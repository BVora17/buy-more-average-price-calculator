import { calculateComparison, calculateSummary, formatSignedMoney, formatSignedQuantity, validateHypothetical, validateRows } from './calc';
import type { Comparison, RowInput } from './calc';

const rows = (pairs: string[][]): RowInput[] => pairs.map(([quantity, price], i) => ({ id: i + 1, quantity, price }));

/** Builds a comparison from text boxes, the same way the app does. */
function compare(pairs: string[][], hq: string, hp: string): Comparison {
  const check = validateRows(rows(pairs));
  const base = calculateSummary(check.purchases)!;
  const hyp = validateHypothetical({ quantity: hq, price: hp }).hypothetical!;
  return calculateComparison(base, hyp)!;
}

const BASE = [['2', '100'], ['3', '200']];

describe('required scenario (2@100 + 3@200, then 2@120)', () => {
  const c = compare(BASE, '2', '120');
  it('baseline', () => {
    expect(c.before.totalCoins).toBe(5);
    expect(c.before.totalInvestment).toBe(800);
    expect(c.before.average).toBe(160);
  });
  it('projected', () => {
    expect(c.hypothetical.total).toBe(240);
    expect(c.after.totalCoins).toBe(7);
    expect(c.after.totalInvestment).toBe(1040);
    expect(c.after.average).toBeCloseTo(148.5714, 4);
  });
  it('changes', () => {
    expect(c.change.coins).toBe(2);
    expect(c.change.investment).toBe(240);
    expect(c.change.average).toBeCloseTo(-11.4286, 4);
    expect(c.direction).toBe('lower');
    expect(formatSignedMoney(c.change.average)).toBe('−₹11.43');
    expect(formatSignedMoney(c.change.investment)).toBe('+₹240.00');
    expect(formatSignedQuantity(c.change.coins)).toBe('+2');
  });
  it('is not the simple mean of old average and new price', () => {
    expect(c.after.average).not.toBeCloseTo((160 + 120) / 2);
  });
});

describe('hypothetical price relative to the current average', () => {
  it('above', () => {
    const c = compare(BASE, '2', '200');
    expect(c.priceVsAverage).toBe('above');
    expect(c.direction).toBe('higher');
    expect(c.change.average).toBeGreaterThan(0);
    expect(c.after.average).toBeCloseTo(1200 / 7 + 0 + 0, 0); // (800+400)/7 = 171.43
  });
  it('equal gives zero change', () => {
    const c = compare(BASE, '2', '160');
    expect(c.priceVsAverage).toBe('equal');
    expect(c.direction).toBe('unchanged');
    expect(c.change.average).toBe(0);
    expect(formatSignedMoney(c.change.average)).toBe('₹0.00');
  });
  it('equal with awkward decimals still counts as unchanged', () => {
    const c = compare([['3', '0.1'], ['3', '0.3']], '1', '0.2'); // average is 0.2 but with float noise
    expect(c.direction).toBe('unchanged');
  });
  it('below', () => {
    const c = compare(BASE, '2', '50');
    expect(c.priceVsAverage).toBe('below');
    expect(c.direction).toBe('lower');
  });
});

describe('decimals and precision', () => {
  it('keeps full precision internally', () => {
    const c = compare([['0.5', '99.99']], '1.25', '100.01');
    expect(c.after.totalCoins).toBeCloseTo(1.75, 10);
    expect(c.after.totalInvestment).toBeCloseTo(0.5 * 99.99 + 1.25 * 100.01, 8);
  });
});

describe('validation', () => {
  it('flags empty hypothetical boxes', () => {
    const r = validateHypothetical({ quantity: '', price: '' });
    expect(r.hypothetical).toBeNull();
    expect(r.errors.quantity).toBeTruthy();
    expect(r.errors.price).toBeTruthy();
  });
  it.each([['0', 'greater than 0'], ['-1', 'negative'], ['abc', 'valid'], ['1e5', 'valid'], ['2000000000000', 'too large']])('rejects quantity %s', (text, word) => {
    const r = validateHypothetical({ quantity: text, price: '10' });
    expect(r.hypothetical).toBeNull();
    expect(r.errors.quantity).toContain(word);
  });
  it('rejects negative and zero price', () => {
    expect(validateHypothetical({ quantity: '1', price: '-5' }).errors.price).toContain('negative');
    expect(validateHypothetical({ quantity: '1', price: '0' }).errors.price).toContain('greater than 0');
  });
  it('accepts decimals', () => {
    expect(validateHypothetical({ quantity: '0.5', price: '.25' }).hypothetical?.total).toBe(0.125);
  });
  it('reports an incomplete or invalid existing row instead of skipping it', () => {
    const r = validateRows(rows([['2', '100'], ['3', '']]));
    expect(r.kind).toBe('invalid');
    expect(r.errors[2].price).toBeTruthy();
  });
  it('treats all-empty existing rows as empty', () => {
    expect(validateRows(rows([['', '']])).kind).toBe('empty');
  });
});

describe('overflow protection', () => {
  it('returns null instead of Infinity', () => {
    const base = calculateSummary(validateRows(rows([['1000000000000', '1000000000000']])).purchases)!;
    const hyp = { quantity: 1e12, price: 1e12, total: 1e24 };
    expect(calculateComparison(base, hyp)).not.toBeNull(); // 1e24 is still finite
    expect(calculateComparison(base, { quantity: 1e308, price: 1, total: Infinity })).toBeNull();
  });
});

describe('baseline is never changed', () => {
  it('leaves the baseline and purchases untouched', () => {
    const base = calculateSummary(validateRows(rows(BASE)).purchases)!;
    const snapshot = JSON.stringify(base);
    calculateComparison(base, { quantity: 2, price: 120, total: 240 });
    expect(JSON.stringify(base)).toBe(snapshot);
  });
  it('repeated calculation gives the same answer', () => {
    expect(compare(BASE, '2', '120')).toEqual(compare(BASE, '2', '120'));
  });
});
