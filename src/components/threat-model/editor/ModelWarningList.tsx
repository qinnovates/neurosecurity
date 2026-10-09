import Panel from '@/components/lab-kit/Panel';
import { MODEL_WARNING_KINDS, type ModelWarning, type ModelWarningKind } from '@/lib/threat-model/model-warnings';

interface Props {
  warnings: readonly ModelWarning[];
}

/** What each check looks for, so an empty list says what was checked and not that the device is sound. */
const CHECK_LABELS: Readonly<Record<ModelWarningKind, string>> = {
  part_without_connection: 'a part with no connection',
  noninvasive_deep_site: 'a non-invasive device with a target region below the cortex',
  records_only_stimulation_connection: 'a records-only device with a connection marked as carrying stimulation commands',
};

/** Answers that disagree with each other. A warning never blocks an edit and never changes the model. */
export default function ModelWarningList({ warnings }: Props) {
  const checks = MODEL_WARNING_KINDS.map((kind) => CHECK_LABELS[kind]).join('; ');
  return (
    <Panel title={`Warnings (${warnings.length})`}>
      <div role="status">
        {warnings.length === 0
          ? <p className="lab-soft">None of the {MODEL_WARNING_KINDS.length} checks made here found a disagreement. They look for: {checks}. Nothing else about the device is checked here.</p>
          : (
            <ul className="lab-editor-list">
              {warnings.map((warning) => <li key={`${warning.kind}:${warning.subjectId}`} className="lab-notice">{warning.message}</li>)}
            </ul>
          )}
      </div>
      {warnings.length > 0 && <p className="lab-label">A warning does not block an edit. The checks look for: {checks}.</p>}
    </Panel>
  );
}
