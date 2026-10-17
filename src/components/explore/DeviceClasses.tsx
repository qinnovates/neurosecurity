import { useMemo, useState } from 'react';
import ReplaceDeviceConfirm from '@/components/threat-model/ReplaceDeviceConfirm';
import { useFocus } from '@/components/workbench/FocusContext';
import { useOpenTechnique } from '@/components/workbench/use-open-technique';
import type { DeviceArchetype } from '@/lib/threat-model/reference-data-types';
import { openModelOverview } from './explore-navigation';
import ClassDifferenceTable from './start/ClassDifferenceTable';
import { compareClass, compareModel, describeIdenticalSet, findIdenticalSets, listClassDifferences } from './start/class-scopes';
import DeviceClassCard from './start/DeviceClassCard';

/** What the tool produces. Each item is a screen of Model. */
const PRODUCES_SENTENCE =
  'TARA Lab drafts a threat model for a neural device: architecture views, a risk register with decisions, chain hypotheses, an FDA premarket checklist and a printable draft report.';
const REVIEW_SENTENCE = 'Its output is a starting point for qualified review. It is not a compliance determination.';
const CLASSES_SENTENCE = 'Device classes, not products. Each picture is drawn from a generic device of that kind, so nothing here describes a specific commercial device.';
const OWN_DEVICE_ID = 'own-device';
const OWN_DEVICE_KICKER = 'Your device';
const START_LABEL = 'Start from this class';
const CONTINUE_LABEL = 'Continue in Model';

/** The Start view: what the tool produces, an example to open, and the device classes side by side. */
export default function DeviceClasses() {
  const { engineData, referenceData, dispatch, state, hasWork, isExampleDevice } = useFocus();
  const [pendingArchetypeId, setPendingArchetypeId] = useState<string | null>(null);
  const openTechnique = useOpenTechnique();
  const { archetypes } = referenceData;
  // A device the reader loaded, edited or decided on is theirs, and is shown before the classes.
  const isOwnDevice = state.archetypeId === null || hasWork;

  const classes = useMemo(() => archetypes.map((archetype) => compareClass(archetype, engineData, referenceData)), [archetypes, engineData, referenceData]);
  const ownDevice = useMemo(
    () => (isOwnDevice ? compareModel(OWN_DEVICE_ID, `${OWN_DEVICE_KICKER} (${state.model.name})`, state.model, engineData, referenceData) : null),
    [isOwnDevice, state.model, engineData, referenceData],
  );
  const devices = useMemo(() => (ownDevice === null ? classes : [ownDevice, ...classes]), [ownDevice, classes]);
  const identicalSets = useMemo(() => findIdenticalSets(devices), [devices]);
  const differences = useMemo(() => listClassDifferences(devices, engineData.techniques.map((technique) => technique.id)), [devices, engineData]);

  const isClassInFocus = (archetype: DeviceArchetype): boolean => !isExampleDevice && !isOwnDevice && state.archetypeId === archetype.id;
  const startFrom = (archetype: DeviceArchetype): void => {
    setPendingArchetypeId(null);
    dispatch({ type: 'preset-selected', archetype, registrarVersion: engineData.registrarVersion });
    openModelOverview();
  };
  const chooseClass = (archetype: DeviceArchetype): void => {
    // The class already in focus is opened as it is.
    if (isClassInFocus(archetype)) openModelOverview();
    else if (hasWork) setPendingArchetypeId(archetype.id);
    else startFrom(archetype);
  };

  return (
    <div className="explore-start">
      <div className="explore-start-top">
      <div className="explore-intro">
        <p className="explore-lead">{PRODUCES_SENTENCE}</p>
        <p className="lab-soft">{REVIEW_SENTENCE}</p>
        {isExampleDevice && (
          <div><button type="button" className="lab-button lab-button--primary" onClick={openModelOverview}>See an example threat model</button></div>
        )}
      </div>
      <section id="lab-results" aria-labelledby="explore-classes-heading" className="explore-classes">
        <h2 className="lab-panel-title" id="explore-classes-heading">Device classes</h2>
        <p className="lab-soft">{CLASSES_SENTENCE}</p>
        <div className="explore-class-row">
          {ownDevice !== null && (
            <DeviceClassCard
              device={ownDevice} title={state.model.name} kicker={OWN_DEVICE_KICKER} isInFocus
              actionLabel={CONTINUE_LABEL} onAction={openModelOverview}
            />
          )}
          {archetypes.map((archetype, index) => (
            <DeviceClassCard
              key={archetype.id} device={classes[index]} description={archetype.description} isInFocus={isClassInFocus(archetype)}
              actionLabel={isClassInFocus(archetype) ? CONTINUE_LABEL : START_LABEL} onAction={() => chooseClass(archetype)}
              confirm={pendingArchetypeId !== archetype.id ? undefined : (
                <ReplaceDeviceConfirm
                  currentName={state.model.name} decisionCount={state.model.riskDecisions.length} replacementLabel={`a new ${archetype.label}`}
                  onReplace={() => startFrom(archetype)} onKeep={() => setPendingArchetypeId(null)}
                />
              )}
            />
          ))}
        </div>
        {identicalSets.map((set) => <p key={set.labels.join('|')} className="explore-identical">{describeIdenticalSet(set)}</p>)}
      </section>
      </div>
      <section className="lab-panel" aria-label="Differences between the classes">
        <ClassDifferenceTable devices={devices} differences={differences} onOpenTechnique={openTechnique} />
      </section>
    </div>
  );
}
