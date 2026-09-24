// src/data/knowledgeCatalogs.js
// The two curated Discover catalogs the Knowledge Vault ships with, kept
// here so the screen file stays readable.
//
//   RESEARCH_CATALOG     — research tools & databases, grouped by what they
//                          do (encyclopedias, papers, AI assistants, ...).
//                          Was the Research Vault's Discover tab.
//   RESOURCE_CATALOG     — curated everyday sites, grouped by life area.
//                          Was Resources & Instruments' Discover tab, and is
//                          still only the FALLBACK: the live list comes from
//                          Supabase (app_content, type='featured_resource';
//                          see remoteConfigService.fetchContentPool) so it
//                          can be edited any time with no app update. This
//                          array is what renders before that fetch resolves,
//                          and what's used if it fails or comes back empty.
//
// Both are intentionally kept separate rather than merged — they group the
// same kind of thing along two different, both-useful axes.

export const RESEARCH_CATEGORIES = [
  { id: 'encyclopedia', label: 'Encyclopedias & Reference', emoji: '📖', icon: 'book-outline', color: '#5c9ce0' },
  { id: 'papers', label: 'Academic Papers & Journals', emoji: '🔬', icon: 'flask-outline', color: '#4caf7d' },
  { id: 'ai', label: 'AI Research Assistants', emoji: '🤖', icon: 'hardware-chip-outline', color: '#9a6fd6' },
  { id: 'citations', label: 'Citations & Bibliography', emoji: '📑', icon: 'bookmark-outline', color: '#c9a84c' },
  { id: 'books', label: 'Books & Archives', emoji: '📚', icon: 'library-outline', color: '#d97a7a' },
  { id: 'data', label: 'Data & Statistics', emoji: '📊', icon: 'stats-chart-outline', color: '#3fb8cf' },
];

