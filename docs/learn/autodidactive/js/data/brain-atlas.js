// Brain Atlas for Autodidactive Learning
// Source: shared/qif-brain-bci-atlas.json (v1.2.0, 2026-02-18)
// 37 brain regions across QIF 7-1-3 hourglass bands (N7 through N1)
// Primary neuroanatomical source: Kandel ER et al. Principles of Neural Science. 6th ed. McGraw Hill, 2021

export const BRAIN_REGIONS = [
  // === N7: Neocortex (10 regions) ===
  {
    id: 'prefrontal_cortex',
    name: 'Prefrontal Cortex',
    band: 'N7',
    function: 'Executive function, decision-making, working memory, personality, social behavior, and planning. The seat of higher-order cognition.',
    recordingMethods: ['EEG', 'fMRI', 'fNIRS', 'ECoG', 'MEG'],
    stimulationMethods: ['TMS', 'tDCS', 'DBS'],
    latency: '150-300ms',
    clinicalRelevance: 'ADHD, depression, schizophrenia, traumatic brain injury, frontotemporal dementia, addiction'
  },
  {
    id: 'primary_motor_cortex',
    name: 'Primary Motor Cortex (M1)',
    band: 'N7',
    function: 'Voluntary motor execution with somatotopic motor map (homunculus). Primary target for motor BCI systems.',
    recordingMethods: ['EEG', 'ECoG', 'intracortical arrays', 'MEG'],
    stimulationMethods: ['TMS', 'tDCS', 'intracortical microstimulation'],
    latency: '10-30ms',
    clinicalRelevance: 'Stroke, ALS, spinal cord injury, cerebral palsy. Most common BCI target for motor restoration.'
  },
  {
    id: 'primary_visual_cortex',
    name: 'Primary Visual Cortex (V1)',
    band: 'N7',
    function: 'Primary visual processing including edge detection, orientation, spatial frequency, and color. First cortical stage of visual hierarchy.',
    recordingMethods: ['EEG', 'fMRI', 'ECoG', 'MEG'],
    stimulationMethods: ['TMS', 'intracortical microstimulation'],
    latency: '56-100ms',
    clinicalRelevance: 'Cortical blindness, visual prosthetics (Neuralink Blindsight targets V1), visual hallucinations'
  },
  {
    id: 'primary_auditory_cortex',
    name: 'Primary Auditory Cortex (A1)',
    band: 'N7',
    function: 'Primary auditory processing with tonotopic frequency mapping and sound onset detection. Receives input from medial geniculate nucleus.',
    recordingMethods: ['EEG', 'ECoG', 'MEG', 'fMRI'],
    stimulationMethods: ['cochlear implant (indirect)', 'TMS'],
    latency: '25-80ms',
    clinicalRelevance: 'Deafness, tinnitus, auditory processing disorders. Cochlear implants stimulate the auditory nerve pathway to A1.'
  },
  {
    id: 'broca_area',
    name: "Broca's Area",
    band: 'N7',
    function: 'Speech production, syntactic processing, and language planning. Shows a unique three-wave processing pattern during linguistic tasks.',
    recordingMethods: ['EEG', 'ECoG', 'fMRI', 'MEG'],
    stimulationMethods: ['TMS', 'direct cortical stimulation'],
    latency: '150-450ms',
    clinicalRelevance: 'Expressive aphasia, speech motor disorders. Target for speech-decoding BCIs.'
  },
  {
    id: 'wernicke_area',
    name: "Wernicke's Area",
    band: 'N7',
    function: 'Language comprehension, semantic processing, and speech reception. Posterior superior temporal gyrus region.',
    recordingMethods: ['EEG', 'ECoG', 'fMRI', 'MEG'],
    stimulationMethods: ['TMS', 'direct cortical stimulation'],
    latency: '50-400ms',
    clinicalRelevance: 'Receptive aphasia, semantic dementia, language comprehension deficits'
  },
  {
    id: 'premotor_cortex',
    name: 'Premotor Cortex',
    band: 'N7',
    function: 'Motor planning, movement preparation, and sensorimotor integration. Fires 80-200ms before movement onset.',
    recordingMethods: ['EEG', 'ECoG', 'fMRI', 'MEG'],
    stimulationMethods: ['TMS', 'tDCS'],
    latency: '80-200ms',
    clinicalRelevance: 'Apraxia, motor planning deficits, stroke rehabilitation'
  },
  {
    id: 'supplementary_motor_area',
    name: 'Supplementary Motor Area (SMA)',
    band: 'N7',
    function: 'Motor sequence planning, bimanual coordination, and internally generated movements. Generates readiness potential 1500ms before voluntary movement.',
    recordingMethods: ['EEG', 'fMRI', 'MEG'],
    stimulationMethods: ['TMS', 'tDCS'],
    latency: '300-1500ms',
    clinicalRelevance: 'Movement initiation disorders, alien hand syndrome, supplementary motor area syndrome'
  },
  {
    id: 'posterior_parietal_cortex',
    name: 'Posterior Parietal Cortex (PPC)',
    band: 'N7',
    function: 'Spatial awareness, sensorimotor integration, attention, and reach planning. Integrates visual and motor information.',
    recordingMethods: ['EEG', 'ECoG', 'fMRI', 'MEG'],
    stimulationMethods: ['TMS', 'tDCS'],
    latency: '45-150ms',
    clinicalRelevance: 'Hemispatial neglect, optic ataxia, Balint syndrome, attention deficits'
  },
  {
    id: 'primary_somatosensory_cortex',
    name: 'Primary Somatosensory Cortex (S1)',
    band: 'N7',
    function: 'Tactile sensation, proprioception, and somatotopic sensory map (homunculus). Earliest cortical somatosensory processing.',
    recordingMethods: ['EEG', 'ECoG', 'MEG', 'fMRI'],
    stimulationMethods: ['TMS', 'intracortical microstimulation', 'tDCS'],
    latency: '14-50ms',
    clinicalRelevance: 'Somatosensory deficits, neuropathic pain, sensory restoration via BCI'
  },

  // === N6: Limbic System (5 regions) ===
  {
    id: 'hippocampus',
    name: 'Hippocampus',
    band: 'N6',
    function: 'Episodic memory formation, spatial navigation, and memory consolidation. Generates sharp-wave ripples during memory replay.',
    recordingMethods: ['depth electrodes', 'fMRI', 'stereo-EEG'],
    stimulationMethods: ['DBS', 'responsive neurostimulation'],
    latency: '101-500ms',
    clinicalRelevance: "Epilepsy (temporal lobe), Alzheimer's disease, PTSD, amnesia. NeuroPace RNS targets hippocampal seizure foci."
  },
  {
    id: 'basolateral_amygdala',
    name: 'Basolateral Amygdala (BLA)',
    band: 'N6',
    function: 'Fear conditioning, emotional valence assignment, and associative learning. Has cortical-like architecture unlike the central amygdala.',
    recordingMethods: ['depth electrodes', 'fMRI', 'stereo-EEG'],
    stimulationMethods: ['DBS'],
    latency: '74-200ms',
    clinicalRelevance: 'PTSD, anxiety disorders, phobias, emotional dysregulation'
  },
  {
    id: 'insular_cortex',
    name: 'Insular Cortex',
    band: 'N6',
    function: 'Interoception, pain processing, emotional awareness, taste, and autonomic regulation. Key hub for subjective feeling states.',
    recordingMethods: ['stereo-EEG', 'fMRI', 'depth electrodes'],
    stimulationMethods: ['direct cortical stimulation'],
    latency: '200-350ms',
    clinicalRelevance: 'Chronic pain, addiction, eating disorders, anxiety. Difficult to access surgically due to deep location.'
  },
  {
    id: 'anterior_cingulate_cortex',
    name: 'Anterior Cingulate Cortex (ACC)',
    band: 'N6',
    function: 'Conflict monitoring, error detection, pain processing, motivation, and autonomic regulation. Generates error-related negativity (ERN).',
    recordingMethods: ['EEG', 'fMRI', 'depth electrodes', 'MEG'],
    stimulationMethods: ['DBS', 'TMS'],
    latency: '100-400ms',
    clinicalRelevance: 'OCD, depression, chronic pain, apathy. DBS target for treatment-resistant depression.'
  },
  {
    id: 'posterior_cingulate_cortex',
    name: 'Cingulate Gyrus (Posterior)',
    band: 'N6',
    function: 'Default mode network hub, self-referential processing, memory retrieval, and spatial orientation.',
    recordingMethods: ['fMRI', 'EEG', 'MEG'],
    stimulationMethods: ['TMS'],
    latency: '150-400ms',
    clinicalRelevance: "Alzheimer's disease (early hypometabolism), dissociative disorders, spatial disorientation"
  },

  // === N5: Basal Ganglia (5 regions) ===
  {
    id: 'striatum',
    name: 'Striatum (Caudate + Putamen)',
    band: 'N5',
    function: 'Motor selection, habit learning, reward prediction, and action initiation. Primary input nucleus of basal ganglia.',
    recordingMethods: ['depth electrodes', 'fMRI', 'PET'],
    stimulationMethods: ['DBS'],
    latency: '60-300ms',
    clinicalRelevance: "Parkinson's disease, Huntington's disease, OCD, addiction, Tourette syndrome"
  },
  {
    id: 'globus_pallidus_internus',
    name: 'Globus Pallidus Internus (GPi)',
    band: 'N5',
    function: 'Primary output nucleus of basal ganglia (inhibitory). Major DBS target for dystonia and movement disorders.',
    recordingMethods: ['depth electrodes', 'intraoperative microelectrode recording'],
    stimulationMethods: ['DBS'],
    latency: '10-30ms',
    clinicalRelevance: "Dystonia (primary DBS target), Parkinson's disease, Huntington's chorea"
  },
  {
    id: 'globus_pallidus_externus',
    name: 'Globus Pallidus Externus (GPe)',
    band: 'N5',
    function: 'Indirect pathway relay, tonic inhibition of the subthalamic nucleus, and basal ganglia modulation.',
    recordingMethods: ['depth electrodes', 'intraoperative microelectrode recording'],
    stimulationMethods: ['DBS'],
    latency: '10-25ms',
    clinicalRelevance: "Parkinson's disease (indirect pathway dysfunction), dystonia"
  },
  {
    id: 'subthalamic_nucleus',
    name: 'Subthalamic Nucleus (STN)',
    band: 'N5',
    function: "Hyperdirect pathway hub, motor urgency signal, and stop-signal processing. Primary DBS target for Parkinson's disease.",
    recordingMethods: ['depth electrodes', 'intraoperative microelectrode recording'],
    stimulationMethods: ['DBS'],
    latency: '5-70ms',
    clinicalRelevance: "Parkinson's disease (primary DBS target), OCD. Pathological beta oscillations (15-30 Hz) are a biomarker."
  },
  {
    id: 'substantia_nigra',
    name: 'Substantia Nigra (SNr/SNc)',
    band: 'N5',
    function: "Dopamine production (SNc pars compacta) and basal ganglia output (SNr pars reticulata). Degeneration causes Parkinson's disease.",
    recordingMethods: ['depth electrodes', 'PET', 'DaTscan'],
    stimulationMethods: ['DBS (indirect)'],
    latency: '10-50ms',
    clinicalRelevance: "Parkinson's disease (SNc degeneration is the hallmark), dopamine-related psychiatric conditions"
  },
  {
    id: 'central_amygdala',
    name: 'Central Amygdala (CeA)',
    band: 'N5',
    function: 'Autonomic fear output, conditioned fear responses, and pain modulation. Subcortical architecture distinct from the cortical-like BLA.',
    recordingMethods: ['depth electrodes', 'fMRI'],
    stimulationMethods: ['DBS'],
    latency: '80-200ms',
    clinicalRelevance: 'Anxiety disorders, PTSD (autonomic fear responses), pain modulation'
  },

  // === N4: Diencephalon (4 regions) ===
  {
    id: 'thalamus',
    name: 'Thalamus',
    band: 'N4',
    function: "Central relay station for all sensory modalities except olfaction. Reticular thalamic nucleus implements default-deny gating on ascending traffic.",
    recordingMethods: ['depth electrodes', 'fMRI', 'stereo-EEG'],
    stimulationMethods: ['DBS'],
    latency: '3-20ms',
    clinicalRelevance: 'Disorders of consciousness, thalamic pain syndrome, epilepsy. Gating dysfunction implicated in schizophrenia.'
  },
  {
    id: 'hypothalamus',
    name: 'Hypothalamus',
    band: 'N4',
    function: 'Homeostatic regulation including temperature, hunger, thirst, circadian rhythm, hormone release, and autonomic output.',
    recordingMethods: ['fMRI', 'depth electrodes (rare)'],
    stimulationMethods: ['DBS'],
    latency: '7-20ms',
    clinicalRelevance: 'Obesity, cluster headaches (DBS target), narcolepsy, hormonal disorders, temperature dysregulation'
  },
  {
    id: 'ventral_intermediate_nucleus',
    name: 'Ventral Intermediate Nucleus (VIM)',
    band: 'N4',
    function: 'Cerebellar relay to motor cortex. Primary DBS target for essential tremor. Part of the cerebellar-thalamo-cortical loop.',
    recordingMethods: ['intraoperative microelectrode recording', 'depth electrodes'],
    stimulationMethods: ['DBS', 'focused ultrasound ablation'],
    latency: '5-15ms',
    clinicalRelevance: 'Essential tremor (primary DBS target), cerebellar tremor, multiple sclerosis tremor'
  },
  {
    id: 'anterior_nucleus_thalamus',
    name: 'Anterior Nucleus of Thalamus (ANT)',
    band: 'N4',
    function: 'Limbic relay and memory circuits (Papez circuit). DBS target for drug-resistant epilepsy (SANTE trial).',
    recordingMethods: ['depth electrodes', 'fMRI'],
    stimulationMethods: ['DBS'],
    latency: '5-20ms',
    clinicalRelevance: 'Drug-resistant epilepsy (FDA-approved DBS target), memory circuit dysfunction'
  },

  // === N3: Cerebellum (3 regions) ===
  {
    id: 'cerebellar_cortex',
    name: 'Cerebellar Cortex',
    band: 'N3',
    function: 'Motor coordination, error correction, timing, and procedural learning. Purkinje cells are the sole output neurons.',
    recordingMethods: ['fMRI', 'EEG (limited)', 'intraoperative recording'],
    stimulationMethods: ['TMS', 'tDCS'],
    latency: '10-50ms',
    clinicalRelevance: 'Ataxia, cerebellar cognitive affective syndrome, autism spectrum (cerebellar theory), motor learning deficits'
  },
  {
    id: 'deep_cerebellar_nuclei',
    name: 'Deep Cerebellar Nuclei (DCN)',
    band: 'N3',
    function: 'Cerebellar output nuclei (dentate, interposed, fastigial). Relay processed signals to thalamus and brainstem.',
    recordingMethods: ['depth electrodes (rare)', 'fMRI'],
    stimulationMethods: ['DBS (experimental)'],
    latency: '5-30ms',
    clinicalRelevance: 'Cerebellar output disorders, tremor generation, dysmetria'
  },
  {
    id: 'cerebellar_vermis',
    name: 'Cerebellar Vermis',
    band: 'N3',
    function: 'Axial motor control, balance, gait, vestibular integration, and emotional regulation (Schmahmann dysmetria of thought).',
    recordingMethods: ['fMRI', 'EEG (limited)'],
    stimulationMethods: ['TMS', 'tDCS'],
    latency: '10-40ms',
    clinicalRelevance: 'Gait ataxia, vertigo, cerebellar cognitive affective syndrome, some psychiatric conditions'
  },

  // === N2: Brainstem (4 regions) ===
  {
    id: 'medulla_oblongata',
    name: 'Medulla Oblongata',
    band: 'N2',
    function: 'Vital autonomic centers for respiratory rhythm, cardiac center, blood pressure regulation, and vomiting reflex.',
    recordingMethods: ['brainstem auditory evoked potentials (BAEP)', 'fMRI'],
    stimulationMethods: ['vagus nerve stimulation (indirect)'],
    latency: '1-4ms',
    clinicalRelevance: 'Brainstem stroke (life-threatening), sleep apnea, autonomic failure. Compromise is potentially lethal.'
  },
  {
    id: 'pons',
    name: 'Pons',
    band: 'N2',
    function: 'Relay between cortex and cerebellum, REM sleep regulation, and auditory relay via the superior olivary complex.',
    recordingMethods: ['BAEP', 'fMRI'],
    stimulationMethods: ['none (too dangerous for direct stimulation)'],
    latency: '3-5ms',
    clinicalRelevance: 'Locked-in syndrome, central pontine myelinolysis, REM sleep behavior disorder, trigeminal neuralgia'
  },
  {
    id: 'midbrain',
    name: 'Midbrain (Mesencephalon)',
    band: 'N2',
    function: 'Visual and auditory reflexes (superior/inferior colliculi), dopaminergic pathways (VTA, SNc), and pain modulation (PAG).',
    recordingMethods: ['BAEP', 'fMRI', 'PET'],
    stimulationMethods: ['DBS (PAG/PVG for pain)'],
    latency: '7-9ms',
    clinicalRelevance: "Parkinson's disease, chronic pain (PAG DBS), auditory processing, oculomotor disorders"
  },
  {
    id: 'reticular_formation',
    name: 'Reticular Formation',
    band: 'N2',
    function: 'Arousal, consciousness, sleep-wake transitions, pain modulation, and postural tone. The reticular activating system.',
    recordingMethods: ['fMRI', 'EEG (indirect via arousal markers)'],
    stimulationMethods: ['DBS (experimental)'],
    latency: '5-50ms',
    clinicalRelevance: 'Coma, disorders of consciousness, narcolepsy, central pain syndromes'
  },

  // === N1: Spinal Cord (5 regions) ===
  {
    id: 'cervical_spinal_cord',
    name: 'Cervical Spinal Cord (C1-C8)',
    band: 'N1',
    function: 'Upper limb motor innervation, diaphragm control (C3-C5), neck muscles, and upper limb sensation.',
    recordingMethods: ['somatosensory evoked potentials (SEP)', 'EMG', 'MRI'],
    stimulationMethods: ['epidural spinal stimulation', 'FES'],
    latency: '5-10ms',
    clinicalRelevance: 'Quadriplegia, cervical myelopathy, respiratory failure (high cervical). Spinal cord stimulation target.'
  },
  {
    id: 'thoracic_spinal_cord',
    name: 'Thoracic Spinal Cord (T1-T12)',
    band: 'N1',
    function: 'Trunk muscles, sympathetic outflow, and intercostal muscles for respiration.',
    recordingMethods: ['SEP', 'EMG', 'MRI'],
    stimulationMethods: ['epidural spinal stimulation'],
    latency: '8-15ms',
    clinicalRelevance: 'Paraplegia, autonomic dysreflexia, thoracic myelopathy'
  },
  {
    id: 'lumbar_spinal_cord',
    name: 'Lumbar Spinal Cord (L1-L5)',
    band: 'N1',
    function: 'Lower limb motor innervation, patellar reflex, and lower limb sensation.',
    recordingMethods: ['SEP', 'EMG', 'MRI'],
    stimulationMethods: ['epidural spinal stimulation', 'FES'],
    latency: '12-20ms',
    clinicalRelevance: 'Paraplegia, lumbar stenosis. Epidural stimulation here has restored walking in some spinal cord injury patients.'
  },
  {
    id: 'sacral_spinal_cord',
    name: 'Sacral Spinal Cord (S1-S5)',
    band: 'N1',
    function: 'Bladder, bowel, sexual function, perineal sensation, and parasympathetic outflow.',
    recordingMethods: ['SEP', 'EMG', 'urodynamics'],
    stimulationMethods: ['sacral neuromodulation', 'epidural stimulation'],
    latency: '15-25ms',
    clinicalRelevance: 'Neurogenic bladder, bowel dysfunction, sexual dysfunction. Sacral neuromodulation is FDA-approved for incontinence.'
  },
  {
    id: 'cauda_equina',
    name: 'Cauda Equina',
    band: 'N1',
    function: 'Bundle of spinal nerve roots below L1-L2. Carries lower limb motor, sensory, bladder, and bowel signals.',
    recordingMethods: ['EMG', 'nerve conduction studies', 'MRI'],
    stimulationMethods: ['epidural stimulation'],
    latency: null,
    clinicalRelevance: 'Cauda equina syndrome (surgical emergency), disc herniation, lower limb weakness and saddle anesthesia'
  }
];

// Utility: get regions by QIF band
export function getRegionsByBand(band) {
  return BRAIN_REGIONS.filter(r => r.band === band);
}

// Utility: get region by ID
export function getRegionById(id) {
  return BRAIN_REGIONS.find(r => r.id === id);
}

// Utility: band summary counts
export const BAND_COUNTS = {
  N7: 10,
  N6: 5,
  N5: 6,
  N4: 4,
  N3: 3,
  N2: 4,
  N1: 5
};

// Utility: total region count
export const TOTAL_REGIONS = BRAIN_REGIONS.length;
