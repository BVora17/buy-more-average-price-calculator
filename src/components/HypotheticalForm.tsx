import { formatMoney, validateField } from '../calc';
import type { FieldName, HypotheticalInput, RowErrors } from '../calc';

interface Props {
  value: HypotheticalInput;
  errors: RowErrors;
  onChange: (field: FieldName, value: string) => void;
  onCalculate: () => void;
}

/** The two boxes for the hypothetical purchase, kept apart from the real purchase list. */
export default function HypotheticalForm({ value, errors, onChange, onCalculate }: Props) {
  const q = validateField(value.quantity, 'quantity');
  const p = validateField(value.price, 'price');
  const total = q.value !== null && p.value !== null ? formatMoney(q.value * p.value) : '—';

  const field = (name: FieldName, label: string) => {
    const id = `hyp-${name}`;
    const err = errors[name];
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id} type="text" inputMode="decimal" autoComplete="off"
          value={value[name]} aria-invalid={err ? true : undefined} aria-describedby={err ? `${id}-err` : undefined}
          onChange={(e) => onChange(name, e.target.value)}
        />
        {err && <p className="field-error" id={`${id}-err`}>{err}</p>}
      </div>
    );
  };

  return (
    <section className="panel hypo" aria-labelledby="hyp-title">
      <h2 id="hyp-title">Explore a hypothetical purchase</h2>
      <p className="note">Enter a hypothetical quantity and price to see how the figures would change. This is a calculation tool, not a recommendation to buy.</p>
      <div className="hypo-fields">
        {field('quantity', 'Additional quantity (coins)')}
        {field('price', 'Hypothetical price per coin (₹)')}
        <div className="field">
          <span className="label">Additional investment</span>
          <output className="row-total" data-testid="hyp-total">{total}</output>
        </div>
      </div>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onCalculate}>Calculate New Average</button>
      </div>
    </section>
  );
}
