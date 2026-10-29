import { formatMoney, formatQuantity, formatSignedMoney, formatSignedQuantity } from '../calc';
import type { Comparison } from '../calc';

interface Props { comparison: Comparison | null; stale: boolean }

/** Words describing the move. They describe only; they never say it is good or bad. */
function directionText(c: Comparison): string {
  const size = formatMoney(Math.abs(c.change.average));
  if (c.direction === 'lower') return `The projected average buying price is ${size} lower than the current average.`;
  if (c.direction === 'higher') return `The projected average buying price is ${size} higher than the current average.`;
  return 'The projected average buying price is unchanged.';
}

function priceText(c: Comparison): string {
  const where = { below: 'below', equal: 'equal to', above: 'above' }[c.priceVsAverage];
  return `The hypothetical price (${formatMoney(c.hypothetical.price)}) is ${where} the current average (${formatMoney(c.before.average)}).`;
}

export default function ComparisonResults({ comparison: c, stale }: Props) {
  const state = c ? 'ready' : stale ? 'stale' : 'empty';
  const dash = '—';

  return (
    <section className="ledger" data-state={state} aria-labelledby="cmp-title">
      <h2 id="cmp-title">Before vs. After Comparison</h2>
      <p className="hint" role="status">
        {c ? 'Scenario comparison. Projected values are hypothetical and are not predictions.'
          : stale ? 'Inputs changed. Calculate again to update the comparison.'
          : 'Enter your purchases and a hypothetical purchase, then press Calculate New Average.'}
      </p>

      <div className="compare">
        <article className="card card-before" aria-labelledby="before-title">
          <h3 id="before-title" className="card-title">Before — current holdings</h3>
          <dl>
            <div><dt>Current total coins</dt><dd data-testid="before-coins">{c ? formatQuantity(c.before.totalCoins) : dash}</dd></div>
            <div><dt>Current total investment</dt><dd data-testid="before-investment">{c ? formatMoney(c.before.totalInvestment) : dash}</dd></div>
            <div><dt>Current average buying price</dt><dd className="big" data-testid="before-average">{c ? formatMoney(c.before.average) : dash}</dd></div>
          </dl>
        </article>

        <article className="card card-after" aria-labelledby="after-title">
          <h3 id="after-title" className="card-title">After — hypothetical scenario</h3>
          <dl>
            <div><dt>Projected total coins</dt><dd data-testid="after-coins">{c ? formatQuantity(c.after.totalCoins) : dash}</dd></div>
            <div><dt>Projected total investment</dt><dd data-testid="after-investment">{c ? formatMoney(c.after.totalInvestment) : dash}</dd></div>
            <div><dt>Projected average buying price</dt><dd className="big" data-testid="after-average">{c ? formatMoney(c.after.average) : dash}</dd></div>
          </dl>
          <span className="tag">Hypothetical</span>
        </article>
      </div>

      <h3 className="sub">Changes in this scenario</h3>
      <dl className="changes">
        <div className="card"><dt>Change in total coins</dt><dd data-testid="change-coins">{c ? formatSignedQuantity(c.change.coins) : dash}</dd></div>
        <div className="card"><dt>Additional investment</dt><dd data-testid="change-investment">{c ? formatSignedMoney(c.change.investment) : dash}</dd></div>
        <div className="card"><dt>Change in average buying price</dt><dd data-testid="change-average">{c ? formatSignedMoney(c.change.average) : dash}</dd></div>
      </dl>

      {c && (
        <>
          <p className="explain" data-testid="direction">{directionText(c)} {priceText(c)}</p>
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Scenario comparison table">
            <table>
              <thead><tr><th scope="col">Measure</th><th scope="col">Current</th><th scope="col">Hypothetical After Purchase</th><th scope="col">Difference</th></tr></thead>
              <tbody>
                <tr><th scope="row">Total coins</th><td>{formatQuantity(c.before.totalCoins)}</td><td>{formatQuantity(c.after.totalCoins)}</td><td>{formatSignedQuantity(c.change.coins)}</td></tr>
                <tr><th scope="row">Total investment</th><td>{formatMoney(c.before.totalInvestment)}</td><td>{formatMoney(c.after.totalInvestment)}</td><td>{formatSignedMoney(c.change.investment)}</td></tr>
                <tr><th scope="row">Average buying price</th><td>{formatMoney(c.before.average)}</td><td>{formatMoney(c.after.average)}</td><td>{formatSignedMoney(c.change.average)}</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="disclaimer">This calculator illustrates hypothetical changes in purchase cost and holdings. It does not recommend buying or selling any asset.</p>
    </section>
  );
}
