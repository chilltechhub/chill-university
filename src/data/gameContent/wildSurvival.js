// src/data/gameContent/wildSurvival.js
// Wild Survival content — a multi-round survival scenario (Science/Health
// themed), tiered by grade band. Verified by simulation: choosing the
// wise option every round always keeps you alive to the end; choosing the
// risky option every round always runs your stamina out before the end.

export const SURVIVAL_BANK = {
  'K-2': {
    title: 'Backyard Camping',
    startingStamina: 100,
    rounds: [
      { story: "It's getting dark and chilly.", wise: { label: 'Put on a jacket', delta: -5 }, risky: { label: 'Stay in a t-shirt', delta: -20 } },
      { story: "You're thirsty.", wise: { label: 'Drink from your water bottle', delta: 5 }, risky: { label: 'Drink from a puddle', delta: -25 } },
      { story: "You're hungry.", wise: { label: 'Eat your packed snack', delta: 10 }, risky: { label: 'Try unknown wild berries', delta: -30 } },
      { story: "You're getting tired.", wise: { label: 'Rest in your tent', delta: 15 }, risky: { label: 'Stay up late playing', delta: -15 } },
      { story: 'You hear a noise outside.', wise: { label: 'Stay calm, check with a flashlight', delta: 5 }, risky: { label: 'Run outside scared', delta: -20 } },
    ],
    lesson: 'Small, sensible choices — a jacket, clean water, real food — add up to a safe night outdoors.',
  },

  '3-5': {
    title: 'Day Hike',
    startingStamina: 100,
    rounds: [
      { story: 'Trail markers are unclear.', wise: { label: 'Check the map and compass', delta: -5 }, risky: { label: 'Guess a direction', delta: -20 } },
      { story: "It's getting hot.", wise: { label: 'Rest in the shade, sip water', delta: -5 }, risky: { label: 'Push through fast', delta: -25 } },
      { story: 'A blister is forming.', wise: { label: 'Stop and treat it', delta: -10 }, risky: { label: 'Ignore it and keep going', delta: -25 } },
      { story: 'Storm clouds are forming.', wise: { label: 'Head back early', delta: -10 }, risky: { label: 'Press on to the summit', delta: -30 } },
      { story: "You're losing daylight.", wise: { label: 'Use a headlamp, go slow', delta: -10 }, risky: { label: 'Rush in the dark', delta: -30 } },
    ],
    lesson: 'Turning back or slowing down when conditions change is a skill, not a failure.',
  },

  '6-8': {
    title: 'Mountain Trek',
    startingStamina: 100,
    rounds: [
      { story: 'Water is running low.', wise: { label: 'Ration it and filter stream water', delta: -10 }, risky: { label: 'Drink freely, untreated', delta: -25 } },
      { story: 'The trail forks and is unmarked.', wise: { label: 'Use map & compass, backtrack if needed', delta: -10 }, risky: { label: 'Guess and continue', delta: -25 } },
      { story: 'You twist your ankle.', wise: { label: 'Rest, wrap it, use a trekking pole', delta: -15 }, risky: { label: 'Push through the pain', delta: -30 } },
      { story: 'The temperature is dropping fast.', wise: { label: 'Layer up, find shelter', delta: -10 }, risky: { label: 'Keep moving in the cold', delta: -30 } },
      { story: "You're running low on food.", wise: { label: 'Ration what you have left', delta: -15 }, risky: { label: 'Eat it all now', delta: -20 } },
      { story: 'The final stretch — you\'re exhausted.', wise: { label: 'Steady pace, short rest breaks', delta: -15 }, risky: { label: 'Sprint to the end', delta: -30 } },
    ],
    lesson: 'Rationing resources and pacing yourself matters more the longer a trek goes.',
  },

  '9-12': {
    title: 'Wilderness Emergency',
    startingStamina: 100,
    rounds: [
      { story: "You're lost with no phone signal.", wise: { label: 'Stay put, signal for help, conserve energy', delta: -10 }, risky: { label: 'Wander around looking for signal', delta: -25 } },
      { story: 'A freezing night is coming.', wise: { label: 'Build a shelter, insulate from the ground', delta: -10 }, risky: { label: 'Sleep exposed to save time', delta: -35 } },
      { story: 'The only water source looks contaminated.', wise: { label: 'Boil or filter it before drinking', delta: -10 }, risky: { label: 'Drink it raw', delta: -30 } },
      { story: 'You cut your hand on a rock.', wise: { label: 'Clean and bandage it properly', delta: -10 }, risky: { label: 'Ignore it, risk infection', delta: -25 } },
      { story: 'Food is scarce — you find unidentified mushrooms.', wise: { label: "Don't eat anything you can't identify", delta: -15 }, risky: { label: 'Eat them — you\'re desperate', delta: -35 } },
      { story: 'Rescuers may be near.', wise: { label: 'Use a mirror, whistle, or fire signals', delta: -5 }, risky: { label: 'Exhaust yourself running toward a noise', delta: -25 } },
    ],
    lesson: 'In a real emergency, conserving energy and signaling for help usually beats frantic action.',
  },
};

export default SURVIVAL_BANK;