export const RESEARCH_CATALOG = [
  {
    id: 'e1', catId: 'encyclopedia', emoji: '📖',
    title: 'Wikipedia',
    url: 'https://www.wikipedia.org',
    desc: 'The free encyclopedia',
    tags: ['free', 'general', 'starting point'],
    summary: 'Where to start when you know nothing about a topic. Read the lead, then jump to the references at the bottom — those are the sources worth citing, not the article itself.',
  },
  {
    id: 'e2', catId: 'encyclopedia', emoji: '📘',
    title: 'Encyclopaedia Britannica',
    url: 'https://www.britannica.com',
    desc: 'Trusted general reference',
    tags: ['reference', 'edited', 'some paid'],
    summary: 'Edited by named experts rather than volunteers, so it is steadier than a crowd-written article and slower to cover anything new. Some entries need a subscription.',
  },
  {
    id: 'e3', catId: 'encyclopedia', emoji: '🔢',
    title: 'Wolfram Alpha',
    url: 'https://www.wolframalpha.com',
    desc: 'Computational knowledge engine',
    tags: ['free', 'maths', 'calculations'],
    summary: 'Answers questions with a computation rather than a page — unit conversions, equations, statistics, dates. Useful for checking a number you already half-know.',
  },
  {
    id: 'e4', catId: 'encyclopedia', emoji: '🏛️',
    title: 'Stanford Encyclopedia of Philosophy',
    url: 'https://plato.stanford.edu',
    desc: 'Rigorous, peer-reviewed philosophy reference',
    tags: ['free', 'philosophy', 'peer reviewed'],
    summary: 'Long, properly peer-reviewed essays on philosophical ideas, written by people who work on them. Far deeper than an encyclopaedia entry and genuinely citable.',
  },

  {
    id: 'p1', catId: 'papers', emoji: '🔎',
    title: 'Google Scholar',
    url: 'https://scholar.google.com',
    desc: 'Search academic papers & citations',
    tags: ['free', 'search', 'citations'],
    summary: 'Searches across almost every journal at once and shows how often a paper has been cited. Start here to find out what exists, then chase the full text elsewhere.',
  },
  {
    id: 'p2', catId: 'papers', emoji: '🧬',
    title: 'PubMed',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
    desc: 'Medical & life sciences research',
    tags: ['free', 'medicine', 'government'],
    summary: 'The US National Library of Medicine\'s index of medical and life-sciences research. Abstracts are free; the full paper often is not.',
  },
  {
    id: 'p3', catId: 'papers', emoji: '📄',
    title: 'arXiv',
    url: 'https://arxiv.org',
    desc: 'Preprints in physics, math, CS & more',
    tags: ['free', 'preprints', 'sciences'],
    summary: 'Papers posted before peer review, mostly physics, maths and computer science. Fast and free, with the trade-off that nothing here has been checked yet.',
  },
  {
    id: 'p4', catId: 'papers', emoji: '🧠',
    title: 'Semantic Scholar',
    url: 'https://www.semanticscholar.org',
    desc: 'AI-powered research paper search',
    tags: ['free', 'search', 'citations'],
    summary: 'A paper search that summarises findings and maps which papers cite which. Good for working out the shape of a field quickly.',
  },
  {
    id: 'p5', catId: 'papers', emoji: '📰',
    title: 'JSTOR',
    url: 'https://www.jstor.org',
    desc: 'Academic journals, books & primary sources',
    tags: ['paid', 'archives', 'humanities'],
    summary: 'Deep back-catalogues of journals, books and primary sources, strongest in the humanities. Usually reached through a school or library login.',
  },
  {
    id: 'p6', catId: 'papers', emoji: '🔓',
    title: 'DOAJ',
    url: 'https://doaj.org',
    desc: 'Directory of Open Access Journals',
    tags: ['free', 'open access', 'journals'],
    summary: 'An index of journals whose full text is free to read. Use it when you keep hitting paywalls and need something you can actually open.',
  },

  {
    id: 'a1', catId: 'ai', emoji: '🤖',
    title: 'Claude',
    url: 'https://claude.ai',
    desc: 'AI assistant for research & writing',
    tags: ['ai', 'writing', 'free tier'],
    summary: 'An assistant for thinking a problem through, drafting, and summarising long documents. Check anything factual against a real source — it can be confidently wrong.',
  },
  {
    id: 'a2', catId: 'ai', emoji: '💬',
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    desc: 'AI assistant for research & writing',
    tags: ['ai', 'writing', 'free tier'],
    summary: 'An assistant for drafting, explaining and rewriting. Same rule as any AI tool: treat what it says as a first draft, not a citation.',
  },
  {
    id: 'a3', catId: 'ai', emoji: '🔍',
    title: 'Perplexity',
    url: 'https://www.perplexity.ai',
    desc: 'AI answer engine with cited sources',
    tags: ['ai', 'search', 'citations'],
    summary: 'Answers a question in prose and links the pages it drew from, so you can check the claim rather than take its word for it.',
  },
  {
    id: 'a4', catId: 'ai', emoji: '🧪',
    title: 'Elicit',
    url: 'https://elicit.com',
    desc: 'AI research assistant for literature review',
    tags: ['ai', 'papers', 'literature review'],
    summary: 'Built for literature reviews: it finds papers on a question and pulls out their methods and findings into a table you can scan.',
  },
  {
    id: 'a5', catId: 'ai', emoji: '✅',
    title: 'Consensus',
    url: 'https://consensus.app',
    desc: 'AI search engine for scientific papers',
    tags: ['ai', 'papers', 'evidence'],
    summary: 'Searches scientific papers and reports what the weight of them actually says on a question, rather than handing back one result.',
  },

  {
    id: 'c1', catId: 'citations', emoji: '📎',
    title: 'Zotero',
    url: 'https://www.zotero.org',
    desc: 'Free citation & reference manager',
    tags: ['free', 'citations', 'open source'],
    summary: 'Saves a source with one click from your browser and turns your collection into a bibliography in any style. Free and open source, which is why researchers keep recommending it.',
  },
  {
    id: 'c2', catId: 'citations', emoji: '🗂️',
    title: 'Mendeley',
    url: 'https://www.mendeley.com',
    desc: 'Reference manager & academic network',
    tags: ['free tier', 'citations', 'pdf'],
    summary: 'A reference manager with a PDF reader and annotation built in. Useful if you read on screen and want notes attached to the paper.',
  },
  {
    id: 'c3', catId: 'citations', emoji: '🖊️',
    title: 'Citation Machine',
    url: 'https://www.citationmachine.net',
    desc: 'Generate citations in any style',
    tags: ['free', 'citations', 'quick'],
    summary: 'Paste a URL or a title and it formats the citation. Quick, and worth checking against the style guide before you hand anything in.',
  },
  {
    id: 'c4', catId: 'citations', emoji: '✍️',
    title: 'Purdue OWL',
    url: 'https://owl.purdue.edu',
    desc: 'Writing & citation style guides',
    tags: ['free', 'writing', 'style guides'],
    summary: 'Purdue University\'s writing lab: the reference most teachers point at for MLA, APA and Chicago, plus plain guidance on structure and grammar.',
  },

  {
    id: 'b1', catId: 'books', emoji: '📕',
    title: 'Google Books',
    url: 'https://books.google.com',
    desc: 'Search & preview millions of books',
    tags: ['free', 'books', 'search'],
    summary: 'Searches inside the text of millions of books, so you can find the page a phrase is on even when you cannot read the whole thing.',
  },
  {
    id: 'b2', catId: 'books', emoji: '🗄️',
    title: 'Archive.org',
    url: 'https://archive.org',
    desc: 'Free books, media & web history',
    tags: ['free', 'archive', 'media'],
    summary: 'A non-profit library of books, film, audio and old versions of web pages. The Wayback Machine here is how you cite a page that has since changed.',
  },
  {
    id: 'b3', catId: 'books', emoji: '📗',
    title: 'Project Gutenberg',
    url: 'https://www.gutenberg.org',
    desc: '70,000+ free public-domain ebooks',
    tags: ['free', 'books', 'public domain'],
    summary: 'Books whose copyright has expired, free in every format. The place to get a classic without paying for it.',
  },
  {
    id: 'b4', catId: 'books', emoji: '📔',
    title: 'Open Library',
    url: 'https://openlibrary.org',
    desc: 'One web page for every book ever published',
    tags: ['free', 'books', 'catalogue'],
    summary: 'A catalogue aiming at one page per book ever published, with borrowing for many of them. Good for checking an edition or an ISBN.',
  },

  {
    id: 'd1', catId: 'data', emoji: '🌍',
    title: 'Our World in Data',
    url: 'https://ourworldindata.org',
    desc: 'Research & data on world problems',
    tags: ['free', 'data', 'charts'],
    summary: 'Charts and explanations on the big long-run questions — health, poverty, energy, population — with the underlying data downloadable and the sources named.',
  },
  {
    id: 'd2', catId: 'data', emoji: '📊',
    title: 'Statista',
    url: 'https://www.statista.com',
    desc: 'Statistics & market data',
    tags: ['paid', 'data', 'market'],
    summary: 'Market and consumer statistics packaged as ready-made charts. The headline number is usually visible; the detail is behind a subscription.',
  },
  {
    id: 'd3', catId: 'data', emoji: '🏦',
    title: 'World Bank Open Data',
    url: 'https://data.worldbank.org',
    desc: 'Global development data',
    tags: ['free', 'data', 'global'],
    summary: 'Free development indicators for every country, going back decades. The standard source when you need a national figure you can cite.',
  },
  {
    id: 'd4', catId: 'data', emoji: '🏛️',
    title: 'U.S. Census Bureau',
    url: 'https://www.census.gov',
    desc: 'Official U.S. demographic data',
    tags: ['free', 'data', 'government'],
    summary: 'Official United States population, housing and economic data. Slow to navigate, authoritative once you find the table you want.',
  },
];

