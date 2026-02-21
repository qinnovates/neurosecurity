/**
 * Coherence Scene - Animated Metric Visualization
 */

import {makeScene2D, Circle, Txt, Rect} from '@motion-canvas/2d';
import {
  all,
  createRef,
  waitFor,
  easeOutCubic,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  view.fill('#080b16');

  const title = createRef<Txt>();
  const formula = createRef<Txt>();
  const gaugeOuter = createRef<Circle>();
  const gaugeValue = createRef<Txt>();
  const gaugeLabel = createRef<Txt>();

  // Title
  view.add(
    <Txt
      ref={title}
      text="Coherence Score"
      x={0}
      y={-350}
      fontSize={0}
      fontWeight={700}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#ffffff'}
    />
  );

  // Formula
  view.add(
    <Txt
      ref={formula}
      text="Cₛ = e^(−(σ²φ + σ²τ + σ²γ))"
      x={0}
      y={-280}
      fontSize={0}
      fontWeight={400}
      fontFamily="monospace"
      fill={'#888888'}
    />
  );

  // Gauge circle
  view.add(
    <Circle
      ref={gaugeOuter}
      x={0}
      y={0}
      size={0}
      stroke={'#00e5ff'}
      lineWidth={16}
    />
  );

  // Value
  view.add(
    <Txt
      ref={gaugeValue}
      text="0.85"
      x={0}
      y={-20}
      fontSize={0}
      fontWeight={700}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#ffffff'}
    />
  );

  // Label
  view.add(
    <Txt
      ref={gaugeLabel}
      text="Neural Coherence"
      x={0}
      y={40}
      fontSize={0}
      fontWeight={400}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#888888'}
    />
  );

  // ===== ANIMATION =====

  yield* title().fontSize(48, 0.8, easeOutCubic);
  yield* formula().fontSize(24, 0.6, easeOutCubic);

  yield* waitFor(0.3);

  yield* gaugeOuter().size(280, 1, easeOutCubic);

  yield* all(
    gaugeValue().fontSize(72, 0.8, easeOutCubic),
    gaugeLabel().fontSize(18, 0.6, easeOutCubic),
  );

  yield* waitFor(2);
});
