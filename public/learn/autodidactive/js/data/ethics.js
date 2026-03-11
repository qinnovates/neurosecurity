// ═══════════════════════════════════════════════════════════════════════════════
// ETHICS TIMELINE — Philosophers & traditions across history
// ═══════════════════════════════════════════════════════════════════════════════

export const ETHICS_TIMELINE = [
  // ── Context: Earliest Known Ethics ──────────────────────────────────────────
  {
    id: 'context-earliest',
    isContext: true,
    years: '~2400 BCE',
    label: 'Oldest surviving ethics text predates Greek philosophy by 2,000 years'
  },

  // ── African — Ancient ───────────────────────────────────────────────────────
  {
    id: 'ptahhotep',
    name: 'Ptahhotep',
    years: '~2400 BCE',
    era: 'Ancient',
    region: 'african',
    tradition: 'Egyptian',
    emoji: '📜',
    works: ['The Maxims of Ptahhotep'],
    coreIdeas: 'Justice, humility, self-control, respect for elders, listening as virtue; earliest known ethical instruction text.',
    impact: 'Oldest surviving ethics text in human history. Predates Greek philosophy by 2,000 years.',
    searchQuery: 'Ptahhotep Maxims ancient Egyptian ethics instruction'
  },

  // ── Context: Bronze Age ─────────────────────────────────────────────────────
  {
    id: 'context-bronze-age',
    isContext: true,
    years: '~2000 BCE',
    label: 'Bronze Age civilizations flourish across Mesopotamia, Egypt, Indus Valley'
  },

  // ── Middle Eastern — Ancient ────────────────────────────────────────────────
  {
    id: 'zarathustra',
    name: 'Zarathustra (Zoroaster)',
    years: '~1500-1000 BCE',
    era: 'Ancient',
    region: 'middle-eastern',
    tradition: 'Zoroastrianism',
    emoji: '🔥',
    works: ['Gathas (within the Avesta)'],
    coreIdeas: 'Good thoughts, good words, good deeds; cosmic struggle between truth (asha) and falsehood (druj); free will to choose good.',
    impact: 'One of the oldest ethical monotheisms. Influenced Judaism, Christianity, and Islam. Introduced moral dualism and individual moral choice.',
    searchQuery: 'Zarathustra Zoroaster Gathas ethics moral dualism'
  },

  // ── Context: Axial Age ──────────────────────────────────────────────────────
  {
    id: 'context-axial-age',
    isContext: true,
    years: '~800-200 BCE',
    label: 'Axial Age: simultaneous ethical breakthroughs across Greece, China, India, Persia'
  },

  // ── Eastern Indian — Ancient ────────────────────────────────────────────────
  {
    id: 'mahavira',
    name: 'Mahavira',
    years: '599-527 BCE',
    era: 'Ancient',
    region: 'eastern-indian',
    tradition: 'Jainism',
    emoji: '🙏',
    works: ['Agamas (compiled by followers)'],
    coreIdeas: 'Ahimsa (non-violence) as supreme duty; anekantavada (many-sidedness of truth); non-possessiveness; ascetic self-discipline.',
    impact: 'Founded Jainism. Ahimsa influenced Gandhi and the global nonviolence movement. Anekantavada anticipates modern pluralism.',
    searchQuery: 'Mahavira Jainism ahimsa non-violence anekantavada'
  },

  {
    id: 'buddha',
    name: 'Siddhartha Gautama (Buddha)',
    years: '563-483 BCE',
    era: 'Ancient',
    region: 'eastern-indian',
    tradition: 'Buddhism',
    emoji: '☸️',
    works: ['Dhammapada', 'Tripitaka (compiled by followers)'],
    coreIdeas: 'Four Noble Truths; Eightfold Path; middle way; non-attachment; compassion (karuna); interdependent origination.',
    impact: 'Founded Buddhism. Influenced ethics, psychology, and governance across Asia. Mindfulness practices now global in healthcare and education.',
    searchQuery: 'Siddhartha Gautama Buddha Four Noble Truths Eightfold Path ethics'
  },

  // ── Eastern Chinese — Ancient ───────────────────────────────────────────────
  {
    id: 'confucius',
    name: 'Confucius (Kong Qiu)',
    years: '551-479 BCE',
    era: 'Ancient',
    region: 'eastern-chinese',
    tradition: 'Confucianism',
    emoji: '📖',
    works: ['Analects (compiled by disciples)'],
    coreIdeas: 'Ren (benevolence/humaneness); li (ritual propriety); filial piety; junzi (exemplary person); rectification of names.',
    impact: 'Defined Chinese civilization for 2,500 years. Shaped governance, education, family structure, and social ethics across East Asia.',
    searchQuery: 'Confucius Analects ren benevolence Confucian ethics'
  },

  // ── Western — Ancient & Classical ───────────────────────────────────────────
  {
    id: 'socrates',
    name: 'Socrates',
    years: '470-399 BCE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Classical Greek',
    emoji: '🏛️',
    works: ['No written works (preserved by Plato)'],
    coreIdeas: 'The examined life; Socratic method; virtue is knowledge; no one does wrong willingly.',
    impact: 'Founded Western ethical inquiry. His trial and death became the archetype for intellectual freedom and civil disobedience.',
    searchQuery: 'Socrates examined life Socratic method virtue ethics'
  },

  {
    id: 'mozi',
    name: 'Mozi (Mo Di)',
    years: '470-391 BCE',
    era: 'Ancient',
    region: 'eastern-chinese',
    tradition: 'Mohism',
    emoji: '⚖️',
    works: ['Mozi'],
    coreIdeas: 'Universal love (jian ai); consequentialism; anti-war; meritocracy over aristocracy; critique of extravagance and fatalism.',
    impact: 'First Chinese consequentialist. Challenged Confucian hierarchy with radical equality. His anti-war arguments anticipated modern just war theory.',
    searchQuery: 'Mozi Mohism universal love jian ai consequentialism'
  },

  {
    id: 'plato',
    name: 'Plato',
    years: '428-348 BCE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Classical Greek',
    emoji: '💎',
    works: ['Republic', 'Phaedo', 'Symposium', 'Gorgias', 'Meno'],
    coreIdeas: 'Theory of Forms; justice as harmony of the soul; philosopher-kings; the Good as highest Form.',
    impact: 'Established the Academy (first university). Shaped political philosophy, education theory, and metaphysical ethics for 2,400 years.',
    searchQuery: 'Plato Republic Theory of Forms justice philosopher-kings'
  },

  {
    id: 'diogenes',
    name: 'Diogenes of Sinope',
    years: '412-323 BCE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Cynicism',
    emoji: '🏺',
    works: ['No written works (anecdotal tradition)'],
    coreIdeas: 'Cynicism; live according to nature; reject social conventions; radical honesty and self-sufficiency.',
    impact: 'Challenged class, materialism, and hypocrisy. Precursor to Stoicism. His provocations remain models of speaking truth to power.',
    searchQuery: 'Diogenes Sinope Cynicism philosophy radical honesty'
  },

  {
    id: 'aristotle',
    name: 'Aristotle',
    years: '384-322 BCE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Classical Greek',
    emoji: '🧠',
    works: ['Nicomachean Ethics', 'Politics', 'Eudemian Ethics'],
    coreIdeas: 'Virtue ethics; eudaimonia (flourishing); the golden mean; practical wisdom (phronesis).',
    impact: 'Defined virtue ethics as a tradition. Influenced medieval Islamic, Jewish, and Christian thought. Still foundational in modern moral philosophy.',
    searchQuery: 'Aristotle Nicomachean Ethics virtue eudaimonia golden mean'
  },

  {
    id: 'chanakya',
    name: 'Chanakya (Kautilya)',
    years: '375-283 BCE',
    era: 'Ancient',
    region: 'eastern-indian',
    tradition: 'Political Realism',
    emoji: '👑',
    works: ['Arthashastra'],
    coreIdeas: 'Statecraft; political realism; espionage ethics; welfare of the people as king\'s duty; just taxation.',
    impact: 'India\'s Machiavelli (1,800 years earlier). First systematic treatise on governance, economics, and political ethics.',
    searchQuery: 'Chanakya Kautilya Arthashastra statecraft political ethics India'
  },

  {
    id: 'mencius',
    name: 'Mencius (Meng Ke)',
    years: '372-289 BCE',
    era: 'Ancient',
    region: 'eastern-chinese',
    tradition: 'Confucianism',
    emoji: '🌱',
    works: ['Mencius'],
    coreIdeas: 'Human nature is inherently good; four sprouts (compassion, shame, deference, judgment); benevolent government; the mandate of heaven can be lost.',
    impact: 'Established the optimistic wing of Confucianism. His "four sprouts" theory influenced moral psychology and education philosophy.',
    searchQuery: 'Mencius Meng Ke four sprouts human nature good Confucian'
  },

  {
    id: 'zhuangzi',
    name: 'Zhuangzi (Chuang Tzu)',
    years: '369-286 BCE',
    era: 'Ancient',
    region: 'eastern-chinese',
    tradition: 'Daoism',
    emoji: '🦋',
    works: ['Zhuangzi'],
    coreIdeas: 'Relativity of values; spontaneity; the usefulness of uselessness; butterfly dream (questioning reality); freedom from convention.',
    impact: 'Expanded Daoism into a profound skepticism of fixed moral categories. Influenced Chan/Zen Buddhism and Chinese literary culture.',
    searchQuery: 'Zhuangzi Chuang Tzu butterfly dream Daoism relativity values'
  },

  {
    id: 'epicurus',
    name: 'Epicurus',
    years: '341-270 BCE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Epicureanism',
    emoji: '🌿',
    works: ['Letter to Menoeceus', 'Principal Doctrines', 'Vatican Sayings'],
    coreIdeas: 'Pleasure as absence of pain (ataraxia); friendship as highest good; mortality removes fear of death; the gods don\'t intervene.',
    impact: 'Offered an ethics of modest living and mental tranquility. Countered superstition. Influenced Enlightenment thinkers (Jefferson, Bentham).',
    searchQuery: 'Epicurus Epicureanism ataraxia pleasure ethics Letter Menoeceus'
  },

  {
    id: 'zeno-citium',
    name: 'Zeno of Citium',
    years: '334-262 BCE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Stoicism',
    emoji: '🏛️',
    works: ['Republic (lost), fragments'],
    coreIdeas: 'Founded Stoicism; live according to nature; virtue is the sole good; cosmopolitanism.',
    impact: 'Created the Stoic school. His idea that all humans share rational nature influenced Roman law and later human rights concepts.',
    searchQuery: 'Zeno Citium Stoicism founder virtue cosmopolitanism'
  },

  {
    id: 'cleanthes',
    name: 'Cleanthes',
    years: '330-230 BCE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Stoicism',
    emoji: '🌅',
    works: ['Hymn to Zeus', 'fragments'],
    coreIdeas: 'Divine reason pervades nature; duty and endurance; emotional discipline.',
    impact: 'Preserved and transmitted early Stoicism. His hymn is one of the earliest monotheistic philosophical texts.',
    searchQuery: 'Cleanthes Stoic Hymn to Zeus divine reason'
  },

  {
    id: 'xunzi',
    name: 'Xunzi (Xun Kuang)',
    years: '310-235 BCE',
    era: 'Ancient',
    region: 'eastern-chinese',
    tradition: 'Confucianism',
    emoji: '📚',
    works: ['Xunzi'],
    coreIdeas: 'Human nature tends toward selfishness; morality is learned through ritual and education; importance of teachers and institutions.',
    impact: 'Countered Mencius -- morality is achievement, not inheritance. Influenced legalism and institutional ethics.',
    searchQuery: 'Xunzi human nature evil morality learned ritual Confucian'
  },

  {
    id: 'han-fei',
    name: 'Han Fei',
    years: '280-233 BCE',
    era: 'Ancient',
    region: 'eastern-chinese',
    tradition: 'Legalism',
    emoji: '⚔️',
    works: ['Han Feizi'],
    coreIdeas: 'Legalism; rule by law not virtue; institutional design over personal morality; incentive structures; realism about human nature.',
    impact: 'Shaped the Qin dynasty\'s unification of China. His institutional thinking influenced modern organizational and governance theory.',
    searchQuery: 'Han Fei Legalism Han Feizi rule by law Chinese philosophy'
  },

  {
    id: 'chrysippus',
    name: 'Chrysippus',
    years: '279-206 BCE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Stoicism',
    emoji: '🔗',
    works: ['~700 works (nearly all lost), fragments'],
    coreIdeas: 'Systematized Stoic logic, physics, and ethics; determinism and fate; assent theory.',
    impact: 'Called the "second founder" of Stoicism. Built the logical framework that made Stoicism rigorous and transmissible.',
    searchQuery: 'Chrysippus Stoic logic determinism assent theory second founder'
  },

  {
    id: 'thiruvalluvar',
    name: 'Thiruvalluvar',
    years: '3rd century BCE-5th century CE (est.)',
    era: 'Ancient',
    region: 'eastern-indian',
    tradition: 'Tamil Ethics',
    emoji: '🕊️',
    works: ['Thirukkural'],
    coreIdeas: 'Virtue (aram), wealth (porul), love (inbam); non-violence; hospitality; justice; ethical governance.',
    impact: '1,330 couplets covering all of ethical life. Called the "universal scripture." Translated into 40+ languages.',
    searchQuery: 'Thiruvalluvar Thirukkural Tamil ethics virtue universal scripture'
  },

  // ── Eastern Chinese — Ancient (Laozi) ───────────────────────────────────────
  {
    id: 'laozi',
    name: 'Laozi (Lao Tzu)',
    years: '6th century BCE (traditional)',
    era: 'Ancient',
    region: 'eastern-chinese',
    tradition: 'Daoism',
    emoji: '☯️',
    works: ['Tao Te Ching'],
    coreIdeas: 'The Dao (Way); wu wei (effortless action); softness overcomes hardness; return to simplicity; the sage leads by not leading.',
    impact: 'One of the most translated books in history. Influenced Chinese governance, medicine, art, martial arts, and environmental ethics.',
    searchQuery: 'Laozi Lao Tzu Tao Te Ching Daoism wu wei'
  },

  // ── Context: Roman Empire ───────────────────────────────────────────────────
  {
    id: 'context-roman-empire',
    isContext: true,
    years: '~27 BCE',
    label: 'Roman Empire established; Stoicism becomes philosophy of Roman governance'
  },

  // ── Western — Roman Stoics ──────────────────────────────────────────────────
  {
    id: 'seneca',
    name: 'Seneca',
    years: '4 BCE-65 CE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Stoicism',
    emoji: '✍️',
    works: ['Letters to Lucilius', 'On the Shortness of Life', 'On Anger', 'On the Happy Life', 'On Mercy'],
    coreIdeas: 'Practical Stoicism; emotional mastery; wealth is a tool not a goal; clemency in leadership; death as natural.',
    impact: 'Brought Stoicism to Roman political life. His letters remain the most accessible entry to Stoic practice. Influenced Montaigne, Descartes, and modern CBT.',
    searchQuery: 'Seneca Stoic Letters Lucilius practical philosophy'
  },

  {
    id: 'musonius-rufus',
    name: 'Musonius Rufus',
    years: '30-101 CE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Stoicism',
    emoji: '🎓',
    works: ['Lectures and Fragments'],
    coreIdeas: 'Equal education for women; marriage as partnership; simple living; philosophy as practice not theory.',
    impact: 'Called the "Roman Socrates." One of the earliest advocates for gender equality in education. Teacher of Epictetus.',
    searchQuery: 'Musonius Rufus Roman Socrates Stoic women education equality'
  },

  {
    id: 'epictetus',
    name: 'Epictetus',
    years: '50-135 CE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Stoicism',
    emoji: '⛓️',
    works: ['Discourses', 'Enchiridion (Handbook)'],
    coreIdeas: 'Dichotomy of control; freedom through acceptance; we are disturbed not by events but by our judgments; role ethics.',
    impact: 'Born a slave, became one of history\'s most influential moral teachers. The dichotomy of control is foundational to CBT and resilience psychology.',
    searchQuery: 'Epictetus Discourses Enchiridion dichotomy of control Stoic'
  },

  {
    id: 'marcus-aurelius',
    name: 'Marcus Aurelius',
    years: '121-180 CE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Stoicism',
    emoji: '👑',
    works: ['Meditations'],
    coreIdeas: 'Self-governance; impermanence; duty to the common good; amor fati; the view from above.',
    impact: 'A Roman emperor writing private reminders to be humble and just. Meditations is the most widely read philosophy book by a head of state.',
    searchQuery: 'Marcus Aurelius Meditations Stoicism self-governance amor fati'
  },

  {
    id: 'hierocles',
    name: 'Hierocles',
    years: '2nd century CE',
    era: 'Ancient',
    region: 'western',
    tradition: 'Stoicism',
    emoji: '⭕',
    works: ['Elements of Ethics'],
    coreIdeas: 'Oikeiosis (concentric circles of concern); pull all circles closer to the self; treat strangers as friends, friends as family.',
    impact: 'His concentric circles model is the earliest systematic framework for expanding moral concern -- foundational to cosmopolitanism and modern ethics of care.',
    searchQuery: 'Hierocles Stoic Elements of Ethics oikeiosis concentric circles'
  },

  {
    id: 'nagarjuna',
    name: 'Nagarjuna',
    years: '150-250 CE',
    era: 'Ancient',
    region: 'eastern-indian',
    tradition: 'Buddhism (Madhyamaka)',
    emoji: '🔮',
    works: ['Mulamadhyamakakarika (Fundamental Verses on the Middle Way)'],
    coreIdeas: 'Emptiness (sunyata); two truths doctrine; dependent origination; compassion grounded in non-self.',
    impact: 'Founded Madhyamaka Buddhism. His logic influenced all subsequent Buddhist philosophy and contemporary philosophy of language.',
    searchQuery: 'Nagarjuna Madhyamaka emptiness sunyata two truths Buddhist philosophy'
  },

  // ── Context: Fall of Rome ───────────────────────────────────────────────────
  {
    id: 'context-fall-rome',
    isContext: true,
    years: '~300-600 CE',
    label: 'Fall of Rome (476); preservation of Greek philosophy by Islamic scholars begins'
  },

  // ── Western — Medieval ──────────────────────────────────────────────────────
  {
    id: 'augustine',
    name: 'Augustine of Hippo',
    years: '354-430 CE',
    era: 'Medieval',
    region: 'western',
    tradition: 'Christian Philosophy',
    emoji: '✝️',
    works: ['Confessions', 'City of God', 'On Free Choice of the Will'],
    coreIdeas: 'Original sin; divine grace; free will vs. predestination; just war theory; the two cities (earthly/heavenly).',
    impact: 'Shaped Christian ethics for 1,500 years. Just war theory still governs international law. Confessions invented the autobiography as moral inquiry.',
    searchQuery: 'Augustine Hippo Confessions City of God just war free will'
  },

  {
    id: 'shankara',
    name: 'Shankara (Adi Shankaracharya)',
    years: '788-820 CE',
    era: 'Medieval',
    region: 'eastern-indian',
    tradition: 'Hinduism (Advaita Vedanta)',
    emoji: '🕉️',
    works: ['Vivekachudamani', 'Brahma Sutra Bhashya'],
    coreIdeas: 'Advaita Vedanta (non-dualism); the self (atman) is identical with ultimate reality (Brahman); world as maya (appearance); liberation through knowledge.',
    impact: 'Unified Hindu philosophy. Non-dualism influenced Schopenhauer, Emerson, and modern consciousness studies.',
    searchQuery: 'Adi Shankara Advaita Vedanta non-dualism atman Brahman'
  },

  {
    id: 'al-farabi',
    name: 'Al-Farabi',
    years: '872-950 CE',
    era: 'Medieval',
    region: 'middle-eastern',
    tradition: 'Islamic Philosophy',
    emoji: '🌙',
    works: ['The Virtuous City', 'The Attainment of Happiness'],
    coreIdeas: 'Philosopher-king (blending Plato and Islam); happiness through intellectual and moral virtue; political ethics.',
    impact: 'Called the "Second Teacher" (after Aristotle). Transmitted Greek ethics to the Islamic world and back to medieval Europe.',
    searchQuery: 'Al-Farabi Virtuous City Islamic philosophy philosopher-king'
  },

  {
    id: 'ibn-sina',
    name: 'Ibn Sina (Avicenna)',
    years: '980-1037',
    era: 'Medieval',
    region: 'middle-eastern',
    tradition: 'Islamic Philosophy',
    emoji: '🏥',
    works: ['The Book of Healing', 'The Canon of Medicine'],
    coreIdeas: 'Soul as rational substance; virtue as perfected intellect; medical ethics as moral duty; synthesis of Greek and Islamic thought.',
    impact: 'His medical ethics shaped healthcare for 600 years. The Canon was a standard European medical text until the 1700s.',
    searchQuery: 'Ibn Sina Avicenna Canon of Medicine medical ethics Islamic philosophy'
  },

  {
    id: 'al-ghazali',
    name: 'Al-Ghazali',
    years: '1058-1111',
    era: 'Medieval',
    region: 'middle-eastern',
    tradition: 'Islamic Philosophy (Sufi)',
    emoji: '🌟',
    works: ['The Incoherence of the Philosophers', 'Revival of the Religious Sciences'],
    coreIdeas: 'Critique of pure rationalism; spiritual ethics through practice; sincerity over ritual; mystical union with God.',
    impact: 'Reconciled Sufi mysticism with orthodox Islam. His emphasis on inner intention over outer compliance reshaped Islamic ethics.',
    searchQuery: 'Al-Ghazali Incoherence Philosophers Revival Religious Sciences Sufi ethics'
  },

  // ── Context: Crusades ───────────────────────────────────────────────────────
  {
    id: 'context-crusades',
    isContext: true,
    years: '~1100',
    label: 'Crusades begin; cross-cultural exchange intensifies between Europe and Islamic world'
  },

  {
    id: 'ibn-rushd',
    name: 'Ibn Rushd (Averroes)',
    years: '1126-1198',
    era: 'Medieval',
    region: 'middle-eastern',
    tradition: 'Islamic Philosophy',
    emoji: '📘',
    works: ['The Incoherence of the Incoherence', 'Commentaries on Aristotle'],
    coreIdeas: 'Reason and faith are compatible; truth cannot contradict truth; women can be philosophers and rulers.',
    impact: 'Preserved Aristotle for Europe. His rationalism directly influenced Aquinas and the European Renaissance.',
    searchQuery: 'Ibn Rushd Averroes Aristotle commentaries reason faith Islam'
  },

  {
    id: 'zhu-xi',
    name: 'Zhu Xi',
    years: '1130-1200',
    era: 'Medieval',
    region: 'eastern-chinese',
    tradition: 'Neo-Confucianism',
    emoji: '🎋',
    works: ['Reflections on Things at Hand', 'Commentary on the Four Books'],
    coreIdeas: 'Neo-Confucianism; investigation of things; li (principle) and qi (material force); moral cultivation through study.',
    impact: 'His commentaries became the basis of the Chinese civil service exam for 600 years. Defined orthodoxy across East Asia.',
    searchQuery: 'Zhu Xi Neo-Confucianism investigation of things li qi moral cultivation'
  },

  {
    id: 'maimonides',
    name: 'Maimonides',
    years: '1138-1204',
    era: 'Medieval',
    region: 'middle-eastern',
    tradition: 'Jewish Philosophy',
    emoji: '🕎',
    works: ['Guide for the Perplexed', 'Mishneh Torah'],
    coreIdeas: 'Synthesis of Jewish law and Aristotelian philosophy; negative theology; eight levels of charity; intellectual virtue as highest.',
    impact: 'Codified Jewish ethics. His charity ladder remains the standard framework for philanthropic giving.',
    searchQuery: 'Maimonides Guide Perplexed Mishneh Torah Jewish ethics charity'
  },

  {
    id: 'dogen',
    name: 'Dogen',
    years: '1200-1253',
    era: 'Medieval',
    region: 'eastern-japanese',
    tradition: 'Zen Buddhism',
    emoji: '🧘',
    works: ['Shobogenzo (Treasury of the True Dharma Eye)'],
    coreIdeas: 'Zazen (sitting meditation) as enlightenment itself (not a means to it); being-time; practice-realization unity.',
    impact: 'Founded Soto Zen. Influenced Japanese aesthetics, martial arts philosophy, and modern mindfulness movements.',
    searchQuery: 'Dogen Shobogenzo Soto Zen zazen practice-realization'
  },

  {
    id: 'rumi',
    name: 'Rumi',
    years: '1207-1273',
    era: 'Medieval',
    region: 'middle-eastern',
    tradition: 'Islamic Philosophy (Sufi)',
    emoji: '🌹',
    works: ['Masnavi', 'Divan-e Shams-e Tabrizi'],
    coreIdeas: 'Love as the ultimate ethical force; dissolution of ego; unity of all beings; compassion beyond creed.',
    impact: 'Best-selling poet in the US. His ethics of radical love and inclusivity resonate across religious boundaries worldwide.',
    searchQuery: 'Rumi Masnavi Sufi poetry love ethics compassion'
  },

  {
    id: 'aquinas',
    name: 'Thomas Aquinas',
    years: '1225-1274',
    era: 'Medieval',
    region: 'western',
    tradition: 'Christian Philosophy',
    emoji: '⚜️',
    works: ['Summa Theologica', 'Summa Contra Gentiles'],
    coreIdeas: 'Natural law; synthesis of Aristotle and Christianity; the five ways; virtue and divine law; double effect.',
    impact: 'Natural law theory underpins Catholic moral theology and influenced the UN Declaration of Human Rights. Doctrine of double effect still used in medical and military ethics.',
    searchQuery: 'Thomas Aquinas Summa Theologica natural law double effect'
  },

  {
    id: 'ibn-khaldun',
    name: 'Ibn Khaldun',
    years: '1332-1406',
    era: 'Medieval',
    region: 'middle-eastern',
    tradition: 'Islamic Philosophy',
    emoji: '🌍',
    works: ['Muqaddimah (Prolegomena)'],
    coreIdeas: 'Cyclical theory of civilizations; asabiyyah (social cohesion) as engine of history; sociology as science; decline through luxury and moral decay.',
    impact: 'Invented sociology 400 years before Comte. The Muqaddimah is the first systematic analysis of how societies rise, corrupt, and fall.',
    searchQuery: 'Ibn Khaldun Muqaddimah asabiyyah sociology civilizations'
  },

  // ── Context: Gutenberg ──────────────────────────────────────────────────────
  {
    id: 'context-gutenberg',
    isContext: true,
    years: '~1440',
    label: 'Gutenberg printing press; philosophical texts become widely accessible'
  },

  // ── Western — Renaissance ───────────────────────────────────────────────────
  {
    id: 'machiavelli',
    name: 'Niccolo Machiavelli',
    years: '1469-1527',
    era: 'Renaissance',
    region: 'western',
    tradition: 'Political Realism',
    emoji: '🦊',
    works: ['The Prince', 'Discourses on Livy'],
    coreIdeas: 'Political realism; ends justify means (for state stability); virtu vs. fortuna; separation of politics from morality.',
    impact: 'Invented modern political science. Forced ethics to confront power as it actually operates, not as it should.',
    searchQuery: 'Machiavelli The Prince political realism virtu fortuna'
  },

  {
    id: 'wang-yangming',
    name: 'Wang Yangming',
    years: '1472-1529',
    era: 'Renaissance',
    region: 'eastern-chinese',
    tradition: 'Neo-Confucianism',
    emoji: '💡',
    works: ['Instructions for Practical Living'],
    coreIdeas: 'Unity of knowledge and action; innate moral knowledge (liangzhi); the mind is principle; act on moral intuition immediately.',
    impact: 'Most influential Neo-Confucian after Zhu Xi. His "unity of knowledge and action" influenced Meiji Japan and modern East Asian thought.',
    searchQuery: 'Wang Yangming liangzhi unity knowledge action Neo-Confucian'
  },

  {
    id: 'thomas-more',
    name: 'Thomas More',
    years: '1478-1535',
    era: 'Renaissance',
    region: 'western',
    tradition: 'Christian Humanism',
    emoji: '🏝️',
    works: ['Utopia'],
    coreIdeas: 'Critique of private property; communal living; religious tolerance; social justice through institutional design.',
    impact: 'Coined "utopia." Established the tradition of imagining better societies as ethical argument. Died for conscience over power.',
    searchQuery: 'Thomas More Utopia communal living social justice Renaissance'
  },

  // ── Context: Colonialism ────────────────────────────────────────────────────
  {
    id: 'context-colonialism',
    isContext: true,
    years: '~1500-1800',
    label: 'European colonialism reshapes global power structures and ethical questions'
  },

  // ── Western — Enlightenment ─────────────────────────────────────────────────
  {
    id: 'hobbes',
    name: 'Thomas Hobbes',
    years: '1588-1679',
    era: 'Enlightenment',
    region: 'western',
    tradition: 'Social Contract',
    emoji: '🐉',
    works: ['Leviathan', 'De Cive'],
    coreIdeas: 'Social contract; state of nature ("nasty, brutish, and short"); sovereign authority as escape from chaos; rational self-interest.',
    impact: 'Founded modern political philosophy. Social contract theory shaped every democratic constitution that followed.',
    searchQuery: 'Thomas Hobbes Leviathan social contract state of nature'
  },

  {
    id: 'spinoza',
    name: 'Baruch Spinoza',
    years: '1632-1677',
    era: 'Enlightenment',
    region: 'western',
    tradition: 'Rationalism',
    emoji: '🔭',
    works: ['Ethics', 'Theologico-Political Treatise'],
    coreIdeas: 'God and nature are one substance; freedom through understanding necessity; emotions as confused ideas; democratic governance.',
    impact: 'Laid groundwork for secular ethics, biblical criticism, and liberal democracy. Einstein cited him as his philosophical model.',
    searchQuery: 'Baruch Spinoza Ethics pantheism freedom necessity rationalism'
  },

  {
    id: 'locke',
    name: 'John Locke',
    years: '1632-1704',
    era: 'Enlightenment',
    region: 'western',
    tradition: 'Liberalism',
    emoji: '🗝️',
    works: ['Two Treatises of Government', 'Essay Concerning Human Understanding', 'A Letter Concerning Toleration'],
    coreIdeas: 'Natural rights (life, liberty, property); government by consent; tabula rasa; religious toleration.',
    impact: 'Direct influence on the US Declaration of Independence and Constitution. Father of liberalism.',
    searchQuery: 'John Locke Two Treatises natural rights liberalism government consent'
  },

  // ── Eastern Japanese — Bushido ──────────────────────────────────────────────
  {
    id: 'bushido',
    name: 'Bushido Tradition',
    years: '17th-18th century (codified)',
    era: 'Enlightenment',
    region: 'eastern-japanese',
    tradition: 'Bushido',
    emoji: '⚔️',
    works: ['Hagakure (Yamamoto Tsunetomo)', 'Bushido: The Soul of Japan (Nitobe Inazo)'],
    coreIdeas: 'Rectitude, courage, benevolence, respect, honesty, honor, loyalty; death before dishonor; duty to lord and society.',
    impact: 'Shaped Japanese moral identity. Nitobe\'s 1900 book introduced Japanese ethics to the West. Still influences corporate and military culture.',
    searchQuery: 'Bushido Hagakure Nitobe Japanese warrior ethics samurai'
  },

  {
    id: 'hume',
    name: 'David Hume',
    years: '1711-1776',
    era: 'Enlightenment',
    region: 'western',
    tradition: 'Empiricism',
    emoji: '🔍',
    works: ['A Treatise of Human Nature', 'An Enquiry Concerning the Principles of Morals'],
    coreIdeas: 'Is-ought problem; moral sentiment over reason; skepticism of causation; sympathy as basis of morality.',
    impact: 'Showed that morality cannot be derived from facts alone. Woke Kant from his "dogmatic slumber." Foundation of empirical ethics.',
    searchQuery: 'David Hume is-ought problem moral sentiment Treatise Human Nature'
  },

  {
    id: 'rousseau',
    name: 'Jean-Jacques Rousseau',
    years: '1712-1778',
    era: 'Enlightenment',
    region: 'western',
    tradition: 'Social Contract',
    emoji: '🌳',
    works: ['The Social Contract', 'Emile', 'Discourse on Inequality'],
    coreIdeas: 'General will; humans are naturally good but corrupted by society; freedom through civic participation; education as moral development.',
    impact: 'Inspired the French Revolution. His educational philosophy reshaped childhood and pedagogy. Influenced Romanticism.',
    searchQuery: 'Rousseau Social Contract general will natural goodness Emile'
  },

  {
    id: 'adam-smith',
    name: 'Adam Smith',
    years: '1723-1790',
    era: 'Enlightenment',
    region: 'western',
    tradition: 'Moral Sentimentalism',
    emoji: '🤝',
    works: ['The Theory of Moral Sentiments', 'The Wealth of Nations'],
    coreIdeas: 'Moral sentiment and sympathy; the impartial spectator; self-interest channeled by moral constraints; justice as foundation of society.',
    impact: 'The Theory of Moral Sentiments is a foundational ethics text, not just economics. Showed that markets require moral foundations.',
    searchQuery: 'Adam Smith Theory Moral Sentiments impartial spectator sympathy'
  },

  {
    id: 'kant',
    name: 'Immanuel Kant',
    years: '1724-1804',
    era: 'Enlightenment',
    region: 'western',
    tradition: 'Deontology',
    emoji: '📐',
    works: ['Groundwork of the Metaphysics of Morals', 'Critique of Practical Reason', 'Metaphysics of Morals'],
    coreIdeas: 'Categorical imperative; duty-based ethics (deontology); treat humanity never merely as means; moral law from reason alone; autonomy.',
    impact: 'Defined deontological ethics. The categorical imperative remains the primary alternative to consequentialism. Shaped human rights and international law.',
    searchQuery: 'Immanuel Kant categorical imperative deontology Groundwork Metaphysics Morals'
  },

  {
    id: 'bentham',
    name: 'Jeremy Bentham',
    years: '1748-1832',
    era: 'Modern',
    region: 'western',
    tradition: 'Utilitarianism',
    emoji: '⚖️',
    works: ['An Introduction to the Principles of Morals and Legislation', 'The Panopticon'],
    coreIdeas: 'Utilitarianism; greatest happiness for greatest number; hedonic calculus; animal rights ("Can they suffer?"); prison reform.',
    impact: 'Founded utilitarianism. First major philosopher to argue for animal rights and decriminalization of homosexuality. Shaped modern policy analysis.',
    searchQuery: 'Jeremy Bentham utilitarianism greatest happiness principle hedonic calculus'
  },

  {
    id: 'wollstonecraft',
    name: 'Mary Wollstonecraft',
    years: '1759-1797',
    era: 'Modern',
    region: 'western',
    tradition: 'Feminist Ethics',
    emoji: '🔥',
    works: ['A Vindication of the Rights of Woman', 'A Vindication of the Rights of Men'],
    coreIdeas: 'Women are rational beings deserving equal education; virtue has no sex; critique of aristocratic privilege; independence through reason.',
    impact: 'Founded feminist ethics 70 years before Mill. Argued women\'s subordination was not natural but produced by lack of education.',
    searchQuery: 'Mary Wollstonecraft Vindication Rights Woman feminist ethics education'
  },

  // ── Context: French Revolution ──────────────────────────────────────────────
  {
    id: 'context-french-revolution',
    isContext: true,
    years: '~1789',
    label: 'French Revolution; Enlightenment ethics tested in political upheaval'
  },

  // ── Western — Modern ────────────────────────────────────────────────────────
  {
    id: 'hegel',
    name: 'Georg Wilhelm Friedrich Hegel',
    years: '1770-1831',
    era: 'Modern',
    region: 'western',
    tradition: 'German Idealism',
    emoji: '🔄',
    works: ['Phenomenology of Spirit', 'Philosophy of Right'],
    coreIdeas: 'Dialectics (thesis-antithesis-synthesis); ethical life (Sittlichkeit); history as progress of freedom; recognition.',
    impact: 'His dialectic shaped Marx, existentialism, and critical theory. Ethical life concept bridges individual morality and social institutions.',
    searchQuery: 'Hegel dialectics Sittlichkeit Phenomenology Spirit ethical life'
  },

  {
    id: 'schopenhauer',
    name: 'Arthur Schopenhauer',
    years: '1788-1860',
    era: 'Modern',
    region: 'western',
    tradition: 'Pessimism / Voluntarism',
    emoji: '🌑',
    works: ['The World as Will and Representation', 'On the Basis of Morality'],
    coreIdeas: 'Will as blind striving; compassion (Mitleid) as basis of morality; denial of the will; suffering as universal condition; Eastern-Western synthesis.',
    impact: 'First major Western philosopher to engage seriously with Hindu and Buddhist thought. His compassion-based ethics directly influenced Nietzsche, Wittgenstein, and Tolstoy.',
    searchQuery: 'Schopenhauer World Will Representation compassion Mitleid pessimism'
  },

  {
    id: 'mill',
    name: 'John Stuart Mill',
    years: '1806-1873',
    era: 'Modern',
    region: 'western',
    tradition: 'Utilitarianism',
    emoji: '🗽',
    works: ['Utilitarianism', 'On Liberty', 'The Subjection of Women'],
    coreIdeas: 'Refined utilitarianism (higher/lower pleasures); harm principle; liberty of thought and expression; women\'s equality.',
    impact: 'On Liberty is the foundational text for free speech. Championed women\'s suffrage in Parliament. Made utilitarianism workable.',
    searchQuery: 'John Stuart Mill Utilitarianism On Liberty harm principle'
  },

  {
    id: 'kierkegaard',
    name: 'Soren Kierkegaard',
    years: '1813-1855',
    era: 'Modern',
    region: 'western',
    tradition: 'Existentialism',
    emoji: '🕳️',
    works: ['Either/Or', 'Fear and Trembling', 'The Sickness Unto Death'],
    coreIdeas: 'Three stages of existence (aesthetic, ethical, religious); leap of faith; anxiety and despair as ethical signals; subjective truth.',
    impact: 'Father of existentialism. Showed that ethics requires personal commitment, not just rational principles.',
    searchQuery: 'Kierkegaard Either Or Fear Trembling existentialism leap of faith'
  },

  {
    id: 'nietzsche',
    name: 'Friedrich Nietzsche',
    years: '1844-1900',
    era: 'Modern',
    region: 'western',
    tradition: 'Existentialism / Nihilism',
    emoji: '⚡',
    works: ['Beyond Good and Evil', 'On the Genealogy of Morals', 'Thus Spoke Zarathustra', 'The Gay Science'],
    coreIdeas: 'Master-slave morality; will to power; eternal recurrence; death of God; creation of values; amor fati.',
    impact: 'Dismantled inherited moral frameworks. Forced philosophy to confront nihilism. Influenced existentialism, postmodernism, and psychology.',
    searchQuery: 'Nietzsche Beyond Good Evil will to power eternal recurrence Zarathustra'
  },

  {
    id: 'gandhi',
    name: 'Mahatma Gandhi',
    years: '1869-1948',
    era: 'Modern',
    region: 'eastern-indian',
    tradition: 'Nonviolent Resistance',
    emoji: '🕊️',
    works: ['The Story of My Experiments with Truth', 'Hind Swaraj'],
    coreIdeas: 'Satyagraha (truth-force); ahimsa as active resistance; swaraj (self-rule); sarvodaya (welfare of all); means and ends must align.',
    impact: 'Pioneered nonviolent resistance. Directly influenced MLK Jr., Mandela, and every nonviolent movement since. Changed how power is challenged.',
    searchQuery: 'Gandhi satyagraha ahimsa nonviolent resistance Hind Swaraj'
  },

  {
    id: 'nishida',
    name: 'Nishida Kitaro',
    years: '1870-1945',
    era: 'Modern',
    region: 'eastern-japanese',
    tradition: 'Kyoto School',
    emoji: '🪞',
    works: ['An Inquiry into the Good', 'Logic of Place'],
    coreIdeas: 'Pure experience; nothingness as ground of being; East-West philosophical synthesis; self-awareness through self-negation.',
    impact: 'Founded the Kyoto School. First modern philosopher to synthesize Zen Buddhism with Western philosophy.',
    searchQuery: 'Nishida Kitaro pure experience Kyoto School Zen Western synthesis'
  },

  {
    id: 'watsuji',
    name: 'Watsuji Tetsuro',
    years: '1889-1960',
    era: 'Modern',
    region: 'eastern-japanese',
    tradition: 'Japanese Ethics',
    emoji: '🤲',
    works: ['Rinrigaku: Ethics in Japan', 'Climate and Culture'],
    coreIdeas: 'Ethics as relational (aidagara -- "betweenness"); self exists only in relation to others; climate shapes moral character.',
    impact: 'Challenged Western individualism with a relational ethics rooted in Japanese experience. Influenced communitarian philosophy.',
    searchQuery: 'Watsuji Tetsuro Rinrigaku betweenness relational ethics Japanese'
  },

  {
    id: 'ambedkar',
    name: 'B.R. Ambedkar',
    years: '1891-1956',
    era: 'Modern',
    region: 'eastern-indian',
    tradition: 'Constitutional Ethics / Buddhism',
    emoji: '🏛️',
    works: ['Annihilation of Caste', 'The Buddha and His Dhamma'],
    coreIdeas: 'Caste as moral catastrophe; equality through constitutional law; Buddhism as rational ethics of liberation; dignity as non-negotiable right.',
    impact: 'Architect of India\'s constitution. Championed Dalit rights and converted to Buddhism as a political-ethical act.',
    searchQuery: 'Ambedkar Annihilation of Caste Dalit rights Indian constitution'
  },

  // ── Context: World Wars ─────────────────────────────────────────────────────
  {
    id: 'context-world-wars',
    isContext: true,
    years: '~1914-1945',
    label: 'Two World Wars; Holocaust; ethics confronts industrialized violence and totalitarianism'
  },

  // ── Western — 20th Century & Contemporary ──────────────────────────────────
  {
    id: 'arendt',
    name: 'Hannah Arendt',
    years: '1906-1975',
    era: 'Contemporary',
    region: 'western',
    tradition: 'Political Philosophy',
    emoji: '🔬',
    works: ['The Human Condition', 'Eichmann in Jerusalem', 'The Origins of Totalitarianism'],
    coreIdeas: 'Banality of evil; public vs. private realm; natality (capacity to begin); totalitarianism as destruction of moral thinking.',
    impact: '"Banality of evil" changed how we understand moral failure. Essential reading for genocide prevention and political ethics.',
    searchQuery: 'Hannah Arendt banality of evil Eichmann totalitarianism Human Condition'
  },

  {
    id: 'levinas',
    name: 'Emmanuel Levinas',
    years: '1906-1995',
    era: 'Contemporary',
    region: 'western',
    tradition: 'Phenomenology',
    emoji: '👤',
    works: ['Totality and Infinity', 'Otherwise than Being'],
    coreIdeas: 'Ethics as first philosophy; the face of the Other; infinite responsibility; ethics precedes ontology.',
    impact: 'Recentered philosophy on responsibility to others. Influenced bioethics, human rights discourse, and postmodern theology.',
    searchQuery: 'Emmanuel Levinas Totality Infinity face of the Other ethics first philosophy'
  },

  {
    id: 'beauvoir',
    name: 'Simone de Beauvoir',
    years: '1908-1986',
    era: 'Contemporary',
    region: 'western',
    tradition: 'Existentialist Feminism',
    emoji: '✊',
    works: ['The Second Sex', 'The Ethics of Ambiguity'],
    coreIdeas: '"One is not born, but becomes, a woman"; ethics of ambiguity; freedom as situated; oppression as ethical failure.',
    impact: 'Foundational text of modern feminism. Connected existentialist freedom to gender, embodiment, and social structures.',
    searchQuery: 'Simone de Beauvoir Second Sex Ethics of Ambiguity feminist existentialism'
  },

  {
    id: 'rawls',
    name: 'John Rawls',
    years: '1921-2002',
    era: 'Contemporary',
    region: 'western',
    tradition: 'Political Liberalism',
    emoji: '🎭',
    works: ['A Theory of Justice', 'Political Liberalism', 'Justice as Fairness'],
    coreIdeas: 'Veil of ignorance; original position; justice as fairness; difference principle (inequalities must benefit the least advantaged).',
    impact: 'Most influential political philosopher of the 20th century. Reshaped how governments think about fairness, welfare, and inequality.',
    searchQuery: 'John Rawls Theory of Justice veil of ignorance difference principle'
  },

  {
    id: 'fanon',
    name: 'Frantz Fanon',
    years: '1925-1961',
    era: 'Contemporary',
    region: 'african',
    tradition: 'Postcolonial Ethics',
    emoji: '🔥',
    works: ['The Wretched of the Earth', 'Black Skin, White Masks'],
    coreIdeas: 'Decolonization as moral imperative; violence of oppression precedes violence of resistance; identity under colonialism.',
    impact: 'Shaped anti-colonial movements worldwide. His analysis of psychological oppression influenced critical race theory and postcolonial ethics.',
    searchQuery: 'Frantz Fanon Wretched Earth Black Skin White Masks decolonization'
  },

  {
    id: 'foucault',
    name: 'Michel Foucault',
    years: '1926-1984',
    era: 'Contemporary',
    region: 'western',
    tradition: 'Post-Structuralism',
    emoji: '🔓',
    works: ['Discipline and Punish', 'The History of Sexuality', 'Madness and Civilization'],
    coreIdeas: 'Power/knowledge; biopower; technologies of the self; ethics as self-formation; genealogy of morals.',
    impact: 'Revealed how institutions shape moral subjects. Essential for understanding medical ethics, surveillance, and institutional power.',
    searchQuery: 'Michel Foucault Discipline Punish power knowledge biopower ethics'
  },

  {
    id: 'habermas',
    name: 'Jurgen Habermas',
    years: '1929-',
    era: 'Contemporary',
    region: 'western',
    tradition: 'Critical Theory',
    emoji: '🗣️',
    works: ['The Theory of Communicative Action', 'Between Facts and Norms'],
    coreIdeas: 'Discourse ethics; communicative rationality; public sphere; democratic legitimacy through dialogue.',
    impact: 'Provided the philosophical foundation for deliberative democracy and informed consent in research ethics.',
    searchQuery: 'Habermas communicative action discourse ethics public sphere deliberative democracy'
  },

  {
    id: 'gilligan',
    name: 'Carol Gilligan',
    years: '1936-',
    era: 'Contemporary',
    region: 'western',
    tradition: 'Ethics of Care',
    emoji: '💛',
    works: ['In a Different Voice'],
    coreIdeas: 'Ethics of care; moral development differs by gender; relationships and responsibility over abstract rules; critique of Kohlberg\'s justice-only model.',
    impact: 'Created the ethics of care as a field. Showed that justice frameworks missed how many people actually reason morally. Influenced nursing ethics, education, and feminist philosophy.',
    searchQuery: 'Carol Gilligan In a Different Voice ethics of care moral development'
  },

  {
    id: 'gyekye',
    name: 'Kwame Gyekye',
    years: '1939-2019',
    era: 'Contemporary',
    region: 'african',
    tradition: 'African Philosophy',
    emoji: '🌍',
    works: ['An Essay on African Philosophical Thought', 'Tradition and Modernity'],
    coreIdeas: 'Moderate communitarianism; individual rights within communal framework; African philosophy as systematic, not just folk wisdom.',
    impact: 'Demonstrated that African ethics is rigorous philosophy, not just cultural practice. Bridged communitarian and rights-based approaches.',
    searchQuery: 'Kwame Gyekye African philosophical thought communitarianism modernity'
  },

  {
    id: 'singer',
    name: 'Peter Singer',
    years: '1946-',
    era: 'Contemporary',
    region: 'western',
    tradition: 'Utilitarianism',
    emoji: '🐾',
    works: ['Animal Liberation', 'Practical Ethics', 'The Life You Can Save'],
    coreIdeas: 'Effective altruism; animal rights based on sentience; expanding moral circle; obligation to prevent suffering when cost is low.',
    impact: 'Launched the animal rights movement and effective altruism. Changed global conversation on factory farming and charitable giving.',
    searchQuery: 'Peter Singer Animal Liberation effective altruism expanding moral circle'
  },

  {
    id: 'nussbaum',
    name: 'Martha Nussbaum',
    years: '1947-',
    era: 'Contemporary',
    region: 'western',
    tradition: 'Capabilities Approach',
    emoji: '🌺',
    works: ['The Fragility of Goodness', 'Creating Capabilities', 'Frontiers of Justice'],
    coreIdeas: 'Capabilities approach; emotions as moral judgments; justice for the disabled, animals, and across nations.',
    impact: 'Capabilities approach adopted by the UN Human Development Index. Bridges Aristotelian virtue ethics with modern justice.',
    searchQuery: 'Martha Nussbaum capabilities approach Fragility Goodness Frontiers Justice'
  },

  // ── Context: Universal Declaration ──────────────────────────────────────────
  {
    id: 'context-udhr',
    isContext: true,
    years: '~1948',
    label: 'Universal Declaration of Human Rights; ethics formalized at global institutional level'
  },

  // ── African — Ubuntu ────────────────────────────────────────────────────────
  {
    id: 'ubuntu',
    name: 'Ubuntu Tradition',
    years: 'Ancient-20th century',
    era: 'Contemporary',
    region: 'african',
    tradition: 'Ubuntu',
    emoji: '🤝',
    works: ['Oral tradition; academic works by Mogobe Ramose, Desmond Tutu'],
    coreIdeas: '"I am because we are"; personhood through community; restorative over retributive justice; interconnectedness.',
    impact: 'Foundation of South Africa\'s Truth and Reconciliation Commission. Influenced communitarian ethics globally.',
    searchQuery: 'Ubuntu philosophy "I am because we are" restorative justice Tutu'
  }
];
