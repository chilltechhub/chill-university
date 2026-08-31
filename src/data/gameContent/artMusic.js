// src/data/gameContent/artMusic.js
// Art & Music content, tiered by grade band.

export const ART_BANK = {
  'K-2': [
    { prompt: 'Mixing blue and yellow paint makes what color?', correct: 'Green', options: ['Green', 'Purple', 'Orange', 'Brown'], explanation: 'Blue and yellow are primary colors that combine to make green.' },
    { prompt: 'Which instrument has black and white keys?', correct: 'Piano', options: ['Piano', 'Drum', 'Guitar', 'Flute'], explanation: 'A piano has black and white keys you press to make sound.' },
    { prompt: 'What do you call a picture made by painting?', correct: 'A painting', options: ['A painting', 'A sculpture', 'A song', 'A poem'], explanation: 'Artwork made with paint is called a painting.' },
    { prompt: 'Which instrument do you blow into to make music?', correct: 'Flute', options: ['Flute', 'Drum', 'Piano', 'Xylophone'], explanation: 'A flute makes sound when you blow air across its opening.' },
    { prompt: 'What are the three primary colors?', correct: 'Red, blue, and yellow', options: ['Red, blue, and yellow', 'Green, orange, and purple', 'Black, white, and gray', 'Pink, brown, and teal'], explanation: "Red, blue, and yellow are primary colors — they can't be made by mixing other colors." },
    { prompt: 'What do you call music with no words, played only by instruments?', correct: 'Instrumental music', options: ['Instrumental music', 'A cappella', 'Rap', 'Lyrics'], explanation: 'Instrumental music is played using instruments only, without singing.' },
  ],

  '3-5': [
    { prompt: 'What do sculptors mainly use to shape clay?', correct: 'Their hands and sculpting tools', options: ['Their hands and sculpting tools', 'A paintbrush only', 'A camera', 'A microphone'], explanation: 'Sculptors shape materials like clay using their hands and special tools.' },
    { prompt: 'What word describes how fast or slow a piece of music is played?', correct: 'Tempo', options: ['Tempo', 'Pitch', 'Volume', 'Harmony'], explanation: 'Tempo is the speed of the music — fast or slow.' },
    { prompt: 'Which art style uses tiny dots to create a picture?', correct: 'Pointillism', options: ['Pointillism', 'Cubism', 'Realism', 'Abstract'], explanation: 'Pointillism is a technique where small dots of color combine to form an image.' },
    { prompt: 'What do we call a large group of musicians playing instruments like violins and cellos together?', correct: 'An orchestra', options: ['An orchestra', 'A choir', 'A band only', 'A solo act'], explanation: 'An orchestra is a large group of musicians playing different instruments together.' },
    { prompt: 'What is it called when an artist draws the same object repeatedly to practice?', correct: 'Sketching', options: ['Sketching', 'Framing', 'Glazing', 'Etching'], explanation: 'Sketching is quick, practice drawing, often used to plan a final artwork.' },
    { prompt: 'In music, what do we call the pattern of beats?', correct: 'Rhythm', options: ['Rhythm', 'Melody', 'Tone', 'Key'], explanation: 'Rhythm is the pattern of long and short sounds and silences in music.' },
  ],

  '6-8': [
    { prompt: 'Which art movement is famous for melting clocks and dreamlike scenes, led by Salvador Dalí?', correct: 'Surrealism', options: ['Surrealism', 'Impressionism', 'Cubism', 'Realism'], explanation: 'Surrealism explored dreams and the unconscious mind through strange, dreamlike imagery.' },
    { prompt: "What's the difference between a major and minor musical key?", correct: 'Major often sounds happy, minor often sounds sad', options: ['Major often sounds happy, minor often sounds sad', 'Major is always louder', 'Minor has no rhythm', 'Major only uses drums'], explanation: 'Major keys tend to sound bright and happy, while minor keys often sound darker or sadder.' },
    { prompt: "Which composer wrote the famous 'Symphony No. 9' while going deaf?", correct: 'Ludwig van Beethoven', options: ['Ludwig van Beethoven', 'Wolfgang Amadeus Mozart', 'Johann Sebastian Bach', 'Frédéric Chopin'], explanation: 'Beethoven composed some of his greatest works, including Symphony No. 9, after losing most of his hearing.' },
    { prompt: 'What painting technique uses thick layers of paint for texture?', correct: 'Impasto', options: ['Impasto', 'Fresco', 'Watercolor', 'Etching'], explanation: 'Impasto involves applying paint thickly so brush or palette-knife strokes are visible.' },
    { prompt: 'What art movement, led by Picasso, broke objects into geometric shapes shown from multiple angles?', correct: 'Cubism', options: ['Cubism', 'Pointillism', 'Baroque', 'Minimalism'], explanation: 'Cubism represented subjects from many viewpoints at once using geometric forms.' },
    { prompt: "In music, what is a 'chord'?", correct: 'Three or more notes played together', options: ['Three or more notes played together', 'A single note played alone', 'A type of drum', 'The speed of a song'], explanation: 'A chord is a combination of multiple notes played simultaneously to create harmony.' },
  ],

  '9-12': [
    { prompt: 'What term describes art meant to comment on or challenge political or social issues?', correct: 'Politically or socially engaged art', options: ['Politically or socially engaged art', 'Decorative art', 'Commercial art', 'Folk art'], explanation: 'Some art is created specifically to comment on or challenge political and social issues.' },
    { prompt: "What is 'counterpoint' in music theory?", correct: 'Two or more independent melodic lines played together', options: ['Two or more independent melodic lines played together', 'A single loud note', 'A type of drum solo', 'The title of a song'], explanation: 'Counterpoint combines multiple independent melodies that still sound harmonious together.' },
    { prompt: 'Which art period emphasized dramatic lighting and emotion, exemplified by Caravaggio?', correct: 'Baroque', options: ['Baroque', 'Rococo', 'Minimalism', 'Pop Art'], explanation: 'Baroque art (17th century) used dramatic contrasts of light and shadow to evoke strong emotion.' },
    { prompt: "What does 'dissonance' mean in music?", correct: 'A combination of notes that sounds tense or unresolved', options: ['A combination of notes that sounds tense or unresolved', 'A note played very softly', 'The fastest possible tempo', 'A song with no instruments'], explanation: 'Dissonant notes create tension, often resolved by moving to a more harmonious (consonant) chord.' },
    { prompt: "What movement rejected traditional art in favor of everyday objects, like Duchamp's 'Fountain'?", correct: 'Dada', options: ['Dada', 'Realism', 'Romanticism', 'Neoclassicism'], explanation: 'Dadaism challenged the definition of art itself, often using ordinary objects as art.' },
    { prompt: "What is a 'leitmotif' in music, famously used by composer Richard Wagner?", correct: 'A recurring musical theme associated with a person, place, or idea', options: ['A recurring musical theme associated with a person, place, or idea', 'A type of guitar', 'The last note of a song', 'A style of singing'], explanation: 'A leitmotif is a short, recurring musical phrase linked to a specific character or idea, often used in operas and film scores.' },
  ],
};

export default ART_BANK;
