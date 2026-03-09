// Neuroscience pioneers — person and case study cards
// Cross-references: Cajal (polymaths module), Penfield (neuroethics module)

export const NEUROSCIENCE_CROSSREFS = [
  { crossRef: 'cajal', note: 'Santiago Ramon y Cajal — see polymaths module' },
  { crossRef: 'penfield', note: 'Wilder Penfield — see neuroethics module' }
];

export const NEUROSCIENCE = [
  {
    id: 'paul-broca',
    name: 'Paul Broca',
    years: '1824 – 1880',
    era: 'Modern',
    field: 'Neuroscience',
    emoji: '\u{1F9E0}',
    fields: ['Neurology', 'Anatomy', 'Anthropology', 'Surgery'],
    tagline: 'He found where words live in the brain.',
    bio: 'Paul Broca was a French physician who proved that specific brain regions control specific functions. Before him, most scientists thought the brain worked as a single undifferentiated mass. He fought the establishment by insisting that damage to a precise spot in the left frontal lobe destroyed the ability to speak. His work with a single patient changed neuroscience forever and launched the field of cortical localization.',
    frameworks: [
      'Cortical localization — specific brain regions handle specific tasks',
      'Clinico-anatomical method — correlate patient symptoms with post-mortem brain lesions',
      'Left hemisphere dominance for language — speech production lateralized to the left',
      'Systematic case documentation — rigorous patient observation paired with autopsy findings'
    ],
    habits: [
      'Meticulous surgical and autopsy documentation',
      'Presented every finding to the Anthropological Society for peer scrutiny',
      'Maintained detailed case histories for all patients',
      'Cross-referenced symptoms with anatomical structures systematically',
      'Published prolifically to share findings with the broader medical community'
    ],
    struggles: 'Broca faced fierce resistance from the anti-localizationists who believed the brain could not be mapped to specific functions. The scientific establishment mocked the idea that a lesion in one small area could eliminate speech. He also wrestled with the ethical implications of his anthropological work on cranial measurements, which later generations rightly criticized. Despite the controversy, he pushed forward with evidence-based medicine at a time when dogma ruled.',
    moment: 'In 1861, Broca examined a patient named Louis Victor Leborgne, known as "Tan" because it was the only syllable he could utter. Tan could understand everything said to him, but could only produce that single sound. When Tan died, Broca performed an autopsy and found a lesion in the left frontal lobe. He presented the brain at the Anthropological Society of Paris, and in that moment, proved that language production lives in a specific region of the brain. That region now bears his name.',
    quotes: [
      { text: 'We speak with the left hemisphere.', src: 'Paul Broca, clinical observation, 1865' },
      { text: 'There are in the human mind a group of faculties and in the brain groups of convolutions, and the facts assembled by science so far allow to state that the great regions of the mind correspond to the great regions of the brain.', src: 'Paul Broca, on cortical localization' },
      { text: 'There is no faith, however respectable, no interest, however legitimate, which must not accommodate itself to the progress of human knowledge and bend before truth.', src: 'Paul Broca' },
      { text: 'Private practice and marriage — those twin extinguishers of science.', src: 'Paul Broca' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Paul Broca')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Paul Broca')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Paul Broca')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Paul Broca documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Paul Broca')}`
    },
    books: [
      { title: 'Sur le siege de la faculte du langage articule', author: 'Paul Broca', desc: 'Broca\'s landmark 1861 paper establishing that the left frontal lobe controls speech production, based on his study of patient Tan.' },
      { title: 'Broca\'s Brain', author: 'Carl Sagan', desc: 'Sagan reflects on visiting Broca\'s preserved brain collection and explores the nature of scientific inquiry, skepticism, and the human drive to understand the brain.' }
    ],
    takeaways: [
      { title: 'One case can change everything', desc: 'Broca built an entire field on meticulous observation of a single patient. You don\'t always need massive datasets. Sometimes one deeply studied example reveals a universal truth.' },
      { title: 'Pair observation with evidence', desc: 'Broca didn\'t just note symptoms. He correlated them with physical brain structures at autopsy. Always connect your observations to verifiable evidence.' },
      { title: 'Challenge consensus with data', desc: 'The scientific establishment said the brain couldn\'t be mapped. Broca brought a brain to a meeting and proved them wrong. When you have the evidence, present it.' }
    ]
  },

  {
    id: 'carl-wernicke',
    name: 'Carl Wernicke',
    years: '1848 – 1905',
    era: 'Modern',
    field: 'Neuroscience',
    emoji: '\u{1F5E3}',
    fields: ['Neurology', 'Psychiatry', 'Neuropathology', 'Anatomy'],
    tagline: 'He found where comprehension lives — the other half of language.',
    bio: 'Carl Wernicke was a German physician who discovered that a region in the left temporal lobe is essential for understanding speech. While Broca had found where speech is produced, Wernicke found where it is understood. His patients could speak fluently but produced meaningless word salads because they couldn\'t comprehend language, including their own. He was only 26 when he published his landmark work, and he built a connectionist model of brain function decades before anyone else.',
    frameworks: [
      'Connectionist model — brain functions arise from connections between regions, not single areas',
      'Sensory vs. motor aphasia distinction — comprehension and production are separate systems',
      'The Wernicke-Lichtheim model — a network diagram of language processing in the brain',
      'Symptom-to-lesion mapping — systematic correlation of specific deficits with specific brain damage'
    ],
    habits: [
      'Published his major discovery at age 26 with rigorous anatomical evidence',
      'Studied under Theodor Meynert, absorbing neuroanatomical methods',
      'Maintained systematic clinical observations across hundreds of patients',
      'Built theoretical models and then tested them against clinical data',
      'Integrated psychiatry with neurology, refusing to treat them as separate fields'
    ],
    struggles: 'Wernicke worked in the shadow of Broca, who had already claimed the glory of cortical localization. He had to convince the field that there was a second, equally important language center. His connectionist ideas were ahead of their time and largely ignored until the 20th century. He died young at 57 in a cycling accident, leaving much of his theoretical work unfinished. His nuanced models were oversimplified by later textbooks into cartoon diagrams that missed the depth of his thinking.',
    moment: 'In 1874, at just 26 years old, Wernicke published "Der aphasische Symptomencomplex." He described patients who could speak fluently but produced gibberish. They strung real words together in ways that made no sense, and they couldn\'t understand what others said to them. The lesion was in the left temporal lobe, posterior to the auditory cortex. Wernicke didn\'t just find another language center. He proposed an entire model: a network where Broca\'s area and his area connect via a fiber bundle, and damage at any point produces a different type of aphasia. It was the first connectionist model of the brain.',
    quotes: [
      { text: 'In the course of years I have yet much to learn, but also much I have accepted as true from others has proved inaccurate. I believe that this double-edged discovery spares no one who holds an earnest striving.', src: 'Carl Wernicke' },
      { text: 'The symptom complex of aphasia allows a distinction between the motor and the sensory elements of speech.', src: 'Carl Wernicke, Der aphasische Symptomencomplex, 1874' },
      { text: 'A disease of the mind is nothing more than a disease of the brain that manifests primarily in psychological symptoms.', src: 'Carl Wernicke, on unifying psychiatry and neurology' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Carl Wernicke')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Carl Wernicke')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Carl Wernicke')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Carl Wernicke documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Carl Wernicke')}`
    },
    books: [
      { title: 'Der aphasische Symptomencomplex', author: 'Carl Wernicke', desc: 'Wernicke\'s 1874 monograph distinguishing sensory aphasia from motor aphasia and proposing the first connectionist model of language in the brain.' },
      { title: 'From Neuron to Brain', author: 'John Nicholls et al.', desc: 'A foundational neuroscience textbook that contextualizes Wernicke\'s discoveries within the broader story of how we understand brain function.' }
    ],
    takeaways: [
      { title: 'Youth is not a disqualification', desc: 'Wernicke was 26 when he reshaped neuroscience. Don\'t wait for permission or seniority to publish important work.' },
      { title: 'Think in systems, not silos', desc: 'Wernicke saw the brain as a connected network, not a collection of independent modules. Complex behavior emerges from connections, not from single regions.' },
      { title: 'Build models that generate predictions', desc: 'Wernicke\'s model predicted a third type of aphasia (conduction aphasia) before anyone had seen it. Good theories predict things you haven\'t observed yet.' }
    ]
  },

  {
    id: 'roger-sperry',
    name: 'Roger Sperry',
    years: '1913 – 1994',
    era: 'Modern',
    field: 'Neuroscience',
    emoji: '\u{1FA9F}',
    fields: ['Neurobiology', 'Neuropsychology', 'Developmental Biology', 'Philosophy of Mind'],
    tagline: 'He split the brain and found two minds.',
    bio: 'Roger Sperry proved that the left and right hemispheres of the brain are essentially two separate conscious systems. He worked with patients whose corpus callosum had been severed to treat epilepsy and designed ingenious experiments showing each hemisphere could learn, remember, and act independently. His work destroyed the myth of a unified, singular consciousness and won him the Nobel Prize in 1981. Before the split-brain experiments, he also overturned conventional wisdom about nerve growth with his chemoaffinity hypothesis.',
    frameworks: [
      'Split-brain paradigm — study each hemisphere independently by severing the corpus callosum',
      'Lateralization of function — left hemisphere specializes in language, right in spatial tasks',
      'Chemoaffinity hypothesis — neurons find their targets through chemical markers, not random growth',
      'Emergent interactionism — consciousness is real, causally potent, and emerges from brain activity'
    ],
    habits: [
      'Designed precise experimental setups that isolated each hemisphere\'s contributions',
      'Maintained long-term relationships with split-brain patients for longitudinal study',
      'Drew his own experimental diagrams with meticulous attention to detail',
      'Wrote philosophical papers alongside empirical ones, bridging science and philosophy',
      'Challenged reductionism publicly, arguing consciousness matters in its own right'
    ],
    struggles: 'Sperry spent decades fighting the behaviorist establishment that dismissed consciousness as irrelevant to science. His early work on nerve regeneration was met with skepticism because it contradicted the prevailing view that neurons could wire up randomly. His split-brain research was initially seen as a curiosity with no broader implications. And his later philosophical work on consciousness was dismissed by hard-nosed reductionists who thought he\'d gone soft. He fought on every front.',
    moment: 'In the 1960s, Sperry and his student Michael Gazzaniga tested patients who\'d had their corpus callosum severed. They flashed images to one eye at a time. The left hemisphere could name objects shown to the right visual field but was completely unaware of objects shown to the left. The right hemisphere could point to the correct object but couldn\'t name it. In one famous test, a patient\'s left hand reached for one object while the right hand reached for another, as if two different people were making decisions. Sperry had proven that cutting one cable creates two independent conscious minds.',
    quotes: [
      { text: 'The great pleasure and feeling in my right brain is more than my left brain can find the words to tell you.', src: 'Roger Sperry, Nobel Prize lecture, 1981' },
      { text: 'The centermost processes of the brain with which consciousness is presumably associated are simply not understood. They are so far beyond our comprehension that no one I know of has been able to imagine their nature.', src: 'Roger Sperry' },
      { text: 'Prior to the advent of brain, there was no color and no sound in the universe, nor was there any flavor or aroma and probably rather little sense and no feeling or emotion.', src: 'Roger Sperry, on consciousness and evolution' },
      { text: 'Each hemisphere is indeed a conscious system in its own right, perceiving, thinking, remembering, reasoning, willing, and emoting, all at a characteristically human level.', src: 'Roger Sperry, on split-brain findings' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Roger Sperry')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Roger Sperry')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Roger Sperry')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Roger Sperry documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Roger Sperry')}`
    },
    books: [
      { title: 'Science and Moral Priority', author: 'Roger Sperry', desc: 'Sperry\'s philosophical work arguing that science has moral implications and that consciousness, as an emergent property, has real causal power in the physical world.' },
      { title: 'Tales from Both Sides of the Brain', author: 'Michael Gazzaniga', desc: 'Sperry\'s most famous student tells the inside story of split-brain research, from the first experiments to the philosophical questions they raised.' }
    ],
    takeaways: [
      { title: 'Design experiments that isolate variables', desc: 'Sperry\'s genius was creating setups where each hemisphere had to act alone. Clean experimental design reveals truths that messy observations miss.' },
      { title: 'Don\'t fear philosophical implications', desc: 'Sperry didn\'t shy away from what his data meant for consciousness and free will. Let your evidence lead you to big questions, even uncomfortable ones.' },
      { title: 'Challenge the dominant paradigm directly', desc: 'Sperry took on behaviorism, reductionism, and the unity-of-consciousness assumption all at once. If your data contradicts the consensus, say so clearly.' }
    ]
  },

  {
    id: 'eric-kandel',
    name: 'Eric Kandel',
    years: '1929 – present',
    era: 'Modern',
    field: 'Neuroscience',
    emoji: '\u{1F41A}',
    fields: ['Neuroscience', 'Molecular Biology', 'Psychiatry', 'Memory Research'],
    tagline: 'He decoded memory at the molecular level using sea slugs.',
    bio: 'Eric Kandel is an Austrian-American neuroscientist who figured out how memories are stored at the molecular level. He chose the giant sea slug Aplysia because its neurons are huge and few, making the chemistry of learning visible. His work showed that short-term memory involves temporary chemical changes at synapses, while long-term memory requires new gene expression and the growth of entirely new synaptic connections. He won the Nobel Prize in 2000 and proved that even the most complex human experiences reduce to molecular events.',
    frameworks: [
      'Reductionist approach — study complex phenomena in simple organisms first',
      'Short-term vs. long-term memory — different molecular mechanisms for temporary vs. lasting memories',
      'Synaptic plasticity — learning physically changes the strength of connections between neurons',
      'Gene expression in memory — long-term memory requires turning genes on and building new proteins'
    ],
    habits: [
      'Chose the simplest possible model organism to study the most complex question',
      'Maintained a single research focus on memory for over 50 years',
      'Bridged psychiatry and molecular biology, refusing to accept they were separate',
      'Wrote extensively for general audiences to make neuroscience accessible',
      'Integrated his personal history as a Vienna refugee into his scientific motivation'
    ],
    struggles: 'Kandel fled Nazi Vienna as a child, an experience that shaped his lifelong obsession with memory. When he started studying memory in sea slugs, colleagues dismissed the approach as absurd. How could a slug teach us anything about human memory? The psychiatry establishment resisted his reductionist approach, insisting that the mind couldn\'t be understood through molecules. He spent decades proving them wrong, one synapse at a time. His persistence turned ridicule into a Nobel Prize.',
    moment: 'Kandel\'s defining breakthrough came when he showed that touching a sea slug\'s siphon caused a simple withdrawal reflex that could be strengthened through repetition. The short-term memory of this learning involved existing proteins modifying synaptic strength. But when the training was repeated enough times, something remarkable happened: the cell\'s nucleus turned on new genes, manufactured new proteins, and grew entirely new synaptic connections. Memory, at its most fundamental level, is the growth of new physical structures in the brain. The number of synaptic connections literally doubled with learning.',
    quotes: [
      { text: 'Memory is the glue that binds our mental life together. Without the unifying force of memory, we would be broken into as many fragments as there are moments in the day.', src: 'Eric Kandel, In Search of Memory' },
      { text: 'You could double the number of synaptic connections in a very simple neurocircuit as a result of experience and learning.', src: 'Eric Kandel, on Aplysia experiments' },
      { text: 'One of the reasons that the neurobiology of learning and memory appealed to me so much was that I liked the idea of bringing biology and psychology together.', src: 'Eric Kandel' },
      { text: 'Long-term memory involves enduring changes that result from the growth of new synaptic connections.', src: 'Eric Kandel, Nobel lecture, 2000' },
      { text: 'Nerve cells communicate with one another at specialized points called synapses. And these synapses are plastic — they can be modified by learning.', src: 'Eric Kandel' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Eric Kandel')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Eric Kandel')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Eric Kandel')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Eric Kandel documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Eric Kandel')}`
    },
    books: [
      { title: 'In Search of Memory', author: 'Eric Kandel', desc: 'Kandel\'s memoir weaving together his escape from Nazi Vienna, his scientific journey through sea slug neurons, and the molecular basis of memory. Part autobiography, part neuroscience masterclass.' },
      { title: 'Principles of Neural Science', author: 'Eric Kandel, James Schwartz, Thomas Jessell', desc: 'The definitive neuroscience textbook, now in its sixth edition. Co-authored by Kandel, it synthesizes molecular, cellular, and systems neuroscience.' }
    ],
    takeaways: [
      { title: 'Start simple to understand complex', desc: 'Kandel chose a slug with 20,000 neurons instead of a human with 86 billion. Reduce your problem to its simplest form before scaling up.' },
      { title: 'Repetition physically rewires the brain', desc: 'Learning isn\'t metaphorical. It literally grows new synaptic connections. This is the biological argument for deliberate practice.' },
      { title: 'Personal pain can fuel scientific purpose', desc: 'Kandel\'s childhood trauma drove a lifelong quest to understand memory. Your struggles can become the engine of your deepest work.' }
    ]
  },

  {
    id: 'brenda-milner',
    name: 'Brenda Milner',
    years: '1918 – present',
    era: 'Modern',
    field: 'Neuroscience',
    emoji: '\u{1F9EC}',
    fields: ['Neuropsychology', 'Cognitive Neuroscience', 'Memory Research', 'Language'],
    tagline: 'She proved memory has more than one system — and she\'s still working past 100.',
    bio: 'Brenda Milner is the founder of neuropsychology as a discipline. Working at the Montreal Neurological Institute, she studied patients with brain lesions and discovered that memory is not one thing but many: declarative, procedural, spatial, each handled by different brain structures. Her work with Patient H.M. proved that the hippocampus is essential for forming new declarative memories but not for learning new skills. She\'s been doing science for over 70 years and was still active in her lab past age 100.',
    frameworks: [
      'Multiple memory systems — the brain stores different types of memory in different structures',
      'Dissociation method — if a brain lesion destroys one ability but spares another, they use different systems',
      'Hippocampal memory consolidation — the hippocampus converts short-term experiences into long-term memories',
      'Lateralization of cognitive functions — verbal memory left, spatial memory right'
    ],
    habits: [
      'Maintained active research for over 70 consecutive years',
      'Developed standardized neuropsychological tests still used worldwide',
      'Built long-term relationships with patients, studying them over decades',
      'Approached every patient as a unique scientific opportunity',
      'Stayed curious and kept learning new techniques well into her 100s'
    ],
    struggles: 'Milner started her career in an era when women in science were barely tolerated. She was told repeatedly that her contributions were secondary to the male surgeons she worked with. Her most famous finding, from Patient H.M., was initially credited primarily to the surgeon William Scoville. She had to fight for decades to receive proper recognition. Cambridge rejected her doctoral application because they didn\'t award degrees to women at the time. She outlasted every obstacle through sheer persistence and an unshakeable love of the work.',
    moment: 'In 1957, Milner published her landmark study of Patient H.M. Henry Molaison had both hippocampi surgically removed to treat severe epilepsy. The seizures stopped, but H.M. could no longer form new memories. He forgot people he\'d met minutes ago. Yet Milner discovered something stunning: H.M. could learn new motor skills. She had him trace a star while looking in a mirror, and he got better every day, even though he had no memory of ever having practiced. This proved that declarative memory and procedural memory are entirely separate systems in the brain, a finding that restructured all of memory research.',
    quotes: [
      { text: 'I\'m still nosy, you know. Curious.', src: 'Brenda Milner, interview at age 100' },
      { text: 'Human quirks attract my interest. If you\'re a theoretical person, you can sit and dream up beautiful theories, but my approach is: What would happen if? And then, how can I measure it?', src: 'Brenda Milner, McGill University interview' },
      { text: 'I wouldn\'t still be working if I didn\'t find it exciting.', src: 'Brenda Milner, at age 101' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Brenda Milner')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Brenda Milner')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Brenda Milner')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Brenda Milner documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Brenda Milner')}`
    },
    books: [
      { title: 'Memory and the Medial Temporal Lobe', author: 'Brenda Milner (collected papers)', desc: 'A collection of Milner\'s key papers documenting decades of research on how the hippocampus and surrounding structures create, store, and retrieve memories.' }
    ],
    takeaways: [
      { title: 'There are many kinds of memory', desc: 'You can learn a skill without remembering the learning. Procedural and declarative memory are separate systems. Use this knowledge to design better learning strategies.' },
      { title: 'Longevity comes from love of the work', desc: 'Milner has been doing science for over 70 years because she genuinely loves it. Sustainable careers are built on intrinsic motivation, not external rewards.' },
      { title: 'Ask "what would happen if?" instead of theorizing', desc: 'Milner\'s approach was always empirical. Test your assumptions with experiments rather than building theories in isolation.' }
    ]
  },

  {
    id: 'patient-hm',
    name: 'Patient H.M. (Henry Molaison)',
    years: '1926 – 2008',
    era: 'Modern',
    field: 'Neuroscience',
    emoji: '\u{1F50D}',
    fields: ['Neuropsychology', 'Memory Research', 'Case Study', 'Medical History'],
    tagline: 'The man who couldn\'t make new memories — and rewrote neuroscience.',
    bio: 'Henry Molaison is the most studied patient in the history of neuroscience. In 1953, a surgeon removed both of his hippocampi to treat debilitating epilepsy. The seizures improved, but Henry lost the ability to form new declarative memories. He lived in a permanent present tense for 55 years. Every conversation was new. Every person he met was a stranger. But he could still learn motor skills, even though he couldn\'t remember practicing them. His case proved that memory is not one thing, and the hippocampus is its gatekeeper.',
    frameworks: [
      'Anterograde amnesia — inability to form new memories after brain damage',
      'Declarative vs. procedural memory dissociation — knowing what vs. knowing how',
      'Hippocampal necessity — the hippocampus is required for new memory consolidation',
      'Preserved implicit learning — motor skills and conditioning survive hippocampal damage'
    ],
    habits: [
      'Participated willingly in decades of testing, always as if for the first time',
      'Completed the same puzzles and tests hundreds of times without fatigue or frustration',
      'Maintained a polite, cooperative demeanor with researchers he could never remember',
      'Worked crossword puzzles daily as a personal routine',
      'Donated his brain to science, enabling detailed post-mortem analysis'
    ],
    struggles: 'Henry Molaison lived in a world without continuity. He could hold a conversation but would forget it within minutes. He read the same magazines as if they were new every time. He couldn\'t grieve properly because he\'d forget the loss, only to be told about it again and re-experience the pain. He knew something was wrong with him but couldn\'t fully grasp what. For 55 years, he was trapped in a permanent present, aware enough to know he was missing something but unable to hold onto the knowledge of what.',
    moment: 'In 1953, surgeon William Beecher Scoville performed an experimental bilateral medial temporal lobectomy on 27-year-old Henry Molaison. The surgery removed most of his hippocampus, amygdala, and surrounding cortex on both sides. Henry woke up unable to form new memories. Brenda Milner began studying him and discovered that while he couldn\'t remember meeting her each visit, he could learn new motor skills and improve at them over days. This single case study proved that the brain has multiple, independent memory systems. Henry was studied by over 100 researchers across five decades, and his initials H.M. became the most cited case in neuroscience. After his death in 2008, his brain was sliced into 2,401 thin sections and digitized for future research.',
    quotes: [
      { text: 'Every day is alone in itself, whatever enjoyment I\'ve had, and whatever sorrow I\'ve had.', src: 'Henry Molaison (Patient H.M.), recorded interview' },
      { text: 'Right now, I\'m wondering, have I done or said something amiss? You see, at this moment everything looks clear to me, but what happened just before? That\'s what worries me.', src: 'Henry Molaison (Patient H.M.), conversation with researchers' },
      { text: 'It\'s like waking from a dream. I just don\'t remember.', src: 'Henry Molaison (Patient H.M.)' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Henry Molaison')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Patient HM memory')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Patient HM Henry Molaison')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Patient HM Henry Molaison documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Henry Molaison')}`
    },
    books: [
      { title: 'Permanent Present Tense', author: 'Suzanne Corkin', desc: 'Written by the MIT neuroscientist who studied H.M. for nearly 50 years. The definitive account of his life, his condition, and what he taught us about memory.' },
      { title: 'Patient H.M.: A Story of Memory, Madness, and Family Secrets', author: 'Luke Dittrich', desc: 'A journalist\'s investigation into H.M.\'s case, the surgeon who operated on him, and the ethical questions surrounding decades of research on a man who couldn\'t consent to remember.' }
    ],
    takeaways: [
      { title: 'Memory makes identity', desc: 'Without the ability to form new memories, you lose the thread of your own life. Memory isn\'t just storage. It\'s the foundation of who you are.' },
      { title: 'The body remembers what the mind forgets', desc: 'H.M. could learn skills his conscious mind had no record of. Your procedural memory is a separate, powerful system. Use it deliberately through physical practice.' },
      { title: 'Ethics must keep pace with science', desc: 'H.M. couldn\'t consent meaningfully to decades of research because he couldn\'t remember agreeing. His case raised questions about consent, autonomy, and the rights of research subjects that we\'re still working through.' }
    ]
  }
];
