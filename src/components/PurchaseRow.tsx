import { formatMoney, validateField } from '../calc';
import type { FieldName, RowErrors, RowInput } from '../calc';

interface Props {
  row: RowInput;
  index: number;
  errors: RowErrors;
  canRemove: boolean;
  onChange: (id: number, field: FieldName, value: string) => void;
  onBlur: (id: number, field: FieldName) => void;
  onRemove: (id: number) => void;
}

export default function PurchaseRow({ row, index, errors, canRemove, onChange, onBlur, onRemove }: Props) {
  const n = index + 1;
  const q = validateField(row.quantity, 'quantity');
  const p = validateField(row.price, 'price');
  const total = q.value !== null && p.value !== null ? formatMoney(q.value * p.value) : '—';

  const field = (name: FieldName, label: string) => {
    const id = `${name}-${row.id}`;
    const err = errors[name];
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id} type="text" inputMode="decimal" autoComplete="off"
          value={row[name]} aria-invalid={err ? true : undefined} aria-describedby={err ? `${id}-err` : undefined}
          onChange={(e) => onChange(row.id, name, e.target.value)} onBlur={() => onBlur(row.id, name)}
        />
        {err && <p className="field-error" id={`${id}-err`}>{err}</p>}
      </div>
    );
  };

  return (
    <li className="row">
      <h3 className="row-title"><span className="badge" aria-hidden="true">{n}</span>Purchase {n}</h3>
      {field('quantity', 'Quantity (coins)')}
      {field('price', 'Price per coin (₹)')}
      <div className="field">
        <span className="label">Purchase total</span>
        <output className="row-total">{total}</output>
      </div>
      <button type="button" className="btn btn-quiet remove" disabled={!canRemove}
        title={canRemove ? undefined : 'At least one purchase is required'}
        aria-label={`Remove purchase ${n}`} onClick={() => onRemove(row.id)}>Remove</button>
    </li>
  );
}
