// src/data/classCatalog.js
// The ONE list of every Academy class subject/topic and the screen it opens —
// same "single source of truth" pattern as gameRegistry.js (see that file's
// header comment for why: three separate copies of a list like this is how
// you get a subject that navigates nowhere because one copy drifted).
//
// Classes.js renders this catalog into a browsable subject list; the
// Planner's "Link to a class" picker (PlannerScreen.js) reuses it so a
// scheduled study session can jump straight to the topic it's for. Anything
// that needs to go from a topic label to its screen name — for
// `navigation.navigate('ClassesStack', { screen })` — should read
// CLASS_SCREEN_MAP here rather than keeping its own copy.

// `personas` — which profile types this subject is FOR. It decides what's on
// the map (question 3 in docs/access-system.md): a type's own subjects show
// from the start, everyone else's appear under "Other tracks" once the
// 'all-tools' stage opens. Omit it and the subject belongs to every type.
//
// `adult` — 18+ only (question 1, src/logic/allowed.js). The business-
// ownership and startup tracks cover credit, funding, tax and entity law.
// This used to be enforced only by the fact that minors can't pick Business;
// it's an age rule now, so it holds whatever type someone is on.
//
// The split: school subjects belong to PERSONAL and STUDENT profiles, not to
// someone's night job or their startup. The business-ownership track is the
// mirror image. Technology & Engineering sits in both, being as useful to a
// founder as to a learner.
export const CLASS_SUBJECTS = [
  {
    title: 'Math',
    personas: ['PERSONAL', 'STUDENT'],
    icon: 'calculator',
    color: '#4A90E2',
    description: 'Numbers, algebra, geometry & more',
    children: [
      // The practical one first: money, kitchen, workshop, data. See
      // src/screens/classes/mathClass/everydaymath.js.
      { label: 'Everyday Math', grade: '6-8' },
      { label: 'Numbers & Operations', grade: 'K-2' },
      { label: 'Algebra & Functions', grade: '3-5' },
      { label: 'Geometry & Spatial Reasoning', grade: '3-5' },
      { label: 'Measurement', grade: 'K-2' },
      { label: 'Data, Statistics & Probability', grade: '3-5' },
      { label: 'Advanced & Elective Topics', grade: '9-12' },
    ],
  },
  {
    title: 'Language Arts',
    personas: ['PERSONAL', 'STUDENT'],
    icon: 'book',
    color: '#E05858',
    description: 'Reading, writing & communication',
    children: [
      { label: 'Reading', grade: 'K-2' },
      { label: 'Writing', grade: 'K-2' },
      { label: 'Speaking & Listening', grade: 'K-2' },
      { label: 'Language', grade: 'K-2' },
      { label: 'Media & Digital Literacy', grade: '6-8' },
    ],
  },
  {
    title: 'Science',
    personas: ['PERSONAL', 'STUDENT'],
    icon: 'flask',
    color: '#3AC860',
    description: 'Explore the natural world',
    children: [
      { label: 'Astronomy & Space', grade: 'K-2' },
      { label: 'Physics', grade: '3-5' },
      { label: 'Earth & Environmental', grade: 'K-2' },
      { label: 'Chemistry', grade: '3-5' },
      { label: 'Biology', grade: 'K-2' },
      { label: 'Oceanography', grade: 'K-2' },
    ],
  },
  {
    title: 'Social Sciences',
    personas: ['PERSONAL', 'STUDENT'],
    icon: 'people',
    color: '#E0A830',
    description: 'History, geography & society',
    children: [
      { label: 'History', grade: '3-5' },
      { label: 'Geography', grade: 'K-2' },
      { label: 'Civics and Government', grade: '3-5' },
      { label: 'Psychology & Sociology', grade: '3-5' },
    ],
  },
  {
    title: 'Art & Music',
    personas: ['PERSONAL', 'STUDENT'],
    icon: 'color-palette',
    color: '#8B4FC4',
    description: 'Express your creativity',
    children: [
      { label: 'Visual Arts', grade: 'K-2' },
      { label: 'Music', grade: 'K-2' },
    ],
  },
  {
    title: 'Home Economics & Workshop',
    personas: ['PERSONAL', 'STUDENT'],
    icon: 'home',
    color: '#E07A30',
    description: 'Practical life skills',
    children: [
      { label: 'Nutrition & Food', grade: '3-5' },
      { label: 'Textiles, Apparel & Fashion', grade: '3-5' },
      { label: 'Family & Human Development', grade: '6-8' },
      { label: 'Household & Resource Management', grade: '3-5' },
      { label: 'Health & Wellness', grade: 'K-2' },
      { label: 'Material-working', grade: '6-8' },
      { label: 'Construction', grade: '9-12' },
      { label: 'Automotive', grade: '9-12' },
      { label: 'Tool Safety & Shop Practices', grade: '3-5' },
    ],
  },
  {
    title: 'Technology & Engineering',
    personas: ['PERSONAL', 'STUDENT', 'BUSINESS', 'ENTREPRENEUR'],
    icon: 'laptop',
    color: '#5A9AE0',
    description: 'Build the future',
  },
  {
    title: 'Foreign Language',
    personas: ['PERSONAL', 'STUDENT'],
    icon: 'language',
    color: '#3498DB',
    description: 'Connect with the world',
  },
  {
    title: 'Health & Fitness',
    personas: ['PERSONAL', 'STUDENT'],
    icon: 'fitness',
    color: '#E05858',
    description: 'Mind and body wellness',
  },
  {
    title: 'Business & Finance',
    personas: ['PERSONAL', 'STUDENT'],
    icon: 'briefcase',
    color: '#3AC860',
    description: 'Economics & entrepreneurship',
  },
  // ENTREPRENEUR / BUSINESS profiles only. Two separate tracks because buying
  // an operating business and building a startup are genuinely different
  // journeys after the shared foundation of Levels 1 and 2 — see TRACKS in
  // src/data/ownershipCurriculum.js.
  {
    title: 'Business Foundations',
    adult: true,
    icon: 'library',
    color: '#3AC860',
    description: 'Shared groundwork for both paths',
    personas: ['BUSINESS', 'ENTREPRENEUR'],
    children: [
      { label: 'Level 0: How Money Systems Work' },
      { label: 'Level 1: Personal Sovereignty' },
      { label: 'Level 2: Business Architecture' },
    ],
  },
  {
    title: 'Acquisition & Ownership',
    adult: true,
    icon: 'business',
    color: '#E0A830',
    description: 'Buy or grow a cash-flow business, and the property under it',
    personas: ['BUSINESS', 'ENTREPRENEUR'],
    children: [
      { label: 'Level 3A: Capital & Funding' },
      { label: 'Level 3B: Real Estate & Assets' },
      { label: 'Level 4: Taxes & Wealth Protection' },
    ],
  },
  {
    title: 'Startup & Venture',
    adult: true,
    icon: 'rocket',
    color: '#8B4FC4',
    description: 'Validate, build, grow, and raise',
    personas: ['BUSINESS', 'ENTREPRENEUR'],
    children: [
      { label: 'Level S1: Idea Validation' },
      { label: 'Level S2: Product & MVP' },
      { label: 'Level S3: Go-To-Market & Growth' },
      { label: 'Level S4: Venture Scale & Exit' },
    ],
  },
  // The employer-side layer: what it takes to actually run a business with
  // people in it, rather than own or build one — front-line operations
  // training plus the compliance/risk/culture policies a real handbook
  // needs. This is the content a business would hand its own team, which
  // is what makes this track pitchable as a B2B product on its own: an
  // owner in this persona can already assign any of these lessons to a
  // Team via the Organization layer (Organization -> Team -> Assign) and
  // see completion per employee.
  {
    title: 'Operations & Compliance',
    adult: true,
    icon: 'shield-checkmark',
    color: '#C0392B',
    description: 'Run the business, train the team, stay compliant',
    personas: ['BUSINESS', 'ENTREPRENEUR'],
    children: [
      { label: 'Level R1: Retail Operations Training' },
      { label: 'Level W1: Workplace Compliance & Culture' },
    ],
  },
];

