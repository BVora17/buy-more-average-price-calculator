import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const qty = () => screen.getAllByLabelText('Quantity (coins)');
const price = () => screen.getAllByLabelText('Price per coin (₹)');
const hypQty = () => screen.getByLabelText('Additional quantity (coins)');
const hypPrice = () => screen.getByLabelText('Hypothetical price per coin (₹)');
const calcButton = () => screen.getByRole('button', { name: 'Calculate New Average' });
const text = (id: string) => screen.getByTestId(id).textContent;

async function fillRequiredScenario(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Add Purchase' }));
  await user.type(qty()[0], '2'); await user.type(price()[0], '100');
  await user.type(qty()[1], '3'); await user.type(price()[1], '200');
  await user.type(hypQty(), '2'); await user.type(hypPrice(), '120');
}

describe('layout and wording', () => {
  it('shows the Task 2 header, heading and disclaimer', () => {
    render(<App />);
    expect(screen.getByText('Scalezix Ventures LLP')).toBeInTheDocument();
    expect(screen.getByText('Full Stack Developer Intern Assessment')).toBeInTheDocument();
    expect(screen.getByText('TASK 02 / 05')).toBeInTheDocument();
    expect(screen.getByText('TASK 02 · FINANCIAL CALCULATOR')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Buy More - New Average Price Calculator' })).toBeInTheDocument();
    expect(screen.getByText(/does not recommend buying or selling any asset/, { selector: '.disclaimer' })).toBeInTheDocument();
  });
  it('starts with one blank row and no action-oriented buy buttons', () => {
    render(<App />);
    expect(qty()).toHaveLength(1);
    expect(qty()[0]).toHaveValue('');
    expect(screen.queryByRole('button', { name: /buy (now|more)/i })).toBeNull();
  });
});

describe('required scenario through the UI', () => {
  it('shows before, after and change', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillRequiredScenario(user);
    expect(text('base-average')).toBe('₹160.00'); // live baseline, before any hypothetical calculation
    await user.click(calcButton());
    expect(text('before-coins')).toBe('5');
    expect(text('before-investment')).toBe('₹800.00');
    expect(text('before-average')).toBe('₹160.00');
    expect(text('after-coins')).toBe('7');
    expect(text('after-investment')).toBe('₹1,040.00');
    expect(text('after-average')).toBe('₹148.57');
    expect(text('change-coins')).toBe('+2');
    expect(text('change-investment')).toBe('+₹240.00');
    expect(text('change-average')).toBe('−₹11.43');
    expect(text('direction')).toContain('lower');
    expect(text('direction')).toContain('below');
  });

  it('reports "higher" and "equal" neutrally', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillRequiredScenario(user);
    await user.clear(hypPrice()); await user.type(hypPrice(), '200');
    await user.click(calcButton());
    expect(text('direction')).toContain('higher');
    await user.clear(hypPrice()); await user.type(hypPrice(), '160');
    await user.click(calcButton());
    expect(text('direction')).toContain('unchanged');
    expect(text('change-average')).toBe('₹0.00');
  });

  it('does not add the hypothetical purchase to the existing list or baseline', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillRequiredScenario(user);
    await user.click(calcButton());
    expect(qty()).toHaveLength(2);
    expect(text('base-coins')).toBe('5');
    expect(text('base-investment')).toBe('₹800.00');
    expect(text('base-average')).toBe('₹160.00');
  });
});

describe('stale results', () => {
  it('hides the comparison after editing a purchase or the hypothetical', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillRequiredScenario(user);
    await user.click(calcButton());
    expect(text('after-average')).toBe('₹148.57');
    await user.type(hypQty(), '5');
    expect(text('after-average')).toBe('—');
    expect(screen.getByText(/Calculate again to update the comparison/)).toBeInTheDocument();
    await user.click(calcButton());
    expect(text('after-coins')).toBe('30'); // 5 existing + 25 hypothetical (typed '2' then '5')
    await user.type(qty()[0], '9');
    expect(text('after-average')).toBe('—');
  });
});

describe('validation in the UI', () => {
  it('shows messages and no result for empty inputs', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(calcButton());
    expect(screen.getByRole('alert')).toHaveTextContent(/at least one existing purchase/);
    expect(screen.getAllByText('Please enter quantity.').length).toBeGreaterThan(0);
    expect(text('after-average')).toBe('—');
  });
  it('rejects zero, negative and non-numeric hypothetical values', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(qty()[0], '2'); await user.type(price()[0], '100');
    await user.type(hypQty(), '0'); await user.type(hypPrice(), '-4');
    expect(screen.getByText('Quantity must be greater than 0.')).toBeInTheDocument();
    expect(screen.getByText('Price cannot be negative.')).toBeInTheDocument();
    await user.click(calcButton());
    expect(text('after-average')).toBe('—');
    await user.clear(hypQty()); await user.type(hypQty(), 'abc');
    expect(screen.getByText('Enter a valid quantity.')).toBeInTheDocument();
  });
  it('does not calculate when an existing row is incomplete', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Add Purchase' }));
    await user.type(qty()[0], '2'); await user.type(price()[0], '100');
    await user.type(qty()[1], '3'); // price left empty
    await user.type(hypQty(), '1'); await user.type(hypPrice(), '10');
    await user.click(calcButton());
    expect(text('after-average')).toBe('—');
    expect(screen.getByText('Please enter price per coin.')).toBeInTheDocument();
  });
  it('flags extremely large values', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(qty()[0], '2'); await user.type(price()[0], '100');
    await user.type(hypQty(), '99999999999999'); await user.type(hypPrice(), '1');
    expect(screen.getByText('Quantity is too large.')).toBeInTheDocument();
  });
});

describe('rows, reset and example', () => {
  it('adds and removes rows but keeps at least one', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Add Purchase' }));
    expect(qty()).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Remove purchase 2' }));
    expect(qty()).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Remove purchase 1' })).toBeDisabled();
  });
  it('Load Example fills both parts on purpose and Reset clears them', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Load Example' }));
    expect(qty()).toHaveLength(2);
    expect(hypQty()).toHaveValue('2');
    expect(hypPrice()).toHaveValue('120');
    expect(screen.getByTestId('base-average').textContent).toBe('₹160.00');
    await user.click(calcButton());
    expect(text('after-average')).toBe('₹148.57');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(qty()).toHaveLength(1);
    expect(qty()[0]).toHaveValue('');
    expect(hypQty()).toHaveValue('');
    expect(text('after-average')).toBe('—');
    expect(text('base-average')).toBe('—');
  });
  it('asks before Load Example replaces typed values', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(qty()[0], '7');
    await user.click(screen.getByRole('button', { name: 'Load Example' }));
    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Keep my entries' }));
    expect(qty()[0]).toHaveValue('7');
    await user.click(screen.getByRole('button', { name: 'Load Example' }));
    await user.click(screen.getByRole('button', { name: 'Replace entries' }));
    expect(qty()).toHaveLength(2);
  });
});

describe('keyboard accessibility', () => {
  it('lets the whole flow be done with the keyboard', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(qty()[0]);
    await user.keyboard('2{Tab}100');
    await user.click(hypQty());
    await user.keyboard('2{Tab}120{Tab}'); // the total is an <output> (not focusable), so one Tab lands on the button
    expect(calcButton()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(text('after-coins')).toBe('4');
  });
  it('labels every input and marks invalid ones', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(hypQty(), '-1');
    expect(hypQty()).toHaveAttribute('aria-invalid', 'true');
    expect(hypQty()).toHaveAccessibleDescription('Quantity cannot be negative.');
  });
});
