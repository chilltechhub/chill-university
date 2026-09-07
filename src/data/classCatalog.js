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

export const CLASS_SUBJECTS = [
  {
    title: 'Math',
    icon: 'calculator',
    color: '#4A90E2',
    description: 'Numbers, algebra, geometry & more',
    children: [
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
    icon: 'laptop',
    color: '#5A9AE0',
    description: 'Build the future',
  },
  {
    title: 'Foreign Language',
    icon: 'language',
    color: '#3498DB',
    description: 'Connect with the world',
  },
  {
    title: 'Health & Fitness',
    icon: 'fitness',
    color: '#E05858',
    description: 'Mind and body wellness',
  },
  {
    title: 'Business & Finance',
    icon: 'briefcase',
    color: '#3AC860',
    description: 'Economics & entrepreneurship',
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
};
