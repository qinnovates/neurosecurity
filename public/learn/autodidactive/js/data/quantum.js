// Quantum physics pioneers — person cards

export const QUANTUM = [
  {
    id: 'max-planck',
    name: 'Max Planck',
    years: '1858 – 1947',
    era: 'Modern',
    field: 'Physics',
    emoji: '\u{1F4A1}',
    fields: ['Theoretical Physics', 'Thermodynamics', 'Quantum Theory'],
    tagline: 'He started a revolution he didn\'t want.',
    bio: 'Max Planck was the most reluctant revolutionary in the history of science. In 1900, he introduced the idea that energy comes in discrete packets called quanta, not because he believed it, but because it was the only math that fit the data. He spent years trying to undo his own discovery, hoping to reconcile it with classical physics. He couldn\'t. His quantum hypothesis destroyed the smooth, continuous universe of 19th-century physics and launched the most successful theory in scientific history.',
    frameworks: [
      'Quantization of energy — energy is emitted and absorbed in discrete packets, not continuously',
      'Planck\'s constant (h) — the fundamental unit linking energy to frequency',
      'Black-body radiation solution — resolved the ultraviolet catastrophe with quantum assumptions',
      'Thermodynamic foundations — built quantum theory on the bedrock of thermodynamic principles'
    ],
    habits: [
      'Maintained a rigorous daily schedule of research and academic duties',
      'Played piano and organ regularly, finding parallels between music and physics',
      'Wrote detailed letters to colleagues working through problems collaboratively',
      'Revisited and challenged his own assumptions repeatedly before accepting results',
      'Maintained scientific output despite devastating personal losses'
    ],
    struggles: 'Planck lost his first wife to tuberculosis, his eldest son in World War I, and both twin daughters in childbirth. His second son was executed by the Nazis for participating in the plot to assassinate Hitler. Through all of this, he kept working. Scientifically, he spent years trying to make his quantum hypothesis go away, to fit it back into classical physics. He couldn\'t, and he knew it. He had to accept that he\'d broken physics in a way no one could repair.',
    moment: 'On December 14, 1900, Planck presented his quantum hypothesis to the German Physical Society. He proposed that oscillators in a black body emit energy only in discrete chunks: E = nh\u03BD. He called these chunks "quanta." Planck himself called it "an act of desperation" because nothing else fit the experimental data. He had no physical explanation for why energy should be quantized. He just knew the math worked. That single equation, born from mathematical necessity rather than physical intuition, became the seed of quantum mechanics and changed the trajectory of all physics.',
    quotes: [
      { text: 'A new scientific truth does not triumph by convincing its opponents and making them see the light, but rather because its opponents eventually die, and a new generation grows up that is familiar with it.', src: 'Max Planck, Scientific Autobiography and Other Papers, 1949' },
      { text: 'Science cannot solve the ultimate mystery of nature. And that is because, in the last analysis, we ourselves are a part of the mystery that we are trying to solve.', src: 'Max Planck, Where Is Science Going?, 1932' },
      { text: 'An experiment is a question which science poses to Nature, and a measurement is the recording of Nature\'s answer.', src: 'Max Planck, Scientific Autobiography, 1949' },
      { text: 'I regard consciousness as fundamental. I regard matter as derivative from consciousness.', src: 'Max Planck, interview in The Observer, 1931' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Max Planck')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Max Planck')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Max Planck')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Max Planck documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Max Planck')}`
    },
    books: [
      { title: 'Scientific Autobiography and Other Papers', author: 'Max Planck', desc: 'Planck\'s own account of his scientific journey, including the reluctant discovery of energy quanta and reflections on the nature of scientific progress.' },
      { title: 'Quantum: Einstein, Bohr, and the Great Debate about the Nature of Reality', author: 'Manjit Kumar', desc: 'Tells the story of quantum mechanics from Planck\'s desperate hypothesis through the epic debates that followed, placing Planck\'s work in its full historical context.' }
    ],
    takeaways: [
      { title: 'Trust the math even when it scares you', desc: 'Planck didn\'t believe his own result, but the math was undeniable. When the evidence contradicts your assumptions, update your assumptions, not the evidence.' },
      { title: 'Desperation can be creative', desc: 'Planck called his quantum hypothesis an act of desperation. Sometimes the best ideas come when every conventional approach has failed.' },
      { title: 'Personal tragedy doesn\'t have to end your work', desc: 'Planck lost nearly everyone he loved and kept producing science. You don\'t have to, but knowing it\'s possible matters.' }
    ]
  },

  {
    id: 'niels-bohr',
    name: 'Niels Bohr',
    years: '1885 – 1962',
    era: 'Modern',
    field: 'Physics',
    emoji: '\u{269B}',
    fields: ['Theoretical Physics', 'Quantum Mechanics', 'Atomic Physics', 'Philosophy of Science'],
    tagline: 'He built the atom, then spent decades arguing about what it meant.',
    bio: 'Niels Bohr was a Danish physicist who proposed the first quantum model of the atom and then became the philosophical leader of quantum mechanics. His Bohr model showed electrons orbiting in fixed energy levels, and his complementarity principle argued that quantum objects are both wave and particle depending on how you look. He founded the Copenhagen Institute, which became the intellectual center of quantum physics. His decades-long debate with Einstein about the nature of reality is one of the greatest intellectual battles in scientific history.',
    frameworks: [
      'Bohr model of the atom — electrons occupy discrete energy levels and jump between them',
      'Complementarity principle — wave and particle descriptions are both necessary but mutually exclusive',
      'Copenhagen interpretation — quantum mechanics describes probabilities, not underlying reality',
      'Correspondence principle — quantum predictions must match classical physics at large scales'
    ],
    habits: [
      'Hosted constant discussions and debates at his institute, making physics a collaborative sport',
      'Paced while thinking, often dragging colleagues on long walks to work through problems',
      'Revised papers obsessively, sometimes going through dozens of drafts',
      'Played football (goalkeeper) and maintained physical activity throughout his life',
      'Used thought experiments as primary tools for testing ideas before math'
    ],
    struggles: 'Bohr fought the biggest intellectual battle of the 20th century: his debate with Einstein over quantum mechanics. Einstein believed quantum theory was incomplete and that God does not play dice. Bohr argued that probability is fundamental to reality, not a sign of ignorance. This wasn\'t academic politeness. It was a genuine, deep, sometimes bitter disagreement between two giants about the nature of existence. Bohr also escaped Nazi-occupied Denmark in 1943, fled to Sweden in a fishing boat, and then to England in a bomber, nearly dying from oxygen deprivation during the flight.',
    moment: 'At the 1927 Solvay Conference, Bohr and Einstein faced off directly. Einstein presented thought experiment after thought experiment designed to show quantum mechanics must be incomplete. Each morning, Einstein would present a new challenge at breakfast. By dinner, Bohr had refuted it. This continued for days. The climax came when Einstein proposed a box that could weigh a photon to determine both its energy and time of emission simultaneously, violating the uncertainty principle. Bohr spent a sleepless night and returned the next morning with a devastating counterargument using Einstein\'s own general relativity to show the thought experiment actually confirmed the uncertainty principle. Einstein never fully accepted it, but Bohr had won the argument.',
    quotes: [
      { text: 'Anyone who is not shocked by quantum theory has not understood it.', src: 'Niels Bohr, as reported by Werner Heisenberg' },
      { text: 'The opposite of a correct statement is a false statement. But the opposite of a profound truth may well be another profound truth.', src: 'Niels Bohr' },
      { text: 'Prediction is very difficult, especially about the future.', src: 'Attributed to Niels Bohr (widely cited Danish saying)' },
      { text: 'How wonderful that we have met with a paradox. Now we have some hope of making progress.', src: 'Niels Bohr' },
      { text: 'Every great and deep difficulty bears in itself its own solution. It forces us to change our thinking in order to find it.', src: 'Niels Bohr' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Niels Bohr')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Niels Bohr')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Niels Bohr')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Niels Bohr documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Niels Bohr')}`
    },
    books: [
      { title: 'Atomic Physics and Human Knowledge', author: 'Niels Bohr', desc: 'Bohr\'s philosophical essays on the implications of quantum mechanics for our understanding of reality, knowledge, and the limits of human observation.' },
      { title: 'Niels Bohr\'s Times', author: 'Abraham Pais', desc: 'A comprehensive biography by a fellow physicist who knew Bohr personally. Covers both the physics and the man behind it.' }
    ],
    takeaways: [
      { title: 'Embrace paradox as a sign of progress', desc: 'Bohr didn\'t run from contradictions. He saw them as clues. When two seemingly incompatible things are both true, you\'re close to a deeper understanding.' },
      { title: 'Make your institution a magnet for talent', desc: 'Bohr\'s Copenhagen Institute attracted the best minds because he created a culture of open debate and intellectual honesty. Build environments where smart people want to be.' },
      { title: 'Defend your ideas with evidence, not authority', desc: 'Bohr debated Einstein not by pulling rank but by dismantling arguments one by one. The quality of your reasoning is what matters, not who you are.' }
    ]
  },

  {
    id: 'werner-heisenberg',
    name: 'Werner Heisenberg',
    years: '1901 – 1976',
    era: 'Modern',
    field: 'Physics',
    emoji: '\u{1F300}',
    fields: ['Theoretical Physics', 'Quantum Mechanics', 'Nuclear Physics', 'Philosophy of Science'],
    tagline: 'He proved that certainty has a limit baked into the universe.',
    bio: 'Werner Heisenberg formulated matrix mechanics (the first complete mathematical framework for quantum theory) and discovered the uncertainty principle, which states that you cannot simultaneously know both the exact position and momentum of a particle. This isn\'t a limitation of our instruments. It\'s a fundamental feature of reality. He won the Nobel Prize at 31. His legacy is complicated by his decision to stay in Nazi Germany and lead their nuclear research program, a choice that has been debated by historians ever since.',
    frameworks: [
      'Uncertainty principle — there is a fundamental limit to how precisely you can know complementary properties simultaneously',
      'Matrix mechanics — the first mathematically complete formulation of quantum theory',
      'Observable-only physics — build theories around what can be measured, not what you imagine exists',
      'S-matrix theory — describe particle interactions through observable scattering data'
    ],
    habits: [
      'Worked through problems with intense periods of solitary focus, often on remote islands',
      'Played piano seriously, using music as a thinking tool',
      'Engaged in long philosophical discussions with Bohr, often walking for hours',
      'Wrote accessible popular science books explaining quantum mechanics to general audiences',
      'Maintained physical fitness through hiking and outdoor activities'
    ],
    struggles: 'Heisenberg made the most controversial decision in physics history: he stayed in Nazi Germany and led their uranium research program. Whether he deliberately sabotaged the German bomb effort or simply failed to build one remains one of the great unanswered questions of the 20th century. After the war, many colleagues refused to speak to him. His reputation was permanently stained. Scientifically, his matrix mechanics was initially overshadowed by Schrodinger\'s more intuitive wave equation, even though both approaches were later shown to be mathematically equivalent.',
    moment: 'In 1927, Heisenberg was alone on the island of Helgoland, struggling with a calculation. He realized that the act of measurement itself disturbs the system being measured. To see an electron\'s position, you hit it with a photon, which changes its momentum. But it went deeper than that. He proved mathematically that the product of the uncertainty in position and the uncertainty in momentum can never be less than Planck\'s constant divided by 4 pi. This isn\'t about clumsy instruments. It\'s a fundamental property of nature. The universe itself does not have definite values for both properties simultaneously. He wrote to Pauli: "I believe I have succeeded in treating the case where both p and q are given to a certain accuracy."',
    quotes: [
      { text: 'What we observe is not nature itself, but nature exposed to our method of questioning.', src: 'Werner Heisenberg, Physics and Philosophy, 1958' },
      { text: 'Not only is the Universe stranger than we think, it is stranger than we can think.', src: 'Werner Heisenberg, Across the Frontiers, 1974' },
      { text: 'The first gulp from the glass of natural sciences will turn you into an atheist, but at the bottom of the glass God is waiting for you.', src: 'Attributed to Werner Heisenberg' },
      { text: 'Every experiment destroys some of the knowledge of the system which was obtained by previous experiments.', src: 'Werner Heisenberg, The Physical Principles of the Quantum Theory, 1930' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Werner Heisenberg')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Werner Heisenberg')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Werner Heisenberg')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Werner Heisenberg documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Werner Heisenberg')}`
    },
    books: [
      { title: 'Physics and Philosophy', author: 'Werner Heisenberg', desc: 'Heisenberg explains quantum mechanics and its philosophical implications for general audiences. One of the best introductions to the conceptual revolution of quantum theory.' },
      { title: 'Uncertainty: Einstein, Heisenberg, Bohr, and the Struggle for the Soul of Science', author: 'David Lindley', desc: 'The story of the uncertainty principle and the philosophical battle it triggered among the founders of quantum mechanics.' }
    ],
    takeaways: [
      { title: 'Some limits are features, not bugs', desc: 'The uncertainty principle isn\'t about bad instruments. It\'s about reality. Recognizing fundamental limits helps you stop wasting effort on the impossible and focus on what can be known.' },
      { title: 'Focus on observables', desc: 'Heisenberg built his theory on what can actually be measured, not on hidden variables you imagine. Build your models on data you can verify.' },
      { title: 'Your context shapes your legacy', desc: 'Heisenberg\'s physics was brilliant. His decision to stay in Nazi Germany overshadows it. Where you choose to stand matters as much as what you build.' }
    ]
  },

  {
    id: 'erwin-schrodinger',
    name: 'Erwin Schrodinger',
    years: '1887 – 1961',
    era: 'Modern',
    field: 'Physics',
    emoji: '\u{1F408}',
    fields: ['Theoretical Physics', 'Quantum Mechanics', 'Wave Mechanics', 'Biophysics'],
    tagline: 'He put the wave in wave-particle duality — and a cat in a box.',
    bio: 'Erwin Schrodinger developed the wave equation that became the mathematical backbone of quantum mechanics. While Heisenberg used abstract matrices, Schrodinger gave physicists something they could visualize: waves. His equation describes how the quantum state of a system evolves over time and is one of the most important equations in all of physics. He\'s also famous for his cat thought experiment, which he designed not to celebrate quantum mechanics but to mock the absurdity of its implications. He later pivoted to biology and wrote "What Is Life?", which directly inspired Watson and Crick to pursue the structure of DNA.',
    frameworks: [
      'Wave equation — the Schrodinger equation describes how quantum states evolve over time',
      'Wave function — a mathematical object encoding all possible information about a quantum system',
      'Cat paradox — a thought experiment exposing the measurement problem in quantum mechanics',
      'Biological physics — applying quantum and thermodynamic thinking to living systems'
    ],
    habits: [
      'Worked in intense bursts of creative focus, often during romantic getaways',
      'Maintained deep engagement with philosophy, especially Vedantic thought',
      'Read widely across disciplines, connecting physics to biology and philosophy',
      'Kept detailed notebooks of calculations and ideas',
      'Wrote clearly for non-specialist audiences, making complex physics accessible'
    ],
    struggles: 'Schrodinger developed his wave equation during a Christmas vacation in the Swiss Alps. The physics was brilliant, but his personal life was chaotic. He maintained multiple simultaneous relationships that scandalized academia and cost him positions. He fled Austria after the Nazi annexation, bouncing between Oxford and Dublin. His wave mechanics were initially dismissed by Heisenberg as "disgusting" because they seemed to smuggle classical thinking back into quantum theory. The debate about whether quantum mechanics is fundamentally about waves or particles (or neither) continues to this day.',
    moment: 'In late 1925, Schrodinger read Louis de Broglie\'s thesis proposing that particles have wave properties. Over the Christmas holiday at a villa in Arosa, Switzerland, he worked out the mathematics. He produced a wave equation that described the behavior of quantum systems with remarkable accuracy. Where Heisenberg\'s matrix mechanics was abstract and hard to visualize, Schrodinger\'s wave equation was intuitive and could be solved with standard mathematical techniques. Physicists overwhelmingly preferred it. Then in 1935, he published his famous cat thought experiment: a cat in a box is simultaneously alive and dead until observed. He meant it as a criticism, showing that the Copenhagen interpretation leads to absurd conclusions at macroscopic scales. Instead, Schrodinger\'s cat became the most famous thought experiment in physics.',
    quotes: [
      { text: 'The task is not so much to see what no one has yet seen, but to think what nobody has yet thought about that which everybody sees.', src: 'Erwin Schrodinger, attributed in Problems of Life, 1952' },
      { text: 'Consciousness cannot be accounted for in physical terms. For consciousness is absolutely fundamental. It cannot be accounted for in terms of anything else.', src: 'Erwin Schrodinger, What Is Life?, 1944' },
      { text: 'If we are going to stick to this damned quantum-jumping, then I regret that I ever had anything to do with quantum theory.', src: 'Erwin Schrodinger, to Niels Bohr, 1926' },
      { text: 'The scientist only imposes two things, namely truth and sincerity, imposes them upon himself and upon other scientists.', src: 'Erwin Schrodinger, Nature and the Greeks, 1954' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Erwin Schrodinger')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Erwin Schrodinger')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Erwin Schrodinger')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Erwin Schrodinger documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Erwin Schrodinger')}`
    },
    books: [
      { title: 'What Is Life?', author: 'Erwin Schrodinger', desc: 'Schrodinger applies physics to biology and asks how living systems maintain order. This short book directly inspired Watson and Crick\'s discovery of the DNA double helix.' },
      { title: 'My View of the World', author: 'Erwin Schrodinger', desc: 'Schrodinger\'s philosophical reflections on consciousness, Vedantic thought, and the relationship between mind and matter.' }
    ],
    takeaways: [
      { title: 'Make the abstract visual', desc: 'Schrodinger gave physicists a picture where Heisenberg gave them algebra. Making ideas visual and intuitive helps them spread, even if the math underneath is equivalent.' },
      { title: 'Cross-pollinate between fields', desc: 'Schrodinger\'s "What Is Life?" connected physics to biology and sparked the molecular biology revolution. The biggest breakthroughs often come from applying one field\'s tools to another field\'s problems.' },
      { title: 'Criticize constructively', desc: 'The cat thought experiment was meant as a critique, but it became the most powerful teaching tool in quantum mechanics. Good criticism clarifies the problem even when it doesn\'t solve it.' }
    ]
  },

  {
    id: 'paul-dirac',
    name: 'Paul Dirac',
    years: '1902 – 1984',
    era: 'Modern',
    field: 'Physics',
    emoji: '\u{2728}',
    fields: ['Theoretical Physics', 'Quantum Mechanics', 'Quantum Electrodynamics', 'Mathematics'],
    tagline: 'The strangest man in physics — who predicted antimatter from pure math.',
    bio: 'Paul Dirac was a British theoretical physicist who predicted the existence of antimatter years before it was discovered, purely from the beauty of his equations. He formulated the Dirac equation, which combined quantum mechanics with special relativity and naturally produced the electron\'s spin and magnetic moment. He was legendarily silent and literal, so socially unusual that colleagues invented the unit "one dirac" meaning one word per hour. His physics was elegant to the point of being almost artistic, and he openly argued that beauty in equations was a guide to truth.',
    frameworks: [
      'Dirac equation — relativistic quantum mechanics that naturally predicts spin and antimatter',
      'Mathematical beauty as a guide — if an equation is beautiful, it\'s more likely to be true',
      'Bra-ket notation — a compact mathematical language for quantum mechanics still used today',
      'Quantum field theory foundations — treated particles as excitations of underlying fields'
    ],
    habits: [
      'Worked in complete silence, often thinking for hours without writing anything',
      'Took long solitary walks on Sundays, his primary form of recreation',
      'Spoke only when he had something precise to say, sometimes not at all',
      'Approached physics as an aesthetic pursuit, judging equations by their beauty',
      'Read widely in mathematics, importing tools that physicists hadn\'t considered'
    ],
    struggles: 'Dirac grew up under a tyrannical father who required the family to speak only French at dinner. If young Paul couldn\'t express himself perfectly in French, he wasn\'t allowed to speak at all. This may explain his legendary silence. He struggled with human connection his entire life. Colleagues found him impossible to talk to. Bohr called him "the strangest man" who ever visited his institute. Despite being one of the greatest physicists who ever lived, he spent his later years in relative obscurity, his contributions overshadowed by the more charismatic Feynman.',
    moment: 'In 1928, Dirac wrote down an equation that unified quantum mechanics with Einstein\'s special relativity. The Dirac equation described the electron perfectly, naturally producing its spin without any ad hoc additions. But the equation had an unexpected consequence: it predicted a second particle, identical to the electron but with a positive charge. Most physicists thought this was a flaw in the math. Dirac insisted the equation was too beautiful to be wrong. In 1932, Carl Anderson discovered the positron in cosmic ray experiments, exactly as Dirac had predicted. Antimatter was real. Dirac had discovered an entire mirror universe of matter from pure mathematics.',
    quotes: [
      { text: 'It is more important to have beauty in one\'s equations than to have them fit experiment.', src: 'Paul Dirac, Scientific American, May 1963' },
      { text: 'In science one tries to tell people, in such a way as to be understood by everyone, something that no one ever knew before. But in poetry, it\'s the exact opposite.', src: 'Paul Dirac' },
      { text: 'If you are receptive and humble, mathematics will lead you by the hand.', src: 'Paul Dirac' },
      { text: 'Pick a flower on Earth and you move the farthest star.', src: 'Paul Dirac, on the interconnectedness of the universe' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Paul Dirac')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Paul Dirac')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Paul Dirac')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Paul Dirac documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Paul Dirac')}`
    },
    books: [
      { title: 'The Strangest Man', author: 'Graham Farmelo', desc: 'The definitive biography of Dirac. Farmelo traces his difficult childhood, his revolutionary physics, and his extraordinary personality with equal care.' },
      { title: 'The Principles of Quantum Mechanics', author: 'Paul Dirac', desc: 'Dirac\'s own textbook, first published in 1930. Still considered one of the most elegant presentations of quantum theory ever written.' }
    ],
    takeaways: [
      { title: 'Trust mathematical beauty', desc: 'Dirac predicted antimatter because the math was too beautiful to be wrong. Aesthetic elegance is often a signal of deep truth in technical work.' },
      { title: 'Silence has power', desc: 'Dirac only spoke when he had something precise to say. In a world of noise, the person who speaks rarely but accurately commands attention.' },
      { title: 'Your quirks don\'t disqualify you', desc: 'Dirac was deeply eccentric by any measure. He became one of the greatest physicists ever anyway. Don\'t let social norms tell you that different means less.' }
    ]
  },

  {
    id: 'richard-feynman',
    name: 'Richard Feynman',
    years: '1918 – 1988',
    era: 'Modern',
    field: 'Physics',
    emoji: '\u{1F941}',
    fields: ['Theoretical Physics', 'Quantum Electrodynamics', 'Particle Physics', 'Science Communication'],
    tagline: 'The great explainer who could also do the hardest math in the room.',
    bio: 'Richard Feynman was an American physicist who reinvented quantum electrodynamics (QED), created Feynman diagrams to visualize particle interactions, and became the most gifted science communicator of the 20th century. He had an uncanny ability to see through complexity to the simple core of a problem. He worked on the Manhattan Project at Los Alamos, won the Nobel Prize for QED in 1965, cracked safes for fun, played bongo drums, and exposed the Challenger disaster\'s cause during a live hearing by dunking an O-ring in ice water. He was the rare physicist who was both a profound thinker and a genuine showman.',
    frameworks: [
      'Feynman diagrams — visual representations of particle interactions that simplified QED calculations',
      'Path integral formulation — sum over all possible histories to calculate quantum probabilities',
      'First principles thinking — strip away assumptions and rebuild understanding from the ground up',
      'The Feynman technique — if you can\'t explain it simply, you don\'t understand it'
    ],
    habits: [
      'Explained problems to himself as if teaching a class, testing his own understanding',
      'Maintained a list of favorite problems and checked new tools against them constantly',
      'Played bongo drums and frequented bars, finding ideas in unexpected places',
      'Cracked safes and puzzles recreationally, keeping his problem-solving instincts sharp',
      'Refused to read papers, preferring to derive results independently first'
    ],
    struggles: 'Feynman\'s first wife, Arline, died of tuberculosis while he was working at Los Alamos on the atomic bomb. He was 27. He wrote her a letter after her death that he kept sealed for decades. The Manhattan Project weighed on him. He fell into depression after the war, questioning whether physics had become a tool of destruction. His later years were marked by a battle with cancer. Through it all, he maintained his curiosity and his insistence that understanding is the only real goal of science.',
    moment: 'In 1986, Feynman was appointed to the Rogers Commission investigating the Space Shuttle Challenger disaster. During a televised hearing, he took a piece of O-ring rubber, dunked it in a glass of ice water, and squeezed it with a clamp. The rubber didn\'t bounce back. In ten seconds, he demonstrated what months of bureaucratic investigation had failed to show: cold temperatures made the O-rings rigid and unable to seal the joints. The shuttle had launched on a cold January morning. The simplicity of the demonstration was pure Feynman. Cut through the complexity. Show, don\'t tell. One experiment worth a thousand meetings.',
    quotes: [
      { text: 'The first principle is that you must not fool yourself, and you are the easiest person to fool.', src: 'Richard Feynman, Caltech commencement address, 1974' },
      { text: 'I would rather have questions that can\'t be answered than answers that can\'t be questioned.', src: 'Attributed to Richard Feynman' },
      { text: 'What I cannot create, I do not understand.', src: 'Richard Feynman, written on his blackboard at time of death, 1988' },
      { text: 'Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.', src: 'Richard Feynman' },
      { text: 'It doesn\'t matter how beautiful your theory is, it doesn\'t matter how smart you are. If it doesn\'t agree with experiment, it\'s wrong.', src: 'Richard Feynman' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Richard Feynman')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Richard Feynman')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Richard Feynman')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Richard Feynman documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Richard Feynman')}`
    },
    books: [
      { title: 'Surely You\'re Joking, Mr. Feynman!', author: 'Richard Feynman (as told to Ralph Leighton)', desc: 'Feynman\'s autobiography in anecdotes: cracking safes at Los Alamos, learning to draw, playing bongo drums in Brazil, and accidentally becoming one of the world\'s greatest physicists.' },
      { title: 'QED: The Strange Theory of Light and Matter', author: 'Richard Feynman', desc: 'Feynman explains quantum electrodynamics to a general audience with zero equations. A masterclass in making the complex clear.' }
    ],
    takeaways: [
      { title: 'If you can\'t explain it simply, you don\'t understand it', desc: 'Feynman tested his understanding by trying to explain things to beginners. If he got stuck, he knew he had a gap. Use teaching as a diagnostic tool for your own knowledge.' },
      { title: 'Keep a list of favorite problems', desc: 'Feynman maintained a dozen problems he cared about and tested every new technique against them. This is how you turn random learning into systematic progress.' },
      { title: 'Show, don\'t argue', desc: 'The O-ring demonstration was more convincing than any report. When you can demonstrate something physically, do it. One clear demo beats a hundred slide decks.' }
    ]
  },

  {
    id: 'emmy-noether',
    name: 'Emmy Noether',
    years: '1882 – 1935',
    era: 'Modern',
    field: 'Mathematics',
    emoji: '\u{1F4D0}',
    fields: ['Abstract Algebra', 'Theoretical Physics', 'Ring Theory', 'Topology'],
    tagline: 'She proved that symmetry is the deepest thing in physics.',
    bio: 'Emmy Noether was a German mathematician who proved what many consider the most beautiful theorem in physics: for every continuous symmetry of a physical system, there is a corresponding conservation law. Symmetry in time gives conservation of energy. Symmetry in space gives conservation of momentum. Her theorem is the foundation of modern theoretical physics. She also revolutionized abstract algebra, creating the conceptual frameworks that mathematicians still use today. She did all of this while being denied a paid position for years because she was a woman.',
    frameworks: [
      'Noether\'s theorem — every continuous symmetry corresponds to a conserved quantity',
      'Abstract algebra revolution — shifted math from computation to structural thinking',
      'Ideal theory in rings — foundational work that reshaped how algebraists think about structure',
      'Ascending chain condition — a finiteness condition that became central to modern algebra'
    ],
    habits: [
      'Taught informally for years without pay, driven by love of mathematics',
      'Worked collaboratively, often giving away her ideas to students who published them',
      'Thought in terms of abstract structures rather than specific computations',
      'Maintained an intense, enthusiastic lecturing style that inspired devoted students',
      'Continued producing mathematics at the highest level despite constant institutional barriers'
    ],
    struggles: 'Noether fought gender discrimination her entire career. She was denied enrollment at the University of Erlangen, allowed only to audit classes. When Hilbert and Klein tried to get her a position at Gottingen, the faculty objected: "What will our soldiers think when they return to the university and find that they are required to learn at the feet of a woman?" Hilbert responded: "I do not see that the sex of the candidate is an argument against her admission. We are a university, not a bath house." She lectured unpaid under Hilbert\'s name for four years. When the Nazis came to power, she was dismissed for being Jewish and fled to the United States, where she died two years later at 53.',
    moment: 'In 1915, Hilbert invited Noether to Gottingen to solve a problem that had stumped both him and Einstein: the conservation of energy seemed to break in general relativity. Noether didn\'t just solve the problem. She proved a theorem so fundamental that it undergirds all of modern physics. Noether\'s theorem showed that every symmetry of a physical system corresponds to a conservation law. Time symmetry gives energy conservation. Spatial symmetry gives momentum conservation. Rotational symmetry gives angular momentum conservation. Einstein called the theorem "a piece of penetrating mathematical thinking." It remains the deepest connection between mathematics and physics ever discovered.',
    quotes: [
      { text: 'My methods are really methods of working and thinking; this is why they have crept in everywhere anonymously.', src: 'Emmy Noether, letter to a colleague, 1931' },
      { text: 'If one proves the equality of two numbers a and b by showing first that a is less than or equal to b and then that b is less than or equal to a, it is unfair; one should instead show that they are really equal by disclosing the inner ground for their equality.', src: 'Emmy Noether, on mathematical elegance' },
      { text: 'In the judgment of the most competent living mathematicians, Fraulein Noether was the most significant creative mathematical genius thus far produced since the higher education of women began.', src: 'Albert Einstein, letter to the New York Times, 1935 (about Noether)' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Emmy Noether')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Emmy Noether')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Emmy Noether')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Emmy Noether documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Emmy Noether')}`
    },
    books: [
      { title: 'Emmy Noether\'s Wonderful Theorem', author: 'Dwight Neuenschwander', desc: 'An accessible explanation of Noether\'s theorem for readers with basic calculus and physics. Shows why the theorem is considered the most beautiful result in theoretical physics.' },
      { title: 'Emmy Noether: The Mother of Modern Algebra', author: 'M.B.W. Tent', desc: 'A biography tracing Noether\'s journey from auditing classes in Erlangen to revolutionizing mathematics and physics, despite every institutional barrier.' }
    ],
    takeaways: [
      { title: 'Look for symmetry', desc: 'Noether showed that symmetry is the deepest organizing principle in nature. When you find a symmetry in a system, you\'ve found something that\'s conserved. This applies beyond physics.' },
      { title: 'Don\'t let institutions define your worth', desc: 'Noether was denied positions, pay, and credit because of her gender. She kept doing mathematics anyway. Your work speaks for itself regardless of what institutions say about you.' },
      { title: 'Think structurally, not computationally', desc: 'Noether revolutionized algebra by asking about structures rather than grinding through calculations. Step back from the details and ask what pattern connects them.' }
    ]
  },

  {
    id: 'john-bell',
    name: 'John Bell',
    years: '1928 – 1990',
    era: 'Modern',
    field: 'Physics',
    emoji: '\u{1F514}',
    fields: ['Theoretical Physics', 'Quantum Foundations', 'Particle Physics', 'Philosophy of Physics'],
    tagline: 'He proved that quantum mechanics is fundamentally nonlocal. Einstein was wrong.',
    bio: 'John Bell was a Northern Irish physicist who proved the most profound theorem in quantum mechanics. Bell\'s theorem showed that no theory of "local hidden variables" can reproduce all the predictions of quantum mechanics. In plain terms: if quantum mechanics is right (and it is), then measuring one particle can instantaneously affect another particle far away. Einstein called this "spooky action at a distance" and was sure it was wrong. Bell proved it\'s real. He worked at CERN on particle physics by day and on quantum foundations in his spare time, producing the result that settled the Einstein-Bohr debate once and for all.',
    frameworks: [
      'Bell\'s theorem — local hidden variable theories cannot reproduce quantum mechanical predictions',
      'Bell inequalities — mathematical tests that distinguish quantum mechanics from local realism',
      'Beables vs. observables — focus on what exists (beables) rather than just what\'s measured',
      'Nonlocality as fundamental — the universe is connected in ways that violate our classical intuitions'
    ],
    habits: [
      'Worked on foundations of quantum mechanics in his spare time, outside his official CERN duties',
      'Read and re-read the original papers of Einstein, Bohr, and Bohm carefully',
      'Thought deeply before publishing, preferring one devastating paper to many incremental ones',
      'Engaged openly with philosophical questions that most physicists avoided',
      'Maintained intellectual independence, disagreeing publicly with the Copenhagen orthodoxy'
    ],
    struggles: 'Bell worked on quantum foundations when it was career suicide. The physics establishment considered the debate between Einstein and Bohr settled (in Bohr\'s favor) and viewed anyone revisiting it as a crank. Bell did his foundations work at CERN in his spare time because it wasn\'t considered respectable physics. He was also deeply troubled by his own result: he had a gut sympathy for Einstein\'s position and was disturbed to prove that nature really is nonlocal. He died suddenly of a brain hemorrhage at 62, before the experimental confirmations of his theorem won Nobel Prizes for others.',
    moment: 'In 1964, Bell published a six-page paper titled "On the Einstein Podolsky Rosen Paradox" in a short-lived journal called Physics Physique Fizika. In it, he derived a mathematical inequality that any local hidden variable theory must satisfy. Then he showed that quantum mechanics violates this inequality. The implication was staggering: if quantum mechanics is correct, then reality is nonlocal. Measuring one particle instantaneously determines properties of another particle, no matter how far apart they are. The paper was barely noticed at first. It took decades and increasingly precise experiments (Freedman-Clauser 1972, Aspect 1982, and finally loophole-free tests in 2015) to confirm that Bell was right. In 2022, Aspect, Clauser, and Zeilinger won the Nobel Prize for experimentally proving Bell\'s theorem. Bell himself had died 32 years earlier.',
    quotes: [
      { text: 'Bohm\'s 1952 papers on quantum mechanics were for me a revelation. The elimination of indeterminism was very striking. But more important, it seemed to me, was the elimination of any need for a vague division of the world into system on the one hand, and apparatus or observer on the other.', src: 'John Bell, Speakable and Unspeakable in Quantum Mechanics, 1987' },
      { text: 'The beables of the theory are those elements which might correspond to elements of reality, to things which exist.', src: 'John Bell, on what physics should describe' },
      { text: 'Is it not good to know what follows from what, even if it is not necessary for daily life? Is it not good to know the depth of the foundations, even when they serve well enough for daily life?', src: 'John Bell, on why foundations of quantum mechanics matter' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('John Stewart Bell')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('John Bell theorem')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('John Bell theorem quantum')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('John Bell theorem documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('John Stewart Bell physicist')}`
    },
    books: [
      { title: 'Speakable and Unspeakable in Quantum Mechanics', author: 'John Bell', desc: 'Bell\'s collected papers on quantum foundations. Includes the original 1964 paper, his thoughts on nonlocality, and his critiques of the Copenhagen interpretation.' },
      { title: 'The Quantum Dissidents', author: 'Olival Freire Jr.', desc: 'The story of how a small group of physicists, including Bell, kept the foundations of quantum mechanics alive when the establishment wanted to bury them.' }
    ],
    takeaways: [
      { title: 'Question settled questions', desc: 'Everyone said the Einstein-Bohr debate was over. Bell reopened it and proved something neither side expected. "Settled" doesn\'t always mean understood.' },
      { title: 'Side projects can be your most important work', desc: 'Bell\'s theorem was done in his spare time at CERN. Sometimes the work that defines your legacy is the work you do outside your day job.' },
      { title: 'A single clear result beats a hundred vague ones', desc: 'Bell published relatively few papers on foundations, but each one was devastating. Focus on quality and clarity over volume.' }
    ]
  }
];
