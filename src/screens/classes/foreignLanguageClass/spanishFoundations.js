// src/screens/classes/foreignLanguageClass/spanishFoundations.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
  {
    key: 'greetingsManners',
    title: 'Greetings, Feelings & Manners',
    grade: 'K-2',
    color: '#FF6B6B',
    description:
      'The first building blocks of Spanish conversation: saying hello and goodbye, asking how someone feels, and using polite words like "please" and "thank you."',
    learn: [
      { heading: 'Say Hello & Ask How Someone Feels', body: '"¡Hola!" means Hello! "¿Cómo estás?" means How are you? and "Estoy bien" or "Estoy feliz" means I am good / I am happy. These four phrases are enough to start a real conversation in Spanish.' },
      { heading: 'Manners Matter Everywhere', body: '"Gracias" means Thank you, and "Por favor" means Please. Using them is just as important in Spanish as it is in English — they show respect and make people want to keep talking with you.' },
    ],
    practice: [
      { question: 'How do you say "Thank you" in Spanish?', options: ['Por favor', 'Gracias', 'Hola', 'Adiós'], answerIndex: 1, explanation: '"Gracias" means "thank you"; "por favor" means "please."' },
      { question: 'What does "¿Cómo estás?" mean?', options: ['What is your name?', 'How are you?', 'Where do you live?', 'Goodbye'], answerIndex: 1, explanation: '"¿Cómo estás?" is how you ask someone how they are feeling.' },
    ],
    apply: {
      prompt: 'Record a 5-second voice note greeting someone in Spanish, asking how they are, and saying goodbye ("¡Hola! ¿Cómo estás? ¡Adiós!").',
      checklist: ['Said "¡Hola!"', 'Asked "¿Cómo estás?"', 'Said "¡Adiós!" to close'],
    },
    help: {
      videos: [
        { title: '¡Hola! Spanish Greetings Song for Kids | Saludos en Español para Niños', url: 'https://www.youtube.com/watch?v=PAbcvJAEoEE' },
        { title: 'Hola Hola ¿Cómo Estás? | Spanish Greeting Song for Kids', url: 'https://www.youtube.com/watch?v=_7ef62sjZP8' },
      ],
    },
  },
  {
    key: 'colorsNumbersFamily',
    title: 'Colors, Numbers & Family Words',
    grade: '3-5',
    color: '#4D96FF',
    description:
      'Core vocabulary for describing the world around you: counting, naming colors, and talking about family members — plus how Spanish word order differs from English.',
    learn: [
      { heading: 'Counting and Coloring in Spanish', body: 'Numbers 1–5 are uno, dos, tres, cuatro, cinco. Colors include rojo (red), azul (blue), verde (green), and amarillo (yellow). Once you know a handful of nouns, colors and numbers let you describe almost anything.' },
      { heading: 'Colors Go AFTER the Noun', body: 'In English we say "the red car," but in Spanish the adjective usually comes after the noun: "el carro rojo" (literally "the car red"). Family words like madre (mother), padre (father), and hermano/hermana (brother/sister) follow normal noun rules too.' },
    ],
    practice: [
      { question: 'Translate into English: "Tengo un hermano."', options: ['I have a sister.', 'I have one brother.', 'I am a brother.', 'He has one brother.'], answerIndex: 1, explanation: '"Tengo" = I have, "un hermano" = one brother.' },
      { question: 'How do you say "the red car" in Spanish?', options: ['El rojo carro', 'El carro rojo', 'Rojo el carro', 'Carro el rojo'], answerIndex: 1, explanation: 'In Spanish, most adjectives (like colors) come after the noun: "el carro rojo."' },
    ],
    apply: {
      prompt: 'Point to 3 colored items in your room and say their color out loud in Spanish while recording a short clip.',
      checklist: ['Named 3 different colored items', 'Used the correct Spanish color word for each', 'Said each sentence with the color after the noun'],
    },
    help: {
      videos: [
        { title: 'Learn Spanish for Kids - Numbers, Colors & More', url: 'https://www.youtube.com/watch?v=8yuiUvi568I' },
        { title: 'Learn the Colors in Spanish - Spanish Vocab for Kids', url: 'https://www.youtube.com/watch?v=Lf60AKfbaEo' },
      ],
    },
  },
  {
    key: 'dailyRoutinesVerbs',
    title: 'Descriptive Sentences & Daily Routines',
    grade: '6-8',
    color: '#3AC860',
    description:
      'Building real sentences by conjugating regular -AR verbs to describe daily routines and activities.',
    learn: [
      { heading: 'Conjugating -AR Verbs', body: 'Regular Spanish verbs end in -ar, -er, or -ir. For -ar verbs, drop the -ar and add a new ending based on who\'s doing the action: hablar (to speak) becomes yo hablo (I speak), tú hablas (you speak), él/ella habla (he/she speaks).' },
      { heading: 'Everyday Verbs Build Everyday Sentences', body: 'Common -ar verbs like estudiar (to study), escuchar (to listen), and caminar (to walk) let you describe a whole daily routine once you know the conjugation pattern — it applies the same way to every regular -ar verb.' },
    ],
    practice: [
      { question: 'What is the correct form of necesitar (to need) for "I need"?', options: ['Yo necesita', 'Yo necesito', 'Tú necesitas', 'Él necesito'], answerIndex: 1, explanation: 'Drop -ar from necesitar and add -o for "yo": necesito.' },
      { question: 'How do you conjugate hablar for "tú" (you)?', options: ['Hablo', 'Hablas', 'Habla', 'Hablan'], answerIndex: 1, explanation: 'For "tú," drop -ar and add -as: hablas.' },
    ],
    apply: {
      prompt: 'Write 3 sentences in Spanish describing your daily schedule using common -ar verbs (estudiar, comer, escuchar, caminar).',
      checklist: ['Wrote 3 complete Spanish sentences', 'Used a different -ar verb correctly conjugated in each', 'Sentences describe real parts of your day'],
    },
    help: {
      videos: [
        { title: 'SPANISH VERBS EXPLAINED! - Conjugate AR Verbs', url: 'https://www.youtube.com/watch?v=oEVfwmt0oVA' },
      ],
    },
  },
  {
    key: 'orderingFoodPoliteRequests',
    title: 'Ordering Food & Polite Requests',
    grade: '9-12',
    color: '#8B4FC4',
    description:
      'Real-world conversational Spanish: ordering a meal, making polite requests, and using formal address with waitstaff or strangers.',
    learn: [
      { heading: 'Making Polite Requests', body: '"Quisiera..." means I would like... — a softer, more polite way to ask than "quiero" (I want). "¿Me trae...?" means Could you bring me...? and "La cuenta, por favor" means The bill, please.' },
      { heading: 'Formal vs. Informal "You"', body: 'Spanish has two ways to say "you": tú (informal, for friends) and usted (formal, for strangers, elders, or service staff). Restaurant conversations almost always use the formal usted forms as a sign of respect.' },
    ],
    practice: [
      { question: 'Translate to Spanish: "I would like a water, please."', options: ['Quiero un agua.', 'Quisiera un agua, por favor.', 'Necesito un agua, gracias.', 'Un agua, ahora.'], answerIndex: 1, explanation: '"Quisiera" is the polite conditional form of "quiero," and "por favor" adds "please."' },
      { question: 'When ordering at a restaurant, which form of "you" should you typically use with the waiter?', options: ['Tú', 'Usted (formal)', 'Vosotros', 'Neither — skip it'], answerIndex: 1, explanation: 'Usted is the polite, formal form used with strangers and service staff.' },
    ],
    apply: {
      prompt: 'Record a 15-second audio snippet simulating ordering a full meal — one drink, one main dish, and asking for the check — in Spanish.',
      checklist: ['Ordered a drink using "quisiera"', 'Ordered a main dish', 'Asked for the bill with "la cuenta, por favor"'],
    },
    help: {
      videos: [
        { title: 'Spanish for Beginners: Ordering Food at a Restaurant', url: 'https://www.youtube.com/watch?v=xZCW3bnq5ds' },
        { title: 'How to Order Food in Spanish: Restaurant Vocab & Phrases', url: 'https://www.youtube.com/watch?v=t8V2Gw8MyiM' },
      ],
    },
  },
];

export default function ForeignLanguageScreen() {
  return <ClassTopicScreen title={'Foreign Language (Spanish)'} classKey="ForeignLanguage" fallbackTopics={topics} />;
}
