/** Small helpers for the list of existing purchases. Each returns a NEW list; nothing is edited in place. */
import type { ErrorsById, FieldName, RowInput } from './calc';

export const MAX_ROWS = 50;
let nextId = 1;

/** Makes a row with a new unique id. */
export function createRow(quantity = '', price = ''): RowInput {
  return { id: nextId++, quantity, price };
}

/** Same rows, but the row with this id gets a new value in one box. */
export function updateRowField(rows: RowInput[], id: number, field: FieldName, value: string): RowInput[] {
  return rows.map((row) => (row.id === id ? { ...row, [field]: value } : row));
}

/** Same rows without this id. The last remaining row is never removed. */
export function removeRowById(rows: RowInput[], id: number): RowInput[] {
  return rows.length <= 1 ? rows : rows.filter((row) => row.id !== id);
}

/** Sets (or clears, when message is null) one error message for one box. */
export function setFieldError(errors: ErrorsById, id: number, field: FieldName, message: string | null): ErrorsById {
  const rowErrors = { ...errors[id] };
  if (message) rowErrors[field] = message;
  else delete rowErrors[field];
  const updated = { ...errors };
  if (Object.keys(rowErrors).length > 0) updated[id] = rowErrors;
  else delete updated[id];
  return updated;
}

/** Same errors without this row's messages. */
export function removeRowErrors(errors: ErrorsById, id: number): ErrorsById {
  const updated = { ...errors };
  delete updated[id];
  return updated;
}
