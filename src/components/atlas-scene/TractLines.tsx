import { useEffect } from 'react';
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments } from 'three';
import type { AnatomyIndex } from '@/lib/anatomy/anatomy-index-types';
import { positionsToScene } from '@/lib/anatomy/ras-to-scene';
import { tractSegments, type TractLine } from '@/lib/anatomy/tract-format';
import { NEUTRAL_COLOUR } from '@/lib/atlas-explorer/scene-shapes';

export const TRACTS_LAYER = 'tracts';
const TRACT_OPACITY = 0.35;

interface Props {
  index: AnatomyIndex;
  lines: readonly TractLine[];
  /** Puts the lines in the scene and returns how to take them out again. */
  attach: (lines: LineSegments) => () => void;
}

/**
 * Whether tract lines may be drawn at all: the index must say the tracts layer
 * is available and must hold a tract file. In this build neither is true, because no
 * tract source is cleared for this site, so nothing mounts this component.
 */
export function canMountTracts(index: AnatomyIndex): boolean {
  return index.layers.some((layer) => layer.id === TRACTS_LAYER && layer.available) && index.tracts.group_asset_ids.length > 0;
}

/**
 * Still lines in one quiet colour. The geometry holds positions and nothing
 * else, and the material is a plain line material: there is nothing here to
 * dash, reveal bit by bit, recolour along a line or animate in any other way,
 * so a tract can never be drawn as something travelling.
 */
export function buildTractLines(lines: readonly TractLine[]): LineSegments<BufferGeometry, LineBasicMaterial> {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positionsToScene(tractSegments(lines)), 3));
  return new LineSegments(geometry, new LineBasicMaterial({ color: NEUTRAL_COLOUR, transparent: true, opacity: TRACT_OPACITY, depthWrite: false }));
}

/**
 * The tract lines in the scene. It draws nothing on the page itself. While the
 * tracts layer is unavailable it builds nothing and attaches nothing, whatever
 * it is handed; its control in the layer list stays disabled with the reason.
 */
export default function TractLines({ index, lines, attach }: Props) {
  const isAllowed = canMountTracts(index);
  useEffect(() => {
    if (!isAllowed || lines.length === 0) return undefined;
    const drawn = buildTractLines(lines);
    const detach = attach(drawn);
    return () => {
      detach();
      drawn.geometry.dispose();
      drawn.material.dispose();
    };
  }, [isAllowed, lines, attach]);
  return null;
}
