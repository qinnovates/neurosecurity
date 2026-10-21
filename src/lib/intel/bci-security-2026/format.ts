/** Number and date formatting for the State of BCI Security 2026 report. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BILLION = 1_000_000_000;
const MILLION = 1_000_000;

/** $1.22B, $250M, $7.5M. Billions keep two decimals only below $10B. */
export function formatUsdCompact(amountUsd: number): string {
  if (amountUsd >= BILLION) {
    const billions = amountUsd / BILLION;
    return `$${billions >= 10 ? billions.toFixed(1) : billions.toFixed(2)}B`;
  }
  if (amountUsd >= MILLION) {
    const millions = amountUsd / MILLION;
    return `$${millions >= 100 ? Math.round(millions) : Number(millions.toFixed(1))}M`;
  }
  return `$${Math.round(amountUsd).toLocaleString('en-US')}`;
}

/** Whole-number percent; the report avoids false precision. */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** "2026-03-13" -> "13 Mar 2026"; "2026-04" -> "Apr 2026". */
export function formatReportDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month) return isoDate;
  const monthName = MONTHS[month - 1];
  return day ? `${day} ${monthName} ${year}` : `${monthName} ${year}`;
}

/** Fractional year for placing a date on a time axis ("2026-07-01" -> ~2026.5). */
export function toFractionalYear(isoDate: string): number {
  const [year, month = 1, day = 1] = isoDate.split('-').map(Number);
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return year + (Date.UTC(year, month - 1, day) - start) / (end - start);
}
