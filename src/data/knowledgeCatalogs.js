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
  { id: 'e1', catId: 'encyclopedia', emoji: '📖', title: 'Wikipedia', url: 'https://www.wikipedia.org', desc: 'The free encyclopedia' },
  { id: 'e2', catId: 'encyclopedia', emoji: '📘', title: 'Encyclopaedia Britannica', url: 'https://www.britannica.com', desc: 'Trusted general reference' },
  { id: 'e3', catId: 'encyclopedia', emoji: '🔢', title: 'Wolfram Alpha', url: 'https://www.wolframalpha.com', desc: 'Computational knowledge engine' },
  { id: 'e4', catId: 'encyclopedia', emoji: '🏛️', title: 'Stanford Encyclopedia of Philosophy', url: 'https://plato.stanford.edu', desc: 'Rigorous, peer-reviewed philosophy reference' },

  { id: 'p1', catId: 'papers', emoji: '🔎', title: 'Google Scholar', url: 'https://scholar.google.com', desc: 'Search academic papers & citations' },
  { id: 'p2', catId: 'papers', emoji: '🧬', title: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov', desc: 'Medical & life sciences research' },
  { id: 'p3', catId: 'papers', emoji: '📄', title: 'arXiv', url: 'https://arxiv.org', desc: 'Preprints in physics, math, CS & more' },
  { id: 'p4', catId: 'papers', emoji: '🧠', title: 'Semantic Scholar', url: 'https://www.semanticscholar.org', desc: 'AI-powered research paper search' },
  { id: 'p5', catId: 'papers', emoji: '📰', title: 'JSTOR', url: 'https://www.jstor.org', desc: 'Academic journals, books & primary sources' },
  { id: 'p6', catId: 'papers', emoji: '🔓', title: 'DOAJ', url: 'https://doaj.org', desc: 'Directory of Open Access Journals' },

  { id: 'a1', catId: 'ai', emoji: '🤖', title: 'Claude', url: 'https://claude.ai', desc: 'AI assistant for research & writing' },
  { id: 'a2', catId: 'ai', emoji: '💬', title: 'ChatGPT', url: 'https://chat.openai.com', desc: 'AI assistant for research & writing' },
  { id: 'a3', catId: 'ai', emoji: '🔍', title: 'Perplexity', url: 'https://www.perplexity.ai', desc: 'AI answer engine with cited sources' },
  { id: 'a4', catId: 'ai', emoji: '🧪', title: 'Elicit', url: 'https://elicit.com', desc: 'AI research assistant for literature review' },
  { id: 'a5', catId: 'ai', emoji: '✅', title: 'Consensus', url: 'https://consensus.app', desc: 'AI search engine for scientific papers' },

  { id: 'c1', catId: 'citations', emoji: '📎', title: 'Zotero', url: 'https://www.zotero.org', desc: 'Free citation & reference manager' },
  { id: 'c2', catId: 'citations', emoji: '🗂️', title: 'Mendeley', url: 'https://www.mendeley.com', desc: 'Reference manager & academic network' },
  { id: 'c3', catId: 'citations', emoji: '🖊️', title: 'Citation Machine', url: 'https://www.citationmachine.net', desc: 'Generate citations in any style' },
  { id: 'c4', catId: 'citations', emoji: '✍️', title: 'Purdue OWL', url: 'https://owl.purdue.edu', desc: 'Writing & citation style guides' },

  { id: 'b1', catId: 'books', emoji: '📕', title: 'Google Books', url: 'https://books.google.com', desc: 'Search & preview millions of books' },
  { id: 'b2', catId: 'books', emoji: '🗄️', title: 'Archive.org', url: 'https://archive.org', desc: 'Free books, media & web history' },
  { id: 'b3', catId: 'books', emoji: '📗', title: 'Project Gutenberg', url: 'https://www.gutenberg.org', desc: '70,000+ free public-domain ebooks' },
  { id: 'b4', catId: 'books', emoji: '📔', title: 'Open Library', url: 'https://openlibrary.org', desc: 'One web page for every book ever published' },

  { id: 'd1', catId: 'data', emoji: '🌍', title: 'Our World in Data', url: 'https://ourworldindata.org', desc: 'Research & data on world problems' },
  { id: 'd2', catId: 'data', emoji: '📊', title: 'Statista', url: 'https://www.statista.com', desc: 'Statistics & market data' },
  { id: 'd3', catId: 'data', emoji: '🏦', title: 'World Bank Open Data', url: 'https://data.worldbank.org', desc: 'Global development data' },
  { id: 'd4', catId: 'data', emoji: '🏛️', title: 'U.S. Census Bureau', url: 'https://www.census.gov', desc: 'Official U.S. demographic data' },
];

