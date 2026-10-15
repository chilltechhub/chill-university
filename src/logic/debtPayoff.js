// src/logic/debtPayoff.js
// Month-by-month payoff for a list of debts, two ways:
//   avalanche  extra money to the highest interest rate first (least interest)
//   snowball   extra money to the smallest balance first (quickest wins)
// Every debt gets its minimum each month; the extra, plus the minimum of each
// debt already paid off, goes to the target. Interest is monthly (APR / 12).
// An estimate for learning and planning, not financial advice.
// No imports, so scripts/check-planner.mjs can run it.

const MAX_MONTHS = 600;

/**
 * @param {{ name: string, balance: number, apr: number, min: number }[]} debts
 * @param {number} extra  money on top of the minimums, each month
 * @param {'avalanche'|'snowball'} strategy
 * @returns {{ months: number|null, interest: number, order: string[] }}
 *   months null = never paid off at these payments (interest outruns them)
 */
export function payoffPlan(debts, extra = 0, strategy = 'avalanche') {
  const list = (debts || [])
    .map(d => ({ name: d.name || 'Debt', balance: Math.max(0, +d.balance || 0), apr: Math.max(0, +d.apr || 0), min: Math.max(0, +d.min || 0) }))
    .filter(d => d.balance > 0);
  if (!list.length) return { months: 0, interest: 0, order: [] };
  const budget = list.reduce((n, d) => n + d.min, 0) + Math.max(0, +extra || 0);
  let interest = 0;
  const order = [];
  for (let month = 1; month <= MAX_MONTHS; month++) {
    list.forEach(d => { if (d.balance > 0) { const i = d.balance * d.apr / 1200; d.balance += i; interest += i; } });
    let left = budget;
    // Minimums first.
    list.forEach(d => { if (d.balance > 0) { const pay = Math.min(d.min, d.balance, left); d.balance -= pay; left -= pay; } });
    // Then everything left to the target, then the next.
    const open = list.filter(d => d.balance > 0.005)
      .sort((a, b) => (strategy === 'snowball' ? a.balance - b.balance : b.apr - a.apr || a.balance - b.balance));
    for (const d of open) {
      if (left <= 0) break;
      const pay = Math.min(d.balance, left);
      d.balance -= pay; left -= pay;
    }
    list.forEach(d => { if (d.balance <= 0.005 && !order.includes(d.name)) { d.balance = 0; order.push(d.name); } });
    if (list.every(d => d.balance <= 0)) return { months: month, interest: Math.round(interest * 100) / 100, order };
  }
  return { months: null, interest: Math.round(interest * 100) / 100, order };
}

/** Months to reach a savings goal at a monthly amount (null = no monthly amount). */
export function monthsToGoal(target, saved, monthly) {
  const left = Math.max(0, (+target || 0) - (+saved || 0));
  if (left === 0) return 0;
  if (!(+monthly > 0)) return null;
  return Math.ceil(left / +monthly);
}