// Who each Discover resource is for, by the id the fallback entries use —
// which is also meta.legacy_id on the app_content rows. Nothing here filtered
// by age before, so a ten-year-old was shown Bumble BFF, Meetup and
// BetterHelp.
//
//   18+   the service's own terms require an adult, or it's adult by nature
//         (therapy for adults, credit monitoring, calorie tracking)
//   13+   an account, public posting, strangers, or a job board
//
// A row's meta.age_bands in Supabase wins over this map, so a dashboard edit
// can change any of them without an app update; this is the floor for the
// bundled fallback and for any row not tagged yet. Bands match
// profileResolver.AGE_BANDS.
const ADULT = ['young_adult', 'adult', 'professional'];
const TEEN_UP = ['teen', 'young_adult', 'adult', 'professional'];
export const DISCOVER_AGE_BANDS = {
  g11: ADULT,   // Claude
  p1:  ADULT,   // MyFitnessPal
  m3:  ADULT,   // BetterHelp (its under-18 service is a separate site)
  s1:  ADULT,   // Meetup
  s2:  ADULT,   // Nextdoor
  s4:  ADULT,   // Bumble BFF
  s5:  ADULT,   // InterNations
  f4:  ADULT,   // Credit Karma
  g13: TEEN_UP, // YouTube
  p2:  TEEN_UP, // Strava
  m6:  TEEN_UP, // 7 Cups
  s3:  TEEN_UP, // Eventbrite
  c2:  TEEN_UP, // Behance
  c5:  TEEN_UP, // Pinterest
  c6:  TEEN_UP, // SoundCloud
  pr1: TEEN_UP, // LinkedIn
  pr2: TEEN_UP, // LinkedIn Learning
  pr3: TEEN_UP, // Glassdoor
  pr4: TEEN_UP, // Indeed
  pr6: TEEN_UP, // The Muse
};

