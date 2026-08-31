// src/data/gameContent/lingoMatch.js
// Lingo Match content — Spanish vocabulary and grammar, tiered by grade band.

export const LINGO_BANK = {
  'K-2': [
    { prompt: "What does 'rojo' mean in English?", correct: 'Red', options: ['Red', 'Blue', 'Green', 'Yellow'], explanation: "'Rojo' is the Spanish word for red." },
    { prompt: "What does 'perro' mean in English?", correct: 'Dog', options: ['Dog', 'Cat', 'Bird', 'Fish'], explanation: "'Perro' is the Spanish word for dog." },
    { prompt: "How do you say 'three' in Spanish?", correct: 'Tres', options: ['Tres', 'Dos', 'Cuatro', 'Cinco'], explanation: "'Tres' means three in Spanish." },
    { prompt: "What does 'gato' mean in English?", correct: 'Cat', options: ['Cat', 'Dog', 'Mouse', 'Rabbit'], explanation: "'Gato' is the Spanish word for cat." },
    { prompt: "How do you say 'hello' in Spanish?", correct: 'Hola', options: ['Hola', 'Adiós', 'Gracias', 'Por favor'], explanation: "'Hola' is how you say hello in Spanish." },
    { prompt: "What does 'azul' mean in English?", correct: 'Blue', options: ['Blue', 'Red', 'Purple', 'Black'], explanation: "'Azul' is the Spanish word for blue." },
  ],

  '3-5': [
    { prompt: "What does 'familia' mean in English?", correct: 'Family', options: ['Family', 'Friend', 'Food', 'Home'], explanation: "'Familia' is the Spanish word for family." },
    { prompt: "How do you say 'thank you' in Spanish?", correct: 'Gracias', options: ['Gracias', 'Hola', 'Adiós', 'Sí'], explanation: "'Gracias' means thank you in Spanish." },
    { prompt: "What does 'manzana' mean in English?", correct: 'Apple', options: ['Apple', 'Banana', 'Orange', 'Grape'], explanation: "'Manzana' is the Spanish word for apple." },
    { prompt: "How would you ask 'How are you?' in Spanish?", correct: '¿Cómo estás?', options: ['¿Cómo estás?', '¿Qué hora es?', '¿Dónde está?', '¿Cuánto cuesta?'], explanation: "'¿Cómo estás?' is a common way to ask someone how they are doing." },
    { prompt: "What does 'escuela' mean in English?", correct: 'School', options: ['School', 'House', 'Store', 'Park'], explanation: "'Escuela' is the Spanish word for school." },
    { prompt: "How do you say 'good morning' in Spanish?", correct: 'Buenos días', options: ['Buenos días', 'Buenas noches', 'Buenas tardes', 'Hasta luego'], explanation: "'Buenos días' means good morning in Spanish." },
  ],

  '6-8': [
    { prompt: "What is the correct form of 'hablar' (to speak) for 'yo' (I)?", correct: 'Hablo', options: ['Hablo', 'Hablas', 'Habla', 'Hablan'], explanation: "'Yo hablo' means 'I speak' — regular -ar verbs drop the -ar and add -o for 'yo'." },
    { prompt: "What does 'nosotros' mean in English?", correct: 'We', options: ['We', 'They', 'You', 'He'], explanation: "'Nosotros' is the Spanish pronoun for 'we' (masculine or mixed group)." },
    { prompt: "What is the correct form of 'comer' (to eat) for 'tú' (you)?", correct: 'Comes', options: ['Comes', 'Como', 'Come', 'Comen'], explanation: "'Tú comes' means 'you eat' — regular -er verbs add -es for 'tú'." },
    { prompt: "What does '¿Por qué?' mean in English?", correct: 'Why?', options: ['Why?', 'Where?', 'When?', 'Who?'], explanation: "'¿Por qué?' is how you ask 'why?' in Spanish." },
    { prompt: "What is the correct form of 'vivir' (to live) for 'ella' (she)?", correct: 'Vive', options: ['Vive', 'Vivo', 'Vives', 'Viven'], explanation: "'Ella vive' means 'she lives' — regular -ir verbs add -e for 'él/ella'." },
    { prompt: "What does 'ayer' mean in English?", correct: 'Yesterday', options: ['Yesterday', 'Today', 'Tomorrow', 'Always'], explanation: "'Ayer' means yesterday in Spanish." },
  ],

  '9-12': [
    { prompt: "How would you translate 'I went to the store yesterday' into Spanish?", correct: 'Fui a la tienda ayer', options: ['Fui a la tienda ayer', 'Voy a la tienda mañana', 'Iré a la tienda hoy', 'Fue a la tienda ayer'], explanation: "'Fui' is the first-person past tense (preterite) of 'ir' (to go) — 'I went'." },
    { prompt: "What does the idiom 'estar en las nubes' express?", correct: 'Daydreaming or being distracted', options: ['Daydreaming or being distracted', 'Being very angry', 'Being extremely tired', 'Being very hungry'], explanation: "'Estar en las nubes' literally means 'to be in the clouds' and is used to describe someone daydreaming." },
    { prompt: "What is the correct preterite (past tense) form of 'hablar' for 'ellos' (they)?", correct: 'Hablaron', options: ['Hablaron', 'Hablan', 'Hablaban', 'Hablaría'], explanation: "'Ellos hablaron' means 'they spoke' — the preterite ending for regular -ar verbs with 'ellos' is -aron." },
    { prompt: "How would you politely say 'I would like a coffee, please' in Spanish?", correct: 'Me gustaría un café, por favor', options: ['Me gustaría un café, por favor', 'Quiero café ahora', 'Dame café', 'No quiero café'], explanation: "'Me gustaría' is a polite conditional form meaning 'I would like'." },
    { prompt: "What does the subjunctive mood generally express, as in 'Espero que vengas'?", correct: 'Wishes, doubts, or uncertainty', options: ['Wishes, doubts, or uncertainty', 'Simple factual statements', 'Commands only', 'Past completed actions'], explanation: "The subjunctive mood expresses wishes, doubts, emotions, or uncertain situations — 'Espero que vengas' means 'I hope that you come.'" },
    { prompt: "What does 'costar un ojo de la cara' mean?", correct: 'To be very expensive', options: ['To be very expensive', 'To hurt your eye', 'To be very cheap', 'To be difficult to see'], explanation: "This idiom literally means 'to cost an eye from your face' — used when something is extremely expensive." },
  ],
};

export default LINGO_BANK;
