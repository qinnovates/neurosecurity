// ═══════════════════════════════════════════════════════════════════════════════
// NEUROETHICS PEOPLE — Extracted from polymaths-and-philosophers.html
// ═══════════════════════════════════════════════════════════════════════════════

export const NEUROETHICS_PEOPLE = [
  {
    id: 'hippocrates',
    name: 'Hippocrates',
    years: 'c. 460 – 370 BC',
    era: 'Ancient',
    field: 'medicine',
    emoji: '⚕️',
    fields: ['medicine', 'ethics', 'neuroscience'],
    tagline: 'The first to say: the brain is the seat of the mind',
    bio: `Practiced medicine in an era when illness was considered punishment from the gods. His insistence that disease had natural causes — not divine ones — was heresy. He fought against temple healers, superstition, and a medical establishment that prescribed prayer over observation. He was reportedly exiled from Athens, and some ancient sources claim his writings were burned.`,
    frameworks: [
      'The Hippocratic Oath — "First, do no harm." The foundation of all medical ethics. Every neuroethics framework traces back to this principle.',
      'Natural causation — diseases have physical causes, not supernatural ones. The brain is an organ, not a mystical vessel.',
      'Clinical observation — watch the patient. Record symptoms. Look for patterns. Don\'t theorize before observing.',
      'Physician as servant, not master — the doctor serves the patient\'s interest, not their own ego or the state\'s agenda.'
    ],
    habits: [
      'Taught medicine through apprenticeship — bedside observation, not abstract lecture.',
      'Documented case histories — the first clinical records in Western medicine.',
      'Traveled extensively to study diseases in different climates and populations.',
      'Refused to treat disease with religious ritual — insisted on rational methods.',
      'Taught that diet, exercise, and environment were primary treatments before any intervention.'
    ],
    struggles: `Practiced medicine in an era when illness was considered punishment from the gods. His insistence that disease had natural causes — not divine ones — was heresy. He fought against temple healers, superstition, and a medical establishment that prescribed prayer over observation. He was reportedly exiled from Athens, and some ancient sources claim his writings were burned.`,
    moment: `Writing "On the Sacred Disease" (about epilepsy), he declared that the brain — not the heart, not the gods — is the organ of thought, sensation, and emotion. "Men ought to know that from the brain, and from the brain only, arise our pleasures, joys, laughter, and tears." This was 400 BC. It took Western civilization nearly 2,000 years to fully accept what he said in one paragraph.`,
    quotes: [
      { text: 'Men ought to know that from the brain, and from the brain only, arise our pleasures, joys, laughter, and tears.', src: 'Hippocrates, On the Sacred Disease' },
      { text: 'First, do no harm.', src: 'Hippocratic tradition' },
      { text: 'Healing is a matter of time, but it is sometimes also a matter of opportunity.', src: 'Hippocrates' },
      { text: 'There are in fact two things, science and opinion; the former begets knowledge, the latter ignorance.', src: 'Hippocrates' },
      { text: 'The life so short, the craft so long to learn.', src: 'Hippocrates' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Hippocrates')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Hippocrates')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Hippocrates')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Hippocrates documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Hippocrates')}`
    },
    books: [
      { title: 'Oral medical tradition of the Asclepiads', author: 'Asclepiad guild teachings (pre-5th century BC)', desc: 'Hippocrates came from a family guild of healers (Asclepiads) who passed medical knowledge orally. He broke with tradition by writing it down and systematizing it. His "book" was actually the collective knowledge of generations of healers — which he transformed from oral tradition into the first evidence-based medical texts.' }
    ],
    takeaways: [
      { title: 'First, do no harm', desc: 'Before any intervention — medical, technological, or policy — ask: what damage could this cause? The constraint is the starting point, not an afterthought.' },
      { title: 'Name the organ', desc: 'Hippocrates settled the brain-vs-heart debate 2,400 years ago. When building neurotechnology, remember what we\'re touching: the seat of selfhood.' },
      { title: 'Observe before theorizing', desc: 'The clinical method: watch, record, find patterns. Theory comes after data, not before.' }
    ]
  },
  {
    id: 'descartes',
    name: 'Ren\u00e9 Descartes',
    years: '1596 – 1650',
    era: 'Renaissance',
    field: 'philosophy',
    emoji: '🤔',
    fields: ['philosophy', 'mathematics', 'science'],
    tagline: 'The philosopher who split mind from body — and created a problem we still can\'t solve',
    bio: `Lived in an era where challenging Church doctrine could get you killed (Galileo was condemned the year before Descartes published). He self-censored, moved to the Netherlands for intellectual freedom, and still had his books placed on the Catholic Church's Index of Forbidden Books. He was invited to teach Queen Christina of Sweden — and the 5 AM lessons in an unheated library during a Swedish winter gave him pneumonia. He died at 53, in exile, likely because a queen wanted a philosophy tutor.`,
    frameworks: [
      'Cartesian Dualism — mind and body are separate substances. The mind is non-physical. This framing underpins every neurorights argument about mental privacy.',
      'Methodological doubt — doubt everything until you find something undoubtable. Then build from that foundation.',
      'Mechanistic biology — the body (including the brain) is a machine. Only the mind is special. This created the framework for neuroscience to study the brain as hardware.',
      'The pineal gland hypothesis — Descartes proposed the pineal gland as the "seat of the soul" where mind meets body. He was wrong about the gland, but right about the question: where does subjective experience interface with physical matter?'
    ],
    habits: [
      'Thought in bed — rarely rose before noon. His most productive hours were morning meditation in bed.',
      'Wrote in solitude — moved frequently to avoid social obligations.',
      'Used doubt as a systematic tool, not an emotional state.',
      'Studied anatomy and performed dissections to understand the body as mechanism.',
      'Corresponded extensively with other thinkers — Princess Elisabeth of Bohemia\'s letters pushed him to address the mind-body problem more rigorously.'
    ],
    struggles: `Lived in an era where challenging Church doctrine could get you killed (Galileo was condemned the year before Descartes published). He self-censored, moved to the Netherlands for intellectual freedom, and still had his books placed on the Catholic Church's Index of Forbidden Books. He was invited to teach Queen Christina of Sweden — and the 5 AM lessons in an unheated library during a Swedish winter gave him pneumonia. He died at 53, in exile, likely because a queen wanted a philosophy tutor.`,
    moment: `Sitting in a heated room (the famous "po\u00eale"), he systematically doubted everything he believed until he found one thing he couldn't doubt: the fact that he was doubting. "Cogito, ergo sum." But the deeper consequence was his conclusion that the mind and body are fundamentally different substances — mind is non-physical, body is mechanical. This "Cartesian dualism" created the mind-body problem that neuroscience, philosophy, and now neuroethics have been wrestling with for 400 years. Every neurorights debate — who owns your thoughts? can a machine read your mind? — traces back to Descartes asking: what IS the mind?`,
    quotes: [
      { text: 'I think, therefore I am.', src: 'Ren\u00e9 Descartes, Discourse on the Method' },
      { text: 'Doubt is the origin of wisdom.', src: 'Ren\u00e9 Descartes' },
      { text: 'The reading of all good books is like a conversation with the finest minds of past centuries.', src: 'Ren\u00e9 Descartes' },
      { text: 'Divide each difficulty into as many parts as is feasible and necessary to resolve it.', src: 'Ren\u00e9 Descartes' },
      { text: 'It is not enough to have a good mind; the main thing is to use it well.', src: 'Ren\u00e9 Descartes' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Ren\u00e9 Descartes')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Ren\u00e9 Descartes')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Ren\u00e9 Descartes')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Ren\u00e9 Descartes documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Ren\u00e9 Descartes')}`
    },
    books: [
      { title: 'Confessions', author: 'Augustine of Hippo (c. 400 AD)', desc: 'Augustine\'s radical introspection — turning the mind inward to examine its own processes — prefigured Descartes\' method of systematic doubt by 1,200 years. Augustine asked "what can I know for certain?" and concluded: my own existence as a thinking being. Sound familiar? Descartes secularized Augustine\'s insight and built modern philosophy on it.' }
    ],
    takeaways: [
      { title: 'Ask the foundational question', desc: 'Before regulating neurotechnology, before building BCIs, before scanning brains — answer Descartes\' question first: what IS a mind? Your answer determines everything that follows.' },
      { title: 'Doubt systematically', desc: 'Don\'t doubt randomly. Doubt methodically. Remove assumptions one by one until you find bedrock. Then build.' },
      { title: 'The problem you frame is the problem you solve', desc: 'Descartes framed mind and body as separate. 400 years later we\'re still inside his frame. Be careful what you assume at the start — it determines every conclusion.' }
    ]
  },
  {
    id: 'penfield',
    name: 'Wilder Penfield',
    years: '1891 – 1976',
    era: 'Modern',
    field: 'neuroscience',
    emoji: '⚡',
    fields: ['neuroscience', 'medicine', 'ethics'],
    tagline: 'The surgeon who mapped the mind with a wire',
    bio: `Penfield pioneered a technique that required him to operate on the brains of conscious patients — using local anesthesia and electrically stimulating different brain regions while the patient reported what they experienced. This was ethically uncharted territory. Each surgery forced real-time ethical decisions: how far to stimulate, what to do when a patient reported memories or emotions being triggered by the electrode, how to balance surgical need against the patient's subjective experience. He was doing brain-computer interaction before the term existed.`,
    frameworks: [
      'The homunculus — Penfield\'s cortical maps showed that the brain\'s representation of the body is wildly distorted. Hands and lips are enormous; backs and legs are tiny. The brain doesn\'t mirror the body — it mirrors what matters.',
      'Conscious collaboration — the patient was an active participant in their own brain surgery. They reported their experiences while Penfield mapped. The subject is also the instrument.',
      'The double life of the brain — Penfield concluded the mind might be more than just brain activity. Even after a career of brain stimulation, he suspected consciousness couldn\'t be fully reduced to neural firing.',
      'Ethical surgical practice — developed protocols for informed consent in neurosurgery that became the foundation for modern neuroethics.'
    ],
    habits: [
      'Sketched brain maps during every surgery — creating the famous homunculus diagrams.',
      'Talked to patients throughout operations — used their reports as real-time data.',
      'Published his findings in both scientific and public-facing formats.',
      'Maintained detailed surgical records that became foundational neuroscience datasets.',
      'Spent his later years writing about the philosophical implications of his work.'
    ],
    struggles: `Penfield pioneered a technique that required him to operate on the brains of conscious patients — using local anesthesia and electrically stimulating different brain regions while the patient reported what they experienced. This was ethically uncharted territory. Each surgery forced real-time ethical decisions: how far to stimulate, what to do when a patient reported memories or emotions being triggered by the electrode, how to balance surgical need against the patient's subjective experience. He was doing brain-computer interaction before the term existed.`,
    moment: `During epilepsy surgery in the 1930s-50s, Penfield stimulated the temporal cortex of conscious patients and they reported vivid experiential memories — hearing specific songs, reliving moments from childhood, feeling emotions from decades earlier. The brain wasn't just processing information. It was storing experiences in a form that could be replayed by an electrode. He had accidentally demonstrated that human experience is physically encoded — and physically accessible. The implications for privacy, identity, and consent were staggering, and Penfield knew it.`,
    quotes: [
      { text: 'The brain is the organ of destiny. It holds within its humming mechanism the secrets of human life.', src: 'Wilder Penfield' },
      { text: 'The mind seems to act independently of the brain in the same sense that a programmer acts independently of a computer.', src: 'Wilder Penfield, The Mystery of the Mind' },
      { text: 'I worked as a scientist trying to prove that the brain accounted for the mind. But now, perhaps the mind is distinct.', src: 'Wilder Penfield' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Wilder Penfield')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Wilder Penfield')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Wilder Penfield')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Wilder Penfield documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Wilder Penfield')}`
    },
    books: [
      { title: 'Integrative Action of the Nervous System', author: 'Charles Sherrington (1906)', desc: 'Sherrington\'s work on reflexes, synapses, and neural integration gave Penfield the theoretical foundation for his brain mapping. Sherrington showed that the nervous system is an integrated network of excitation and inhibition. Penfield took that framework and applied it directly — with an electrode — to the living human brain.' }
    ],
    takeaways: [
      { title: 'The subject is also the expert', desc: 'Penfield couldn\'t map the brain without the patient\'s lived experience. In neuroethics, the person whose brain is being studied has irreplaceable knowledge.' },
      { title: 'Access does not equal understanding', desc: 'Penfield could trigger memories with a wire. But he couldn\'t explain WHY those memories were stored that way. Access to the brain doesn\'t mean comprehension of the mind.' },
      { title: 'Document everything', desc: 'Penfield\'s surgical sketches are still used today. Meticulous records outlive the recorder.' }
    ]
  },
  {
    id: 'delgado',
    name: 'Jos\u00e9 Delgado',
    years: '1915 – 2011',
    era: 'Modern',
    field: 'neuroscience',
    emoji: '📡',
    fields: ['neuroscience', 'ethics', 'invention'],
    tagline: 'The man who stopped a charging bull with a brain implant',
    bio: `Delgado is the most controversial figure in neuroscience history. A Yale professor, he implanted electrodes (his "stimoceiver") in the brains of animals and humans to control behavior by radio signal. He stopped a charging bull in a bullfighting arena by pressing a button. He altered mood, triggered movements, and suppressed aggression in human patients — sometimes without clear consent by modern standards. His 1969 book "Physical Control of the Mind" argued that brain stimulation could create a "psychocivilized society." The backlash was enormous. He was accused of creating mind control technology for authoritarian states. He left Yale and returned to Spain.`,
    frameworks: [
      'The stimoceiver — a brain-implanted device that could receive radio signals and deliver electrical stimulation. The first wireless BCI. Primitive by modern standards, revolutionary in concept.',
      'Physical control of behavior — Delgado demonstrated that aggression, pleasure, motor control, and mood could all be modulated by electrode placement. The brain is not just observable — it\'s controllable.',
      'Psychocivilization — his most controversial idea: that society could be improved by controlling the brain\'s "destructive" impulses. The ethical nightmare of his career.',
      'The consent problem — many of his human subjects were institutionalized psychiatric patients. Informed consent standards were primitive or absent. His work is a case study in why neuroethics exists.'
    ],
    habits: [
      'Operated on both animals and humans — pushed boundaries that later generations drew as ethical lines.',
      'Published prolifically and gave public demonstrations — believed transparency was better than secrecy.',
      'Collaborated with engineers to miniaturize brain implants.',
      'Traveled internationally to demonstrate his technology.',
      'In later years, backed away from invasive techniques and explored non-invasive methods.'
    ],
    struggles: `Delgado is the most controversial figure in neuroscience history. A Yale professor, he implanted electrodes (his "stimoceiver") in the brains of animals and humans to control behavior by radio signal. He stopped a charging bull in a bullfighting arena by pressing a button. He altered mood, triggered movements, and suppressed aggression in human patients — sometimes without clear consent by modern standards. His 1969 book "Physical Control of the Mind" argued that brain stimulation could create a "psychocivilized society." The backlash was enormous. He was accused of creating mind control technology for authoritarian states. He left Yale and returned to Spain.`,
    moment: `1963. A fighting bull with electrodes implanted in its caudate nucleus charged directly at Delgado in a bullring. Delgado pressed a button on his radio transmitter. The bull skidded to a stop inches away, turned, and walked off passively. The photograph became iconic — and terrifying. It proved that behavior could be remotely controlled through direct brain stimulation. The question was no longer "can we control the brain?" but "should we?" — and "who decides?"`,
    quotes: [
      { text: 'We need a program of psychosurgery for political control of our society. The purpose is physical control of the mind.', src: 'Jos\u00e9 Delgado, Congressional testimony (1974)' },
      { text: 'The individual may think that the most important reality is his own existence, but this is only his personal point of view.', src: 'Jos\u00e9 Delgado, Physical Control of the Mind' },
      { text: 'Can you conceive of a world in which the weights of aggressive behavior could be controlled?', src: 'Jos\u00e9 Delgado' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Jos\u00e9 Delgado')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Jos\u00e9 Delgado')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Jos\u00e9 Delgado')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Jos\u00e9 Delgado documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Jos\u00e9 Delgado')}`
    },
    books: [
      { title: 'The Integrative Action of the Nervous System', author: 'Charles Sherrington (1906)', desc: 'Like Penfield, Delgado was deeply influenced by Sherrington. But where Penfield used Sherrington to map, Delgado used him to control. Sherrington showed that behavior emerges from neural circuits. Delgado asked: what if we could intervene in those circuits directly? The same book, read through different ethical lenses, produced a mapper and a controller.' }
    ],
    takeaways: [
      { title: 'Capability precedes ethics — always', desc: 'Delgado could control a bull\'s brain before anyone had a framework for whether he should. Technology outpaces regulation. This is the permanent condition of neuroscience.' },
      { title: 'The road to hell is paved with good intentions', desc: 'Delgado genuinely believed brain control could reduce violence and suffering. The intent was humane. The implications were authoritarian. Intent doesn\'t determine outcome.' },
      { title: 'Consent is not optional', desc: 'Delgado\'s institutional patients could not meaningfully consent. Every modern BCI ethics framework exists because of what went wrong in the 1960s.' }
    ]
  },
  {
    id: 'freeman',
    name: 'Walter Freeman',
    years: '1895 – 1972',
    era: 'Modern',
    field: 'medicine',
    emoji: '🚨',
    fields: ['medicine', 'neuroscience'],
    tagline: 'THE CAUTIONARY TALE — what happens when neuroscience has no ethics',
    bio: `This is not an inspirational story. Freeman performed approximately 3,500 lobotomies — including on children as young as 4. He developed the "ice pick lobotomy" (transorbital lobotomy) that could be done in minutes without a surgeon, without anesthesia, in his office. He drove across the country in a van he called the "lobotomobile," performing the procedure in state hospitals. Many patients were left vegetative, permanently disabled, or dead. Rosemary Kennedy — JFK's sister — was lobotomized at age 23 and spent the remaining 63 years of her life institutionalized. Freeman is the reason neuroethics exists.`,
    frameworks: [
      'There is no framework here — only a warning. Freeman operated without controlled trials, without peer review of outcomes, without long-term follow-up, and without meaningful patient consent.',
      'Institutional complicity — hospitals, state governments, and families endorsed lobotomy because it "solved" the problem of difficult psychiatric patients. The system incentivized brain destruction.',
      'The absence of oversight — no ethics board reviewed Freeman\'s procedures. No regulatory body stopped him. He was only stopped when a patient died on his table.',
      'Irreversibility as the core crime — you cannot un-lobotomize someone. The procedure destroyed brain tissue permanently. Every neuroethics framework must address irreversibility as a primary concern.'
    ],
    habits: [
      'Drove across the country performing lobotomies in state hospitals.',
      'Kept detailed records and photographs — which later became evidence against the practice.',
      'Performed the procedure without surgical training (he was a neurologist, not a surgeon).',
      'Continued performing lobotomies long after the medical community turned against the practice.',
      'Sent Christmas cards to his former patients for decades — genuinely believed he had helped them.'
    ],
    struggles: `This is not an inspirational story. Freeman performed approximately 3,500 lobotomies — including on children as young as 4. He developed the "ice pick lobotomy" (transorbital lobotomy) that could be done in minutes without a surgeon, without anesthesia, in his office. He drove across the country in a van he called the "lobotomobile," performing the procedure in state hospitals. Many patients were left vegetative, permanently disabled, or dead. Rosemary Kennedy — JFK's sister — was lobotomized at age 23 and spent the remaining 63 years of her life institutionalized. Freeman is the reason neuroethics exists.`,
    moment: `There is no redeeming moment. The closest thing to a turning point: in 1967, Freeman performed his last lobotomy. The patient — Helen Mortensen, whom he had lobotomized twice before — died of a brain hemorrhage on the table. The hospital revoked his surgical privileges. He had been performing the procedure for 31 years. He never expressed remorse. He died believing he had helped his patients.`,
    quotes: [
      { text: 'Lobotomy gets them home.', src: 'Walter Freeman' },
      { text: 'If we wait until we understand the brain, we\'ll wait forever.', src: 'Walter Freeman' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Walter Freeman')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Walter Freeman')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Walter Freeman')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Walter Freeman documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Walter Freeman')}`
    },
    books: [],
    takeaways: [
      { title: 'THIS is why neuroethics matters', desc: 'Freeman lobotomized 3,500 people. Many were children. Many could not consent. No ethics board stopped him for 31 years. Every neuroethics rule exists because rules didn\'t exist for him.' },
      { title: 'Irreversibility demands the highest bar', desc: 'Any procedure that permanently alters brain tissue must meet the highest possible standard of consent, evidence, and oversight. There is no undo.' },
      { title: 'Good intentions are not enough', desc: 'Freeman believed he was helping. The patients he left vegetative did not agree. Outcomes matter more than intentions. Always.' }
    ]
  },
  {
    id: 'william-james',
    name: 'William James',
    years: '1842 – 1910',
    era: 'Modern',
    field: 'philosophy',
    emoji: '🔬',
    fields: ['philosophy', 'science', 'psychology'],
    tagline: 'The philosopher-psychologist who made the mind a science',
    bio: `Suffered from severe depression, chronic illness, and existential crisis throughout his life. He seriously contemplated suicide in his late twenties. His father was a Swedenborgian mystic; his brother was Henry James the novelist. William felt lost between art, science, and philosophy, unable to commit to any single path — a crisis familiar to every polymath. He trained as a physician but never practiced. He nearly abandoned intellectual life entirely before finding his way to psychology.`,
    frameworks: [
      'Pragmatism — an idea is true if it works. Don\'t ask "is this correct in the abstract?" Ask "what difference does it make in practice?"',
      'Stream of consciousness — the mind is not a series of discrete states but a continuous, flowing process. This framing anticipates modern neural dynamics.',
      'Habit as neuroplasticity — James described habits as physical grooves in the brain decades before the term "neuroplasticity" existed. "The great thing, then, in all education, is to make our nervous system our ally instead of our enemy."',
      'Radical empiricism — experience is primary. Don\'t reduce consciousness to something it\'s not — study it as it actually presents itself.'
    ],
    habits: [
      'Wrote voluminously — letters, books, lectures. His writing is famously readable.',
      'Experimented with altered states — nitrous oxide, psychic phenomena, religious experiences.',
      'Taught the first psychology course in America (Harvard, 1875).',
      'Maintained friendships across disciplines — philosophers, scientists, writers, mystics.',
      'Practiced what he preached about habit — deliberately built routines to counteract his depressive tendencies.'
    ],
    struggles: `Suffered from severe depression, chronic illness, and existential crisis throughout his life. He seriously contemplated suicide in his late twenties. His father was a Swedenborgian mystic; his brother was Henry James the novelist. William felt lost between art, science, and philosophy, unable to commit to any single path — a crisis familiar to every polymath. He trained as a physician but never practiced. He nearly abandoned intellectual life entirely before finding his way to psychology.`,
    moment: `Reading the philosopher Charles Renouvier, James encountered the argument that free will is real — not because it can be proven, but because believing in it changes how you act. James decided to believe in free will as an experiment. He wrote in his diary: "My first act of free will shall be to believe in free will." It pulled him out of his depression. He went on to write "The Principles of Psychology" (1890) — 1,400 pages that established psychology as a laboratory science and introduced concepts like "stream of consciousness," "habit," and "the self" that neuroscience still uses.`,
    quotes: [
      { text: 'The greatest discovery of my generation is that a human being can alter his life by altering his attitudes.', src: 'William James' },
      { text: 'Act as if what you do makes a difference. It does.', src: 'William James' },
      { text: 'The art of being wise is the art of knowing what to overlook.', src: 'William James' },
      { text: 'Be not afraid of life. Believe that life is worth living, and your belief will help create the fact.', src: 'William James' },
      { text: 'We are like islands in the sea, separate on the surface but connected in the deep.', src: 'William James' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('William James')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('William James')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('William James')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('William James documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('William James')}`
    },
    books: [
      { title: 'First Principles', author: 'Herbert Spencer (1862)', desc: 'James initially admired Spencer\'s attempt to unify all knowledge under evolutionary principles, then spent decades demolishing it. Spencer taught James what NOT to do: don\'t build grand theories that explain everything and predict nothing. James\'s pragmatism was born as a direct reaction to Spencer\'s beautiful, useless abstractions.' }
    ],
    takeaways: [
      { title: 'Make your nervous system your ally', desc: 'James said it in 1890: build habits deliberately. Your brain physically rewires based on what you repeat. Choose your repetitions.' },
      { title: 'Believe in order to act', desc: 'Sometimes you must choose a belief before evidence proves it — not because you\'re irrational, but because the belief enables the action that produces the evidence.' },
      { title: 'Psychology IS neuroscience', desc: 'James saw no boundary between mind and brain. The ethical questions about neurotechnology are inseparable from the psychological questions about selfhood.' }
    ]
  }
];
