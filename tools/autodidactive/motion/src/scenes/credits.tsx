/**
 * Credits Scene - Powerful Manifesto Closing
 */

import {makeScene2D, Circle, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  waitFor,
  easeOutCubic,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  view.fill('#080b16');

  const line1 = createRef<Txt>();
  const line2 = createRef<Txt>();
  const line3 = createRef<Txt>();
  const becauseText = createRef<Txt>();
  const deserveText = createRef<Txt>();
  const welcomeText = createRef<Txt>();
  const osiText = createRef<Txt>();
  const tagline = createRef<Txt>();
  const glowCircle = createRef<Circle>();

  // Background glow
  view.add(
    <Circle
      ref={glowCircle}
      x={0}
      y={0}
      size={0}
      fill={'#a855f715'}
    />
  );

  // Manifesto lines
  view.add(
    <Txt
      ref={line1}
      text="Our mind."
      x={0}
      y={-80}
      fontSize={0}
      fontWeight={700}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#ffffff'}
    />
  );

  view.add(
    <Txt
      ref={line2}
      text="Our future."
      x={0}
      y={0}
      fontSize={0}
      fontWeight={700}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#ffffff'}
    />
  );

  view.add(
    <Txt
      ref={line3}
      text="Our rules."
      x={0}
      y={80}
      fontSize={0}
      fontWeight={700}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#ffffff'}
    />
  );

  // Because text (hidden initially)
  view.add(
    <Txt
      ref={becauseText}
      text="Because the most important connections"
      x={0}
      y={-40}
      fontSize={0}
      fontWeight={400}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#aaaaaa'}
    />
  );

  view.add(
    <Txt
      ref={deserveText}
      text="deserve the most thought."
      x={0}
      y={30}
      fontSize={0}
      fontWeight={500}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#00e5ff'}
    />
  );

  // Welcome text (hidden initially)
  view.add(
    <Txt
      ref={welcomeText}
      text="Welcome to"
      x={0}
      y={-100}
      fontSize={0}
      fontWeight={300}
      letterSpacing={12}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#666666'}
    />
  );

  view.add(
    <Txt
      ref={osiText}
      text="The OSI of Mind"
      x={0}
      y={0}
      fontSize={0}
      fontWeight={800}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#ffffff'}
    />
  );

  view.add(
    <Txt
      ref={tagline}
      text="Open Neurosecurity Interoperability"
      x={0}
      y={80}
      fontSize={0}
      fontWeight={400}
      letterSpacing={4}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#666666'}
    />
  );

  // ===== ANIMATION =====

  // Glow expands
  yield* glowCircle().size(600, 1, easeOutCubic);

  // Manifesto appears one by one
  yield* line1().fontSize(72, 0.8, easeOutCubic);
  yield* waitFor(0.5);
  yield* line2().fontSize(72, 0.8, easeOutCubic);
  yield* waitFor(0.5);
  yield* line3().fontSize(72, 0.8, easeOutCubic);

  yield* waitFor(1.5);

  // Fade out manifesto
  yield* all(
    line1().opacity(0, 0.5),
    line2().opacity(0, 0.5),
    line3().opacity(0, 0.5),
  );

  // Show "Because..."
  yield* all(
    becauseText().fontSize(32, 0.8, easeOutCubic),
    deserveText().fontSize(32, 0.8, easeOutCubic),
  );

  yield* waitFor(2);

  // Fade out
  yield* all(
    becauseText().opacity(0, 0.5),
    deserveText().opacity(0, 0.5),
  );

  // Final reveal
  yield* welcomeText().fontSize(24, 0.6, easeOutCubic);
  yield* osiText().fontSize(80, 1, easeOutCubic);
  yield* tagline().fontSize(16, 0.6, easeOutCubic);

  yield* waitFor(3);
});
