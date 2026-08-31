// src/data/gameContent/memoryMatch.js
// Memory Match content — cross-subject term/definition pairs, tiered by
// grade band. Each play samples a random subset of the pool so replays
// don't always show the same board.

export const MEMORY_BANK = {
  'K-2': [
    { term: '☀️ Sun', definition: 'Star that gives us light and heat' },
    { term: '🔺 Triangle', definition: 'A shape with 3 sides' },
    { term: '🐶 Dog', definition: 'A common pet that barks' },
    { term: '🛑 Red', definition: 'The color of a stop sign' },
    { term: '❄️ Winter', definition: 'The coldest season' },
    { term: '🍎 Apple', definition: 'A fruit that can be red or green' },
    { term: '⭕ Circle', definition: 'A round shape with no corners' },
    { term: '🍎 Teacher', definition: 'Person who helps you learn at school' },
    { term: '🌙 Moon', definition: 'Object that orbits the Earth at night' },
    { term: '🐟 Fish', definition: 'Animal that breathes with gills' },
  ],

  '3-5': [
    { term: 'Continent', definition: 'A huge landmass like Africa or Asia' },
    { term: 'Noun', definition: 'A word that names a person, place, or thing' },
    { term: 'Herbivore', definition: 'An animal that only eats plants' },
    { term: 'Democracy', definition: 'A government where citizens vote for leaders' },
    { term: 'Fraction', definition: 'A number that shows part of a whole' },
    { term: 'Equator', definition: "An imaginary line dividing Earth's north and south halves" },
    { term: 'Habitat', definition: 'The natural home of a plant or animal' },
    { term: 'Verb', definition: 'A word that shows an action' },
    { term: 'Precipitation', definition: 'Water falling from clouds, like rain or snow' },
    { term: 'Capital', definition: 'The city where a government is based' },
  ],

  '6-8': [
    { term: 'Photosynthesis', definition: 'Process plants use to turn sunlight into energy' },
    { term: 'Metaphor', definition: "Comparing two things without using 'like' or 'as'" },
    { term: 'Federalism', definition: 'Power split between a national government and states' },
    { term: 'Igneous rock', definition: 'Rock formed from cooled lava or magma' },
    { term: 'Renaissance', definition: 'Period of renewed art and learning in Europe' },
    { term: 'Algorithm', definition: 'Step-by-step instructions to solve a problem' },
    { term: 'Ecosystem', definition: 'A community of living things and their environment' },
    { term: 'Perimeter', definition: 'The distance around the edge of a shape' },
    { term: 'Mitochondria', definition: 'The part of a cell that makes energy' },
    { term: 'Alliteration', definition: 'Repeating the same starting sound in nearby words' },
  ],

  '9-12': [
    { term: 'Capitalism', definition: 'Economic system based on private ownership and free markets' },
    { term: 'Confirmation bias', definition: 'Favoring information that matches what you already believe' },
    { term: 'Encryption', definition: 'Converting data into a coded form for security' },
    { term: 'Subjunctive mood', definition: 'A grammar mood expressing wishes or doubts' },
    { term: 'Counterpoint', definition: 'Two or more independent melodies played together' },
    { term: 'Resilience', definition: 'The ability to recover from setbacks and adapt' },
    { term: 'Iterative design', definition: 'Repeatedly testing and improving a design based on feedback' },
    { term: 'Dissonance', definition: 'Musical notes that sound tense or unresolved' },
    { term: 'Imposter syndrome', definition: 'Feeling like a fraud despite real competence' },
    { term: 'Machine learning', definition: 'Computers improving at a task by learning from data' },
  ],
};

export default MEMORY_BANK;
