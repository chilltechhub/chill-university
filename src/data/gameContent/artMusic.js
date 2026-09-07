// src/data/gameContent/artMusic.js
// Art & Music content, tiered by grade band.
//
// Distractors are written to roughly match the correct answer's length —
// a multiple-choice question where the right answer is a full sentence
// and the wrong ones are single words lets a player win by "pick the
// longest option" without reading the question at all. Keeping all four
// options in the same length ballpark (even when that means writing a
// plausible-sounding WRONG explanation instead of a one-word distractor)
// closes that shortcut.

export const ART_BANK = {
  'K-2': [
    { prompt: 'Mixing blue and yellow paint makes what color?', correct: 'Green', options: ['Green', 'Purple', 'Orange', 'Brown'], explanation: 'Blue and yellow are primary colors that combine to make green.' },
    { prompt: 'Which instrument has black and white keys?', correct: 'Piano', options: ['Piano', 'Drum', 'Guitar', 'Flute'], explanation: 'A piano has black and white keys you press to make sound.' },
    { prompt: 'What do you call a picture made by painting?', correct: 'A painting', options: ['A painting', 'A sculpture', 'A song', 'A poem'], explanation: 'Artwork made with paint is called a painting.' },
    { prompt: 'Which instrument do you blow into to make music?', correct: 'Flute', options: ['Flute', 'Drum', 'Piano', 'Xylophone'], explanation: 'A flute makes sound when you blow air across its opening.' },
    { prompt: 'What are the three primary colors?', correct: 'Red, blue, and yellow', options: ['Red, blue, and yellow', 'Green, orange, and purple', 'Black, white, and gray', 'Pink, brown, and teal'], explanation: "Red, blue, and yellow are primary colors — they can't be made by mixing other colors." },
    { prompt: 'What do you call music with no words, played only by instruments?', correct: 'Instrumental music', options: ['Instrumental music', 'A cappella singing', 'Rap battling', 'Written lyrics'], explanation: 'Instrumental music is played using instruments only, without singing.' },
    { prompt: 'What tool do you use to spread paint on a canvas?', correct: 'A paintbrush', options: ['A paintbrush', 'A hammer', 'A scissors', 'A ruler'], explanation: 'A paintbrush holds and spreads paint onto a surface.' },
    { prompt: 'Which shape has three sides?', correct: 'A triangle', options: ['A triangle', 'A circle', 'A square', 'A rectangle'], explanation: 'A triangle is a shape with exactly three straight sides.' },
    { prompt: 'What do we call a group of people who sing together?', correct: 'A choir', options: ['A choir', 'A quartet', 'A duet', 'A soloist'], explanation: 'A choir is a group of singers performing together.' },
    { prompt: 'What do you call clay art you shape with your hands?', correct: 'A sculpture', options: ['A sculpture', 'A drawing', 'A photo', 'A painting'], explanation: 'A sculpture is a 3D artwork often shaped by hand from clay, stone, or other materials.' },
  ],

  '3-5': [
    { prompt: 'What do sculptors mainly use to shape clay?', correct: 'Their hands and sculpting tools', options: ['Their hands and sculpting tools', 'A paintbrush and easel', 'A camera and tripod', 'A microphone and speaker'], explanation: 'Sculptors shape materials like clay using their hands and special tools.' },
    { prompt: 'What word describes how fast or slow a piece of music is played?', correct: 'Tempo', options: ['Tempo', 'Pitch', 'Volume', 'Harmony'], explanation: 'Tempo is the speed of the music — fast or slow.' },
    { prompt: 'Which art style uses tiny dots to create a picture?', correct: 'Pointillism', options: ['Pointillism', 'Cubism', 'Realism', 'Abstract'], explanation: 'Pointillism is a technique where small dots of color combine to form an image.' },
    { prompt: 'What do we call a large group of musicians playing instruments like violins and cellos together?', correct: 'An orchestra', options: ['An orchestra', 'A choir group', 'A solo act', 'A duet pair'], explanation: 'An orchestra is a large group of musicians playing different instruments together.' },
    { prompt: 'What is it called when an artist draws the same object repeatedly to practice?', correct: 'Sketching', options: ['Sketching', 'Framing', 'Glazing', 'Etching'], explanation: 'Sketching is quick, practice drawing, often used to plan a final artwork.' },
    { prompt: 'In music, what do we call the pattern of beats?', correct: 'Rhythm', options: ['Rhythm', 'Melody', 'Tone', 'Key'], explanation: 'Rhythm is the pattern of long and short sounds and silences in music.' },
    { prompt: 'What are warm colors like red, orange, and yellow often used to show in a painting?', correct: 'Energy, heat, or excitement', options: ['Energy, heat, or excitement', 'Calm, cold, or sadness', 'Silence and stillness', 'Nothing at all'], explanation: 'Warm colors tend to feel energetic and are often used to show heat or excitement.' },
    { prompt: 'What do we call the main tune of a song that you hum along to?', correct: 'The melody', options: ['The melody', 'The rhythm section', 'The bass line', 'The chord chart'], explanation: 'The melody is the main sequence of notes that forms a song\'s tune.' },
    { prompt: 'What is a self-portrait?', correct: 'A picture an artist makes of themselves', options: ['A picture an artist makes of themselves', 'A picture of a landscape scene', 'A picture of a famous building', 'A picture of an animal outdoors'], explanation: 'A self-portrait is artwork where the artist depicts their own likeness.' },
    { prompt: 'What is it called when two or more colors are placed side by side to create contrast?', correct: 'Color contrast', options: ['Color contrast', 'Color matching', 'Color fading', 'Color blending'], explanation: 'Contrasting colors, like blue next to orange, make each other stand out.' },
  ],

  '6-8': [
    { prompt: 'Which art movement is famous for melting clocks and dreamlike scenes, led by Salvador Dalí?', correct: 'Surrealism', options: ['Surrealism', 'Impressionism', 'Cubism', 'Realism'], explanation: 'Surrealism explored dreams and the unconscious mind through strange, dreamlike imagery.' },
    { prompt: "What's the difference between a major and minor musical key?", correct: 'Major often sounds happy, minor often sounds sad', options: ['Major often sounds happy, minor often sounds sad', 'Major is always played much louder', 'Minor keys have no steady rhythm', 'Major only ever uses drum sounds'], explanation: 'Major keys tend to sound bright and happy, while minor keys often sound darker or sadder.' },
    { prompt: "Which composer wrote the famous 'Symphony No. 9' while going deaf?", correct: 'Ludwig van Beethoven', options: ['Ludwig van Beethoven', 'Wolfgang Amadeus Mozart', 'Johann Sebastian Bach', 'Frédéric François Chopin'], explanation: 'Beethoven composed some of his greatest works, including Symphony No. 9, after losing most of his hearing.' },
    { prompt: 'What painting technique uses thick layers of paint for texture?', correct: 'Impasto', options: ['Impasto', 'Fresco', 'Etching', 'Collage'], explanation: 'Impasto involves applying paint thickly so brush or palette-knife strokes are visible.' },
    { prompt: 'What art movement, led by Picasso, broke objects into geometric shapes shown from multiple angles?', correct: 'Cubism', options: ['Cubism', 'Pointillism', 'Baroque', 'Minimalism'], explanation: 'Cubism represented subjects from many viewpoints at once using geometric forms.' },
    { prompt: "In music, what is a 'chord'?", correct: 'Three or more notes played together at once', options: ['Three or more notes played together at once', 'A single note held for a long time', 'A percussion instrument made of wood', 'The overall speed of a song'], explanation: 'A chord is a combination of multiple notes played simultaneously to create harmony.' },
    { prompt: 'What term describes the overall arrangement of shapes, colors, and space in an artwork?', correct: 'Composition', options: ['Composition', 'Restoration', 'Preservation', 'Fabrication'], explanation: 'Composition is how an artist arranges the visual elements within a piece.' },
    { prompt: 'What is a "motif" in music?', correct: 'A short musical idea repeated throughout a piece', options: ['A short musical idea repeated throughout a piece', 'The very last chord of a song', 'A brand of stringed instrument', 'A type of concert hall'], explanation: 'A motif is a short recurring musical phrase that helps unify a composition.' },
    { prompt: 'Which artistic technique uses light and shadow to make a 2D image look three-dimensional?', correct: 'Shading', options: ['Shading', 'Sketching', 'Tracing', 'Blotting'], explanation: 'Shading adds light and dark values to suggest depth and form.' },
    { prompt: 'What do we call a piece of music written for one performer to play alone?', correct: 'A solo', options: ['A solo', 'A duet', 'A chorus', 'A medley'], explanation: 'A solo is performed by a single musician without other performers.' },
  ],

  '9-12': [
    { prompt: 'What term describes art meant to comment on or challenge political or social issues?', correct: 'Politically or socially engaged art', options: ['Politically or socially engaged art', 'Purely decorative wall art', 'Commercial advertising art', 'Traditional folk craftwork'], explanation: 'Some art is created specifically to comment on or challenge political and social issues.' },
    { prompt: "What is 'counterpoint' in music theory?", correct: 'Two or more independent melodic lines played together', options: ['Two or more independent melodic lines played together', 'A single note played very loudly', 'An extended solo drum performance', 'The printed title of a song'], explanation: 'Counterpoint combines multiple independent melodies that still sound harmonious together.' },
    { prompt: 'Which art period emphasized dramatic lighting and emotion, exemplified by Caravaggio?', correct: 'Baroque', options: ['Baroque', 'Rococo', 'Minimalism', 'Pop Art'], explanation: 'Baroque art (17th century) used dramatic contrasts of light and shadow to evoke strong emotion.' },
    { prompt: "What does 'dissonance' mean in music?", correct: 'A combination of notes that sounds tense or unresolved', options: ['A combination of notes that sounds tense or unresolved', 'A note that is played very softly', 'The fastest tempo a piece can reach', 'A song performed with no instruments'], explanation: 'Dissonant notes create tension, often resolved by moving to a more harmonious (consonant) chord.' },
    { prompt: "What movement rejected traditional art in favor of everyday objects, like Duchamp's 'Fountain'?", correct: 'Dada', options: ['Dada', 'Realism', 'Romanticism', 'Neoclassicism'], explanation: 'Dadaism challenged the definition of art itself, often using ordinary objects as art.' },
    { prompt: "What is a 'leitmotif' in music, famously used by composer Richard Wagner?", correct: 'A recurring musical theme tied to a person or idea', options: ['A recurring musical theme tied to a person or idea', 'A specific brand of concert guitar', 'The closing note of any opera', 'A formal style of solo singing'], explanation: 'A leitmotif is a short, recurring musical phrase linked to a specific character or idea, often used in operas and film scores.' },
    { prompt: 'What art historical term describes work that intentionally imitates or references earlier styles?', correct: 'Pastiche', options: ['Pastiche', 'Gesso', 'Vellum', 'Patina'], explanation: 'A pastiche deliberately imitates the style of another work, artist, or period.' },
    { prompt: 'In music theory, what is "modulation"?', correct: 'A shift from one musical key to another within a piece', options: ['A shift from one musical key to another within a piece', 'The act of tuning an instrument once', 'A pause with complete silence', 'The written lyrics of a song'], explanation: 'Modulation changes the tonal center of a piece, often to build tension or contrast.' },
    { prompt: 'Which 20th-century movement stripped art down to simple geometric forms and rejected excess decoration?', correct: 'Minimalism', options: ['Minimalism', 'Baroque', 'Romanticism', 'Rococo'], explanation: 'Minimalism favored simplicity, using basic shapes and forms with little embellishment.' },
    { prompt: 'What is "timbre" in music?', correct: 'The unique tone quality that distinguishes one sound source from another', options: ['The unique tone quality that distinguishes one sound source from another', 'The exact number of beats in one measure', 'The physical height of a musical staff', 'The name given to a song\'s chorus'], explanation: 'Timbre is why a piano and a violin playing the same note still sound different from each other.' },
  ],
};

export default ART_BANK;
