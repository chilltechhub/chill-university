// src/data/gameContent/foodSort.js
// Food Sort content, tiered by grade band. All tiers use the same three
// categories — higher bands just use less obvious, more realistic foods.

export const CAT_LIST = ['Healthy', 'Moderate', 'Junk'];

export const FOOD_BANK = {
  'K-2': [
    { food: '🍎 Apple',     category: 'Healthy', emoji: '🍎', fact: 'Apples contain fiber that helps digestion.' },
    { food: '🥦 Broccoli',  category: 'Healthy', emoji: '🥦', fact: 'Broccoli has more vitamin C than an orange!' },
    { food: '🥕 Carrot',    category: 'Healthy', emoji: '🥕', fact: 'Carrots boost night vision thanks to beta-carotene.' },
    { food: '🍔 Burger',    category: 'Junk',    emoji: '🍔', fact: 'Burgers are high in saturated fat and sodium.' },
    { food: '🍭 Lollipop',  category: 'Junk',    emoji: '🍭', fact: 'Sugar spikes blood sugar quickly.' },
    { food: '🍟 Fries',     category: 'Junk',    emoji: '🍟', fact: 'Deep frying removes most nutrients from potatoes.' },
    { food: '🍇 Grapes',    category: 'Healthy', emoji: '🍇', fact: 'Grapes contain antioxidants that fight disease.' },
    { food: '🥤 Soda',      category: 'Junk',    emoji: '🥤', fact: 'A can of soda has about 10 teaspoons of sugar.' },
    { food: '🍦 Ice Cream', category: 'Junk',    emoji: '🍦', fact: 'Ice cream is mostly sugar and saturated fat.' },
    { food: '🐟 Fish',      category: 'Healthy', emoji: '🐟', fact: 'Fish provides omega-3 fatty acids for brain health.' },
    { food: '🥚 Egg',       category: 'Healthy', emoji: '🥚', fact: 'Eggs are a complete protein with all amino acids.' },
    { food: '🍰 Cake',      category: 'Junk',    emoji: '🍰', fact: 'Cake is mostly refined flour and sugar.' },
  ],

  '3-5': [
    { food: '🍕 Pizza',    category: 'Moderate', emoji: '🍕', fact: 'Pizza can be healthy with veggie toppings and less cheese.' },
    { food: '🌮 Taco',      category: 'Moderate', emoji: '🌮', fact: 'Tacos can include healthy beans and veggies.' },
    { food: '🧃 Juice',     category: 'Moderate', emoji: '🧃', fact: 'Juice has vitamins but often lacks the fiber whole fruit has.' },
    { food: '🍫 Chocolate', category: 'Moderate', emoji: '🍫', fact: 'Dark chocolate has antioxidants — in small amounts!' },
    { food: '🥑 Avocado',   category: 'Healthy',  emoji: '🥑', fact: 'Avocados are full of healthy monounsaturated fats.' },
    { food: '🫘 Beans',     category: 'Healthy',  emoji: '🫘', fact: 'Beans are high in protein and fiber.' },
    { food: '🥜 Peanuts',   category: 'Healthy',  emoji: '🥜', fact: 'Peanuts are protein-packed and heart-healthy.' },
    { food: '🥓 Bacon',     category: 'Junk',     emoji: '🥓', fact: 'Bacon is very high in sodium and processed fat.' },
    { food: '🧀 Cheese',    category: 'Moderate', emoji: '🧀', fact: 'Cheese has calcium and protein, but also a lot of saturated fat.' },
    { food: '🍞 White Bread', category: 'Moderate', emoji: '🍞', fact: 'White bread is refined — less fiber than whole grain.' },
    { food: '🌭 Hot Dog',   category: 'Junk',     emoji: '🌭', fact: 'Hot dogs are heavily processed and high in sodium.' },
    { food: '🥣 Yogurt',    category: 'Healthy',  emoji: '🥣', fact: 'Plain yogurt has protein and probiotics for gut health.' },
    { food: '🥨 Pretzels',  category: 'Moderate', emoji: '🥨', fact: 'Pretzels are low-fat but high in sodium.' },
    { food: '🍗 Fried Chicken', category: 'Junk', emoji: '🍗', fact: 'Frying adds a lot of extra fat and calories.' },
  ],

  '6-8': [
    { food: '🍫 Granola Bar',  category: 'Moderate', emoji: '🍫', fact: "Many granola bars have as much sugar as a candy bar — check the label." },
    { food: '🥜 Trail Mix',     category: 'Moderate', emoji: '🥜', fact: 'Nuts are healthy, but added candy and dried fruit push it to moderate.' },
    { food: '🍞 Whole Wheat Bread', category: 'Healthy', emoji: '🍞', fact: 'Whole grains keep the fiber-rich bran and germ, unlike white bread.' },
    { food: '🥤 Sports Drink',  category: 'Junk',     emoji: '🥤', fact: 'Sports drinks are mostly sugar water — only useful for intense, long exercise.' },
    { food: '🍦 Flavored Yogurt', category: 'Moderate', emoji: '🍦', fact: 'Flavored yogurts often add as much sugar as dessert.' },
    { food: '🍇 Dried Fruit',   category: 'Moderate', emoji: '🍇', fact: 'Drying concentrates the natural sugar — easy to overeat.' },
    { food: '🧃 100% Fruit Juice', category: 'Moderate', emoji: '🧃', fact: 'Even 100% juice is concentrated sugar without the fiber of whole fruit.' },
    { food: '🥔 Veggie Chips',  category: 'Moderate', emoji: '🥔', fact: "They're still fried and salted — not much different from regular chips." },
    { food: '🦃 Turkey Breast', category: 'Healthy',  emoji: '🦃', fact: 'Lean turkey is a low-fat, high-protein choice.' },
    { food: '🧈 Margarine',     category: 'Junk',     emoji: '🧈', fact: 'Many margarines are high in processed fats — read the label.' },
    { food: '🍚 White Rice',    category: 'Moderate', emoji: '🍚', fact: 'White rice is refined — brown rice keeps more fiber and nutrients.' },
    { food: '🥛 Whole Milk',    category: 'Moderate', emoji: '🥛', fact: 'Whole milk has good calcium but more saturated fat than low-fat milk.' },
    { food: '🍿 Buttered Popcorn', category: 'Moderate', emoji: '🍿', fact: 'Plain popcorn is a whole grain — butter and salt push it to moderate.' },
    { food: '🐟 Canned Tuna',   category: 'Healthy',  emoji: '🐟', fact: 'Tuna is lean protein and omega-3s — great in moderation.' },
  ],

  '9-12': [
    { food: '🍠 Sweet Potato',      category: 'Healthy',  emoji: '🍠', fact: 'Sweet potatoes have a lower glycemic index than white potatoes, so blood sugar rises more slowly.' },
    { food: '🥤 Diet Soda',         category: 'Moderate', emoji: '🥤', fact: 'Diet soda skips the sugar, but the artificial sweeteners and acidity can still add up with heavy use.' },
    { food: '🍔 Plant-Based Burger',category: 'Moderate', emoji: '🍔', fact: 'Plant-based burgers skip animal fat but are often highly processed with extra sodium.' },
    { food: '🌾 Quinoa',            category: 'Healthy',  emoji: '🌾', fact: 'Quinoa is a complete protein — it has all nine essential amino acids, which is rare for a plant food.' },
    { food: '🍫 Protein Bar',       category: 'Moderate', emoji: '🍫', fact: 'Many protein bars are closer to a candy bar once you count the added sugar and sugar alcohols.' },
    { food: '🥩 Processed Deli Meat', category: 'Junk',   emoji: '🥩', fact: 'Processed meats are linked to higher health risks from nitrates and very high sodium.' },
    { food: '🫒 Olive Oil',         category: 'Healthy',  emoji: '🫒', fact: 'Olive oil is rich in monounsaturated fats, which support heart health.' },
    { food: '🍟 Air-Fried Fries',   category: 'Moderate', emoji: '🍟', fact: 'Air-frying uses far less oil than deep frying, but fries are still a refined-carb source.' },
    { food: '🥤 Energy Drink',      category: 'Junk',     emoji: '🥤', fact: 'Energy drinks combine high sugar (or sweeteners) with high caffeine, which can strain the heart in excess.' },
    { food: '🍞 Sourdough Bread',   category: 'Moderate', emoji: '🍞', fact: 'Fermentation can make sourdough easier to digest, but it is still a refined-ish carbohydrate.' },
  ],
};

export const NUTRITION_TIPS = [
  '💡 Calcium from milk and cheese makes your bones strong!',
  '💡 Fiber from fruits and veggies keeps your digestion healthy.',
  '💡 Protein helps repair your muscles after exercise.',
  '💡 Whole grains keep you full longer than refined ones.',
  '💡 Drinking water instead of soda saves a lot of added sugar.',
  '💡 "Healthy", "moderate", and "junk" are about how OFTEN to eat something, not that any food is forbidden.',
];

export default FOOD_BANK;
