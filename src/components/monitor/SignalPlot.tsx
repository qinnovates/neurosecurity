import { useEffect, useMemo, useRef } from 'react';
import { LABEL_GUTTER, drawSignalPage, pageStartFor, type PlotPage } from './signal-plot-draw';

interface Props extends Omit<PlotPage, 'pageStart'> {
  /** The playhead, in seconds from the start of the sample. */
  time: number;
  /** Accessible name; says what is plotted and that it is synthetic. */
  label: string;
}

/**
 * Every channel of the sample, one page at a time. The page is drawn once and stays still;
 * the playhead is the one thing that moves across it, and the page turns when it reaches the edge.
 */
export default function SignalPlot({ sample, time, pageSeconds, scaleMicrovolts, thresholdMicrovolts, spans, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageStart = pageStartFor(time, pageSeconds, sample.durationSeconds);
  const page = useMemo<PlotPage>(
    () => ({ sample, pageStart, pageSeconds, scaleMicrovolts, thresholdMicrovolts, spans }),
    [sample, pageStart, pageSeconds, scaleMicrovolts, thresholdMicrovolts, spans],
  );
  const latestPage = useRef(page);
  latestPage.current = page;

  useEffect(() => {
    if (canvasRef.current !== null) drawSignalPage(canvasRef.current, page);
  }, [page]);

  // Redraw at the new size when the panel is resized, and in the new colours when the theme changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    const redraw = (): void => drawSignalPage(canvas, latestPage.current);
    const sizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(redraw);
    sizeObserver?.observe(canvas);
    const themeObserver = new MutationObserver(redraw);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => { sizeObserver?.disconnect(); themeObserver.disconnect(); };
  }, []);

  const fraction = Math.max(0, Math.min(1, (time - pageStart) / pageSeconds));
  return (
    <div className="monitor-plot-frame">
      <canvas ref={canvasRef} className="monitor-plot" role="img" aria-label={label} />
      <span className="monitor-playhead" aria-hidden="true" style={{ left: `calc(${LABEL_GUTTER}px + (100% - ${LABEL_GUTTER}px) * ${fraction})` }} />
    </div>
  );
}
