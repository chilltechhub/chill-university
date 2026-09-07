// src/data/gameContent/wordDetective.js
// Word Detective content, tiered by grade band. Each item has its own
// options list (instead of one fixed global set) so higher bands can widen
// the word-type vocabulary instead of just reusing noun/verb/adverb/adjective
// every round.

export const WORD_TYPE_COLORS = {
  noun: '#2bb5a0', verb: '#c9a84c', adverb: '#8b4fc4', adjective: '#e05858',
  pronoun: '#3B82F6', preposition: '#e0a830', conjunction: '#10B981',
  interjection: '#EC4899',
};

const BASE4 = ['noun', 'verb', 'adverb', 'adjective'];

export const WORD_BANK = {
  'K-2': [
    { word: 'dog',       sentence: 'The dog barked at the mailman.',            correct: 'noun',      options: BASE4, explanation: "'Dog' names a thing — naming words are nouns." },
    { word: 'ran',       sentence: 'She ran to catch the bus.',                 correct: 'verb',      options: BASE4, explanation: "'Ran' is the action — action words are verbs." },
    { word: 'big',       sentence: 'It was a big red balloon.',                 correct: 'adjective', options: BASE4, explanation: "'Big' describes the balloon — adjective." },
    { word: 'quickly',   sentence: 'The rabbit ran quickly through the garden.',correct: 'adverb',    options: BASE4, explanation: "'Quickly' tells HOW the rabbit ran — adverb." },
    { word: 'happy',     sentence: 'The happy dog wagged its tail.',            correct: 'adjective', options: BASE4, explanation: "'Happy' describes the dog — describing words are adjectives." },
    { word: 'playground',sentence: 'The children played at the playground.',    correct: 'noun',      options: BASE4, explanation: "'Playground' is a place — places are nouns." },
    { word: 'jumped',    sentence: 'The frog jumped over the log.',             correct: 'verb',      options: BASE4, explanation: "'Jumped' is an action — action words are verbs." },
    { word: 'teacher',   sentence: 'Our teacher reads us stories every day.',   correct: 'noun',      options: BASE4, explanation: "'Teacher' is a person — people are nouns." },
    { word: 'slowly',    sentence: 'The turtle moved slowly across the path.',  correct: 'adverb',    options: BASE4, explanation: "'Slowly' tells HOW the turtle moved — adverb." },
    { word: 'giggled',   sentence: 'The baby giggled at the funny face.',       correct: 'verb',      options: BASE4, explanation: "'Giggled' is something the baby did — verb." },
    { word: 'soft',      sentence: 'The kitten had soft fur.',                  correct: 'adjective', options: BASE4, explanation: "'Soft' describes the fur — adjective." },
    { word: 'mountain',  sentence: 'The mountain was covered in snow.',         correct: 'noun',      options: BASE4, explanation: "'Mountain' is a place — noun." },
    { word: 'sang',      sentence: 'The bird sang in the tree.',                correct: 'verb',      options: BASE4, explanation: "'Sang' is the action the bird did — verb." },
    { word: 'loudly',    sentence: 'The thunder crashed loudly.',               correct: 'adverb',    options: BASE4, explanation: "'Loudly' tells HOW the thunder crashed — adverb." },
    { word: 'shiny',     sentence: 'She found a shiny coin on the sidewalk.',   correct: 'adjective', options: BASE4, explanation: "'Shiny' describes the coin — adjective." },
  ],

  '3-5': [
    { word: 'colorful',  sentence: 'She painted a colorful picture.',              correct: 'adjective', options: BASE4, explanation: "'Colorful' describes the picture — adjective." },
    { word: 'ancient',   sentence: 'We visited an ancient castle.',                correct: 'adjective', options: BASE4, explanation: "'Ancient' describes the castle — adjective." },
    { word: 'carefully', sentence: 'He carefully carried the glass vase.',         correct: 'adverb',    options: BASE4, explanation: "'Carefully' tells HOW he carried it — adverb." },
    { word: 'kindness',  sentence: 'Her kindness made everyone smile.',            correct: 'noun',      options: BASE4, explanation: "'Kindness' is an idea/quality treated as a thing — noun." },
    { word: 'vanished',  sentence: 'The magician vanished in a puff of smoke.',    correct: 'verb',      options: BASE4, explanation: "'Vanished' is the action — verb." },
    { word: 'her',       sentence: 'Please give the book to her.',                 correct: 'pronoun',   options: ['noun', 'pronoun', 'verb', 'adjective'], explanation: "'Her' stands in for a person's name — that's a pronoun." },
    { word: 'under',     sentence: 'The cat hid under the porch.',                 correct: 'preposition', options: ['verb', 'preposition', 'noun', 'adverb'], explanation: "'Under' shows where the cat is relative to the porch — a preposition." },
    { word: 'run',       sentence: 'She went for a run before breakfast.',         correct: 'noun',      options: BASE4, explanation: "Here 'run' names the activity itself (a thing you go on) — noun, not the action." },
    { word: 'run',       sentence: 'She will run to school today.',                correct: 'verb',      options: BASE4, explanation: "Here 'run' is the action she'll do — verb. Same word, different job." },
    { word: 'brightest', sentence: 'That is the brightest star in the sky.',       correct: 'adjective', options: BASE4, explanation: "'Brightest' compares and describes the star — a superlative adjective." },
    { word: 'nervously', sentence: 'He nervously tapped his pencil.',              correct: 'adverb',    options: BASE4, explanation: "'Nervously' tells HOW he tapped — adverb." },
    { word: 'and',       sentence: 'We packed sandwiches and juice for the trip.', correct: 'conjunction', options: ['noun', 'conjunction', 'verb', 'adjective'], explanation: "'And' joins two words together — a conjunction." },
    { word: 'freedom',   sentence: 'The prisoners finally tasted freedom.',        correct: 'noun',      options: BASE4, explanation: "'Freedom' is an idea treated as a thing — noun." },
    { word: 'those',     sentence: 'Those belong to my sister.',                   correct: 'pronoun',   options: ['pronoun', 'adjective', 'noun', 'verb'], explanation: "'Those' replaces the name of the objects — pronoun." },
    { word: 'gracefully',sentence: 'The dancer moved gracefully across the stage.',correct: 'adverb',    options: BASE4, explanation: "'Gracefully' tells HOW the dancer moved — adverb." },
  ],

  '6-8': [
    { word: 'despite',   sentence: 'Despite the rain, the game continued.',        correct: 'preposition', options: ['conjunction', 'preposition', 'adverb', 'noun'], explanation: "'Despite' relates 'the rain' to the rest of the sentence — a preposition, not a conjunction, because it takes a noun phrase, not a clause." },
    { word: 'although',  sentence: 'Although it was late, she kept studying.',     correct: 'conjunction', options: ['preposition', 'conjunction', 'adverb', 'verb'], explanation: "'Although' joins two clauses (it was late / she kept studying) — a conjunction." },
    { word: 'seems',     sentence: 'The plan seems reasonable.',                   correct: 'verb',      options: BASE4, explanation: "'Seems' is a linking verb — it connects the subject to a description, but it's still a verb, not a description word itself." },
    { word: 'well',      sentence: 'She played the piano well.',                   correct: 'adverb',    options: BASE4, explanation: "'Well' describes HOW she played — adverb (not to be confused with 'good', an adjective)." },
    { word: 'good',      sentence: 'She is a good piano player.',                  correct: 'adjective', options: BASE4, explanation: "'Good' describes the noun 'player' — adjective. Compare to 'well' in the sentence above, which describes the verb." },
    { word: 'themselves',sentence: 'The kids cleaned up the mess themselves.',     correct: 'pronoun',   options: ['pronoun', 'noun', 'adjective', 'verb'], explanation: "'Themselves' is a reflexive pronoun referring back to 'the kids'." },
    { word: 'quickly',   sentence: 'Working quickly, the crew finished the roof before the storm.', correct: 'adverb', options: BASE4, explanation: "'Quickly' modifies 'working' — telling HOW, even at the start of the sentence — adverb." },
    { word: 'that',      sentence: 'The book that I borrowed is overdue.',         correct: 'pronoun',   options: ['pronoun', 'conjunction', 'adjective', 'noun'], explanation: "'That' stands in for 'the book' inside its own clause — a relative pronoun." },
    { word: 'since',     sentence: 'Since Monday, the shop has been closed.',      correct: 'preposition', options: ['conjunction', 'preposition', 'adverb', 'noun'], explanation: "'Since' here relates a point in time to the rest of the sentence — a preposition (compare: 'Since he left, it's been quiet' would make it a conjunction)." },
    { word: 'happily',   sentence: 'Happily, the storm passed before the picnic.', correct: 'adverb',    options: BASE4, explanation: "'Happily' here modifies the whole sentence, expressing the speaker's attitude — still an adverb." },
    { word: 'complex',   sentence: 'The complex system took years to design.',     correct: 'adjective', options: BASE4, explanation: "'Complex' describes 'system' — adjective." },
    { word: 'either',    sentence: 'You can have either the cake or the pie.',     correct: 'conjunction', options: ['pronoun', 'conjunction', 'adjective', 'noun'], explanation: "'Either...or' is a pair of conjunctions linking two choices." },
    { word: 'growth',    sentence: 'The company saw rapid growth this year.',      correct: 'noun',      options: BASE4, explanation: "'Growth' names a process treated as a thing — a noun, even though it comes from the verb 'grow'." },
    { word: 'barely',    sentence: 'She barely finished the race in time.',        correct: 'adverb',    options: BASE4, explanation: "'Barely' tells the degree to which she finished — adverb." },
    { word: 'whose',     sentence: 'The scientist whose theory was proven right won the prize.', correct: 'pronoun', options: ['pronoun', 'conjunction', 'adjective', 'noun'], explanation: "'Whose' links back to 'the scientist' and shows possession — a relative pronoun." },
  ],

  '9-12': [
    { word: 'running',    sentence: 'Running is her favorite way to relax.',                correct: 'noun',      options: BASE4, explanation: "'Running' acts as the subject here — a verb form (gerund) used as a noun." },
    { word: 'excited',    sentence: 'The excited crowd cheered loudly.',                    correct: 'adjective', options: BASE4, explanation: "'Excited' (from the verb 'excite') describes the crowd — a participial adjective." },
    { word: 'unless',     sentence: "You won't pass unless you study.",                     correct: 'conjunction', options: ['preposition', 'conjunction', 'adverb', 'pronoun'], explanation: "'Unless' introduces a condition, joining the two clauses — a subordinating conjunction." },
    { word: 'wow',        sentence: 'Wow, that was an incredible finish!',                  correct: 'interjection', options: ['interjection', 'adverb', 'noun', 'verb'], explanation: "'Wow' expresses emotion and stands apart from the sentence's grammar — an interjection." },
    { word: 'broken',     sentence: 'The broken window let in the cold air.',                correct: 'adjective', options: BASE4, explanation: "'Broken' (from the verb 'break') describes the window — a participial adjective." },
    { word: 'singing',    sentence: 'Singing is how she expresses herself.',                correct: 'noun',      options: BASE4, explanation: "'Singing' is the subject of the sentence — a gerund acting as a noun." },
    { word: 'whichever',  sentence: 'Choose whichever path feels right.',                   correct: 'pronoun',   options: ['pronoun', 'adjective', 'conjunction', 'noun'], explanation: "'Whichever' stands in for the unnamed path being chosen — an indefinite relative pronoun." },
    { word: 'hmm',        sentence: "Hmm, I'm not sure that's correct.",                    correct: 'interjection', options: ['interjection', 'adverb', 'verb', 'noun'], explanation: "'Hmm' expresses hesitation, grammatically independent of the sentence — an interjection." },
    { word: 'provided',   sentence: 'You may go, provided that you finish your homework.',  correct: 'conjunction', options: ['verb', 'conjunction', 'adjective', 'preposition'], explanation: "'Provided (that)' sets a condition linking the two clauses — functions as a subordinating conjunction here, not the verb 'provide'." },
    { word: 'exhausted',  sentence: 'The exhausted runners collapsed at the finish line.',  correct: 'adjective', options: BASE4, explanation: "'Exhausted' describes the runners — a participial adjective, even though it comes from a verb." },
    { word: 'whom',       sentence: 'The man whom she hired left early.',                   correct: 'pronoun',   options: ['pronoun', 'conjunction', 'noun', 'adjective'], explanation: "'Whom' stands in for 'the man' as the object of 'hired' — an objective relative pronoun." },
    { word: 'nonetheless',sentence: 'The rain continued; nonetheless, the game went on.',   correct: 'adverb',    options: BASE4, explanation: "'Nonetheless' connects two ideas while modifying the second clause — a conjunctive adverb." },
  ],
};

export default WORD_BANK;
