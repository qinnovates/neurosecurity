// Cybersecurity pioneers, events, and concepts — person, event, and concept cards

export const CYBERSECURITY = [
  {
    id: 'claude-shannon',
    name: 'Claude Shannon',
    years: '1916 – 2001',
    era: 'Modern',
    field: 'Information Theory',
    emoji: '\u{1F4E1}',
    fields: ['Information Theory', 'Cryptography', 'Electrical Engineering', 'Mathematics'],
    tagline: 'He invented the bit and made the digital world possible.',
    bio: 'Claude Shannon was an American mathematician and electrical engineer who single-handedly created information theory with his 1948 paper "A Mathematical Theory of Communication." He defined the bit as the fundamental unit of information, proved that any message can be transmitted perfectly over a noisy channel if encoded properly, and showed that information is quantifiable. Before Shannon, communication was an engineering art. After Shannon, it was a mathematical science. He also built chess-playing machines, juggling robots, and a mechanical mouse that could learn to navigate a maze. He did all of this while being remarkably private and playful.',
    frameworks: [
      'Information entropy — a measure of uncertainty in a message, the foundation of all data compression',
      'Channel capacity theorem — every channel has a maximum rate at which information can be transmitted error-free',
      'The bit — the fundamental, indivisible unit of information: a single binary choice',
      'Separation of source coding and channel coding — compress and protect data independently'
    ],
    habits: [
      'Built physical devices and toys to explore mathematical concepts hands-on',
      'Rode a unicycle through the halls of Bell Labs while juggling',
      'Maintained diverse interests: chess machines, juggling, stock market investing, maze-solving robots',
      'Published infrequently but with enormous impact per paper',
      'Avoided publicity and academic politics, preferring solitary tinkering'
    ],
    struggles: 'Shannon struggled with the gap between his playful personality and the gravity of his work. He was uncomfortable with fame and avoided the spotlight even as information theory transformed the world. Later in life, he developed Alzheimer\'s disease, and the man who defined information lost the ability to process it. His 1948 paper was so ahead of its time that it took the field years to catch up. He watched as others applied his theory in ways he never intended, sometimes correctly and sometimes not, and largely stayed quiet about it.',
    moment: 'In 1948, Shannon published "A Mathematical Theory of Communication" in the Bell System Technical Journal. In 55 pages, he founded an entire field. He proved that information can be measured, that any communication channel has a maximum capacity, and that clever encoding can make transmission error-free up to that limit. He introduced the concept of entropy to measure information content, showed how to compress data to its theoretical minimum, and proved that error-correcting codes can defeat noise. Every text message, every streaming video, every file you download works because of this one paper. It\'s arguably the most important engineering paper of the 20th century.',
    quotes: [
      { text: 'Information is the resolution of uncertainty.', src: 'Claude Shannon, A Mathematical Theory of Communication, 1948' },
      { text: 'The fundamental problem of communication is that of reproducing at one point either exactly or approximately a message selected at another point.', src: 'Claude Shannon, A Mathematical Theory of Communication, 1948' },
      { text: 'I just wondered how things were put together.', src: 'Claude Shannon, on his childhood curiosity' },
      { text: 'My greatest concern was what to call it. I thought of calling it information, but the word was overly used, so I decided to call it uncertainty. When I discussed it with John von Neumann, he had a better idea. Von Neumann told me, you should call it entropy.', src: 'Claude Shannon, on naming information entropy' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Claude Shannon')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Claude Shannon information theory')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Claude Shannon')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Claude Shannon documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Claude Shannon')}`
    },
    books: [
      { title: 'A Mathematical Theory of Communication', author: 'Claude Shannon', desc: 'The 1948 paper that created information theory. Dense but surprisingly readable. Every concept in modern digital communication traces back to this document.' },
      { title: 'A Mind at Play', author: 'Jimmy Soni and Rob Goodman', desc: 'The first comprehensive biography of Shannon. Covers his mathematical genius, his playful inventions, and his quiet revolution in how we understand information.' }
    ],
    takeaways: [
      { title: 'Quantify before you optimize', desc: 'Shannon showed that information can be measured precisely. You can\'t improve what you can\'t measure. Before trying to solve a problem, figure out how to quantify it.' },
      { title: 'Play is productive', desc: 'Shannon built juggling robots and chess machines. His playful approach to engineering wasn\'t a distraction from serious work. It was the engine of it.' },
      { title: 'One great paper can be enough', desc: 'Shannon didn\'t publish constantly. He published when he had something fundamental to say. Depth beats volume.' }
    ]
  },

  {
    id: 'diffie-hellman',
    name: 'Whitfield Diffie & Martin Hellman',
    years: '1944 – present / 1945 – present',
    era: 'Modern',
    field: 'Cryptography',
    emoji: '\u{1F511}',
    fields: ['Cryptography', 'Computer Science', 'Information Security', 'Mathematics'],
    tagline: 'They solved the oldest problem in cryptography: how to share a secret with a stranger.',
    bio: 'Whitfield Diffie and Martin Hellman invented public key cryptography, the most important breakthrough in the history of cryptography. Before their 1976 paper "New Directions in Cryptography," two parties had to physically exchange a secret key before they could communicate securely. Diffie and Hellman showed that two strangers could establish a shared secret over a completely public channel. This is what makes secure internet communication possible. Every time you see a padlock in your browser, their invention is working. Diffie was a self-taught cryptography obsessive; Hellman was a Stanford professor who bet his tenure on an idea most colleagues thought was impossible.',
    frameworks: [
      'Public key cryptography — use mathematically related key pairs so secrets can be shared without prior contact',
      'Diffie-Hellman key exchange — two parties compute a shared secret using public information and one-way functions',
      'Computational hardness as security — security based on the difficulty of mathematical problems, not on keeping algorithms secret',
      'Separation of authentication and encryption — distinct problems requiring distinct solutions'
    ],
    habits: [
      'Diffie spent years as an independent researcher, driving cross-country to meet cryptographers',
      'Hellman staked his academic career on an unconventional research direction against all advice',
      'Both maintained a long-term collaboration despite very different working styles',
      'Published openly about cryptography when the NSA preferred everything stay classified',
      'Engaged publicly with policy debates about cryptographic freedom and civil liberties'
    ],
    struggles: 'Diffie and Hellman worked on public key cryptography when the NSA considered all cryptographic research a threat to national security. The NSA sent letters to the IEEE threatening that publishing their paper could violate the Arms Export Control Act. Colleagues told Hellman he was throwing away his tenure. The academic cryptography community barely existed. And after they published, the British intelligence agency GCHQ revealed that Clifford Cocks and James Ellis had independently discovered public key cryptography years earlier but kept it classified. Despite all of this, Diffie and Hellman pushed for open cryptographic research and won.',
    moment: 'In 1976, Diffie and Hellman published "New Directions in Cryptography" in the IEEE Transactions on Information Theory. The paper opened with a bold declaration: "We stand today on the brink of a revolution in cryptography." They proposed a system where anyone could publish a public key, and only the holder of the corresponding private key could decrypt messages sent with it. They also described a key exchange protocol allowing two parties to agree on a shared secret over a public channel. No one believed this was possible. The mathematics was based on the difficulty of computing discrete logarithms. Their paper didn\'t just introduce a technique. It created the entire field of public key cryptography, without which e-commerce, secure email, and the modern internet would not exist.',
    quotes: [
      { text: 'We stand today on the brink of a revolution in cryptography.', src: 'Diffie and Hellman, New Directions in Cryptography, 1976' },
      { text: 'Cryptography is the one indispensable security technique. If the government had succeeded in blocking people from having strong cryptographic systems, it would have meant you could not have had security on the Internet.', src: 'Whitfield Diffie' },
      { text: 'Lots of people working in cryptography have no deep concern with real application issues. They are trying to discover things clever enough to write papers about.', src: 'Whitfield Diffie, on the gap between theory and practice' },
      { text: 'You\'re wasting your time working on cryptography because the NSA has such a huge budget and a several-decades head start. How are you going to come up with something they don\'t already know?', src: 'Skeptics to Hellman, as recalled by Martin Hellman' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Diffie-Hellman key exchange')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('public key cryptography')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Diffie Hellman new directions cryptography')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Diffie Hellman cryptography documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Diffie Hellman cryptography')}`
    },
    books: [
      { title: 'New Directions in Cryptography', author: 'Whitfield Diffie and Martin Hellman', desc: 'The 1976 paper that launched public key cryptography. Only 11 pages, but it changed the architecture of digital security forever.' },
      { title: 'The Code Book', author: 'Simon Singh', desc: 'A history of cryptography from ancient Egypt to quantum computing. Covers Diffie-Hellman\'s breakthrough in the context of the millennia-long quest to secure communication.' }
    ],
    takeaways: [
      { title: 'Challenge impossible assumptions', desc: 'Everyone believed two strangers could never establish a shared secret without meeting first. Diffie and Hellman proved them wrong. Question the assumptions everyone takes for granted.' },
      { title: 'Open research beats closed research', desc: 'The NSA wanted cryptography kept secret. Diffie and Hellman published openly. Open science produced better cryptography than classified programs.' },
      { title: 'Pair the dreamer with the builder', desc: 'Diffie was the visionary outsider. Hellman was the rigorous academic. Together they built something neither could have built alone. Find your complementary partner.' }
    ]
  },

  {
    id: 'bruce-schneier',
    name: 'Bruce Schneier',
    years: '1963 – present',
    era: 'Modern',
    field: 'Cybersecurity',
    emoji: '\u{1F6E1}',
    fields: ['Cryptography', 'Computer Security', 'Security Policy', 'Privacy'],
    tagline: 'Security is a process, not a product.',
    bio: 'Bruce Schneier is an American cryptographer, security technologist, and writer who became the most influential voice in practical security thinking. His book "Applied Cryptography" made cryptographic knowledge accessible to engineers for the first time. But his real contribution is philosophical: he shifted the security field from obsessing over algorithms to thinking about systems, people, incentives, and trade-offs. He coined "security theater" to describe measures that look good but don\'t work. He writes a monthly newsletter, maintains one of the most-read security blogs in the world, and has testified before Congress on privacy and surveillance.',
    frameworks: [
      'Security is a process, not a product — security requires ongoing vigilance, not a one-time purchase',
      'Schneier\'s Law — any person can create a cipher they themselves cannot break; that doesn\'t make it secure',
      'Threat modeling — systematically identify what you\'re protecting, from whom, and what it\'s worth',
      'Security economics — security decisions are driven by incentives, costs, and trade-offs, not just technology'
    ],
    habits: [
      'Writes a monthly Crypto-Gram newsletter covering real-world security issues',
      'Maintains a daily blog analyzing security news through a systemic lens',
      'Testifies before government bodies on security and privacy policy',
      'Reviews and critiques cryptographic systems publicly, holding the field to high standards',
      'Explains complex security concepts to non-technical audiences without dumbing them down'
    ],
    struggles: 'Schneier has spent decades watching the security industry sell products that don\'t work while ignoring the systemic problems that matter. He\'s fought against surveillance overreach by governments, against security theater that wastes resources, and against the tech industry\'s habit of shipping first and patching later. After 9/11, he became one of the loudest critics of the TSA and mass surveillance programs, arguing that they sacrifice liberty without improving security. Being right about security failures doesn\'t make you popular with the people causing them.',
    moment: 'In 1994, Schneier published "Applied Cryptography," a 900-page reference that put practical cryptographic knowledge in the hands of every software engineer. Before this book, cryptography was locked inside the NSA and a handful of academic labs. After it, any competent programmer could implement real encryption. The book sold hundreds of thousands of copies and fundamentally democratized cryptographic knowledge. But Schneier later said the book\'s greatest flaw was making people think cryptography alone could solve security. His follow-up work shifted the field toward systems thinking, arguing that the weakest link is almost never the algorithm. It\'s the human, the process, or the incentive structure.',
    quotes: [
      { text: 'Security is a process, not a product.', src: 'Bruce Schneier, Secrets and Lies, 2000' },
      { text: 'Anyone, from the most clueless amateur to the best cryptographer, can create an algorithm that he himself can\'t break.', src: 'Bruce Schneier, Schneier\'s Law' },
      { text: 'If you think technology can solve your security problems, then you don\'t understand the problems and you don\'t understand the technology.', src: 'Bruce Schneier, Secrets and Lies, 2000' },
      { text: 'There are two kinds of cryptography in this world: cryptography that will stop your kid sister from reading your files, and cryptography that will stop major governments from reading your files.', src: 'Bruce Schneier, Applied Cryptography, 1994' },
      { text: 'Amateurs hack systems, professionals hack people.', src: 'Bruce Schneier' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Bruce Schneier')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Bruce Schneier cryptography')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Bruce Schneier')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Bruce Schneier documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Bruce Schneier')}`
    },
    books: [
      { title: 'Applied Cryptography', author: 'Bruce Schneier', desc: 'The book that democratized cryptographic knowledge. A comprehensive reference covering protocols, algorithms, and source code for practical cryptographic implementations.' },
      { title: 'Secrets and Lies', author: 'Bruce Schneier', desc: 'Schneier\'s corrective to his own previous work. Argues that cryptography is necessary but insufficient, and that real security requires understanding systems, people, and economics.' }
    ],
    takeaways: [
      { title: 'Think in systems, not components', desc: 'The strongest encryption in the world doesn\'t help if the human enters the password on a compromised machine. Security is a property of the whole system, not any single part.' },
      { title: 'Threat model everything', desc: 'Before deciding how to secure something, ask: what am I protecting, who am I protecting it from, and what are the consequences of failure? Without a threat model, security decisions are random.' },
      { title: 'Beware security theater', desc: 'Measures that look secure but aren\'t are worse than no security at all because they create false confidence. Test your security measures against realistic attacks, not just compliance checklists.' }
    ]
  },

  {
    id: 'dorothy-denning',
    name: 'Dorothy Denning',
    years: '1945 – present',
    era: 'Modern',
    field: 'Cybersecurity',
    emoji: '\u{1F6A8}',
    fields: ['Information Security', 'Information Warfare', 'Intrusion Detection', 'Cyber Policy'],
    tagline: 'She built the foundations of intrusion detection and information warfare theory.',
    bio: 'Dorothy Denning is an American computer scientist who pioneered two foundational areas of cybersecurity: intrusion detection systems and information warfare theory. Her 1987 paper on intrusion detection defined the field and introduced the model that all subsequent IDS research built upon. She later became one of the first scholars to systematically analyze cyber warfare, writing "Information Warfare and Security" in 1999 before most people understood the internet was a battlefield. She was inducted into the National Cyber Security Hall of Fame in 2012. She\'s also one of the rare security researchers who engages seriously with the ethical and legal dimensions of cyber operations.',
    frameworks: [
      'Intrusion detection model — statistical profiling of normal behavior to detect anomalies',
      'Lattice-based access control (LBAC) — mathematical model for information flow control',
      'Information warfare taxonomy — systematic classification of offensive and defensive information operations',
      'Cyber ethics framework — applying just war theory and proportionality to cyber operations'
    ],
    habits: [
      'Published foundational papers that defined new subfields of security research',
      'Engaged with policy and military audiences, bridging technical and strategic communities',
      'Taught courses on cyber conflict that integrated legal, ethical, and technical perspectives',
      'Maintained active research across decades, adapting to new threat landscapes',
      'Participated in government advisory boards on cybersecurity policy'
    ],
    struggles: 'Denning entered computer security when it barely existed as a field. She had to build the theoretical foundations while also convincing people that intrusion detection was worth studying. Her work on information warfare was dismissed as alarmist before major cyber attacks proved her right. She also took controversial positions on the Clipper chip and key escrow debates in the 1990s, supporting government access to encrypted communications. This put her at odds with many in the security community, but she defended her position with rigorous analysis rather than ideology.',
    moment: 'In 1987, Denning published "An Intrusion Detection Model" in the IEEE Transactions on Software Engineering. The paper described a system that monitors user behavior, builds statistical profiles of normal activity, and flags deviations as potential intrusions. This was the first rigorous, general-purpose intrusion detection model. Before Denning\'s paper, security was entirely about prevention: build walls and hope they hold. Denning introduced the idea that you also need to detect breaches in real time, because prevention will eventually fail. Every modern Security Operations Center, every SIEM tool, every anomaly detection algorithm traces its lineage back to this paper.',
    quotes: [
      { text: 'If you can achieve the same effects with a cyber weapon versus a kinetic weapon, often that option is ethically preferable, because it causes less harm.', src: 'Dorothy Denning, on the ethics of cyber warfare' },
      { text: 'Any medium that provides one-to-one communications between people can be exploited.', src: 'Dorothy Denning, Information Warfare and Security, 1999' },
      { text: 'Our interconnected economies serve as a deterrent to cyber sabotage that would damage the economy. A state would be very cautious about damaging another nation\'s economy because it would likely damage their own.', src: 'Dorothy Denning, on cyber deterrence' },
      { text: 'What we are seeing primarily is espionage, and we have never responded with military force to espionage.', src: 'Dorothy Denning, on proportionality in cyber operations' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Dorothy E. Denning')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Dorothy Denning information security')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Dorothy Denning intrusion detection')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Dorothy Denning cybersecurity')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Dorothy Denning')}`
    },
    books: [
      { title: 'Information Warfare and Security', author: 'Dorothy Denning', desc: 'The first comprehensive academic treatment of information warfare. Covers offensive and defensive operations, legal frameworks, and ethical considerations. Published in 1999, it reads like prophecy now.' },
      { title: 'Cryptography and Data Security', author: 'Dorothy Denning', desc: 'Denning\'s 1982 textbook on cryptographic methods and access control. One of the first textbooks to treat computer security as a rigorous academic discipline.' }
    ],
    takeaways: [
      { title: 'Detection is as important as prevention', desc: 'Denning\'s key insight: you can\'t prevent every breach, but you can detect them quickly. Build monitoring into your systems from day one, not as an afterthought.' },
      { title: 'Define the field before others define it for you', desc: 'Denning wrote the foundational papers for intrusion detection and information warfare before either was an established discipline. When you see a gap, fill it with rigorous work.' },
      { title: 'Engage with the ethical dimensions', desc: 'Denning didn\'t just build security tools. She thought about when and how they should be used. Technical capability without ethical reasoning is dangerous.' }
    ]
  },

  {
    id: 'morris-worm',
    name: 'The Morris Worm',
    years: '1988',
    era: 'Modern',
    field: 'Cybersecurity',
    emoji: '\u{1F41B}',
    fields: ['Network Security', 'Malware', 'Internet History', 'Computer Science Law'],
    tagline: 'The first internet worm. It was an accident that changed everything.',
    bio: 'The Morris Worm was the first worm to spread across the internet, released on November 2, 1988 by Robert Tappan Morris, a 23-year-old Cornell graduate student. It wasn\'t designed to cause damage. Morris wanted to gauge the size of the internet. But a bug in the worm\'s code caused it to re-infect machines repeatedly, consuming resources until they crashed. It infected roughly 6,000 computers, which was about 10% of the entire internet at the time. The event exposed the internet\'s fundamental vulnerability: a network designed for openness and trust had no defenses against exploitation.',
    frameworks: [
      'Self-propagating code — software that copies itself across networks without human intervention',
      'Exploit chaining — using multiple vulnerabilities in sequence to maximize spread',
      'Unintended consequences — a single bug turned an experiment into a crisis',
      'Defense in depth — the response that followed emphasized layered security rather than single-point protection'
    ],
    habits: [
      'Morris exploited known Unix vulnerabilities: sendmail debug mode, fingerd buffer overflow, weak passwords',
      'The worm used a randomization mechanism to decide whether to re-infect, but the rate was set too high',
      'It attempted to disguise itself by changing its process name',
      'It spread through rsh/rexec trust relationships between machines',
      'The worm carried no destructive payload — all damage was from resource exhaustion'
    ],
    struggles: 'The Morris Worm exposed a naive internet that assumed all users were trustworthy. There were no incident response teams, no coordinated vulnerability disclosure processes, and no legal framework for computer crimes. The aftermath was chaotic: system administrators scrambled to patch machines they barely understood. Robert Morris was the first person convicted under the Computer Fraud and Abuse Act of 1986. He received three years probation, 400 hours of community service, and a fine. He went on to co-found Y Combinator and become an MIT professor. The internet went on to get a lot more hostile.',
    moment: 'On the evening of November 2, 1988, Robert Tappan Morris released a small program from an MIT computer (to disguise that he was at Cornell). The worm exploited three vulnerabilities in Unix systems and spread through the early internet. Within hours, machines at universities, military installations, and research labs began slowing to a crawl. The worm was supposed to infect each machine only once, but a bug caused it to re-infect repeatedly. By the next morning, roughly 10% of the 60,000 machines connected to the internet were affected. The response created CERT (the Computer Emergency Response Team) at Carnegie Mellon, the first organized incident response capability. The Morris Worm was the internet\'s loss of innocence. It proved that a single person, with a single program, could bring a global network to its knees.',
    quotes: [
      { text: 'The Internet worm incident of 1988 showed us how fragile the network really was.', src: 'Eugene Spafford, Purdue University, incident analysis' },
      { text: 'A community of scholars should not have to build walls to protect themselves.', src: 'Internet community response in the aftermath of the Morris Worm' },
      { text: 'The worm exploited the trust model of the early internet, which assumed that everyone connected to the network was a responsible colleague.', src: 'CERT advisory, 1988' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent('Morris worm')}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('computer ethics Morris worm')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Morris worm 1988')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Morris worm 1988 documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Morris worm internet')}`
    },
    books: [
      { title: 'The Cuckoo\'s Egg', author: 'Clifford Stoll', desc: 'Published in 1989, this book about Stoll\'s hunt for a hacker predates the Morris Worm by a year but captures the same era: an internet built on trust being exploited for the first time.' },
      { title: 'Cybersecurity and Cyberwar', author: 'P.W. Singer and Allan Friedman', desc: 'Contextualizes the Morris Worm within the broader history of cyber conflict and its implications for internet governance and security policy.' }
    ],
    takeaways: [
      { title: 'Trust is a vulnerability', desc: 'The early internet was built on trust between academics. The Morris Worm proved that any system built on assumed trust will eventually be exploited. Design for adversaries, not just colleagues.' },
      { title: 'Test your experiments carefully', desc: 'Morris didn\'t intend to crash the internet. A single bug in his rate-limiting code turned an experiment into a disaster. Always test edge cases before deploying anything that self-replicates or auto-scales.' },
      { title: 'Incidents create institutions', desc: 'The Morris Worm led directly to the creation of CERT, the first incident response team. Crises reveal gaps that no amount of planning anticipated. Use them to build the institutions you need.' }
    ]
  },

  {
    id: 'kerckhoffs-principle',
    name: 'Kerckhoffs\' Principle',
    years: '1883',
    era: 'Modern',
    field: 'Cryptography',
    emoji: '\u{1F512}',
    fields: ['Cryptography', 'Information Security', 'Security Engineering', 'Military Science'],
    tagline: 'A system should be secure even if everything about it is public knowledge.',
    bio: 'Kerckhoffs\' Principle is one of the most important ideas in security engineering. Published by Auguste Kerckhoffs in 1883, it states that a cryptographic system should be secure even if everything about the system, except the key, is public knowledge. This was revolutionary because the prevailing approach was "security through obscurity" where the method itself was kept secret. Kerckhoffs argued this was fragile: methods leak, systems get captured, and reverse engineering is always possible. The only thing you can reliably keep secret is a small, changeable key. Every modern encryption system is designed around this principle.',
    frameworks: [
      'Security should depend on the key, not the algorithm — the system design can be public',
      'Security through obscurity is fragile — assume the enemy knows your system',
      'Key management as the central problem — if the key is secure, the system is secure',
      'Open design principle — public scrutiny strengthens systems; secrecy weakens them'
    ],
    habits: [
      'Kerckhoffs formulated six principles for military cipher design in 1883',
      'The principle was tested by centuries of military cryptography where captured systems revealed their methods',
      'Modern open-source cryptography (AES, RSA, Signal Protocol) embodies this principle',
      'Security audits and bug bounties are direct applications: invite scrutiny to find weaknesses',
      'Every time you use HTTPS, Signal, or SSH, Kerckhoffs\' Principle is at work'
    ],
    struggles: 'Kerckhoffs\' Principle has been fighting the same battle for over 140 years: convincing people that hiding your method is not the same as being secure. Governments, corporations, and individuals still fall for security through obscurity. Proprietary encryption algorithms keep getting broken because they were never subjected to public scrutiny. The DRM industry is built on violating Kerckhoffs\' Principle. Every few years, someone invents a "secret" cipher that experts break in days. The principle is simple, but accepting it requires humility: admitting that your clever scheme probably has flaws that only outside eyes will find.',
    moment: 'In 1883, Auguste Kerckhoffs published "La cryptographie militaire" in the Journal des sciences militaires. In it, he laid out six design principles for military ciphers. The second principle became the most famous: "The system must not require secrecy and can be stolen by the enemy without causing trouble." This single sentence reframed all of cryptographic engineering. It meant that the design of an encryption system should withstand full public disclosure. Only the key needs to be secret. This principle was validated dramatically in World War II when the Allies broke the Enigma machine not by discovering its existence (they had captured machines) but by exploiting weaknesses in how the Germans used the keys. The algorithm was known; the key management was flawed.',
    quotes: [
      { text: 'The system must not require secrecy and can be stolen by the enemy without causing trouble.', src: 'Auguste Kerckhoffs, La cryptographie militaire, 1883' },
      { text: 'In assessing the strength of a cryptosystem, assume the opponent knows everything about the system except the key.', src: 'Modern restatement of Kerckhoffs\' Principle' },
      { text: 'Security through obscurity is no security at all.', src: 'Common paraphrase of Kerckhoffs\' Principle' }
    ],
    deepDive: {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent("Kerckhoffs's principle")}`,
      stanford: `https://plato.stanford.edu/search/searcher.py?query=${encodeURIComponent('Kerckhoffs principle cryptography')}`,
      scholar: `https://scholar.google.com/scholar?q=${encodeURIComponent('Kerckhoffs principle')}`,
      youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent('Kerckhoffs principle cryptography documentary')}`,
      archive: `https://archive.org/search?query=${encodeURIComponent('Kerckhoffs cryptographie militaire')}`
    },
    books: [
      { title: 'La cryptographie militaire', author: 'Auguste Kerckhoffs', desc: 'The 1883 paper that established six principles for military cipher design. The second principle became the foundation of all modern cryptographic engineering.' },
      { title: 'The Code Book', author: 'Simon Singh', desc: 'A history of codes and codebreaking that illustrates Kerckhoffs\' Principle through centuries of examples where security through obscurity failed and open design succeeded.' }
    ],
    takeaways: [
      { title: 'Assume your system is known', desc: 'Design security as if the attacker has your source code, your architecture diagrams, and your documentation. Because eventually, they will. Only the key should be secret.' },
      { title: 'Invite scrutiny', desc: 'Open-source cryptography is stronger than proprietary cryptography precisely because thousands of experts have tried to break it and failed. Hiding your code doesn\'t make it secure; it makes its flaws invisible.' },
      { title: 'Separate what changes from what stays', desc: 'The algorithm can be public and permanent. The key must be secret and changeable. When you architect any security system, clearly separate the public components from the secret ones, and make the secret parts small and rotatable.' }
    ]
  }
];
