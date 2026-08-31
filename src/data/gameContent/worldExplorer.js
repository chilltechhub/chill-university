// src/data/gameContent/worldExplorer.js
// World Explorer content (history, geography, civics, government), tiered
// by grade band. Shared quiz shape: { prompt, correct, options, explanation }.

export const WORLD_BANK = {
  'K-2': [
    { prompt: 'Who helps put out fires in your community?', correct: 'Firefighter', options: ['Firefighter', 'Teacher', 'Doctor', 'Chef'], explanation: 'Firefighters are trained to put out fires and keep people safe.' },
    { prompt: 'What is the bald eagle a symbol of?', correct: 'The United States', options: ['The United States', 'Canada', 'Mexico', 'France'], explanation: 'The bald eagle has been a national symbol of the U.S. since 1782.' },
    { prompt: 'A map uses colors and shapes to help you find your way. What do those usually show?', correct: 'Different places, like land and water', options: ['Different places, like land and water', 'The temperature outside', 'How loud a place is', 'What day it is'], explanation: 'Maps use colors and symbols to show land, water, roads, and more.' },
    { prompt: 'Who usually makes the rules a class follows?', correct: 'The teacher and the class together', options: ['The teacher and the class together', 'No one — there are no rules', 'Only the principal', 'Only the students'], explanation: "Classrooms often set rules together so everyone knows what's expected." },
    { prompt: 'What do we call the place where you live, like a city or town?', correct: 'A community', options: ['A community', 'A country', 'A continent', 'An ocean'], explanation: 'A community is a group of people who live in the same area.' },
    { prompt: 'Why do we celebrate holidays like Independence Day?', correct: 'To remember an important event in history', options: ['To remember an important event in history', 'Because school is closed', 'Just for fun with no reason', 'To try new foods'], explanation: 'Many holidays celebrate important moments from the past.' },
  ],

  '3-5': [
    { prompt: 'How many continents are there on Earth?', correct: '7', options: ['5', '6', '7', '8'], explanation: 'Earth has seven continents: Africa, Antarctica, Asia, Australia, Europe, North America, and South America.' },
    { prompt: 'What is the capital of the United States?', correct: 'Washington, D.C.', options: ['Washington, D.C.', 'New York City', 'Los Angeles', 'Chicago'], explanation: "Washington, D.C. is the nation's capital, home to the President and Congress." },
    { prompt: 'Who was the first President of the United States?', correct: 'George Washington', options: ['George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'Benjamin Franklin'], explanation: 'George Washington led the country as its first President starting in 1789.' },
    { prompt: 'What is a democracy?', correct: 'A government where citizens vote for their leaders', options: ['A government where citizens vote for their leaders', 'A government run by one king', 'A government with no leaders', 'A government run only by soldiers'], explanation: 'In a democracy, citizens have a voice by voting for their leaders.' },
    { prompt: 'What is the longest river in the world?', correct: 'The Nile', options: ['The Nile', 'The Amazon', 'The Mississippi', 'The Yangtze'], explanation: 'The Nile River in Africa is generally considered the longest river in the world.' },
    { prompt: 'What do we call the imaginary line that divides Earth into Northern and Southern halves?', correct: 'The Equator', options: ['The Equator', 'The Prime Meridian', 'The Arctic Circle', 'The Horizon'], explanation: 'The Equator circles the globe exactly halfway between the North and South Poles.' },
  ],

  '6-8': [
    { prompt: 'Which branch of the U.S. government makes laws?', correct: 'Legislative', options: ['Legislative', 'Executive', 'Judicial', 'Regional'], explanation: 'Congress (the Legislative branch) is responsible for writing and passing laws.' },
    { prompt: 'Which branch of government decides if a law is constitutional?', correct: 'Judicial', options: ['Judicial', 'Legislative', 'Executive', 'Diplomatic'], explanation: 'The Judicial branch, including the Supreme Court, interprets laws and the Constitution.' },
    { prompt: 'What historical period followed the Middle Ages in Europe, marked by a revival of art and learning?', correct: 'The Renaissance', options: ['The Renaissance', 'The Industrial Revolution', 'The Stone Age', 'The Cold War'], explanation: 'The Renaissance (14th-17th century) was a period of renewed interest in art, science, and classical learning.' },
    { prompt: 'What is the term for goods and services traded between countries?', correct: 'International trade', options: ['International trade', 'Domestic policy', 'Civil rights', 'Federalism'], explanation: 'International trade lets countries exchange goods and services with each other.' },
    { prompt: 'What was a main cause of the American Revolution?', correct: "Colonists' anger over taxation without representation", options: ["Colonists' anger over taxation without representation", 'A disagreement about which sport to play', 'A dispute over farming land in Canada', 'A trade war with Japan'], explanation: 'American colonists were upset about being taxed by Britain without having a voice in Parliament.' },
    { prompt: 'What do we call a government system where power is divided between a national government and states?', correct: 'Federalism', options: ['Federalism', 'Monarchy', 'Anarchy', 'Totalitarianism'], explanation: 'Federalism splits power between a central government and individual states.' },
  ],

  '9-12': [
    { prompt: 'What economic system is based on private ownership and free markets?', correct: 'Capitalism', options: ['Capitalism', 'Communism', 'Feudalism', 'Socialism'], explanation: 'Capitalism relies on private ownership of business and markets driven by supply and demand.' },
    { prompt: "What Supreme Court case established that 'separate but equal' was unconstitutional in public schools?", correct: 'Brown v. Board of Education', options: ['Brown v. Board of Education', 'Roe v. Wade', 'Marbury v. Madison', 'Miranda v. Arizona'], explanation: 'The 1954 Brown v. Board of Education ruling declared school segregation unconstitutional.' },
    { prompt: 'In psychology, what term describes learning through rewards and punishments?', correct: 'Operant conditioning', options: ['Operant conditioning', 'Classical conditioning', 'Cognitive dissonance', 'Confirmation bias'], explanation: 'Operant conditioning, studied by B.F. Skinner, shapes behavior through reinforcement and punishment.' },
    { prompt: 'What was the primary purpose of the United Nations when it was founded in 1945?', correct: 'To maintain international peace and cooperation', options: ['To maintain international peace and cooperation', 'To control global trade prices', 'To replace national governments', 'To fund space exploration'], explanation: 'The UN was founded after WWII to prevent future conflicts through diplomacy and cooperation.' },
    { prompt: "What is 'confirmation bias'?", correct: 'The tendency to favor information that confirms what you already believe', options: ['The tendency to favor information that confirms what you already believe', 'A law requiring government transparency', 'An economic policy about interest rates', 'A form of government censorship'], explanation: 'Confirmation bias causes people to seek out and remember information that supports their existing beliefs.' },
    { prompt: 'What historical event is widely seen as the start of Cold War tensions between the U.S. and Soviet Union?', correct: 'The end of World War II', options: ['The end of World War II', 'The signing of the Declaration of Independence', 'The fall of the Roman Empire', 'The invention of the telephone'], explanation: 'Post-WWII disagreements between the U.S. and Soviet Union over political systems sparked decades of Cold War tension.' },
  ],
};

export default WORLD_BANK;