// Deterministic, filesystem-free subject key — same alnum-only style as the
// per-topic slugify in ClassTopicScreen.js, just one level up (whole-subject
// scope, e.g. "Home Economics & Workshop" -> "HomeEconomicsWorkshop").
// Used to key the Lesson Builder's `lesson_activity` content pool
// (src/api/lessonBuilderService.js) so "Math" + "K-2" always resolves to the
// same Supabase `key`, regardless of which screen is asking.
export function subjectSlug(title) {
  return title.replace(/[^A-Za-z0-9]+/g, '');
}

// Topic label -> screen name registered in ClassesStack.js. Subjects with no
// `children` (the comingSoon ones) map their own title to a placeholder
// screen name that doesn't exist yet — Classes.js never calls goToChild for
// those (it shows a "coming soon" alert instead), so it's harmless here too.
export const CLASS_SCREEN_MAP = {
  'Everyday Math': 'EverydayMath',
  'Numbers & Operations': 'NumbersAndOperations',
  'Algebra & Functions': 'AlgebraAndFunctions',
  'Geometry & Spatial Reasoning': 'GeometrySpatialReasoning',
  'Measurement': 'Measurement',
  'Data, Statistics & Probability': 'DataStatisticsProbability',
  'Advanced & Elective Topics': 'AdvancedMath',
  Reading: 'Reading',
  Writing: 'Writing',
  'Speaking & Listening': 'SpeakingAndListening',
  Language: 'Language',
  'Media & Digital Literacy': 'MediaDigitalLiteracy',
  'Astronomy & Space': 'AstronomyAndSpace',
  Physics: 'Physics',
  'Earth & Environmental': 'EarthAndEnvironmental',
  Chemistry: 'Chemistry',
  Biology: 'Biology',
  Oceanography: 'Oceanography',
  History: 'History',
  Geography: 'Geography',
  'Civics and Government': 'CivicsAndGovernment',
  'Psychology & Sociology': 'PsychologicalAndSociology',
  'Nutrition & Food': 'NutritionAndFood',
  'Textiles, Apparel & Fashion': 'TextilesAndApparel',
  'Family & Human Development': 'FamilyAndHumanDevelopment',
  'Household & Resource Management': 'HouseholdAndResourceManagement',
  'Health & Wellness': 'HealthAndWellness',
  'Material-working': 'MaterialWorking',
  Construction: 'Construction',
  Automotive: 'Automotive',
  'Tool Safety & Shop Practices': 'ToolSafetyAndShopPractices',
  'Visual Arts': 'VisualArt',
  Music: 'Music',
  'Home Economics & Workshop': 'HomeEconomicsAndWorkshop',
  'Technology & Engineering': 'TechnologyAndEngineering',
  'Foreign Language': 'ForeignLanguage',
  'Health & Fitness': 'HealthAndFitness',
  'Business & Finance': 'BusinessAndFinance',
  'Level 2: Business Architecture': 'BusinessArchitecture',
  'Level R1: Retail Operations Training': 'RetailOperations',
  'Level W1: Workplace Compliance & Culture': 'WorkplaceCompliance',
  'Level 0: How Money Systems Work': 'MoneySystems',
  'Level 1: Personal Sovereignty': 'PersonalSovereignty',
  'Level 3A: Capital & Funding': 'CapitalFunding',
  'Level 3B: Real Estate & Assets': 'RealEstateAssets',
  'Level 4: Taxes & Wealth Protection': 'WealthProtection',
  'Level S1: Idea Validation': 'IdeaValidation',
  'Level S2: Product & MVP': 'ProductEngineering',
  'Level S3: Go-To-Market & Growth': 'GoToMarket',
  'Level S4: Venture Scale & Exit': 'VentureScale',
};
