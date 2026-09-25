// src/data/gameContent/recipeBuilder.js
// Recipe Builder content, tiered by grade band / step count: K-2 recipes
// are short with no stove, 9-12 recipes involve real technique (roux,
// marinating, temping meat) and carry a real safety tip.
//
// Real cooking has steps whose order doesn't matter, and marking those
// wrong teaches nothing (peanut butter first or jelly first?). So:
//   order        the step's place in the usual sequence
//   same order   two steps with the same number can go either way round
//   before: n    a step that can happen at ANY point before step n, like
//                preheating the oven or heating the pan
//   after: n     (with before) it still has to wait for step n, like
//                slicing a steak that has to be seared first
// canPlace() below is the one rule the game uses; scripts/check-games.mjs
// checks every recipe can be finished in its written order.

export const RECIPE_BANK = {
  'K-2': [
    {
      name: '🍞 Toast',
      steps: [
        { order: 1, text: 'Put a slice of bread in the toaster' },
        { order: 2, text: 'Push down the lever' },
        { order: 3, text: 'Wait until it pops up' },
        { order: 4, text: 'Spread butter or jam on top' },
      ],
      tip: 'Never stick a fork in the toaster to get stuck toast — unplug it first and ask an adult.',
    },
    {
      name: '🥣 Cereal',
      steps: [
        { order: 1, text: 'Get a bowl' },
        { order: 2, text: 'Pour in the cereal' },
        { order: 3, text: 'Add milk' },
        { order: 4, text: 'Grab a spoon and enjoy' },
      ],
      tip: "Pour the cereal before the milk so you don't overfill the bowl.",
    },
    {
      name: '🥪 PB&J Sandwich',
      steps: [
        { order: 1, text: 'Lay out two slices of bread' },
        { order: 2, text: 'Spread peanut butter on one slice' },
        { order: 2, text: 'Spread jelly on the other slice' },
        { order: 4, text: 'Press the two slices together' },
      ],
      tip: 'Use a butter knife, not a sharp one, to spread.',
    },
  ],

  '3-5': [
    {
      name: '🥞 Pancakes',
      steps: [
        { order: 1, text: 'Mix flour, eggs, and milk in a bowl' },
        { order: 2, text: 'Heat pan on medium and add butter', before: 3 },
        { order: 3, text: 'Pour batter and wait for bubbles' },
        { order: 4, text: 'Flip and cook other side' },
        { order: 5, text: 'Serve with syrup and fruit' },
      ],
      tip: 'Wait until bubbles form before flipping!',
    },
    {
      name: '🥗 Salad',
      steps: [
        { order: 1, text: 'Wash all vegetables thoroughly' },
        { order: 2, text: 'Chop lettuce, tomatoes, and cucumber' },
        { order: 3, text: 'Add toppings like croutons and cheese' },
        { order: 3, text: 'Drizzle dressing over the salad' },
        { order: 5, text: 'Toss gently and serve' },
      ],
      tip: 'Always wash vegetables before eating!',
    },
    {
      name: '🍝 Pasta',
      steps: [
        { order: 1, text: 'Boil salted water in a large pot' },
        { order: 2, text: 'Add pasta and cook for 8-10 minutes' },
        { order: 3, text: 'Drain pasta in a colander' },
        { order: 4, text: 'Heat sauce in a separate pan', before: 5 },
        { order: 5, text: 'Mix pasta and sauce, serve hot' },
      ],
      tip: 'Salting the water adds flavor to the pasta!',
    },
    {
      name: '🥤 Smoothie',
      steps: [
        { order: 1, text: 'Pour yogurt or milk into the blender' },
        { order: 2, text: 'Add the fruit' },
        { order: 3, text: 'Add a handful of ice' },
        { order: 4, text: 'Blend until smooth' },
        { order: 5, text: 'Pour into a glass and serve' },
      ],
      tip: "Add the liquid first so the blender blades don't jam.",
    },
  ],

  '6-8': [
    {
      name: '🍳 Scrambled Eggs',
      steps: [
        { order: 1, text: 'Crack eggs into a bowl' },
        { order: 2, text: 'Whisk with a splash of milk' },
        { order: 3, text: 'Heat butter in a pan on medium-low', before: 4 },
        { order: 4, text: 'Pour in the eggs' },
        { order: 5, text: 'Gently push the eggs across the pan as they set' },
        { order: 6, text: 'Remove from heat while slightly wet — they keep cooking' },
        { order: 7, text: 'Season with salt and pepper and serve' },
      ],
      tip: 'Ask an adult before using the stove, and always turn pot/pan handles inward.',
    },
    {
      name: '🍲 Veggie Stir-Fry',
      steps: [
        { order: 1, text: 'Wash and chop the vegetables' },
        { order: 2, text: 'Heat oil in a pan on medium-high', before: 3 },
        { order: 3, text: 'Add the vegetables that take longest to cook' },
        { order: 4, text: 'Add the quicker-cooking vegetables' },
        { order: 5, text: 'Stir-fry until everything is tender-crisp' },
        { order: 6, text: 'Add sauce and stir to coat' },
        { order: 7, text: 'Serve over rice' },
      ],
      tip: 'Keep ingredients moving — stir-fry cooks fast and can burn quickly.',
    },
    {
      name: '🧀 Grilled Cheese',
      steps: [
        { order: 1, text: 'Butter one side of each bread slice' },
        { order: 2, text: 'Place cheese between the unbuttered sides' },
        { order: 3, text: 'Heat a pan on medium-low', before: 4 },
        { order: 4, text: 'Place the sandwich butter-side down in the pan' },
        { order: 5, text: 'Cook until golden, then flip carefully' },
        { order: 6, text: 'Cook the other side until the cheese melts' },
        { order: 7, text: 'Slice and serve warm' },
      ],
      tip: 'Medium-low heat melts the cheese before the bread burns.',
    },
    {
      name: '🍪 Baked Cookies',
      steps: [
        { order: 1, text: 'Preheat the oven', before: 6 },
        { order: 2, text: 'Cream butter and sugar together' },
        { order: 3, text: 'Mix in eggs and vanilla' },
        { order: 4, text: 'Stir in flour, baking soda, and chocolate chips' },
        { order: 5, text: 'Scoop dough onto a baking sheet' },
        { order: 6, text: 'Bake until the edges turn golden' },
        { order: 7, text: 'Cool on a rack before eating' },
      ],
      tip: 'Always ask an adult to help with the oven — it stays hot even after you turn it off.',
    },
  ],

  '9-12': [
    {
      name: '🍝 Homemade Alfredo Sauce',
      steps: [
        { order: 1, text: 'Melt butter in a saucepan over low heat' },
        { order: 2, text: 'Whisk in flour to form a roux' },
        { order: 3, text: 'Slowly add cream while whisking to avoid lumps' },
        { order: 4, text: 'Stir in grated parmesan until melted' },
        { order: 5, text: 'Season with salt, pepper, and nutmeg' },
        { order: 6, text: 'Cook pasta in salted boiling water until al dente', before: 7 },
        { order: 7, text: 'Toss the pasta in the sauce off the heat' },
        { order: 8, text: 'Serve immediately while hot' },
      ],
      tip: 'A roux needs constant whisking or it will burn or clump.',
    },
    {
      name: '🍗 Marinated Grilled Chicken',
      steps: [
        { order: 1, text: 'Mix oil, an acid (lemon or vinegar), and spices for the marinade' },
        { order: 2, text: 'Add the chicken and refrigerate for at least 30 minutes' },
        { order: 3, text: 'Preheat the grill or pan to medium-high', before: 5 },
        { order: 4, text: 'Remove the chicken and let excess marinade drip off' },
        { order: 5, text: 'Cook the chicken until it reaches 165°F internally' },
        { order: 6, text: 'Let the chicken rest for 5 minutes before cutting' },
        { order: 7, text: 'Slice and serve' },
      ],
      tip: 'Always check internal temperature with a food thermometer — chicken must reach 165°F to be safe.',
    },
    {
      name: '🥩 Pan Sauce for Steak',
      steps: [
        { order: 1, text: 'Sear the steak in a hot pan and set it aside to rest' },
        { order: 2, text: 'Deglaze the pan with stock or wine, scraping up the browned bits' },
        { order: 3, text: 'Simmer the liquid to reduce and concentrate the flavor' },
        { order: 4, text: 'Whisk in a small pat of cold butter to thicken' },
        { order: 5, text: 'Season the sauce with salt and pepper' },
        { order: 6, text: 'Slice the rested steak against the grain', after: 1, before: 7 },
        { order: 7, text: 'Spoon the sauce over the sliced steak' },
      ],
      tip: 'Resting meat before cutting keeps the juices in the meat instead of on the cutting board.',
    },
  ],
};

// Can `step` be placed now, with `remaining` still unplaced (including
// `step` itself)? It can when nothing that has to come before it is
// still waiting. Returns that blocking step, or null when it's fine.
export function blockingStep(step, remaining) {
  const mustPrecede = (r) => {
    if (r === step) return false;
    if (r.before != null && step.order >= r.before) return true;      // r has to happen before this point
    if (step.before != null) return r.before == null && r.order <= (step.after ?? 0);
    if (r.before != null) return false;                               // a flexible step isn't due yet
    return r.order < step.order;                                      // same order = either way round
  };
  return remaining
    .filter(mustPrecede)
    .sort((a, b) => a.order - b.order)[0] || null;
}

export default RECIPE_BANK;
