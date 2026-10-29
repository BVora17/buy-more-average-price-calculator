/** Pure logic: validation, calculation and formatting for Task 2. No React here. */

/** One row as the user typed it. Text boxes always give us strings. */
export interface RowInput { id: number; quantity: string; price: string }

/** The two boxes in a row. Only these two words are allowed. */
export type FieldName = 'quantity' | 'price';

/** Error messages for one row. A box with no problem has no message. */
export interface RowErrors { quantity?: string; price?: string }

/** Error messages for all rows, looked up by the row id. */
export type ErrorsById = Record<number, RowErrors>;

/** Result of checking ONE box: either a number (value) or a message (error). */
export interface FieldResult { value: number | null; error: string | null }

/** A fully valid purchase, with its total already worked out. */
export interface Purchase { id: number; quantity: number; price: number; total: number }

/** The final numbers shown on the right-hand side. */
export interface Summary { purchases: Purchase[]; totalCoins: number; totalInvestment: number; average: number }

/** Highest number we accept in one box; keeps results far from Infinity. */
export const MAX_VALUE = 1e12;
const PLAIN_NUMBER = /^(\d+\.?\d*|\.\d+)$/;

const LABEL = {
  quantity: { empty: 'Please enter quantity.', noun: 'quantity', title: 'Quantity' },
  price: { empty: 'Please enter price per coin.', noun: 'price', title: 'Price' },
};

function bad(error: string): FieldResult { return { value: null, error }; }

/** Checks one box. If the text is fine, error is null; otherwise value is null. */
export function validateField(raw: string, field: FieldName): FieldResult {
  const text = raw.trim();
  const l = LABEL[field];
  if (text === '') return bad(l.empty);
  if (text.startsWith('-')) return bad(`${l.title} cannot be negative.`);
  if (!PLAIN_NUMBER.test(text)) return bad(`Enter a valid ${l.noun}.`);
  const value = Number(text);
  if (value === 0) return bad(`${l.title} must be greater than 0.`);
  if (value > MAX_VALUE) return bad(`${l.title} is too large.`);
  return { value, error: null };
}

export const isRowEmpty = (r: RowInput) => r.quantity.trim() === '' && r.price.trim() === '';
export const hasEntries = (rows: RowInput[]) => rows.some((r) => !isRowEmpty(r));

/** kind says what happened; errors / purchases are filled in when they apply. */
export interface Validation {
  kind: 'empty' | 'invalid' | 'ok';
  errors: ErrorsById;
  purchases: Purchase[];
}

/** Checks EVERY row. An invalid row is reported, never skipped. */
export function validateRows(rows: RowInput[]): Validation {
  if (rows.every(isRowEmpty)) return { kind: 'empty', errors: {}, purchases: [] };
  const errors: ErrorsById = {};
  const purchases: Purchase[] = [];
  for (const row of rows) {
    const q = validateField(row.quantity, 'quantity');
    const p = validateField(row.price, 'price');
    if (q.value !== null && p.value !== null) {
      purchases.push({ id: row.id, quantity: q.value, price: p.value, total: q.value * p.value });
    } else {
      errors[row.id] = {};
      if (q.error) errors[row.id].quantity = q.error;
      if (p.error) errors[row.id].price = p.error;
    }
  }
  return Object.keys(errors).length > 0 ? { kind: 'invalid', errors, purchases: [] } : { kind: 'ok', errors: {}, purchases };
}

/** Weighted average = total investment / total coins. Returns null if not safely computable. */
export function calculateSummary(purchases: Purchase[]): Summary | null {
  const totalCoins = purchases.reduce((s, p) => s + p.quantity, 0);
  const totalInvestment = purchases.reduce((s, p) => s + p.total, 0);
  if (!(totalCoins > 0) || !Number.isFinite(totalCoins) || !Number.isFinite(totalInvestment)) return null;
  const average = totalInvestment / totalCoins;
  return Number.isFinite(average) ? { purchases, totalCoins, totalInvestment, average } : null;
}


// ---------------------------------------------------------------------------
// Task 2: the hypothetical purchase and the before / after comparison
// ---------------------------------------------------------------------------

