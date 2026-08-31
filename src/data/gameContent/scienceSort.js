// src/data/gameContent/scienceSort.js
// Science Sort content, tiered by grade band. Each tier is a set of
// classification topics; items are flattened + shuffled at run start.

export const SCIENCE_TOPICS = {
  'K-2': [
    {
      title: 'Animals',
      question: 'Is this a mammal, reptile, bird, or fish?',
      categories: ['Mammal', 'Reptile', 'Bird', 'Fish'],
      items: [
        { name: '🐬 Dolphin',   correct: 'Mammal',  explanation: 'Dolphins breathe air and nurse their young with milk.' },
        { name: '🦎 Lizard',    correct: 'Reptile', explanation: 'Lizards are cold-blooded and have scales.' },
        { name: '🦅 Eagle',     correct: 'Bird',    explanation: 'Eagles have feathers and hollow bones for flight.' },
        { name: '🐟 Salmon',    correct: 'Fish',    explanation: 'Salmon have gills and live their whole life in water.' },
        { name: '🦇 Bat',       correct: 'Mammal',  explanation: 'Bats are the only flying mammals — they nurse with milk.' },
        { name: '🐊 Crocodile', correct: 'Reptile', explanation: 'Crocodiles are cold-blooded and lay eggs.' },
      ],
    },
    {
      title: 'States of Matter',
      question: 'Is this a solid, liquid, or gas?',
      categories: ['Solid', 'Liquid', 'Gas'],
      items: [
        { name: '💎 Diamond', correct: 'Solid',  explanation: 'Diamond has a fixed shape and volume.' },
        { name: '💧 Water',   correct: 'Liquid', explanation: 'Liquid takes the shape of its container.' },
        { name: '💨 Steam',   correct: 'Gas',    explanation: 'Gas expands to fill any space.' },
        { name: '🧊 Ice',     correct: 'Solid',  explanation: 'Ice is frozen water — fixed shape.' },
        { name: '🫧 Bubbles', correct: 'Gas',    explanation: 'Bubbles are filled with gas — usually air.' },
        { name: '🍯 Honey',   correct: 'Liquid', explanation: 'Honey flows and takes the shape of its container.' },
      ],
    },
  ],

  '3-5': [
    {
      title: 'Living vs Nonliving',
      question: 'Is this living or nonliving?',
      categories: ['Living', 'Nonliving'],
      items: [
        { name: '🌳 Tree',      correct: 'Living',    explanation: 'Trees grow, use energy, and reproduce.' },
        { name: '🪨 Rock',      correct: 'Nonliving', explanation: "Rocks don't grow, eat, or reproduce." },
        { name: '🦋 Butterfly', correct: 'Living',    explanation: 'Butterflies grow, breathe, and reproduce.' },
        { name: '🚗 Car',       correct: 'Nonliving', explanation: "A car is man-made — it doesn't grow or reproduce." },
        { name: '🍄 Mushroom',  correct: 'Living',    explanation: 'Fungi like mushrooms are living things.' },
        { name: '☁️ Cloud',     correct: 'Nonliving', explanation: "Clouds are water droplets — they don't grow or reproduce." },
      ],
    },
    {
      title: 'Vertebrates & Invertebrates',
      question: 'Does this animal have a backbone?',
      categories: ['Vertebrate', 'Invertebrate'],
      items: [
        { name: '🐍 Snake',   correct: 'Vertebrate',   explanation: 'Snakes have a long, flexible backbone.' },
        { name: '🐌 Snail',   correct: 'Invertebrate', explanation: 'Snails have a soft body and no backbone.' },
        { name: '🐬 Dolphin', correct: 'Vertebrate',   explanation: 'Dolphins are mammals with a backbone.' },
        { name: '🕷️ Spider',  correct: 'Invertebrate', explanation: 'Spiders have an exoskeleton instead of a backbone.' },
        { name: '🐦 Sparrow', correct: 'Vertebrate',   explanation: 'Birds have a lightweight backbone.' },
        { name: '🦑 Squid',   correct: 'Invertebrate', explanation: 'Squid have no backbone — just soft tissue.' },
      ],
    },
    {
      title: 'Rock Types',
      question: 'What type of rock is this?',
      categories: ['Igneous', 'Sedimentary', 'Metamorphic'],
      items: [
        { name: '🌋 Obsidian',  correct: 'Igneous',     explanation: 'Obsidian cools so fast from lava it forms glass.' },
        { name: '🏖️ Sandstone', correct: 'Sedimentary', explanation: 'Sandstone forms from layers of pressed sand.' },
        { name: '💎 Marble',    correct: 'Metamorphic', explanation: 'Marble forms when limestone is squeezed and heated.' },
        { name: '🪨 Granite',   correct: 'Igneous',     explanation: 'Granite cools slowly underground from magma.' },
        { name: '🐚 Limestone', correct: 'Sedimentary', explanation: 'Limestone forms from layers of shells and sediment.' },
        { name: '⛰️ Slate',     correct: 'Metamorphic', explanation: 'Slate forms when shale is pressed and heated.' },
      ],
    },
  ],

  '6-8': [
    {
      title: 'Physical vs Chemical Change',
      question: 'Is this a physical or chemical change?',
      categories: ['Physical', 'Chemical'],
      items: [
        { name: '🧊 Melting ice',        correct: 'Physical', explanation: "It's still H₂O — just changing state, not substance." },
        { name: '🔥 Burning wood',       correct: 'Chemical', explanation: 'Burning creates new substances — ash, smoke, and gas.' },
        { name: '✂️ Cutting paper',      correct: 'Physical', explanation: "It's still paper — just smaller pieces." },
        { name: '🍳 Frying an egg',      correct: 'Chemical', explanation: "The proteins change structure — you can't uncook it." },
        { name: '🧂 Dissolving salt',    correct: 'Physical', explanation: 'The salt can be recovered by letting the water evaporate.' },
        { name: '🔩 Rusting iron',       correct: 'Chemical', explanation: 'Iron reacts with oxygen to form a new substance — rust.' },
      ],
    },
    {
      title: 'Ecosystem Roles',
      question: "What's this organism's role in its ecosystem?",
      categories: ['Producer', 'Consumer', 'Decomposer'],
      items: [
        { name: '🌾 Wheat',    correct: 'Producer',   explanation: 'Wheat makes its own food through photosynthesis.' },
        { name: '🦌 Deer',     correct: 'Consumer',   explanation: 'Deer get energy by eating plants.' },
        { name: '🍄 Mushroom', correct: 'Decomposer', explanation: 'Mushrooms break down dead matter and recycle nutrients.' },
        { name: '🌻 Sunflower',correct: 'Producer',   explanation: 'Sunflowers use sunlight to produce their own energy.' },
        { name: '🦁 Lion',     correct: 'Consumer',   explanation: 'Lions get energy by eating other animals.' },
        { name: '🪱 Earthworm',correct: 'Decomposer', explanation: 'Earthworms break down organic material in soil.' },
      ],
    },
    {
      title: 'Space Objects',
      question: 'What type of space object is this?',
      categories: ['Star', 'Planet', 'Moon', 'Galaxy'],
      items: [
        { name: '☀️ Sun',    correct: 'Star',   explanation: 'Our Sun is a medium-sized star made of plasma.' },
        { name: '🌍 Earth',  correct: 'Planet', explanation: 'Earth is a rocky planet orbiting the Sun.' },
        { name: '🌙 Moon',   correct: 'Moon',   explanation: 'Moons orbit planets — Earth has one.' },
        { name: '⭐ Sirius', correct: 'Star',   explanation: 'Sirius is the brightest star in our night sky.' },
        { name: '🌌 Galaxy', correct: 'Galaxy', explanation: 'A galaxy contains billions of stars.' },
        { name: '🪐 Saturn', correct: 'Planet', explanation: 'Saturn is known for its beautiful ring system.' },
      ],
    },
  ],

  '9-12': [
    {
      title: 'Cell Organelles',
      question: "What part of the cell does this describe?",
      categories: ['Nucleus', 'Mitochondria', 'Ribosome', 'Cell Membrane'],
      items: [
        { name: '🔋 Powerhouse of the cell',        correct: 'Mitochondria',  explanation: 'Mitochondria convert nutrients into usable energy (ATP).' },
        { name: '🧠 Control center of the cell',     correct: 'Nucleus',       explanation: 'The nucleus holds DNA and directs cell activity.' },
        { name: '🏭 Builds proteins',                correct: 'Ribosome',      explanation: 'Ribosomes read genetic instructions to assemble proteins.' },
        { name: '🚧 Controls what enters and exits', correct: 'Cell Membrane',explanation: 'The cell membrane is selectively permeable, controlling what passes through.' },
        { name: '💪 Stores energy from food',        correct: 'Mitochondria',  explanation: 'Mitochondria break down glucose to release usable energy.' },
        { name: '📋 Holds the cell\'s DNA',           correct: 'Nucleus',       explanation: 'The nucleus contains chromosomes made of DNA.' },
      ],
    },
    {
      title: "Newton's Laws of Motion",
      question: 'Which law of motion does this describe?',
      categories: ['First Law', 'Second Law', 'Third Law'],
      items: [
        { name: '🛹 A skateboard keeps rolling until friction stops it',       correct: 'First Law',  explanation: "Newton's First Law: an object in motion stays in motion unless acted on by an outside force (inertia)." },
        { name: '🚀 A heavier rocket needs more force for the same speed-up', correct: 'Second Law', explanation: "Newton's Second Law: force equals mass times acceleration (F = ma)." },
        { name: '🏊 Swimmers push water backward to move forward',            correct: 'Third Law',  explanation: "Newton's Third Law: for every action there is an equal and opposite reaction." },
        { name: '🛑 A stopped bus stays stopped until the driver hits the gas', correct: 'First Law', explanation: 'Objects at rest stay at rest unless a force acts on them — inertia again.' },
        { name: '⚽ Kicking a heavier ball needs more force for the same speed', correct: 'Second Law', explanation: 'More mass requires more force to produce the same acceleration.' },
        { name: '🚀 A rocket blasts gas downward and flies upward',            correct: 'Third Law',  explanation: 'The downward force on the gas creates an equal upward force on the rocket.' },
      ],
    },
  ],
};

export default SCIENCE_TOPICS;
