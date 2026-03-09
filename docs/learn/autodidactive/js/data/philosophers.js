// ═══════════════════════════════════════════════════════════════════════════════
// PHILOSOPHERS — Extracted from polymaths-and-philosophers.html
// ═══════════════════════════════════════════════════════════════════════════════

export const PHILOSOPHERS = [
  {
    id: 'marcus',
    name: 'Marcus Aurelius',
    years: '121 – 180 AD',
    era: 'Ancient',
    field: 'stoicism',
    emoji: '👑',
    fields: ['stoicism', 'politics', 'philosophy'],
    tagline: 'The emperor who ruled himself first',
    bio: `The most powerful man in the world, and arguably the most burdened. Constant war on the frontier (Marcomannic Wars lasted most of his reign). Plague (the Antonine Plague killed 5-10 million). Betrayal by his co-emperor Lucius Verus, then by his trusted general Avidius Cassius who declared a coup. His own son Commodus was clearly unfit to rule, and Marcus knew it. He wrote the Meditations not as philosophy for publication — they were private journal entries. A man trying to hold himself together while the world fell apart around him.`,
    frameworks: [
      'Morning preparation — begin each day expecting difficulty. "Today I shall meet with interference, ingratitude, insolence, disloyalty." Then choose your response in advance.',
      'The view from above — zoom out. See your problems from the scale of the cosmos. Most of what torments you is trivial.',
      'Amor fati — love your fate. Don\'t just endure what happens. Embrace it as necessary material for your growth.',
      'The inner citadel — external events cannot reach your mind unless you allow them. Your judgment is the only thing truly under your control.'
    ],
    habits: [
      'Wrote his private journal (Meditations) consistently, never intending publication.',
      'Practiced negative visualization — imagining worst-case outcomes to reduce their emotional power.',
      'Rose before his court to have time for reflection.',
      'Sought counsel from philosophers, not just generals and politicians.',
      'Treated slaves and enemies with a dignity unusual for Roman emperors.'
    ],
    struggles: `The most powerful man in the world, and arguably the most burdened. Constant war on the frontier (Marcomannic Wars lasted most of his reign). Plague (the Antonine Plague killed 5-10 million). Betrayal by his co-emperor Lucius Verus, then by his trusted general Avidius Cassius who declared a coup. His own son Commodus was clearly unfit to rule, and Marcus knew it. He wrote the Meditations not as philosophy for publication — they were private journal entries. A man trying to hold himself together while the world fell apart around him.`,
    moment: `Alone in his tent on the Germanic frontier, freezing, exhausted from years of war he never wanted, writing by lamplight: "When you arise in the morning, think of what a precious privilege it is to be alive — to breathe, to think, to enjoy, to love." He wasn't writing to inspire anyone. He was talking himself out of despair. The most powerful man alive, privately begging himself to find meaning in suffering.`,
    quotes: [
      { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', src: 'Marcus Aurelius, Meditations' },
      { text: 'The happiness of your life depends upon the quality of your thoughts.', src: 'Marcus Aurelius' },
      { text: 'Waste no more time arguing about what a good man should be. Be one.', src: 'Marcus Aurelius' },
      { text: 'The impediment to action advances action. What stands in the way becomes the way.', src: 'Marcus Aurelius' },
      { text: 'When you arise in the morning, think of what a precious privilege it is to be alive.', src: 'Marcus Aurelius' },
      { text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.', src: 'Marcus Aurelius' },
      { text: 'It is not death that a man should fear, but he should fear never beginning to live.', src: 'Marcus Aurelius' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Marcus Aurelius')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Marcus Aurelius')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Marcus Aurelius')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Marcus Aurelius documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Marcus Aurelius')}`
    },
    books: [
      { title: 'Discourses', author: 'Epictetus (via Arrian)', desc: 'Marcus credits Epictetus throughout the Meditations. The slave\'s philosophy became the emperor\'s operating system. Epictetus\'s Dichotomy of Control — focus only on what you can influence — was the framework Marcus used to govern an empire while maintaining his sanity.' }
    ],
    takeaways: [
      { title: 'Morning premeditatio', desc: 'Before checking your phone, spend 2 minutes expecting the day\'s difficulties. You\'ll meet them with calm instead of shock.' },
      { title: 'Journal for yourself, not an audience', desc: 'Write what you need to hear. The Meditations were never meant to be published. That\'s why they\'re honest.' },
      { title: 'The obstacle is the way', desc: 'The thing blocking you contains the lesson you need. Stop trying to go around it.' }
    ]
  },
  {
    id: 'socrates',
    name: 'Socrates',
    years: '470 – 399 BC',
    era: 'Ancient',
    field: 'philosophy',
    emoji: '❓',
    fields: ['philosophy', 'ethics'],
    tagline: 'The man who weaponized questions',
    bio: `Poor his entire life. Walked barefoot. Ate little. His wife Xanthippe was legendarily difficult (or he was legendarily difficult to live with). Athens considered him a nuisance — a man who cornered respected citizens in the marketplace and made them look foolish by exposing the contradictions in their thinking. He was charged with "corrupting the youth" and "impiety" — essentially, asking too many questions. He was sentenced to death by drinking hemlock. He could have escaped (his friends arranged it). He refused, choosing to die for the principle that a citizen must accept the laws of their city, even unjust ones.`,
    frameworks: [
      'The Socratic Method — never state your position. Ask questions until the other person discovers the truth (or their own ignorance) themselves.',
      'Productive ignorance — "I know that I know nothing." The wisest person is the one who understands the limits of their knowledge.',
      'Elenchus (refutation) — test every belief by looking for internal contradictions. If a belief contradicts itself, it\'s wrong.',
      'The examined life — the purpose of being alive is to question everything you believe and refine it through dialogue.'
    ],
    habits: [
      'Spent most of his day in public conversation — the marketplace, the gymnasium, dinner parties.',
      'Lived in voluntary poverty — rejected payment for teaching.',
      'Walked barefoot in all weather, wore the same cloak year-round.',
      'Practiced physical endurance — stood for hours in thought, served as a soldier with distinction.',
      'Drank with friends but was never seen drunk — maintained clarity at all times.'
    ],
    struggles: `Poor his entire life. Walked barefoot. Ate little. His wife Xanthippe was legendarily difficult (or he was legendarily difficult to live with). Athens considered him a nuisance — a man who cornered respected citizens in the marketplace and made them look foolish by exposing the contradictions in their thinking. He was charged with "corrupting the youth" and "impiety" — essentially, asking too many questions. He was sentenced to death by drinking hemlock. He could have escaped (his friends arranged it). He refused, choosing to die for the principle that a citizen must accept the laws of their city, even unjust ones.`,
    moment: `At his trial, given the chance to propose an alternative punishment (exile, a fine), he suggested the city should reward him with free meals for life — because he was performing a public service by making people think. The jury was not amused. But the point landed across millennia: the person who forces you to question your assumptions is the most valuable person in the room, even when everyone wants to kill them for it.`,
    quotes: [
      { text: 'The unexamined life is not worth living.', src: 'Socrates (via Plato, Apology)' },
      { text: 'I know that I know nothing.', src: 'Socrates (via Plato)' },
      { text: 'Strong minds discuss ideas, average minds discuss events, weak minds discuss people.', src: 'Socrates' },
      { text: 'Education is the kindling of a flame, not the filling of a vessel.', src: 'Socrates (via Plutarch)' },
      { text: 'To find yourself, think for yourself.', src: 'Socrates' },
      { text: 'Wonder is the beginning of wisdom.', src: 'Socrates' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Socrates')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Socrates')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Socrates')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Socrates documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Socrates')}`
    },
    books: [
      { title: 'The Delphic Maxims', author: 'Traditional (Temple of Apollo)', desc: '"Know thyself" — inscribed on the Temple of Apollo at Delphi. Not a book but a text that defined Socrates\' entire mission. He took that two-word inscription and made it the foundation of Western philosophy: self-knowledge as the prerequisite for all other knowledge.' }
    ],
    takeaways: [
      { title: 'Ask, don\'t tell', desc: 'When someone has a bad idea, don\'t correct them. Ask questions until they find the flaw themselves. They\'ll actually change.' },
      { title: 'Embrace not knowing', desc: 'The smartest thing you can say is "I don\'t know." It opens the door to learning. Pretending to know slams it shut.' },
      { title: 'Test your beliefs', desc: 'Pick your strongest opinion. Now argue against it. If you can\'t, you don\'t understand it well enough.' }
    ]
  },
  {
    id: 'seneca',
    name: 'Seneca',
    years: '4 BC – 65 AD',
    era: 'Ancient',
    field: 'stoicism',
    emoji: '📝',
    fields: ['stoicism', 'politics', 'writing'],
    tagline: 'The philosopher who knew how to live and how to die',
    bio: `Exiled to Corsica for 8 years on a trumped-up adultery charge. Recalled only to become tutor (then advisor) to Nero — history's most infamous emperor. He watched his student become a monster. Tried to restrain Nero's worst impulses, partially succeeded for years, then couldn't anymore. When Nero decided Seneca was a threat, he ordered him to commit suicide. Seneca complied with the calm he'd spent a lifetime practicing, dictating philosophy to his scribes as he bled out.`,
    frameworks: [
      'Premeditatio malorum — deliberately imagine the worst. Poverty. Loss. Death. Not to create anxiety, but to inoculate against it.',
      'Time as the only resource — money can be earned back. Status can be rebuilt. Time, once spent, is gone. Guard it ferociously.',
      'Practice poverty — periodically live with less than you need. Sleep on the floor. Eat simple food. Not as punishment, but as training.',
      'Letters as philosophy — wrote his ideas as personal letters to friends. Practical, specific, grounded in real problems.'
    ],
    habits: [
      'Evening review — examined every action of the day, looking for errors in judgment.',
      'Practiced voluntary discomfort — cold baths, fasting, wearing rough clothing.',
      'Wrote daily — his letters to Lucilius are a masterclass in applied philosophy.',
      'Maintained friendships through correspondence even in exile.',
      'Read widely but selectively — "It is not the man who has too little who is poor, but the one who hankers after more."'
    ],
    struggles: `Exiled to Corsica for 8 years on a trumped-up adultery charge. Recalled only to become tutor (then advisor) to Nero — history's most infamous emperor. He watched his student become a monster. Tried to restrain Nero's worst impulses, partially succeeded for years, then couldn't anymore. When Nero decided Seneca was a threat, he ordered him to commit suicide. Seneca complied with the calm he'd spent a lifetime practicing, dictating philosophy to his scribes as he bled out.`,
    moment: `In exile on Corsica, stripped of wealth, status, and freedom, he wrote "On the Shortness of Life" — arguably the most practical philosophy text ever written. Sitting in forced poverty, he realized that most people don't have short lives; they waste long ones. Time is the only non-renewable resource, and almost everyone spends it as if they have an infinite supply. The exile that was meant to destroy him produced his clearest thinking.`,
    quotes: [
      { text: 'It is not that we have a short time to live, but that we waste a great deal of it.', src: 'Seneca, On the Shortness of Life' },
      { text: 'We suffer more often in imagination than in reality.', src: 'Seneca' },
      { text: 'Luck is what happens when preparation meets opportunity.', src: 'Seneca' },
      { text: 'Difficulties strengthen the mind, as labor does the body.', src: 'Seneca' },
      { text: 'It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.', src: 'Seneca' },
      { text: 'He who is brave is free.', src: 'Seneca' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Seneca')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Seneca')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Seneca')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Seneca documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Seneca')}`
    },
    books: [
      { title: 'Republic & Letters', author: 'Epicurus', desc: 'Seneca — a Stoic — quoted Epicurus more than any other philosopher. He freely stole good ideas from rival schools: "I am in the habit of crossing over to the enemy\'s camp — not as a deserter, but as a scout." Epicurus taught him that philosophy must reduce suffering, not just satisfy curiosity.' }
    ],
    takeaways: [
      { title: 'Audit your time', desc: 'Track one week honestly. Where does your time actually go? You\'ll find hours you didn\'t know you were losing.' },
      { title: 'Practice voluntary discomfort', desc: 'Once a month, skip a meal. Sleep without a pillow. Walk in the cold. It\'s not suffering — it\'s inoculation against fragility.' },
      { title: 'Evening review', desc: 'Before sleep, replay the day. Where did you react instead of respond? No judgment — just observation. Then do better tomorrow.' }
    ]
  },
  {
    id: 'laotzu',
    name: 'Lao Tzu',
    years: 'c. 6th century BC',
    era: 'Ancient',
    field: 'philosophy',
    emoji: '☯️',
    fields: ['philosophy', 'eastern'],
    tagline: 'The sage who taught by disappearing',
    bio: `We know almost nothing about him — and that may be the point. Tradition says he was a record-keeper in the Zhou dynasty court who grew disillusioned with civilization's corruption. He may not have been a single person at all but a composite of several thinkers. The uncertainty itself embodies his teaching: the Tao that can be named is not the true Tao. He reportedly left civilization riding an ox, and a gatekeeper asked him to write down his wisdom before vanishing. The result was the Tao Te Ching — 81 short chapters that have influenced every century since.`,
    frameworks: [
      'Wu wei — "effortless action." Not passivity, but aligned action. Water doesn\'t force its way through rock. It finds the path of least resistance and carves canyons.',
      'The Tao (The Way) — reality has an underlying pattern that can\'t be captured in words or concepts. You can align with it but never fully describe it.',
      'Reversal — the soft overcomes the hard. The empty vessel is the most useful. Weakness contains strength. Everything contains its opposite.',
      'Simplicity — complexity is a disease. Return to the essential. "Manifest plainness, embrace simplicity, reduce selfishness, have few desires."'
    ],
    habits: [
      'Observed nature as primary teacher — water, wind, seasons, growth.',
      'Spoke in paradox — to break the listener out of conventional thinking.',
      'Practiced non-attachment to outcomes.',
      'Valued solitude and withdrawal from power structures.',
      'Left rather than fought — when the system was corrupt, he walked away.'
    ],
    struggles: `We know almost nothing about him — and that may be the point. Tradition says he was a record-keeper in the Zhou dynasty court who grew disillusioned with civilization's corruption. He may not have been a single person at all but a composite of several thinkers. The uncertainty itself embodies his teaching: the Tao that can be named is not the true Tao. He reportedly left civilization riding an ox, and a gatekeeper asked him to write down his wisdom before vanishing. The result was the Tao Te Ching — 81 short chapters that have influenced every century since.`,
    moment: `At the gate of the western pass, asked to leave behind his teaching before disappearing forever. The gatekeeper's request was simple: "You're leaving. Write something down." The resulting text — 5,000 Chinese characters — became one of the most translated books in human history. The man who valued silence above speech left words that haven't stopped speaking for 2,500 years.`,
    quotes: [
      { text: 'The journey of a thousand miles begins with a single step.', src: 'Lao Tzu' },
      { text: 'When I let go of what I am, I become what I might be.', src: 'Lao Tzu' },
      { text: 'Nature does not hurry, yet everything is accomplished.', src: 'Lao Tzu' },
      { text: 'A leader is best when people barely know he exists. When his work is done, his aim fulfilled, they will say: we did it ourselves.', src: 'Lao Tzu' },
      { text: 'Knowing others is intelligence; knowing yourself is true wisdom.', src: 'Lao Tzu' },
      { text: 'The truth is not always beautiful, nor beautiful words the truth.', src: 'Lao Tzu' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Lao Tzu')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Lao Tzu')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Lao Tzu')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Lao Tzu documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Lao Tzu')}`
    },
    books: [
      { title: 'The Book of Changes (I Ching)', author: 'Traditional (Zhou Dynasty)', desc: 'The I Ching\'s core insight — that change is the only constant, and wisdom lies in flowing with it rather than resisting — is the foundation of Taoist philosophy. The Tao Te Ching can be read as a poetic distillation of the I Ching\'s worldview.' }
    ],
    takeaways: [
      { title: 'Stop forcing it', desc: 'When you\'re stuck, stop pushing harder. Step back. Walk away. The answer comes when you stop strangling it.' },
      { title: 'Study water', desc: 'Water is soft but carves mountains. Be adaptable, persistent, and willing to take the path that\'s open rather than the path you planned.' },
      { title: 'Simplify ruthlessly', desc: 'Most of what you own, do, and think about is unnecessary. Cut until only the essential remains.' }
    ]
  },
  {
    id: 'epictetus',
    name: 'Epictetus',
    years: '50 – 135 AD',
    era: 'Ancient',
    field: 'stoicism',
    emoji: '⛓️',
    fields: ['stoicism', 'philosophy'],
    tagline: 'Born a slave. Died the most free man in Rome.',
    bio: `Born into slavery. His master Epaphroditus (himself a freedman of Nero) allegedly broke his leg — either deliberately or through neglect. Epictetus walked with a permanent limp for the rest of his life. After gaining his freedom, he was expelled from Rome when Emperor Domitian banished all philosophers. He set up a school in Nicopolis, Greece, and taught in poverty until his death. He never wrote a word — everything we have was transcribed by his student Arrian.`,
    frameworks: [
      'The Dichotomy of Control — separate everything in life into two categories: what you can control (your thoughts, responses, efforts) and what you can\'t (other people, outcomes, the past). Focus exclusively on the first.',
      'Prohairesis — your faculty of choice is the only thing that is truly yours. Everything else can be taken away.',
      'Role ethics — you play many roles (student, parent, citizen, worker). Each role has duties. Fulfilling them well is the path to a good life.',
      'Impression management — between stimulus and response, there is a gap. In that gap you choose whether to assent to an impression or reject it.'
    ],
    habits: [
      'Taught by conversation — his "Discourses" read like recorded classroom discussions.',
      'Lived in extreme simplicity — a mat, a cot, an earthen lamp.',
      'Practiced what he preached — never asked students to do what he hadn\'t done.',
      'Used everyday examples (sports, sailing, illness) to make abstract ideas concrete.',
      'Adopted and raised an abandoned child in his old age — practiced compassion, not just philosophy.'
    ],
    struggles: `Born into slavery. His master Epaphroditus (himself a freedman of Nero) allegedly broke his leg — either deliberately or through neglect. Epictetus walked with a permanent limp for the rest of his life. After gaining his freedom, he was expelled from Rome when Emperor Domitian banished all philosophers. He set up a school in Nicopolis, Greece, and taught in poverty until his death. He never wrote a word — everything we have was transcribed by his student Arrian.`,
    moment: `The story goes that while still enslaved, his master was twisting his leg. Epictetus said calmly, "You're going to break it." The leg broke. Epictetus said, "I told you so." Whether or not the story is literally true, it captures his entire philosophy: you cannot control what others do to your body. You can control your response. That distinction — between what is "up to us" and what is "not up to us" — became the foundation of Stoic practice.`,
    quotes: [
      { text: 'It\'s not what happens to you, but how you react to it that matters.', src: 'Epictetus' },
      { text: 'No man is free who is not master of himself.', src: 'Epictetus' },
      { text: 'First say to yourself what you would be; and then do what you have to do.', src: 'Epictetus' },
      { text: 'Don\'t explain your philosophy. Embody it.', src: 'Epictetus' },
      { text: 'Man is not worried by real problems so much as by his imagined anxieties about real problems.', src: 'Epictetus' },
      { text: 'If you want to improve, be content to be thought foolish and stupid.', src: 'Epictetus' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Epictetus')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Epictetus')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Epictetus')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Epictetus documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Epictetus')}`
    },
    books: [
      { title: 'The works of Chrysippus & Zeno', author: 'Stoic founders', desc: 'As a slave, Epictetus was sent to study under the Stoic teacher Musonius Rufus. The writings of the original Stoic founders — Zeno and Chrysippus — gave him the intellectual framework to survive enslavement: your body can be chained, but your mind is always free. He lived this before he taught it.' }
    ],
    takeaways: [
      { title: 'The two lists', desc: 'Right now, write two columns: "What I can control" and "What I can\'t." Move 100% of your energy to column one.' },
      { title: 'Don\'t explain — embody', desc: 'Stop talking about your values. Start living them. People notice actions, not declarations.' },
      { title: 'Use the gap', desc: 'Something happens. Before you react, pause. One breath. In that breath, choose your response instead of being chosen by your emotion.' }
    ]
  },
  {
    id: 'musashi',
    name: 'Miyamoto Musashi',
    years: '1584 – 1645',
    era: 'Renaissance',
    field: 'strategy',
    emoji: '⚔️',
    fields: ['strategy', 'art', 'philosophy'],
    tagline: 'The swordsman who mastered everything by mastering one thing',
    bio: `Killed his first opponent in a duel at age 13. Fought in over 60 duels and never lost. But his life was one of voluntary homelessness — a ronin (masterless samurai) who wandered Japan for decades. He never married, never settled, never served a lord permanently. He was covered in scars, rarely bathed, and was considered socially repulsive. The greatest swordsman in Japanese history couldn't find a place in Japanese society. He only found peace in his final years, retiring to a cave to write the Book of Five Rings before dying.`,
    frameworks: [
      'The Way is in training — mastery comes only from repetition. There are no shortcuts. Practice 1,000 days to forge, 10,000 days to refine.',
      'Know many arts — a warrior must also paint, write, build. Cross-training between disciplines sharpens the primary skill.',
      'Do nothing useless — strip away everything that doesn\'t serve the goal. Efficiency is elegance.',
      'See the macro and the micro simultaneously — perceive both the broad strategy and the immediate detail. Never lose one for the other.'
    ],
    habits: [
      'Practiced sword techniques thousands of times daily.',
      'Painted ink wash paintings, wrote poetry, crafted metal sculptures — cross-trained his mind.',
      'Slept sitting up with his sword — maintained constant readiness.',
      'Bathed rarely, ate simply, owned almost nothing.',
      'Studied opponents for days before engaging — preparation was the fight.'
    ],
    struggles: `Killed his first opponent in a duel at age 13. Fought in over 60 duels and never lost. But his life was one of voluntary homelessness — a ronin (masterless samurai) who wandered Japan for decades. He never married, never settled, never served a lord permanently. He was covered in scars, rarely bathed, and was considered socially repulsive. The greatest swordsman in Japanese history couldn't find a place in Japanese society. He only found peace in his final years, retiring to a cave to write the Book of Five Rings before dying.`,
    moment: `His most famous duel — against Sasaki Kojiro on Ganryu Island — he arrived late (deliberately, to unsettle his opponent) and fought with a wooden sword he'd carved from a boat oar during the crossing. He won. The lesson wasn't about fighting. It was about psychology. The battle was decided before the first strike, by a man who understood that strategy is 90% mental.`,
    quotes: [
      { text: 'Do nothing that is of no use.', src: 'Miyamoto Musashi, Book of Five Rings' },
      { text: 'There is nothing outside of yourself that can ever enable you to get better, stronger, richer, quicker, or smarter. Everything is within.', src: 'Miyamoto Musashi' },
      { text: 'Think lightly of yourself and deeply of the world.', src: 'Miyamoto Musashi' },
      { text: 'The purpose of today\'s training is to defeat yesterday\'s understanding.', src: 'Miyamoto Musashi' },
      { text: 'You must understand that there is more than one path to the top of the mountain.', src: 'Miyamoto Musashi' },
      { text: 'In strategy, it is important to see distant things as if they were close and to take a distanced view of close things.', src: 'Miyamoto Musashi' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Miyamoto Musashi')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Miyamoto Musashi')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Miyamoto Musashi')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Miyamoto Musashi documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Miyamoto Musashi')}`
    },
    books: [
      { title: 'The Art of War', author: 'Sun Tzu', desc: 'While Musashi never directly cites Sun Tzu, the parallels are unmistakable: "All warfare is deception." "Know your enemy and know yourself." "The supreme art of war is to subdue the enemy without fighting." Musashi\'s Book of Five Rings is Sun Tzu refined through 60 real duels.' }
    ],
    takeaways: [
      { title: 'Cut the useless', desc: 'Review your daily activities. How many actually serve your goals? Eliminate everything else. Ruthlessly.' },
      { title: 'Cross-train your mind', desc: 'Musashi painted to improve his swordsmanship. What unrelated skill would sharpen your primary one?' },
      { title: 'Defeat yesterday', desc: 'Don\'t compare yourself to others. Compare yourself to who you were yesterday. Beat that person.' }
    ]
  },
  {
    id: 'confucius',
    name: 'Confucius',
    years: '551 – 479 BC',
    era: 'Ancient',
    field: 'philosophy',
    emoji: '🎓',
    fields: ['philosophy', 'ethics', 'politics'],
    tagline: 'The teacher who civilized an empire',
    bio: `His father died when he was 3. Grew up in poverty. Spent decades trying to get rulers to implement his ideas about ethical governance — and was rejected by every single one. He wandered from state to state for 14 years with a small band of disciples, repeatedly turned away by warlords who found his insistence on virtue impractical. He was mocked as "the one who knows it's impossible but keeps trying." He died believing he had failed. His ideas only conquered China after his death.`,
    frameworks: [
      'Ren (humaneness) — the core virtue. Treat others as you wish to be treated. Compassion is the foundation of all other virtues.',
      'Li (ritual/propriety) — civilization runs on shared norms and respectful behavior. Ritual isn\'t empty ceremony — it\'s the technology of social harmony.',
      'The Rectification of Names — if a king doesn\'t act like a king, don\'t call him one. Words must match reality, or communication breaks down.',
      'Self-cultivation — you cannot fix the world until you fix yourself. Start with your own character, then your family, then your community, then the state.'
    ],
    habits: [
      'Taught through dialogue and analogy — never lectured abstractly.',
      'Tailored his teaching to each student\'s character and weakness.',
      'Practiced music and archery — believed in educating the whole person.',
      'Studied ancient texts obsessively, especially the Book of Changes (I Ching).',
      'Maintained unwavering courtesy even to those who mocked or threatened him.'
    ],
    struggles: `His father died when he was 3. Grew up in poverty. Spent decades trying to get rulers to implement his ideas about ethical governance — and was rejected by every single one. He wandered from state to state for 14 years with a small band of disciples, repeatedly turned away by warlords who found his insistence on virtue impractical. He was mocked as "the one who knows it's impossible but keeps trying." He died believing he had failed. His ideas only conquered China after his death.`,
    moment: `Returning home after 14 years of wandering and rejection, he made a choice that changed the world: if no ruler would listen, he would teach students instead. He opened his school to anyone — rich or poor — which was revolutionary in feudal China. He couldn't change the rulers. So he changed the people who would eventually become them. His 3,000 students carried his ideas forward, and within a few generations, Confucianism became the operating system of Chinese civilization.`,
    quotes: [
      { text: 'It does not matter how slowly you go as long as you do not stop.', src: 'Confucius' },
      { text: 'Real knowledge is to know the extent of one\'s ignorance.', src: 'Confucius' },
      { text: 'The man who moves a mountain begins by carrying away small stones.', src: 'Confucius' },
      { text: 'Before you embark on a journey of revenge, dig two graves.', src: 'Confucius' },
      { text: 'By three methods we may learn wisdom: first, by reflection, which is noblest; second, by imitation, which is easiest; and third, by experience, which is the bitterest.', src: 'Confucius' },
      { text: 'I hear and I forget. I see and I remember. I do and I understand.', src: 'Confucius' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Confucius')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Confucius')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Confucius')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Confucius documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Confucius')}`
    },
    books: [
      { title: 'Book of Documents (Shujing)', author: 'Traditional (Zhou Dynasty)', desc: 'The historical records of the ancient sage-kings — Yao, Shun, Yu — gave Confucius his model of ethical governance. He didn\'t invent his moral framework from scratch. He studied history and extracted principles from rulers who got it right. History was his laboratory.' }
    ],
    takeaways: [
      { title: 'If you can\'t change the system, teach', desc: 'You may not be able to fix institutions directly. But you can raise people who will.' },
      { title: 'Fix yourself first', desc: 'Self \u2192 family \u2192 community \u2192 world. The order matters. You can\'t skip steps.' },
      { title: 'Never stop', desc: 'Speed is irrelevant. Direction is irrelevant. Not stopping is the only thing that matters.' }
    ]
  }
];