/** What the user typed for the hypothetical purchase. Two text boxes, so two strings. */
export interface HypotheticalInput { quantity: string; price: string }

/** A valid hypothetical purchase, with its total (the "additional investment"). */
export interface Hypothetical { quantity: number; price: number; total: number }

/** The three headline numbers for one portfolio (current OR projected). */
export interface Holdings { totalCoins: number; totalInvestment: number; average: number }

/** Is the hypothetical price below, equal to, or above the current average? */
export type PriceVsAverage = 'below' | 'equal' | 'above';

/** Which way the average price moved. Only a description, never a verdict. */
export type Direction = 'lower' | 'higher' | 'unchanged';

/** Everything the right-hand comparison needs. */
export interface Comparison {
  before: Holdings;
  hypothetical: Hypothetical;
  after: Holdings;
  change: { coins: number; investment: number; average: number };
  direction: Direction;
  priceVsAverage: PriceVsAverage;
}

/** Result of checking the hypothetical boxes: errors for the screen, or a valid purchase. */
export interface HypotheticalCheck { errors: RowErrors; hypothetical: Hypothetical | null }

/** Checks BOTH hypothetical boxes so the user sees every problem at once. */
export function validateHypothetical(input: HypotheticalInput): HypotheticalCheck {
  const q = validateField(input.quantity, 'quantity');
  const p = validateField(input.price, 'price');
  const errors: RowErrors = {};
  if (q.error) errors.quantity = q.error;
  if (p.error) errors.price = p.error;
  if (q.value === null || p.value === null) return { errors, hypothetical: null };
  return { errors, hypothetical: { quantity: q.value, price: p.value, total: q.value * p.value } };
}

/** Two numbers that differ only by floating-point noise (like 1e-14) count as equal. */
function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

/**
 * Works out the projected portfolio. The baseline (`before`) is NEVER changed:
 * every "after" number is a new value built from the baseline plus the hypothetical purchase.
 * Returns null when a number would overflow to Infinity.
 */
export function calculateComparison(baseline: Summary, hypothetical: Hypothetical): Comparison | null {
  const before: Holdings = { totalCoins: baseline.totalCoins, totalInvestment: baseline.totalInvestment, average: baseline.average };

  const totalCoins = before.totalCoins + hypothetical.quantity;
  const totalInvestment = before.totalInvestment + hypothetical.total;
  if (!(totalCoins > 0) || !Number.isFinite(totalCoins) || !Number.isFinite(totalInvestment)) return null;
  const average = totalInvestment / totalCoins; // weighted average, NOT (old average + new price) / 2
  if (!Number.isFinite(average)) return null;
  const after: Holdings = { totalCoins, totalInvestment, average };

  const averageChange = nearlyEqual(after.average, before.average) ? 0 : after.average - before.average;
  const direction: Direction = averageChange < 0 ? 'lower' : averageChange > 0 ? 'higher' : 'unchanged';
  const priceVsAverage: PriceVsAverage = nearlyEqual(hypothetical.price, before.average) ? 'equal' : hypothetical.price < before.average ? 'below' : 'above';

  return {
    before, hypothetical, after,
    change: { coins: after.totalCoins - before.totalCoins, investment: after.totalInvestment - before.totalInvestment, average: averageChange },
    direction, priceVsAverage,
  };
}

// ---------------------------------------------------------------------------
// Formatting (rounding happens ONLY here, never inside the calculations above)
// ---------------------------------------------------------------------------

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 8 });
export const formatMoney = (n: number) => money.format(n);
export const formatQuantity = (n: number) => qty.format(n);

/** "+₹240.00", "−₹11.43" or "₹0.00". The sign follows the ROUNDED value, so we never show "−₹0.00". */
export function formatSignedMoney(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  if (rounded === 0) return money.format(0);
  return `${rounded > 0 ? '+' : '−'}${money.format(Math.abs(n))}`;
}

/** "+2", "−1.5" or "0". */
export function formatSignedQuantity(n: number): string {
  if (n === 0) return '0';
  return `${n > 0 ? '+' : '−'}${qty.format(Math.abs(n))}`;
}
