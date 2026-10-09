import { limitSentence } from '@/lib/anatomy/limits-copy';
import type { RegionDetail } from '@/lib/atlas-explorer/region-detail';
import { GEOMETRY_LABELS } from '@/lib/atlas-explorer/region-rows';
import LimitNote from './LimitNote';
import ReviewMark from './ReviewMark';

interface Props {
  detail: RegionDetail;
}

/** What stands for the region in the atlas: its status, the sentence that limits it, and each shape it is drawn through. */
export default function InspectorShapes({ detail }: Props) {
  const { region, shapes } = detail;
  return (
    <section className="atlas-section" aria-labelledby="atlas-inspector-shape">
      <h3 className="atlas-subheading" id="atlas-inspector-shape">What stands for it</h3>
      <p className="atlas-fact"><strong>{GEOMETRY_LABELS[region.geometry.state]}</strong> <ReviewMark state={region.review_state} /></p>
      <LimitNote limit={detail.geometryLimit} />
      {region.geometry.reason_source !== null && <p className="atlas-source">Reason recorded in: {region.geometry.reason_source}</p>}
      {shapes.length > 0 && (
        <ul className="atlas-shapes">
          {shapes.map((shape) => (
            <li key={shape.structureKey} className="atlas-shape">
              <p className="atlas-fact">
                Drawn through <strong>{shape.label}</strong>, from {shape.sourceName}. {shape.shipped ? 'A shape ships in this build.' : 'No shape ships in this build yet.'}{' '}
                <ReviewMark state={shape.reviewState} />
              </p>
              <LimitNote limit={shape.sourceLimit} />
              {shape.mirrored && <LimitNote limit={limitSentence('mirrored_shape')} />}
              {shape.sharedWith.length > 0 && (
                <>
                  <p className="atlas-fact">Also holds: {shape.sharedWith.join(', ')}.</p>
                  <LimitNote limit={limitSentence('shared_shape')} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
