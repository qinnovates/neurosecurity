/** Prop shapes shared by the report chart components. */

export interface LegendEntry {
  label: string;
  colorVar: string;
  shape?: 'square' | 'circle' | 'ring' | 'diamond';
}

export interface StackSeries {
  key: string;
  label: string;
  colorVar: string;
  /** CSS custom property for in-segment label text, chosen per mode for contrast on the fill. */
  labelColorVar: string;
  texture?: string;
}

export interface StackRow {
  label: string;
  note?: string;
  values: Record<string, number>;
}

export interface YearColumn {
  year: number;
  valueUsd: number;
  detail: string;
}
