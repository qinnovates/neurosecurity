import type { ShapeName } from '@/lib/atlas-explorer/resolve-pick';

/** A shape's name as a visitor knows it, and the atlas's own beneath it in smaller type. */
export default function ShapeNames({ name }: { name: ShapeName }) {
  return (
    <>
      <span data-label-region="true">{name.primary}</span>
      {name.secondary !== null && <>{' '}<small className="atlas-shape-atlas-name" data-label-atlas="true">{name.secondary}</small></>}
    </>
  );
}
