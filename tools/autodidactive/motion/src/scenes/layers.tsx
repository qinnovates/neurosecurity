/**
 * Layers Scene - 14-Layer Model Visualization
 */

import {makeScene2D, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  createRefArray,
  waitFor,
  easeOutCubic,
} from '@motion-canvas/core';

// Layer definitions
const layers = [
  {id: 'L1', name: 'Physical Carrier', color: '#3b82f6'},
  {id: 'L2', name: 'Signal Conditioning', color: '#2563eb'},
  {id: 'L3', name: 'Analog Processing', color: '#1d4ed8'},
  {id: 'L4', name: 'Digital Conversion', color: '#1e40af'},
  {id: 'L5', name: 'Protocol Layer', color: '#1e3a8a'},
  {id: 'L6', name: 'Data Transport', color: '#172554'},
  {id: 'L7', name: 'Application Interface', color: '#334155'},
  {id: 'L8', name: 'Neural Gateway', color: '#a855f7'},
  {id: 'L9', name: 'Ion Channel Encoding', color: '#4ade80'},
  {id: 'L10', name: 'Cellular Response', color: '#22c55e'},
  {id: 'L11', name: 'Network Integration', color: '#16a34a'},
  {id: 'L12', name: 'Regional Processing', color: '#15803d'},
  {id: 'L13', name: 'Cognitive Binding', color: '#166534'},
  {id: 'L14', name: 'Identity & Ethics', color: '#14532d'},
];

export default makeScene2D(function* (view) {
  view.fill('#080b16');

  const title = createRef<Txt>();
  const layerRects = createRefArray<Rect>();
  const layerLabels = createRefArray<Txt>();

  const layerWidth = 500;
  const layerHeight = 42;
  const layerGap = 5;
  const startY = -330;

  // Title
  view.add(
    <Txt
      ref={title}
      text="14-Layer Security Model"
      x={0}
      y={-450}
      fontSize={0}
      fontWeight={700}
      fontFamily="Inter, system-ui, sans-serif"
      fill={'#ffffff'}
    />
  );

  // Create layers
  layers.forEach((layer, i) => {
    const y = startY + i * (layerHeight + layerGap);
    const isGateway = layer.id === 'L8';

    view.add(
      <Rect
        ref={layerRects}
        x={0}
        y={y}
        width={0}
        height={layerHeight}
        radius={8}
        fill={layer.color}
      />
    );

    view.add(
      <Txt
        ref={layerLabels}
        text={`${layer.id}: ${layer.name}`}
        x={0}
        y={y}
        fontSize={0}
        fontWeight={isGateway ? 700 : 500}
        fontFamily="Inter, system-ui, sans-serif"
        fill={'#ffffff'}
      />
    );
  });

  // ===== ANIMATION =====

  // Title
  yield* title().fontSize(48, 0.8, easeOutCubic);

  yield* waitFor(0.3);

  // Cascade layers in
  for (let i = 0; i < layers.length; i++) {
    const isGateway = layers[i].id === 'L8';
    const targetWidth = isGateway ? layerWidth + 40 : layerWidth;

    yield* all(
      layerRects[i].width(targetWidth, 0.3, easeOutCubic),
      layerLabels[i].fontSize(isGateway ? 16 : 14, 0.3, easeOutCubic),
    );
  }

  // Hold
  yield* waitFor(2);
});
