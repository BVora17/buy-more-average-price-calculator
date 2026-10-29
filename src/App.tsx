import { useState } from 'react';
import PurchaseRow from './components/PurchaseRow';
import HypotheticalForm from './components/HypotheticalForm';
import ComparisonResults from './components/ComparisonResults';
import { calculateComparison, calculateSummary, formatMoney, formatQuantity, hasEntries, validateField, validateHypothetical, validateRows } from './calc';
import type { Comparison, ErrorsById, FieldName, HypotheticalInput, RowErrors, RowInput } from './calc';
import { MAX_ROWS, createRow, removeRowById, removeRowErrors, setFieldError, updateRowField } from './rows';

const EXAMPLE_ROWS = [['2', '100'], ['3', '200']];
const EXAMPLE_HYPOTHETICAL: HypotheticalInput = { quantity: '2', price: '120' };
const BLANK_HYPOTHETICAL: HypotheticalInput = { quantity: '', price: '' };

export default function App() {
  // ---- State: everything the screen needs to remember ----
  const [rows, setRows] = useState<RowInput[]>([createRow()]);       // existing purchases, as typed
  const [errors, setErrors] = useState<ErrorsById>({});               // messages under the purchase boxes
  const [hyp, setHyp] = useState<HypotheticalInput>(BLANK_HYPOTHETICAL); // hypothetical boxes, as typed (separate from rows!)
  const [hypErrors, setHypErrors] = useState<RowErrors>({});          // messages under the hypothetical boxes
  const [comparison, setComparison] = useState<Comparison | null>(null); // result, or null when there is none
  const [stale, setStale] = useState(false);                          // true after an edit hid an old result
  const [message, setMessage] = useState('');                         // one message for the whole form
  const [confirmExample, setConfirmExample] = useState(false);        // is the "replace entries?" question open

  // The baseline is worked from the existing purchases ONLY, so a hypothetical purchase can never change it.
  const check = validateRows(rows);
  const baseline = check.kind === 'ok' ? calculateSummary(check.purchases) : null;

  /** Called after any edit: hide the old comparison and remember that it was hidden. */
  function hideResult() {
    if (comparison) setStale(true);
    setComparison(null);
    setMessage('');
    setConfirmExample(false);
  }

  // ---- Existing purchases ----
  function onChange(id: number, field: FieldName, value: string) {
    setRows(updateRowField(rows, id, field, value));
    const msg = value.trim() === '' ? null : validateField(value, field).error; // no complaint while empty
    setErrors(setFieldError(errors, id, field, msg));
    hideResult();
  }

  function onBlur(id: number, field: FieldName) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const otherBox = field === 'quantity' ? row.price : row.quantity;
    const rowStarted = row[field].trim() !== '' || otherBox.trim() !== '';
    const error = validateField(row[field], field).error;
    if (error && rowStarted) setErrors(setFieldError(errors, id, field, error)); // flag a missing value only once the row is started
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) return;
    setRows([...rows, createRow()]);
    hideResult();
  }

  function removeRow(id: number) {
    setRows(removeRowById(rows, id));
    setErrors(removeRowErrors(errors, id));
    hideResult();
  }

  // ---- Hypothetical purchase ----
  function onHypChange(field: FieldName, value: string) {
    setHyp({ ...hyp, [field]: value });
    const msg = value.trim() === '' ? undefined : validateField(value, field).error ?? undefined;
    setHypErrors({ ...hypErrors, [field]: msg });
    hideResult();
  }

  // ---- Calculate ----
  function calculate() {
    setConfirmExample(false);
    setStale(false);
    setComparison(null);
    setMessage('');

    // Check BOTH parts first so every problem is shown at once.
    const rowCheck = validateRows(rows);
    const hypCheck = validateHypothetical(hyp);
    setErrors(rowCheck.errors);
    setHypErrors(hypCheck.errors);

    if (rowCheck.kind === 'empty') { setMessage('Please enter quantity and price for at least one existing purchase.'); return; }
    if (rowCheck.kind === 'invalid' || !hypCheck.hypothetical) return; // the messages are already under the boxes

    const base = calculateSummary(rowCheck.purchases);
    const result = base ? calculateComparison(base, hypCheck.hypothetical) : null;
    if (!result) { setMessage('These values are too large to calculate safely. Check the quantities and prices.'); return; }
    setComparison(result);
  }

  // ---- Reset and example ----
  function fill(entries: string[][], hypothetical: HypotheticalInput) {
    setRows(entries.map(([quantity, price]) => createRow(quantity, price)));
    setHyp(hypothetical);
    setErrors({}); setHypErrors({}); setComparison(null); setStale(false); setMessage(''); setConfirmExample(false);
  }

  const reset = () => fill([['', '']], BLANK_HYPOTHETICAL);

  function requestExample() {
    if (hasEntries(rows) || hyp.quantity.trim() !== '' || hyp.price.trim() !== '') { setConfirmExample(true); setMessage(''); return; } // ask before replacing typed values
    fill(EXAMPLE_ROWS, EXAMPLE_HYPOTHETICAL);
  }

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <a className="brand-link" href="#top" aria-label="Scalezix Ventures LLP, Full Stack Developer Intern Assessment">
            <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path d="M11 21V13a2 2 0 0 1 2-2h2.2a2 2 0 0 1 2 2v8M17.2 13.8H19a2 2 0 0 1 2 2V21M9.6 21h13M14.1 21v-1.7" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="brand-text">
              <span className="brand">Scalezix Ventures LLP</span>
              <span className="brand-sub">Full Stack Developer Intern Assessment</span>
            </span>
          </a>
          <span className="task-badge" role="img" aria-label="Task 2 of 5">
            <span className="task-dots" aria-hidden="true"><i /><i className="on" /><i /><i /><i /></span>
            TASK 02 / 05
          </span>
        </div>
      </header>
      <main className="wrap" id="top">
        <div className="intro">
          <p className="eyebrow">TASK 02 · FINANCIAL CALCULATOR</p>
          <h1>Buy More - New Average Price Calculator</h1>
          <p className="lede">Explore how a hypothetical additional purchase at a different price would affect your average buying price and total investment.</p>
        </div>

        <div className="layout">
          <div className="stack">
            <section className="panel" aria-labelledby="entry-title">
              <h2 id="entry-title">Your current purchases</h2>
              <ol className="rows">
                {rows.map((r, i) => (
                  <PurchaseRow key={r.id} row={r} index={i} errors={errors[r.id] ?? {}} canRemove={rows.length > 1}
                    onChange={onChange} onBlur={onBlur} onRemove={removeRow} />
                ))}
              </ol>
              {message && <p className="form-msg" role="alert">{message}</p>}
              {confirmExample && (
                <div className="confirm" role="alertdialog" aria-labelledby="c-title" onKeyDown={(e) => e.key === 'Escape' && setConfirmExample(false)}>
                  <h3 id="c-title">Replace your entries?</h3>
                  <p>Loading the example removes what you have entered now. This cannot be undone.</p>
                  <div className="actions">
                    <button type="button" className="btn btn-quiet" autoFocus onClick={() => setConfirmExample(false)}>Keep my entries</button>
                    <button type="button" className="btn btn-danger" onClick={() => fill(EXAMPLE_ROWS, EXAMPLE_HYPOTHETICAL)}>Replace entries</button>
                  </div>
                </div>
              )}
              <div className="actions">
                <button type="button" className="btn" onClick={addRow} disabled={rows.length >= MAX_ROWS}>Add Purchase</button>
                <button type="button" className="btn btn-quiet" onClick={requestExample}>Load Example</button>
                <button type="button" className="btn btn-quiet" onClick={reset}>Reset</button>
              </div>

              <h3 className="sub">Current portfolio (baseline)</h3>
              <dl className="baseline" aria-live="polite">
                <div><dt>Current total coins</dt><dd data-testid="base-coins">{baseline ? formatQuantity(baseline.totalCoins) : '—'}</dd></div>
                <div><dt>Current total investment</dt><dd data-testid="base-investment">{baseline ? formatMoney(baseline.totalInvestment) : '—'}</dd></div>
                <div><dt>Current average buying price</dt><dd data-testid="base-average">{baseline ? formatMoney(baseline.average) : '—'}</dd></div>
              </dl>
            </section>

            <HypotheticalForm value={hyp} errors={hypErrors} onChange={onHypChange} onCalculate={calculate} />
          </div>

          <div className="side"><ComparisonResults comparison={comparison} stale={stale} /></div>
        </div>

        <section className="panel formula" aria-labelledby="f-title">
          <h2 id="f-title">How it is calculated</h2>
          <p><b>Purchase total</b> = quantity × price per coin. <b>Current average</b> = current total investment ÷ current total coins. <b>Projected coins</b> = current coins + additional coins. <b>Projected investment</b> = current investment + (additional quantity × hypothetical price). <b>Projected average</b> = projected investment ÷ projected coins, a weighted average, not the mean of the old average and the new price. The hypothetical purchase is never added to your purchase list.</p>
        </section>
      </main>
      <footer className="wrap foot">For general information only. This calculator illustrates hypothetical changes in purchase cost and holdings. It does not recommend buying or selling any asset, and is not financial, investment or tax advice.</footer>
    </>
  );
}