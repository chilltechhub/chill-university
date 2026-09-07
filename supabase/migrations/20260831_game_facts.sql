-- Per-game "Did You Know" facts — one pool per game, shown on that game's
-- grade-select start screen (src/components/GradeSelectCard.js via
-- src/logic/useGameFact.js). Reuses the existing app_content table from
-- 20260828_remote_content_config.sql: type='game_fact', key=<game id from
-- src/services/gameRegistry.js>. Add, edit, or deactivate rows any time —
-- the app picks it up on next launch, no build required. Keep facts short
-- (one or two sentences), accurate, and on-topic for that game's subject.
--
-- Apply this in the Supabase SQL editor, or via `supabase db push` if you
-- use the CLI locally with this project linked.

insert into public.app_content (type, key, body, sort_order) values
  -- factor — Factor Craft (Math · number sense)
  ('game_fact', 'factor', 'Zero is the only number that is neither positive nor negative — and it wasn''t even used in Europe until the 1200s.', 0),
  ('game_fact', 'factor', 'Every whole number greater than 1 is either prime or can be broken into a unique set of prime factors — that''s the Fundamental Theorem of Arithmetic.', 1),
  ('game_fact', 'factor', 'The "×" symbol for multiplication was introduced by mathematician William Oughtred in 1631.', 2),
  ('game_fact', 'factor', 'Division by zero is undefined because no number, multiplied by zero, can ever produce anything but zero.', 3),

  -- coin — Coin Game (Math · money)
  ('game_fact', 'coin', 'The U.S. penny costs more than one cent to make — mostly zinc with a thin copper coating.', 0),
  ('game_fact', 'coin', 'Making change with the fewest coins possible is called the "coin change problem" — computers solve it the same way you do, just faster.', 1),
  ('game_fact', 'coin', 'U.S. coins get their sizes from old British currency, which is why a dime is smaller than a penny even though it''s worth more.', 2),
  ('game_fact', 'coin', 'The ridges on the edges of dimes and quarters date back to when coins were made of real silver — the ridges made it obvious if someone had shaved metal off the edge.', 3),

  -- word — Word Detective (Language Arts · grammar)
  ('game_fact', 'word', 'English has eight traditional parts of speech: noun, pronoun, verb, adjective, adverb, preposition, conjunction, and interjection.', 0),
  ('game_fact', 'word', 'A word can be more than one part of speech depending on how it''s used — "run" is a verb in "I run" but a noun in "a home run."', 1),
  ('game_fact', 'word', 'Adverbs don''t just describe verbs — they can modify adjectives and other adverbs too, like "very" in "very quickly."', 2),
  ('game_fact', 'word', 'The word "set" has more distinct definitions than any other word in the English language, according to the Oxford English Dictionary.', 3),

  -- classify — Science Sort (Science · classification)
  ('game_fact', 'classify', 'Living things are sorted into kingdoms, then phylum, class, order, family, genus, and species — the more categories two organisms share, the more closely related they are.', 0),
  ('game_fact', 'classify', 'Matter is classified as a solid, liquid, or gas based on how tightly its particles are packed and how they move.', 1),
  ('game_fact', 'classify', 'A tomato is botanically a fruit — it grows from a flower and holds seeds — even though most people cook and classify it like a vegetable.', 2),
  ('game_fact', 'classify', 'Mushrooms aren''t plants or animals — they belong to their own kingdom, Fungi, because they get energy by absorbing nutrients rather than photosynthesizing or eating.', 3),

  -- recipe — Recipe Builder (Home Ec · sequencing)
  ('game_fact', 'recipe', 'Reading through an entire recipe before starting — called "mise en place" — is the single biggest habit that prevents kitchen mistakes.', 0),
  ('game_fact', 'recipe', 'The USDA recommends cooking ground beef to at least 160°F (71°C) to kill harmful bacteria.', 1),
  ('game_fact', 'recipe', 'Washing raw chicken before cooking actually spreads more bacteria around your sink and counters — cooking it to a safe temperature is what kills germs.', 2),
  ('game_fact', 'recipe', 'Letting meat "rest" for a few minutes after cooking lets its juices redistribute, instead of running out the moment you cut it.', 3),

  -- junk — Food Sort (Health · nutrition)
  ('game_fact', 'junk', 'MyPlate, the USDA''s nutrition guide, recommends filling half your plate with fruits and vegetables at each meal.', 0),
  ('game_fact', 'junk', 'Added sugar hides under more than 60 different names on ingredient labels, including "cane juice," "dextrose," and "maltose."', 1),
  ('game_fact', 'junk', 'Whole grains keep their bran and germ, which is where most of the fiber, vitamins, and minerals live — refining a grain strips those parts away.', 2),
  ('game_fact', 'junk', 'Fiber is the one nutrient that passes through your digestive system mostly undigested — and it''s exactly what helps keep it running smoothly.', 3),

  -- exercise — Exercise Match (Health · fitness)
  ('game_fact', 'exercise', 'The CDC recommends at least 150 minutes of moderate aerobic activity a week for adults — about 30 minutes, 5 days a week.', 0),
  ('game_fact', 'exercise', 'Strength training doesn''t just build muscle — it also increases bone density, which helps protect against fractures later in life.', 1),
  ('game_fact', 'exercise', 'A proper warm-up increases blood flow to your muscles and can measurably lower your risk of injury during a workout.', 2),
  ('game_fact', 'exercise', 'Cardio exercises like running and swimming train your heart and lungs; resistance exercises like push-ups train your muscles — a balanced routine uses both.', 3),

  -- budget — Budget Balance (Finance · budgeting)
  ('game_fact', 'budget', 'The 50/30/20 rule is a popular budgeting guideline: 50% of income to needs, 30% to wants, and 20% to savings or debt.', 0),
  ('game_fact', 'budget', 'A "need" is something required to live and work — housing, food, utilities — while a "want" makes life more enjoyable but isn''t essential.', 1),
  ('game_fact', 'budget', 'An emergency fund of 3–6 months of expenses is a common financial safety-net target, so an unexpected bill doesn''t turn into debt.', 2),
  ('game_fact', 'budget', 'Tracking every expense for just one month is often enough to reveal spending patterns most people had no idea they had.', 3),

  -- tools — Tool Match (Home Ec · tools)
  ('game_fact', 'tools', 'A Phillips-head screwdriver is designed to "cam out" — slip under too much torque — on purpose, to help prevent over-tightening from stripping the screw.', 0),
  ('game_fact', 'tools', 'Safety glasses protect against far more than dust — a huge share of home workshop eye injuries come from small flying debris you never saw coming.', 1),
  ('game_fact', 'tools', 'A claw hammer''s curved back isn''t just for looks — it''s built specifically to pull nails out using leverage.', 2),
  ('game_fact', 'tools', 'Using the wrong size wrench is one of the most common ways tools get damaged — a loose fit rounds off the bolt head instead of turning it.', 3),

  -- world — World Explorer (Social Studies · history/geography/civics)
  ('game_fact', 'world', 'The U.S. Constitution, ratified in 1788, is the oldest written national constitution still in continuous use in the world.', 0),
  ('game_fact', 'world', 'Russia spans 11 time zones — more than any other country on Earth.', 1),
  ('game_fact', 'world', 'Ancient Rome''s system of roads, aqueducts, and law codes influenced engineering and government for nearly two thousand years after the empire fell.', 2),
  ('game_fact', 'world', 'The three branches of the U.S. federal government — legislative, executive, and judicial — were designed specifically to check and balance each other''s power.', 3),

  -- art — Art & Music (Arts · color theory, instruments, movements)
  ('game_fact', 'art', 'On the color wheel, red and green are complementary colors — placed side by side, they make each other look more vivid.', 0),
  ('game_fact', 'art', 'A symphony orchestra is typically grouped into four families: strings, woodwinds, brass, and percussion.', 1),
  ('game_fact', 'art', 'The Impressionist movement got its name from a critic who meant it as an insult, mocking Monet''s painting "Impression, Sunrise."', 2),
  ('game_fact', 'art', 'Mixing all three primary colors of light — red, green, and blue — produces white, while mixing primary paint colors produces closer to black.', 3),

  -- tech — Tech Lab (Technology · coding logic, online safety)
  ('game_fact', 'tech', 'A "bug" in computer code got its name in 1947, when engineers found an actual moth stuck in a Harvard Mark II computer relay.', 0),
  ('game_fact', 'tech', 'A for-loop and a while-loop can often solve the exact same problem — the difference is usually just knowing in advance how many times you need to repeat.', 1),
  ('game_fact', 'tech', 'A strong password''s biggest strength isn''t special characters — it''s length. A long passphrase is typically harder to crack than a short, complex one.', 2),
  ('game_fact', 'tech', 'Binary code uses only two digits, 0 and 1, because computer circuits are built around two simple states: off and on.', 3),

  -- lingo — Lingo Match (Foreign Language · Spanish)
  ('game_fact', 'lingo', 'Spanish nouns are either masculine or feminine, and adjectives usually change their ending to match — "gato negro" but "gata negra."', 0),
  ('game_fact', 'lingo', '"Ser" and "estar" both mean "to be" in Spanish, but "ser" is for lasting traits while "estar" is for temporary states or locations.', 1),
  ('game_fact', 'lingo', 'Spanish is an official language in 20 countries — more than any language besides English.', 2),
  ('game_fact', 'lingo', 'Many English and Spanish words share Latin roots, which is why "nación/nation" and "información/information" look so similar.', 3),

  -- mindgym — Mind Gym (Mental Wellness · mindfulness, coping)
  ('game_fact', 'mindgym', 'Box breathing — inhale 4 seconds, hold 4, exhale 4, hold 4 — is a technique used by Navy SEALs to calm the body under stress.', 0),
  ('game_fact', 'mindgym', 'Naming an emotion out loud, a technique psychologists call "affect labeling," measurably reduces its intensity in brain-imaging studies.', 1),
  ('game_fact', 'mindgym', 'Regular mindfulness practice has been shown to physically thicken the prefrontal cortex, the brain region tied to focus and decision-making.', 2),
  ('game_fact', 'mindgym', 'Resilience isn''t a fixed trait you''re born with — research shows it''s built through coping skills that can be learned and practiced.', 3),

  -- people — People Skills (Social & Relationships · communication)
  ('game_fact', 'people', 'Active listening means reflecting back what you heard before responding — it''s one of the most reliable ways to avoid misunderstandings.', 0),
  ('game_fact', 'people', 'Studies suggest a large share of communication is nonverbal — tone, posture, and facial expression often carry as much meaning as the words themselves.', 1),
  ('game_fact', 'people', '"I feel" statements — like "I feel frustrated when..." instead of "You always..." — tend to lower defensiveness in a disagreement.', 2),
  ('game_fact', 'people', 'Empathy and sympathy aren''t the same thing: sympathy feels sorry for someone, while empathy tries to actually understand what they''re feeling.', 3),

  -- career — Career Compass (Career & Life Skills · career readiness)
  ('game_fact', 'career', 'A resume built around specific, measurable accomplishments ("increased sales 20%") is generally far more effective than one listing vague duties.', 0),
  ('game_fact', 'career', 'The "STAR" method — Situation, Task, Action, Result — is a widely used structure for answering interview questions clearly.', 1),
  ('game_fact', 'career', 'A "soft skill" like communication or teamwork is often just as important to employers as the technical skills listed in a job posting.', 2),
  ('game_fact', 'career', 'Networking accounts for a large share of how people actually find jobs — many openings are never even publicly posted.', 3),

  -- memory — Memory Match (General · matching)
  ('game_fact', 'memory', 'Your brain forms new connections between neurons every time you learn something — the more you review it, the stronger that connection gets.', 0),
  ('game_fact', 'memory', 'Chunking — grouping information into small clusters, like a phone number''s area code — makes it dramatically easier to remember.', 1),
  ('game_fact', 'memory', 'Working memory, the kind you use to hold a card''s position in mind for a few seconds, can typically hold only about 4–7 items at once.', 2),
  ('game_fact', 'memory', 'Spaced repetition — reviewing something right before you''d otherwise forget it — is one of the most well-studied ways to make memories stick long-term.', 3),

  -- build — Build It! (Technology · building)
  ('game_fact', 'build', 'Engineers use the design process — plan, build, test, improve — because almost no first version works perfectly on the first try.', 0),
  ('game_fact', 'build', 'A triangle is the strongest basic shape in construction because, unlike a square, its angles can''t shift without changing the length of a side.', 1),
  ('game_fact', 'build', 'Matching the right-shaped piece to the right slot is the same core idea behind real engineering "tolerances" — parts built to fit together precisely.', 2),
  ('game_fact', 'build', 'Load-bearing structures distribute weight downward through their strongest points — which is why support beams usually run straight, not at odd angles.', 3),

  -- trail — Budget Trail (Finance · strategy)
  ('game_fact', 'trail', 'A "running balance" is just your starting money plus every dollar in, minus every dollar out — the same math banks use on a checking account statement.', 0),
  ('game_fact', 'trail', 'Compound interest means you eventually earn interest on your interest, not just your original savings — which is why starting early matters so much.', 1),
  ('game_fact', 'trail', 'Prioritizing which expenses to cut first — wants before needs — is exactly the kind of decision real household budgets require every month.', 2),
  ('game_fact', 'trail', 'An unplanned expense is far less stressful to cover when it''s the reason you built an emergency fund in the first place.', 3),

  -- codebreaker — Code Breaker (Math · logic)
  ('game_fact', 'codebreaker', 'The board game Mastermind, invented in 1970, uses the exact same "guess and get feedback" logic as most secret-code deduction puzzles.', 0),
  ('game_fact', 'codebreaker', 'Deductive reasoning starts from general rules and narrows to a specific answer — it''s the same logic detectives and codebreakers both rely on.', 1),
  ('game_fact', 'codebreaker', 'During World War II, codebreakers at Bletchley Park cracked Germany''s Enigma cipher, using early computers and pure logical deduction.', 2),
  ('game_fact', 'codebreaker', 'The fastest way to narrow down a secret code isn''t random guessing — it''s picking guesses that eliminate the most possibilities regardless of the outcome.', 3),

  -- bugsquash — Bug Squash (Science · arcade, just for fun)
  ('game_fact', 'bugsquash', 'Insects are the most diverse group of animals on Earth — scientists have identified over a million species, with many more still undiscovered.', 0),
  ('game_fact', 'bugsquash', 'A ladybug isn''t a pest at all — it''s a predator that can eat over 5,000 aphids in its lifetime, making it a gardener''s best friend.', 1),
  ('game_fact', 'bugsquash', 'Ants can carry objects many times their own body weight, thanks to their small size and proportionally powerful muscles.', 2),
  ('game_fact', 'bugsquash', 'Most garden "bugs" people squash are actually beneficial — true agricultural pests are a small minority of all insect species.', 3),

  -- snackcatch — Snack Catch (Health · arcade)
  ('game_fact', 'snackcatch', 'Fruits and vegetables are naturally high in fiber and water, which is a big part of why they help you feel full on fewer calories.', 0),
  ('game_fact', 'snackcatch', 'A food''s ingredient list is ordered by weight — the first ingredient is what there''s the most of in the product.', 1),
  ('game_fact', 'snackcatch', 'Nuts and seeds are calorie-dense but nutrient-rich, packed with healthy fats, protein, and fiber in a small serving.', 2),
  ('game_fact', 'snackcatch', 'Drinking water instead of sugary soda is one of the single biggest changes you can make to cut added sugar from your day.', 3),

  -- reflexrush — Reflex Rush (Technology · arcade)
  ('game_fact', 'reflexrush', 'The average human reaction time to a visual signal is around 200–250 milliseconds — a bit slower than a blink of an eye.', 0),
  ('game_fact', 'reflexrush', 'Reaction time to sound is typically faster than reaction time to light, because auditory signals take a slightly more direct path through the brain.', 1),
  ('game_fact', 'reflexrush', 'Reaction time isn''t fixed — it measurably improves with practice, which is exactly why reflex-training games work.', 2),
  ('game_fact', 'reflexrush', 'Elite athletes and gamers often have reaction times 30–50 milliseconds faster than an average adult, from years of trained practice.', 3),

  -- speedracer — Speed Racer (General · racing)
  ('game_fact', 'speedracer', 'Stopping distance grows much faster than speed does — doubling your speed roughly quadruples the distance needed to stop.', 0),
  ('game_fact', 'speedracer', 'Defensive driving means constantly scanning ahead for hazards, not just reacting to the car directly in front of you.', 1),
  ('game_fact', 'speedracer', 'The "3-second rule" is a simple way to judge safe following distance: pick a fixed point, and count to 3 after the car ahead passes it.', 2),
  ('game_fact', 'speedracer', 'Peripheral vision — seeing motion at the edge of your sight — is what lets a driver notice a hazard before it''s directly in front of them.', 3),

  -- scramble — Word Scramble (Language Arts · vocabulary)
  ('game_fact', 'scramble', 'The longest commonly used English word without repeating any letter is "uncopyrightable," at 15 letters.', 0),
  ('game_fact', 'scramble', 'A "pangram" is a sentence using every letter of the alphabet at least once — "The quick brown fox jumps over the lazy dog" is a classic example.', 1),
  ('game_fact', 'scramble', 'Anagram solving and word unscrambling both rely on the same skill: recognizing common letter patterns like "-ing," "-tion," and "th-."', 2),
  ('game_fact', 'scramble', 'English borrows words from over 350 other languages, which is part of why its spelling can be so unpredictable.', 3),

  -- survival — Wild Survival (Science · survival)
  ('game_fact', 'survival', 'The "Rule of Threes" in survival situations: roughly 3 minutes without air, 3 hours without shelter in extreme conditions, 3 days without water, 3 weeks without food.', 0),
  ('game_fact', 'survival', 'Finding a clean water source is usually a higher survival priority than food, since dehydration can become dangerous far faster than hunger.', 1),
  ('game_fact', 'survival', 'Moss doesn''t reliably grow only on the north side of trees — a common survival myth — but the sun''s position is a much more reliable way to find direction.', 2),
  ('game_fact', 'survival', 'Staying put and signaling for help is often safer than wandering when lost, since it''s easier for rescuers to search a smaller area.', 3),

  -- factbattle — Fact Battle (Science · animal stats)
  ('game_fact', 'factbattle', 'The cheetah is the fastest land animal, able to reach speeds of about 60–70 mph in short bursts.', 0),
  ('game_fact', 'factbattle', 'The blue whale is the largest animal ever known to exist — larger than any dinosaur — with a heart the size of a small car.', 1),
  ('game_fact', 'factbattle', 'An elephant''s trunk contains no bones at all — it''s made up of roughly 40,000 individual muscles.', 2),
  ('game_fact', 'factbattle', 'The peregrine falcon is the fastest animal on Earth in a dive, reaching speeds over 240 mph when hunting.', 3),

  -- freethrow — Free Throw Frenzy (Health · sports)
  ('game_fact', 'freethrow', 'A regulation basketball hoop sits exactly 10 feet off the ground — a height set in 1891 and never changed since.', 0),
  ('game_fact', 'freethrow', 'Professional NBA players typically make around 75–80% of their free throws, a stat teams track closely called free-throw percentage.', 1),
  ('game_fact', 'freethrow', 'A consistent pre-shot routine — like dribbling the same number of times before every free throw — is a technique many top shooters use to build muscle memory.', 2),
  ('game_fact', 'freethrow', 'Backspin on a shot helps a basketball bounce more predictably off the rim, which is why coaches teach a smooth wrist-snap follow-through.', 3)
on conflict do nothing;