// Same idea for the Research Tools list, which is bundled only. Its own map
// because the two lists reuse ids ('c2' is Mendeley there, Behance above).
export const RESEARCH_AGE_BANDS = {
  a1: ADULT,    // Claude
  a2: TEEN_UP,  // ChatGPT
  a3: TEEN_UP,  // Perplexity
  a4: TEEN_UP,  // Elicit
  a5: TEEN_UP,  // Consensus
};

export const RESOURCE_CATALOG = [
  // General & reference
  {
    id: 'g1', areaId: 'general', emoji: '🌐',
    title: 'Wikipedia',
    url: 'https://www.wikipedia.org',
    desc: 'The free encyclopedia',
    tags: ['free', 'reference', 'starting point'],
    summary: 'Where to start when you know nothing about a topic. The references at the bottom are the part worth following.',
  },
  {
    id: 'g2', areaId: 'general', emoji: '🔢',
    title: 'Wolfram Alpha',
    url: 'https://www.wolframalpha.com',
    desc: 'Computational knowledge engine',
    tags: ['free', 'maths', 'calculations'],
    summary: 'Answers with a calculation rather than an article - conversions, equations, statistics. Handy for checking a number.',
  },
  {
    id: 'g3', areaId: 'general', emoji: '📚',
    title: 'Khan Academy',
    url: 'https://www.khanacademy.org',
    desc: 'Free courses on every subject',
    tags: ['free', 'courses', 'school subjects'],
    summary: 'Free lessons and practice across maths, science and more, aimed at school level and genuinely free the whole way through.',
  },
  {
    id: 'g4', areaId: 'general', emoji: '🎓',
    title: 'Coursera',
    url: 'https://www.coursera.org',
    desc: 'University courses online',
    tags: ['courses', 'university', 'some free'],
    summary: 'University courses online. Most can be audited for nothing; the certificate is the part you pay for.',
  },
  {
    id: 'g5', areaId: 'general', emoji: '🏛️',
    title: 'edX',
    url: 'https://www.edx.org',
    desc: 'Free courses from top universities',
    tags: ['courses', 'university', 'some free'],
    summary: 'Courses from universities, free to audit. Founded by MIT and Harvard, and strong on technical subjects.',
  },
  {
    id: 'g6', areaId: 'general', emoji: '🔎',
    title: 'Google Scholar',
    url: 'https://scholar.google.com',
    desc: 'Search academic papers & citations',
    tags: ['free', 'papers', 'citations'],
    summary: 'Searches academic papers across every journal at once and shows citation counts.',
  },
  {
    id: 'g7', areaId: 'general', emoji: '🗄️',
    title: 'Archive.org',
    url: 'https://archive.org',
    desc: 'Free books, media & web history',
    tags: ['free', 'archive', 'media'],
    summary: 'A non-profit library of books, film and audio, plus old versions of web pages through the Wayback Machine.',
  },
  {
    id: 'g8', areaId: 'general', emoji: '🦉',
    title: 'Duolingo',
    url: 'https://www.duolingo.com',
    desc: 'Learn a new language for free',
    tags: ['free tier', 'languages', 'daily practice'],
    summary: 'Short daily language drills. Good at keeping a habit going, weaker at getting you to a real conversation on its own.',
  },
  {
    id: 'g9', areaId: 'general', emoji: '🎤',
    title: 'TED',
    url: 'https://www.ted.com',
    desc: 'Ideas worth spreading, in talk form',
    tags: ['free', 'talks', 'ideas'],
    summary: 'Short filmed talks on one idea each. Useful for a fast, opinionated overview of a field you know nothing about.',
  },
  {
    id: 'g10', areaId: 'general', emoji: '📝',
    title: 'Notion',
    url: 'https://www.notion.so',
    desc: 'Notes, docs & project management',
    tags: ['free tier', 'notes', 'organising'],
    summary: 'Notes, documents and simple databases in one place. Powerful, and easy to spend more time arranging than writing.',
  },
  {
    id: 'g11', areaId: 'general', emoji: '🤖',
    title: 'Claude',
    url: 'https://claude.ai',
    desc: 'AI assistant for research & writing',
    tags: ['ai', 'writing', 'free tier'],
    summary: 'An assistant for thinking something through, drafting and summarising. Check anything factual against a real source.',
  },
  {
    id: 'g12', areaId: 'general', emoji: '✍️',
    title: 'Grammarly',
    url: 'https://www.grammarly.com',
    desc: 'Writing & grammar assistant',
    tags: ['free tier', 'writing', 'proofreading'],
    summary: 'Catches grammar and clarity problems as you write. The free tier covers the basics.',
  },
  {
    id: 'g13', areaId: 'general', emoji: '🎬',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    desc: 'Video tutorials on anything',
    tags: ['free', 'video', 'how-to'],
    summary: 'A tutorial exists for almost anything. Check the upload date and who made it before you follow along.',
  },
  {
    id: 'g14', areaId: 'general', emoji: '📊',
    title: 'Google Sheets',
    url: 'https://sheets.google.com',
    desc: 'Free spreadsheets',
    tags: ['free', 'spreadsheets', 'planning'],
    summary: 'Free spreadsheets in a browser. Enough for a budget, a tracker or a plan without buying anything.',
  },

  // Physical
  {
    id: 'p1', areaId: 'physical', emoji: '🍎',
    title: 'MyFitnessPal',
    url: 'https://www.myfitnesspal.com',
    desc: 'Track meals, calories & macros',
    tags: ['free tier', 'food', 'tracking'],
    summary: 'Logs meals and adds up calories and macros. Most useful as a way of seeing what you actually eat, rather than as a target.',
  },
  {
    id: 'p2', areaId: 'physical', emoji: '🏃',
    title: 'Strava',
    url: 'https://www.strava.com',
    desc: 'Track runs, rides & workouts',
    tags: ['free tier', 'exercise', 'tracking'],
    summary: 'Records runs and rides and keeps a history you can look back on. The social side is optional.',
  },
  {
    id: 'p3', areaId: 'physical', emoji: '🩺',
    title: 'Mayo Clinic',
    url: 'https://www.mayoclinic.org',
    desc: 'Trusted medical information',
    tags: ['free', 'health', 'trusted'],
    summary: 'Plain-language, clinician-reviewed information on conditions, symptoms and treatments. One of the steadier health sites.',
  },
  {
    id: 'p4', areaId: 'physical', emoji: '😴',
    title: 'Sleep Foundation',
    url: 'https://www.sleepfoundation.org',
    desc: 'Sleep science & better rest',
    tags: ['free', 'sleep', 'evidence'],
    summary: 'What the research actually says about sleep, and practical guidance built on it. Good when advice online starts contradicting itself.',
  },
  {
    id: 'p5', areaId: 'physical', emoji: '🏋️',
    title: 'CDC: Physical Activity',
    url: 'https://www.cdc.gov/physical-activity-basics/guidelines/index.html',
    desc: 'Exercise guidelines & health tips',
    tags: ['free', 'exercise', 'government'],
    summary: 'The US public-health guidance on how much movement, of what kind. Useful as a baseline to measure a plan against.',
  },
  {
    id: 'p6', areaId: 'physical', emoji: '💊',
    title: 'WebMD',
    url: 'https://www.webmd.com',
    desc: 'Symptoms, conditions & health news',
    tags: ['free', 'health', 'symptoms'],
    summary: 'Health information and a symptom checker. Broad, and best read alongside a source like Mayo Clinic rather than alone.',
  },

  // Mental
  {
    id: 'm1', areaId: 'mental', emoji: '🧘',
    title: 'Headspace',
    url: 'https://www.headspace.com',
    desc: 'Guided meditation & mindfulness',
    tags: ['paid', 'meditation', 'guided'],
    summary: 'Guided meditation in short sessions, structured as courses. A free trial, then a subscription.',
  },
  {
    id: 'm2', areaId: 'mental', emoji: '🌙',
    title: 'Calm',
    url: 'https://www.calm.com',
    desc: 'Sleep, meditation & relaxation',
    tags: ['paid', 'sleep', 'relaxation'],
    summary: 'Meditation, sleep stories and breathing exercises. Free to try, subscription after that.',
  },
  {
    id: 'm3', areaId: 'mental', emoji: '💬',
    title: 'BetterHelp',
    url: 'https://www.betterhelp.com',
    desc: 'Online therapy & counseling',
    tags: ['paid', 'therapy', 'adults'],
    summary: 'Online therapy with licensed counsellors, by message or video. Paid, and for adults - check whether your insurance covers it first.',
  },
  {
    id: 'm4', areaId: 'mental', emoji: '🧠',
    title: 'Psychology Today',
    url: 'https://www.psychologytoday.com',
    desc: 'Find therapists & mental health articles',
    tags: ['free', 'therapy', 'directory'],
    summary: 'A searchable directory of therapists you can filter by location, cost and speciality, plus readable articles on mental health.',
  },
  {
    id: 'm5', areaId: 'mental', emoji: '🤝',
    title: 'NAMI',
    url: 'https://www.nami.org',
    desc: 'Mental health support & education',
    tags: ['free', 'support', 'non-profit'],
    summary: 'The US National Alliance on Mental Illness: free education, support groups and a helpline, for people struggling and for their families.',
  },
  {
    id: 'm6', areaId: 'mental', emoji: '👂',
    title: '7 Cups',
    url: 'https://www.7cups.com',
    desc: 'Free emotional support & listening',
    tags: ['free', 'support', 'listening'],
    summary: 'Free, anonymous listening from trained volunteers. Not therapy, and it does not pretend to be - a place to be heard at 2am.',
  },

  // Social
  {
    id: 's1', areaId: 'social', emoji: '👥',
    title: 'Meetup',
    url: 'https://www.meetup.com',
    desc: 'Find local groups & events',
    tags: ['free tier', 'groups', 'in person'],
    summary: 'Local groups that meet up around a shared interest - walking, language, board games. Meeting strangers in public places, with the usual sense that implies.',
  },
  {
    id: 's2', areaId: 'social', emoji: '🏘️',
    title: 'Nextdoor',
    url: 'https://nextdoor.com',
    desc: 'Connect with your local neighborhood',
    tags: ['free', 'neighbourhood', 'local'],
    summary: 'A network for your actual street and the ones around it. Useful for recommendations, lost cats and what is happening locally.',
  },
  {
    id: 's3', areaId: 'social', emoji: '🎟️',
    title: 'Eventbrite',
    url: 'https://www.eventbrite.com',
    desc: 'Discover events near you',
    tags: ['free', 'events', 'local'],
    summary: 'Lists events near you, free and paid. Good for finding something on this weekend.',
  },
  {
    id: 's4', areaId: 'social', emoji: '🐝',
    title: 'Bumble BFF',
    url: 'https://bumble.com/bff',
    desc: 'Make new friends',
    tags: ['free tier', 'friendship', 'adults'],
    summary: 'The friendship side of a dating app: matches people looking for friends rather than dates. Adults only.',
  },
  {
    id: 's5', areaId: 'social', emoji: '🌍',
    title: 'InterNations',
    url: 'https://www.internations.org',
    desc: 'Global community & expat network',
    tags: ['paid', 'expats', 'global'],
    summary: 'A community for people living abroad, with local events and practical guides. Free to browse, paid to join in fully.',
  },

  // Financial
  {
    id: 'f1', areaId: 'financial', emoji: '💳',
    title: 'NerdWallet',
    url: 'https://www.nerdwallet.com',
    desc: 'Personal finance advice & tools',
    tags: ['free', 'money', 'comparison'],
    summary: 'Explains how financial products work and compares them side by side. It earns from referrals, so read the explanations and treat the rankings carefully.',
  },
  {
    id: 'f2', areaId: 'financial', emoji: '📈',
    title: 'Investopedia',
    url: 'https://www.investopedia.com',
    desc: 'Learn investing & finance terms',
    tags: ['free', 'money', 'definitions'],
    summary: 'A dictionary and teaching site for finance. The place to look up a term you nodded along to and did not actually follow.',
  },
  {
    id: 'f3', areaId: 'financial', emoji: '🧾',
    title: 'YNAB',
    url: 'https://www.ynab.com',
    desc: 'Zero-based budgeting tool',
    tags: ['paid', 'budgeting', 'method'],
    summary: 'A budgeting tool built around giving every unit of money a job before you spend it. Opinionated, subscription-only, and it teaches its method properly.',
  },
  {
    id: 'f4', areaId: 'financial', emoji: '📉',
    title: 'Credit Karma',
    url: 'https://www.creditkarma.com',
    desc: 'Free credit score & monitoring',
    tags: ['free', 'credit', 'adults'],
    summary: 'Free credit scores and reports, US only. It earns from the offers it shows you, so the score is the useful part.',
  },
  {
    id: 'f5', areaId: 'financial', emoji: '🏦',
    title: 'Investor.gov',
    url: 'https://www.investor.gov',
    desc: 'Official U.S. investor education',
    tags: ['free', 'investing', 'government'],
    summary: 'The US Securities and Exchange Commission\'s own education site. No products to sell, which makes it a good place to check something you read elsewhere.',
  },
  {
    id: 'f6', areaId: 'financial', emoji: '💵',
    title: 'Bankrate',
    url: 'https://www.bankrate.com',
    desc: 'Compare rates & financial products',
    tags: ['free', 'rates', 'comparison'],
    summary: 'Compares rates on savings, loans and cards. Like the others here it is advertising-funded - use it to see the range, not to be told what to pick.',
  },

  // Creative
  {
    id: 'c1', areaId: 'creative', emoji: '🎨',
    title: 'Skillshare',
    url: 'https://www.skillshare.com',
    desc: 'Creative classes on everything',
    tags: ['paid', 'classes', 'creative'],
    summary: 'Short project-based creative classes. Subscription, with a free trial.',
  },
  {
    id: 'c2', areaId: 'creative', emoji: '🖼️',
    title: 'Behance',
    url: 'https://www.behance.net',
    desc: 'Showcase & discover creative work',
    tags: ['free', 'portfolio', 'design'],
    summary: 'Where designers and illustrators post finished work. Good for seeing the standard in a field and for building a portfolio of your own.',
  },
  {
    id: 'c3', areaId: 'creative', emoji: '✏️',
    title: 'Domestika',
    url: 'https://www.domestika.org',
    desc: 'Courses for creative professionals',
    tags: ['paid', 'classes', 'craft'],
    summary: 'Well-produced creative courses, bought one at a time rather than by subscription. Strong on illustration and craft.',
  },
  {
    id: 'c4', areaId: 'creative', emoji: '🎬',
    title: 'MasterClass',
    url: 'https://www.masterclass.com',
    desc: 'Learn from the best in their field',
    tags: ['paid', 'classes', 'interviews'],
    summary: 'Lessons from people at the top of a field. Closer to an extended interview than a course - inspiring rather than instructional.',
  },
  {
    id: 'c5', areaId: 'creative', emoji: '📌',
    title: 'Pinterest',
    url: 'https://www.pinterest.com',
    desc: 'Visual inspiration & mood boards',
    tags: ['free', 'inspiration', 'boards'],
    summary: 'Collect images into boards. Useful for working out what you like before you start making something.',
  },
  {
    id: 'c6', areaId: 'creative', emoji: '🎵',
    title: 'SoundCloud',
    url: 'https://soundcloud.com',
    desc: 'Share & discover music',
    tags: ['free tier', 'music', 'sharing'],
    summary: 'Post your own music and find people making things outside the charts.',
  },

  // Professional
  {
    id: 'pr1', areaId: 'professional', emoji: '💼',
    title: 'LinkedIn',
    url: 'https://www.linkedin.com',
    desc: 'Professional networking',
    tags: ['free tier', 'networking', 'jobs'],
    summary: 'The default professional network: your working history, plus jobs and people in your field.',
  },
  {
    id: 'pr2', areaId: 'professional', emoji: '📖',
    title: 'LinkedIn Learning',
    url: 'https://www.linkedin.com/learning',
    desc: 'Career & business courses',
    tags: ['paid', 'courses', 'career'],
    summary: 'Video courses on business and technical skills, tied to your professional profile. Often free through a library card.',
  },
  {
    id: 'pr3', areaId: 'professional', emoji: '🏢',
    title: 'Glassdoor',
    url: 'https://www.glassdoor.com',
    desc: 'Company reviews & salaries',
    tags: ['free', 'salaries', 'companies'],
    summary: 'Employee reviews and self-reported salaries. Anonymous and self-selecting, so read it for the pattern rather than the numbers.',
  },
  {
    id: 'pr4', areaId: 'professional', emoji: '🔍',
    title: 'Indeed',
    url: 'https://www.indeed.com',
    desc: 'Job search',
    tags: ['free', 'jobs', 'search'],
    summary: 'A large job board that also aggregates listings from elsewhere. Broad rather than curated.',
  },
  {
    id: 'pr5', areaId: 'professional', emoji: '💻',
    title: 'freeCodeCamp',
    url: 'https://www.freecodecamp.org',
    desc: 'Learn to code for free',
    tags: ['free', 'coding', 'curriculum'],
    summary: 'A full, free coding curriculum with projects and certifications. A non-profit, and free the whole way through.',
  },
  {
    id: 'pr6', areaId: 'professional', emoji: '🚀',
    title: 'The Muse',
    url: 'https://www.themuse.com',
    desc: 'Career advice & job search',
    tags: ['free', 'career', 'advice'],
    summary: 'Career advice written like a person talking to you, plus job listings. Good for the parts nobody explains - interviews, negotiating, leaving well.',
  },

  // Spiritual
  {
    id: 'sp1', areaId: 'spiritual', emoji: '📖',
    title: 'Bible Gateway',
    url: 'https://www.biblegateway.com',
    desc: 'Read scripture in any translation',
    tags: ['free', 'scripture', 'translations'],
    summary: 'Read the Bible in a great many translations side by side, with search and audio.',
  },
  {
    id: 'sp2', areaId: 'spiritual', emoji: '⏱️',
    title: 'Insight Timer',
    url: 'https://insighttimer.com',
    desc: 'Free meditation & mindfulness',
    tags: ['free tier', 'meditation', 'library'],
    summary: 'A very large free library of guided meditations and talks from many traditions, plus a plain timer.',
  },
  {
    id: 'sp3', areaId: 'spiritual', emoji: '☸️',
    title: 'Tricycle',
    url: 'https://tricycle.org',
    desc: 'Buddhist teachings & practice',
    tags: ['some paid', 'buddhism', 'teaching'],
    summary: 'A long-running Buddhist magazine: teachings, practice guidance and writing on applying it day to day.',
  },
  {
    id: 'sp4', areaId: 'spiritual', emoji: '✨',
    title: 'YouVersion Bible App',
    url: 'https://www.bible.com',
    desc: 'Bible reading plans',
    tags: ['free', 'scripture', 'plans'],
    summary: 'Bible reading plans that keep a daily habit going, with translations and audio. Free and widely used.',
  },
  {
    id: 'sp5', areaId: 'spiritual', emoji: '🪷',
    title: 'Plum Village',
    url: 'https://plumvillage.org',
    desc: 'Mindfulness practice community',
    tags: ['free', 'mindfulness', 'community'],
    summary: 'The monastic community founded by Thich Nhat Hanh: free talks, guided practice and retreats.',
  },

  // Digital
  {
    id: 'd1', areaId: 'digital', emoji: '🔓',
    title: 'Have I Been Pwned',
    url: 'https://haveibeenpwned.com',
    desc: 'Check if your data was breached',
    tags: ['free', 'security', 'check'],
    summary: 'Tells you whether your email address has turned up in a known data breach. Free, run by a security researcher, and the first thing to check before changing passwords.',
  },
  {
    id: 'd2', areaId: 'digital', emoji: '🔑',
    title: '1Password',
    url: 'https://1password.com',
    desc: 'Password manager',
    tags: ['paid', 'passwords', 'security'],
    summary: 'Generates and stores a different password for every account. Paid, and the single biggest improvement most people can make to their security.',
  },
  {
    id: 'd3', areaId: 'digital', emoji: '🛡️',
    title: 'EFF',
    url: 'https://www.eff.org',
    desc: 'Digital rights & privacy advocacy',
    tags: ['free', 'privacy', 'non-profit'],
    summary: 'The Electronic Frontier Foundation: a non-profit on digital rights, with plain guides to protecting your own privacy.',
  },
  {
    id: 'd4', areaId: 'digital', emoji: '✉️',
    title: 'Proton Mail',
    url: 'https://proton.me',
    desc: 'Private, encrypted email',
    tags: ['free tier', 'email', 'privacy'],
    summary: 'Encrypted email from a company whose business is privacy rather than advertising. Free tier, paid for more storage.',
  },
  {
    id: 'd5', areaId: 'digital', emoji: '⏳',
    title: 'Freedom',
    url: 'https://freedom.to',
    desc: 'Block distractions & apps',
    tags: ['paid', 'focus', 'blocking'],
    summary: 'Blocks sites and apps for a set period across your devices. Works because it is genuinely hard to switch off mid-session.',
  },
];