export const RESOURCE_CATALOG = [
  // General & reference
  { id: 'g1', areaId: 'general', emoji: '🌐', title: 'Wikipedia', url: 'https://www.wikipedia.org', desc: 'The free encyclopedia' },
  { id: 'g2', areaId: 'general', emoji: '🔢', title: 'Wolfram Alpha', url: 'https://www.wolframalpha.com', desc: 'Computational knowledge engine' },
  { id: 'g3', areaId: 'general', emoji: '📚', title: 'Khan Academy', url: 'https://www.khanacademy.org', desc: 'Free courses on every subject' },
  { id: 'g4', areaId: 'general', emoji: '🎓', title: 'Coursera', url: 'https://www.coursera.org', desc: 'University courses online' },
  { id: 'g5', areaId: 'general', emoji: '🏛️', title: 'edX', url: 'https://www.edx.org', desc: 'Free courses from top universities' },
  { id: 'g6', areaId: 'general', emoji: '🔎', title: 'Google Scholar', url: 'https://scholar.google.com', desc: 'Search academic papers & citations' },
  { id: 'g7', areaId: 'general', emoji: '🗄️', title: 'Archive.org', url: 'https://archive.org', desc: 'Free books, media & web history' },
  { id: 'g8', areaId: 'general', emoji: '🦉', title: 'Duolingo', url: 'https://www.duolingo.com', desc: 'Learn a new language for free' },
  { id: 'g9', areaId: 'general', emoji: '🎤', title: 'TED', url: 'https://www.ted.com', desc: 'Ideas worth spreading, in talk form' },
  { id: 'g10', areaId: 'general', emoji: '📝', title: 'Notion', url: 'https://www.notion.so', desc: 'Notes, docs & project management' },
  { id: 'g11', areaId: 'general', emoji: '🤖', title: 'Claude', url: 'https://claude.ai', desc: 'AI assistant for research & writing' },
  { id: 'g12', areaId: 'general', emoji: '✍️', title: 'Grammarly', url: 'https://www.grammarly.com', desc: 'Writing & grammar assistant' },
  { id: 'g13', areaId: 'general', emoji: '🎬', title: 'YouTube', url: 'https://www.youtube.com', desc: 'Video tutorials on anything' },
  { id: 'g14', areaId: 'general', emoji: '📊', title: 'Google Sheets', url: 'https://sheets.google.com', desc: 'Free spreadsheets' },

  // Physical
  { id: 'p1', areaId: 'physical', emoji: '🍎', title: 'MyFitnessPal', url: 'https://www.myfitnesspal.com', desc: 'Track meals, calories & macros' },
  { id: 'p2', areaId: 'physical', emoji: '🏃', title: 'Strava', url: 'https://www.strava.com', desc: 'Track runs, rides & workouts' },
  { id: 'p3', areaId: 'physical', emoji: '🩺', title: 'Mayo Clinic', url: 'https://www.mayoclinic.org', desc: 'Trusted medical information' },
  { id: 'p4', areaId: 'physical', emoji: '😴', title: 'Sleep Foundation', url: 'https://www.sleepfoundation.org', desc: 'Sleep science & better rest' },
  { id: 'p5', areaId: 'physical', emoji: '🏋️', title: 'CDC: Physical Activity', url: 'https://www.cdc.gov/physical-activity/index.html', desc: 'Exercise guidelines & health tips' },
  { id: 'p6', areaId: 'physical', emoji: '💊', title: 'WebMD', url: 'https://www.webmd.com', desc: 'Symptoms, conditions & health news' },

  // Mental
  { id: 'm1', areaId: 'mental', emoji: '🧘', title: 'Headspace', url: 'https://www.headspace.com', desc: 'Guided meditation & mindfulness' },
  { id: 'm2', areaId: 'mental', emoji: '🌙', title: 'Calm', url: 'https://www.calm.com', desc: 'Sleep, meditation & relaxation' },
  { id: 'm3', areaId: 'mental', emoji: '💬', title: 'BetterHelp', url: 'https://www.betterhelp.com', desc: 'Online therapy & counseling' },
  { id: 'm4', areaId: 'mental', emoji: '🧠', title: 'Psychology Today', url: 'https://www.psychologytoday.com', desc: 'Find therapists & mental health articles' },
  { id: 'm5', areaId: 'mental', emoji: '🤝', title: 'NAMI', url: 'https://www.nami.org', desc: 'Mental health support & education' },
  { id: 'm6', areaId: 'mental', emoji: '👂', title: '7 Cups', url: 'https://www.7cups.com', desc: 'Free emotional support & listening' },

  // Social
  { id: 's1', areaId: 'social', emoji: '👥', title: 'Meetup', url: 'https://www.meetup.com', desc: 'Find local groups & events' },
  { id: 's2', areaId: 'social', emoji: '🏘️', title: 'Nextdoor', url: 'https://nextdoor.com', desc: 'Connect with your local neighborhood' },
  { id: 's3', areaId: 'social', emoji: '🎟️', title: 'Eventbrite', url: 'https://www.eventbrite.com', desc: 'Discover events near you' },
  { id: 's4', areaId: 'social', emoji: '🐝', title: 'Bumble BFF', url: 'https://bumble.com/bff', desc: 'Make new friends' },
  { id: 's5', areaId: 'social', emoji: '🌍', title: 'InterNations', url: 'https://www.internations.org', desc: 'Global community & expat network' },

  // Financial
  { id: 'f1', areaId: 'financial', emoji: '💳', title: 'NerdWallet', url: 'https://www.nerdwallet.com', desc: 'Personal finance advice & tools' },
  { id: 'f2', areaId: 'financial', emoji: '📈', title: 'Investopedia', url: 'https://www.investopedia.com', desc: 'Learn investing & finance terms' },
  { id: 'f3', areaId: 'financial', emoji: '🧾', title: 'YNAB', url: 'https://www.ynab.com', desc: 'Zero-based budgeting tool' },
  { id: 'f4', areaId: 'financial', emoji: '📉', title: 'Credit Karma', url: 'https://www.creditkarma.com', desc: 'Free credit score & monitoring' },
  { id: 'f5', areaId: 'financial', emoji: '🏦', title: 'Investor.gov', url: 'https://www.investor.gov', desc: 'Official U.S. investor education' },
  { id: 'f6', areaId: 'financial', emoji: '💵', title: 'Bankrate', url: 'https://www.bankrate.com', desc: 'Compare rates & financial products' },

  // Creative
  { id: 'c1', areaId: 'creative', emoji: '🎨', title: 'Skillshare', url: 'https://www.skillshare.com', desc: 'Creative classes on everything' },
  { id: 'c2', areaId: 'creative', emoji: '🖼️', title: 'Behance', url: 'https://www.behance.net', desc: 'Showcase & discover creative work' },
  { id: 'c3', areaId: 'creative', emoji: '✏️', title: 'Domestika', url: 'https://www.domestika.org', desc: 'Courses for creative professionals' },
  { id: 'c4', areaId: 'creative', emoji: '🎬', title: 'MasterClass', url: 'https://www.masterclass.com', desc: 'Learn from the best in their field' },
  { id: 'c5', areaId: 'creative', emoji: '📌', title: 'Pinterest', url: 'https://www.pinterest.com', desc: 'Visual inspiration & mood boards' },
  { id: 'c6', areaId: 'creative', emoji: '🎵', title: 'SoundCloud', url: 'https://soundcloud.com', desc: 'Share & discover music' },

  // Professional
  { id: 'pr1', areaId: 'professional', emoji: '💼', title: 'LinkedIn', url: 'https://www.linkedin.com', desc: 'Professional networking' },
  { id: 'pr2', areaId: 'professional', emoji: '📖', title: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning', desc: 'Career & business courses' },
  { id: 'pr3', areaId: 'professional', emoji: '🏢', title: 'Glassdoor', url: 'https://www.glassdoor.com', desc: 'Company reviews & salaries' },
  { id: 'pr4', areaId: 'professional', emoji: '🔍', title: 'Indeed', url: 'https://www.indeed.com', desc: 'Job search' },
  { id: 'pr5', areaId: 'professional', emoji: '💻', title: 'freeCodeCamp', url: 'https://www.freecodecamp.org', desc: 'Learn to code for free' },
  { id: 'pr6', areaId: 'professional', emoji: '🚀', title: 'The Muse', url: 'https://www.themuse.com', desc: 'Career advice & job search' },

  // Spiritual
  { id: 'sp1', areaId: 'spiritual', emoji: '📖', title: 'Bible Gateway', url: 'https://www.biblegateway.com', desc: 'Read scripture in any translation' },
  { id: 'sp2', areaId: 'spiritual', emoji: '⏱️', title: 'Insight Timer', url: 'https://insighttimer.com', desc: 'Free meditation & mindfulness' },
  { id: 'sp3', areaId: 'spiritual', emoji: '☸️', title: 'Tricycle', url: 'https://tricycle.org', desc: 'Buddhist teachings & practice' },
  { id: 'sp4', areaId: 'spiritual', emoji: '✨', title: 'YouVersion Bible App', url: 'https://www.bible.com', desc: 'Bible reading plans' },
  { id: 'sp5', areaId: 'spiritual', emoji: '🪷', title: 'Plum Village', url: 'https://plumvillage.org', desc: 'Mindfulness practice community' },

  // Digital
  { id: 'd1', areaId: 'digital', emoji: '🔓', title: 'Have I Been Pwned', url: 'https://haveibeenpwned.com', desc: 'Check if your data was breached' },
  { id: 'd2', areaId: 'digital', emoji: '🔑', title: '1Password', url: 'https://1password.com', desc: 'Password manager' },
  { id: 'd3', areaId: 'digital', emoji: '🛡️', title: 'EFF', url: 'https://www.eff.org', desc: 'Digital rights & privacy advocacy' },
  { id: 'd4', areaId: 'digital', emoji: '✉️', title: 'Proton Mail', url: 'https://proton.me', desc: 'Private, encrypted email' },
  { id: 'd5', areaId: 'digital', emoji: '⏳', title: 'Freedom', url: 'https://freedom.to', desc: 'Block distractions & apps' },
];
