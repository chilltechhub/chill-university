// src/data/gameContent/wildSurvival.js
// Wild Survival content — a multi-round survival scenario (Science/Health
// themed), tiered by grade band. Stamina carries across rounds.
//
// Each round has three options: one good (`good: true`) and two that are
// wrong in ways people actually believe (eat snow for water, shelter under
// a tall tree in a storm, cooking makes wild mushrooms safe), not "drink
// from a puddle". The game shuffles them, and `why` is shown after the
// pick so a wrong answer still teaches the reason.
//
// scripts/check-games.mjs checks that the good path always finishes and
// that picking the worst option every round runs out of stamina.

export const SURVIVAL_BANK = {
  'K-2': {
    title: 'Backyard Camping',
    startingStamina: 100,
    rounds: [
      { story: "It's getting dark and chilly.", options: [
        { label: 'Put on your jacket', delta: -5, good: true, why: 'A jacket holds your body heat in.' },
        { label: 'Run around to warm up', delta: -15, why: 'Running makes you sweaty, and damp clothes get cold fast.' },
        { label: 'Stay in your t-shirt, it\'s not that cold', delta: -20, why: 'Nights get colder than they feel at first.' },
      ] },
      { story: "You're thirsty.", options: [
        { label: 'Drink from your water bottle', delta: 5, good: true, why: 'Clean water from home is the safe choice.' },
        { label: 'Drink from the pond, it looks clean', delta: -25, why: 'Pond water can have germs you can\'t see.' },
        { label: 'Wait until morning to drink', delta: -10, why: 'Your body needs water, especially when you\'re busy.' },
      ] },
      { story: "You're hungry.", options: [
        { label: 'Eat the snack you packed', delta: 10, good: true, why: 'Food you brought is food you know is safe.' },
        { label: 'Eat berries from a bush in the yard', delta: -30, why: 'Some berries are poisonous. Only eat ones a grown-up says are safe.' },
        { label: 'Skip eating until breakfast', delta: -10, why: 'Your body needs fuel to stay warm at night.' },
      ] },
      { story: "You're getting tired.", options: [
        { label: 'Rest in your tent', delta: 15, good: true, why: 'Sleep gives your body its energy back.' },
        { label: 'Stay up late with a flashlight', delta: -15, why: 'Staying up late makes tomorrow harder.' },
        { label: 'Sleep on the grass under the stars', delta: -15, why: 'Dew and bugs make that a cold, itchy night.' },
      ] },
      { story: 'You hear a noise outside.', options: [
        { label: 'Stay in the tent and call a grown-up', delta: 5, good: true, why: 'A grown-up can check safely.' },
        { label: 'Run outside in the dark to look', delta: -20, why: 'You could trip or get lost in the dark.' },
        { label: 'Yell at it to go away', delta: -10, why: 'Yelling scares you more. Get a grown-up.' },
      ] },
    ],
    lesson: 'Small, sensible choices — a jacket, clean water, real food — add up to a safe night outdoors.',
  },

  '3-5': {
    title: 'Day Hike',
    startingStamina: 100,
    rounds: [
      { story: 'The trail markers are hard to see.', options: [
        { label: 'Check the map and compass', delta: -5, good: true, why: 'A map beats a guess every time.' },
        { label: 'Follow the path that looks most used', delta: -20, why: 'Worn paths are often animal trails that go nowhere.' },
        { label: 'Pick a direction and hurry', delta: -20, why: 'Hurrying the wrong way just gets you more lost.' },
      ] },
      { story: "It's getting hot.", options: [
        { label: 'Rest in the shade and sip water', delta: -5, good: true, why: 'Shade and small sips keep you cool.' },
        { label: 'Drink all your water at once', delta: -20, why: 'Then there is none left for later. Sip regularly.' },
        { label: 'Take off your hat to cool down', delta: -15, why: 'A hat shades your head. Without it the sun heats you more.' },
      ] },
      { story: 'A blister is forming on your heel.', options: [
        { label: 'Stop and cover it with a bandage', delta: -10, good: true, why: 'Covering it early stops it from getting worse.' },
        { label: 'Pop it and keep going', delta: -20, why: 'An open blister can get infected. Cover it instead.' },
        { label: 'Ignore it until you get home', delta: -25, why: 'Blisters get bigger and more painful with every step.' },
      ] },
      { story: 'Storm clouds are building and you hear thunder.', options: [
        { label: 'Head back down the trail early', delta: -10, good: true, why: 'Getting off high ground is the safest move in a storm.' },
        { label: 'Hurry to the top before it hits', delta: -30, why: 'Mountain tops are the most dangerous place in lightning.' },
        { label: 'Wait it out under a tall tree', delta: -30, why: 'Tall trees attract lightning.' },
      ] },
      { story: "You're losing daylight.", options: [
        { label: 'Use a headlamp and go slowly', delta: -10, good: true, why: 'Light and a careful pace prevent falls.' },
        { label: 'Run to get back before dark', delta: -25, why: 'Running on a trail in dim light causes falls.' },
        { label: 'Take a shortcut off the trail', delta: -30, why: 'Leaving the trail is how hikers get lost.' },
      ] },
    ],
    lesson: 'Turning back or slowing down when conditions change is a skill, not a failure.',
  },

  '6-8': {
    title: 'Mountain Trek',
    startingStamina: 100,
    rounds: [
      { story: 'Your water is running low.', options: [
        { label: 'Filter or boil stream water', delta: -10, good: true, why: 'Treating water kills germs you can\'t see.' },
        { label: 'Drink from a clear, fast stream', delta: -25, why: 'Clear, moving water can still carry germs like Giardia.' },
        { label: 'Stop drinking to make it last', delta: -20, why: 'Dehydration makes you weak and confused. Drink, but treat new water.' },
      ] },
      { story: 'The trail splits and neither way is marked.', options: [
        { label: 'Check the map, and backtrack if unsure', delta: -10, good: true, why: 'Going back to the last known spot is always safe.' },
        { label: 'Take the path that goes downhill', delta: -20, why: 'Downhill isn\'t always toward help. Use the map.' },
        { label: 'Split up to check both paths', delta: -25, why: 'Never split up. Separated groups get lost.' },
      ] },
      { story: 'You twist your ankle.', options: [
        { label: 'Rest it, wrap it, use a trekking pole', delta: -15, good: true, why: 'Support and rest keep a sprain from getting worse.' },
        { label: 'Walk it off so it doesn\'t stiffen', delta: -30, why: 'Walking on a fresh sprain can make it much worse.' },
        { label: 'Hold something warm on it right away', delta: -20, why: 'Cold helps a fresh sprain. Heat can increase swelling.' },
      ] },
      { story: 'The temperature is dropping fast.', options: [
        { label: 'Add layers and find shelter', delta: -10, good: true, why: 'Layers trap heat and shelter blocks the wind.' },
        { label: 'Keep hiking hard to stay warm', delta: -25, why: 'Sweat soaks your clothes, then you get colder.' },
        { label: 'Put your cotton hoodie on top', delta: -15, why: 'Cotton holds moisture and stops keeping you warm once damp.' },
      ] },
      { story: "You're running low on food.", options: [
        { label: 'Ration what you have left', delta: -15, good: true, why: 'Small, regular amounts keep your energy steady.' },
        { label: 'Eat it all now for energy', delta: -20, why: 'Then there is nothing for tomorrow.' },
        { label: 'Skip meals to save it', delta: -20, why: 'Your body needs fuel to stay warm and think clearly.' },
      ] },
      { story: "The final stretch. You're exhausted.", options: [
        { label: 'Steady pace with short breaks', delta: -15, good: true, why: 'Pacing gets you there without collapsing.' },
        { label: 'Sprint to finish it quickly', delta: -30, why: 'Sprinting while exhausted causes falls and injuries.' },
        { label: 'Lie down for a long nap on the trail', delta: -20, why: 'A long stop in the cold drains heat and daylight.' },
      ] },
    ],
    lesson: 'Rationing resources and pacing yourself matters more the longer a trek goes.',
  },

  '9-12': {
    title: 'Wilderness Emergency',
    startingStamina: 100,
    rounds: [
      { story: "You're lost with no phone signal.", options: [
        { label: 'Stay put, signal, save energy', delta: -10, good: true, why: 'Searchers start where you were last known. Moving makes you harder to find.' },
        { label: 'Climb higher to look for a signal', delta: -20, why: 'Climbing burns energy and risks falls.' },
        { label: 'Follow a stream downhill to a town', delta: -20, why: 'Streams can lead into cliffs and thick brush. Staying put is the standard advice.' },
      ] },
      { story: 'A freezing night is coming.', options: [
        { label: 'Build a shelter off the cold ground', delta: -10, good: true, why: 'The ground pulls heat out of you. Insulate below, block wind around.' },
        { label: 'Sleep in the open next to a fire', delta: -25, why: 'Fires die overnight, and the open ground still drains heat.' },
        { label: 'Keep walking all night to stay warm', delta: -30, why: 'You burn energy, sweat, and risk injury in the dark.' },
      ] },
      { story: 'The only water nearby looks dirty.', options: [
        { label: 'Boil or filter it before drinking', delta: -10, good: true, why: 'Boiling kills the germs that cause illness.' },
        { label: 'Eat snow instead', delta: -20, why: 'Eating snow lowers your body temperature. Melt it first.' },
        { label: 'Drink it raw, thirst is worse', delta: -30, why: 'A stomach bug in the wild causes worse dehydration.' },
      ] },
      { story: 'You cut your hand on a sharp rock.', options: [
        { label: 'Clean it and bandage it', delta: -10, good: true, why: 'Cleaning first prevents infection.' },
        { label: 'Leave it open so it can air out', delta: -20, why: 'An open wound picks up dirt and germs.' },
        { label: 'Tape it shut without cleaning it', delta: -20, why: 'Sealing dirt inside is how infections start.' },
      ] },
      { story: 'Food is scarce. You find mushrooms you can\'t identify.', options: [
        { label: "Don't eat anything you can't identify", delta: -15, good: true, why: 'You can go weeks without food. A bad mushroom can kill.' },
        { label: 'Eat a small bite to test it first', delta: -35, why: 'The "taste test" doesn\'t work for mushrooms. A small amount can be deadly.' },
        { label: 'Cook them well to make them safe', delta: -35, why: 'Cooking doesn\'t destroy mushroom poisons.' },
      ] },
      { story: 'You think you hear rescuers nearby.', options: [
        { label: 'Signal with a whistle, mirror, or smoke', delta: -5, good: true, why: 'Three whistle blasts means help, and it carries farther than a voice.' },
        { label: 'Run toward where the sound came from', delta: -25, why: 'Sound bounces in the wild, and running risks a fall.' },
        { label: 'Shout until they hear you', delta: -15, why: 'Your voice gives out fast. A whistle doesn\'t.' },
      ] },
    ],
    lesson: 'In a real emergency, conserving energy and signaling for help usually beats frantic action.',
  },
};

export default SURVIVAL_BANK;
