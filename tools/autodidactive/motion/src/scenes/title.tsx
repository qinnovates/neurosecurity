/**
 * Title Scene - Cinematic ONI Logo Reveal
 */

import {makeScene2D, Circle, Txt, Rect} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  waitFor,
  easeOutCubic,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // Set background
  view.fill('#080b16');

  // Create refs
  const oniText = createRef<Txt>();
  const tagline = createRef<Txt>();
  const glowCircle = createRef<Circle>();

  // Add background glow
  view.add(
    <Circle
      ref={glowCircle}
      x={0}
      y={0}
      size={0}
      fill={'#a855f720'}
    />
  );

  // Main ONI text
  view.add(
    <Txt
      ref={oniText}
      text="ONI"
      x={0}
      y={0}
      fontSize={0}
      fontWeight={800}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#ffffff'}
    />
  );

  // Tagline
  view.add(
    <Txt
      ref={tagline}
      text="Open Neurosecurity Interoperability"
      x={0}
      y={120}
      fontSize={0}
      fontWeight={300}
      fontFamily="Inter, system-ui, sans-serif"
      letterSpacing={8}
      fill={'#00e5ff'}
    />
  );

  // ===== ANIMATION SEQUENCE =====

  // Phase 1: Background glow expands
  yield* glowCircle().size(800, 1.5, easeOutCubic);

  // Phase 2: ONI text reveals
  yield* oniText().fontSize(200, 1, easeOutCubic);

  yield* waitFor(0.5);

  // Phase 3: Tagline appears
  yield* tagline().fontSize(28, 0.8, easeOutCubic);

  // Hold
  yield* waitFor(2);
});
