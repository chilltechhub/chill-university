// src/screens/classes/arts/visualart.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'drawingIllustration',
      title: 'Drawing & Illustration',
      grade: 'K-2',
      color: '#8E24AA',
      description:
        'Techniques in line, shading, perspective, and observational drawing.',
      learn: [
        { heading: 'Lines Make Everything', body: 'Every drawing starts with lines — straight, curved, thick, thin, zigzag. Different lines create different feelings: straight lines feel calm and orderly, wavy lines feel playful or flowing.' },
        { heading: 'Shapes From Lines', body: 'Combine simple shapes — circles, squares, triangles — to build more complex pictures. A robot might be a square body, a circle head, and rectangle arms.' },
      ],
      practice: [
        { question: 'Which kind of line usually feels calm and orderly?', options: ['A wavy line', 'A straight line', 'A zigzag line', 'A scribble'], answerIndex: 1, explanation: 'Straight lines tend to feel neat and steady; wavy and zigzag lines feel more playful or energetic.' },
        { question: 'If you wanted to draw a simple house, which shapes would you combine?', options: ['Only circles', 'A square/rectangle and a triangle', 'Only zigzag lines', 'Only dots'], answerIndex: 1, explanation: 'A rectangle for the walls and a triangle for the roof is the classic combination.' },
      ],
      apply: {
        prompt: 'Draw a picture (a house, animal, or robot) using only circles, squares, triangles, and rectangles. Then trace over your favorite line in a different color.',
        checklist: ['Used at least 3 different shapes', 'Drew at least 2 different kinds of lines', 'Colored or traced a favorite line'],
      },
      help: {
        videos: [
          { title: '6 Habits for Good Line Quality', url: 'https://youtu.be/lTslVOUJ0jI?si=IxqGrYvThJQCm32o' },
          { title: '13 Types of Lines and How to Use Them', url: 'https://youtu.be/mysAqNK6CHI?si=Abwl1wEJXXC0zNFG' },
          { title: 'Top 5 Shading Techniques for Beginners', url: 'https://youtu.be/225mwT-gGu8?si=rfRyP9z1GW6yDKot' },
        ],
        readings: [
          { title: 'The complete guide to shading techniques', url: 'https://www.gathered.how/arts-crafts/art/shading-techniques' },
          { title: 'How to Draw Perspective - A Simple Guide', url: 'https://www.youtube.com/watch?v=vs9f9shBpNI' },
          { title: 'Observation Drawing For Beginners', url: 'https://ccmonstersart.com/observation-drawing-for-beginners-101/' },
        ],
      },
    },
    {
      key: 'painting',
      title: 'Painting',
      grade: '3-5',
      color: '#D32F2F',
      description:
        'Exploration of media (watercolor, acrylic, oil), color mixing, brushwork, and composition.',
      learn: [
        { heading: 'Three Kinds of Paint', body: 'Watercolor is thinned with water and stays transparent, so light areas come from the white paper showing through. Acrylic is water-based but dries fast and permanent, while oil paint dries slowly and blends smoothly, letting artists work on a painting over days or weeks.' },
        { heading: 'Mixing Your Own Colors', body: 'The three primary colors — red, yellow, and blue — combine to make secondary colors like orange, green, and purple. Adding white makes a tint (lighter), and adding black makes a shade (darker), giving you an almost unlimited palette from just a few tubes.' },
      ],
      practice: [
        { question: 'Which paint dries the fastest?', options: ['Watercolor', 'Acrylic', 'Oil paint', 'They all dry at the same speed'], answerIndex: 1, explanation: "Acrylic paint dries quickly, often within minutes, because it's water-based, unlike oil paint which can take days." },
        { question: 'What color do you get when you mix blue and yellow paint?', options: ['Purple', 'Orange', 'Green', 'Brown'], answerIndex: 2, explanation: 'Blue and yellow are primary colors that combine to make green, a secondary color.' },
      ],
      apply: {
        prompt: 'Paint a simple landscape (sky, ground, and one object like a tree or house) using only the three primary colors plus white, mixing every other color you need on your palette.',
        checklist: ['Mixed at least 2 secondary colors from primaries', 'Used different brushstrokes for different textures (like sky vs. ground)', 'Painting has a clear foreground and background'],
      },
      help: {
        readings: [
          { title: 'The Difference Between Acrylic, Oils and Watercolor', url: 'https://www.josielewis.com/the-blog/the-difference-between-acrylic-oils-and-watercolor' },
          { title: 'Color Theory Part 4: Mixing Paint', url: 'https://www.muddycolors.com/2022/01/color-theory-part-4-mixing-paint/' },
          { title: 'Color Mixing Guide', url: 'https://goldenartistcolors.com/resources/color-mixing-guide' },
        ],
        videos: [
          { title: '5 Easy Brush Strokes To Help You Paint ANYTHING!', url: 'https://youtu.be/Oqagavq0hH0?si=UdwLksg4MQwgGjsU' },
          { title: '3 Rules for Better Composition in Your Art', url: 'https://youtu.be/te9Efr1VT9U?si=zIN9zOo-qQN78P-K' },
        ],
      },
    },
    {
      key: 'sculpture3d',
      title: 'Sculpture & 3D Media',
      grade: '3-5',
      color: '#FF8F00',
      description:
        'Working in clay, wood, metal, or mixed materials to create three-dimensional forms.',
      learn: [
        { heading: 'Thinking in the Round', body: "Unlike a drawing on flat paper, a sculpture exists in three dimensions and has to look good from every angle — front, back, sides, and even the top. Artists rotate their work constantly while making it to check all those views." },
        { heading: 'Additive vs. Subtractive', body: 'There are two main approaches to sculpting: additive, where you build up a form by adding material (like stacking clay or welding metal), and subtractive, where you carve away material from a larger block (like wood or stone) until the form emerges.' },
      ],
      practice: [
        { question: 'What makes sculpture different from drawing or painting?', options: ["It's always made of clay", 'It exists in three dimensions and can be viewed from many angles', "It can't have color", 'It is only used for statues of people'], answerIndex: 1, explanation: 'Sculpture is three-dimensional, so unlike a flat drawing, it must be considered from all sides.' },
        { question: 'Carving a figure out of a block of wood is an example of which sculpting method?', options: ['Additive', 'Subtractive', 'Modeling', 'Casting'], answerIndex: 1, explanation: 'Carving removes material from a larger block, which is the subtractive method — the opposite of building up with clay.' },
      ],
      apply: {
        prompt: 'Using air-dry clay, plasticine, or even shaped aluminum foil, build a small three-dimensional form (an animal, a bowl, or an abstract shape) and check that it looks good from at least four different angles.',
        checklist: ['Sculpture stands on its own without falling over', 'Checked and adjusted the form from the front, back, and both sides', 'Used at least one texture (smooth, rough, or bumpy) on purpose'],
      },
      help: {
        videos: [
          { title: 'Intro to 3D Form - Soft Geometry - Clay', url: 'https://youtu.be/0pUegki8vcc?si=wfKTbqEBqfOVEjS0' },
          { title: 'How to Carve in 3 Dimensions - Intro', url: 'https://youtu.be/HNMYtpucQHs?si=R5qT52oTbePiRvwb' },
        ],
        readings: [
          { title: '3D Art: Creating with Mixed Media', url: 'https://www.bookbaker.com/es/v/Exploring-Art-A-Comprehensive-Guide-for-Middle-School-Students-3D-Art-Creating-with-Mixed-Media/8acc5310-ee77-4452-af79-4f59605cdcaa/7' },
        ],
      },
    },
    {
      key: 'printmaking',
      title: 'Printmaking',
      grade: '6-8',
      color: '#00796B',
      description:
        'Relief, intaglio, screen-printing, and monotype processes for producing editions.',
      learn: [
        { heading: 'What Makes Printmaking Different', body: 'Printmaking creates multiple original copies — called an "edition" — from one prepared surface, like a carved block, an etched plate, or a screen. That is different from painting or drawing, which produce a single, unique piece.' },
        { heading: 'Relief vs. Intaglio', body: "In relief printing (like woodblock or linocut), you carve away the areas that should stay blank, so ink sits on the raised surface that remains. In intaglio, it's the opposite — ink sits in carved grooves below the surface, and a printing press forces the paper into those grooves to pick it up." },
      ],
      practice: [
        { question: 'In relief printmaking, where does the ink go?', options: ['Into carved grooves below the surface', 'Only on the raised (uncarved) areas', 'Directly onto the paper with no plate', 'Nowhere — relief prints use no ink'], answerIndex: 1, explanation: 'Relief printing carves away the areas meant to stay blank, leaving ink on the raised surface that remains.' },
        { question: 'What is a set of identical prints made from the same plate called?', options: ['A palette', 'A collage', 'An edition', 'A wash'], answerIndex: 2, explanation: 'A set of prints pulled from the same plate or block is called an edition.' },
      ],
      apply: {
        prompt: 'Carve a simple design into a foam sheet or a potato half (a shape, initial, or pattern), ink it, and stamp at least 3 identical prints to create your own small edition.',
        checklist: ['Carved a design with clear raised and recessed areas', 'Printed at least 3 matching copies', 'Signed and numbered the edition (e.g., 1/3, 2/3, 3/3)'],
      },
      help: {
        readings: [
          { title: 'Printmaking 101: Relief, Intaglio, Screen Printing & More', url: 'https://opusartsupplies.com/en-us/blogs/resource-library/printmaking-101-an-introduction-to-relief-printing-intaglio-printing-screen-printing-more?srsltid=AfmBOopFQeb12VrUOQutv9-N8zUhjDm4mI9sRqC1LJNvJ4T0JXKn978P' },
        ],
        videos: [],
      },
    },
    {
      key: 'ceramicsFiber',
      title: 'Ceramics & Fiber Arts',
      grade: '6-8',
      color: '#5D4037',
      description:
        'Hand-building, wheel-throwing, weaving, textile design, and mixed-media fibers.',
      learn: [
        { heading: 'Working Clay by Hand', body: "There are three basic hand-building techniques: pinch (shaping clay with your fingers from a single ball), coil (stacking and smoothing rolled ropes of clay), and slab (cutting and joining flat sheets). These don't require a pottery wheel, just your hands and simple tools." },
        { heading: 'The Structure of Weaving', body: 'Weaving interlaces two sets of threads: the warp, which is stretched vertically and held in place on the loom, and the weft, which is woven horizontally over and under the warp threads to build up the fabric.' },
      ],
      practice: [
        { question: 'Which hand-building technique starts by rolling clay into long ropes and stacking them?', options: ['Pinch', 'Coil', 'Slab', 'Wheel-throwing'], answerIndex: 1, explanation: 'Coil building stacks rolled ropes of clay and smooths them together to build up the walls of a form.' },
        { question: 'In weaving, what are the fixed threads held on the loom called?', options: ['Weft', 'Warp', 'Shuttle', 'Selvage'], answerIndex: 1, explanation: 'The warp threads are strung vertically on the loom and stay in place while the weft is woven through them.' },
      ],
      apply: {
        prompt: 'Choose one: hand-build a small clay pinch pot, or weave a small sample on a cardboard loom using yarn or fabric strips.',
        checklist: ['If clay: used at least one hand-building technique (pinch, coil, or slab)', 'If weaving: kept a consistent over-under pattern across at least 10 rows', 'Finished piece can hold its shape on its own'],
      },
      help: {
        videos: [
          { title: 'Basics of Ceramic Handbuilding', url: 'https://youtu.be/HgKodiI2MMc?si=-artPjQeNSPUh7qe' },
          { title: 'Wheel Throwing For Beginners', url: 'https://youtu.be/dmgMKbHyDFw?si=BuKREbTcGygE989j' },
          { title: 'Ceramic Weaving', url: 'https://youtu.be/30hADtVn-4U?si=9xiAwv70Ztsft4ex' },
          { title: 'Intro to Textile & Surface Pattern Design', url: 'https://www.youtube.com/watch?v=4dp-yP_GapU' },
          { title: '19 kinds of Textile Design', url: 'https://youtu.be/JGR2H5zKJhM?si=-0_0W08fVmpgNJn6' },
          { title: 'Mixed Media Adventures', url: 'https://youtu.be/VwIAnmhCBcU?si=kL8GjBMLdXMgsnxz' },
        ],
        readings: [],
      },
    },
    {
      key: 'photographyDigital',
      title: 'Photography & Digital Media',
      grade: '6-8',
      color: '#303F9F',
      description:
        'Camera basics, digital editing, composition, and experimental media.',
      learn: [
        { heading: 'The Exposure Triangle', body: 'Three settings control how bright or dark a photo turns out: aperture (how wide the lens opening is), shutter speed (how long light hits the sensor), and ISO (how sensitive the sensor is to light). Balancing all three gives you a properly exposed photo.' },
        { heading: 'The Rule of Thirds', body: 'Imagine a grid dividing your photo into 9 equal parts, like a tic-tac-toe board. Placing your subject along those grid lines or at their intersections — instead of dead center — usually creates a more balanced and interesting composition.' },
      ],
      practice: [
        { question: 'Which of these is part of the "exposure triangle" that controls how bright or dark a photo is?', options: ['Shutter speed', 'Filter', 'Crop', 'Filename'], answerIndex: 0, explanation: 'Shutter speed, along with aperture and ISO, is one of the three settings that control a photo\'s exposure.' },
        { question: 'According to the rule of thirds, where should the main subject of a photo usually be placed?', options: ['Always dead center', 'Along imaginary lines or intersections dividing the frame into thirds', 'In the very top corner', "It doesn't matter"], answerIndex: 1, explanation: 'The rule of thirds suggests placing key elements along the grid lines or their intersections for a more balanced composition.' },
      ],
      apply: {
        prompt: 'Take 5 photos of the same object or scene using the rule of thirds instead of centering it, then pick your favorite and adjust its brightness or contrast in a free photo editor.',
        checklist: ['Took at least 5 photos applying the rule of thirds', 'Selected the strongest photo and explained why', 'Made at least one edit (brightness, contrast, or crop) to the chosen photo'],
      },
      help: {
        readings: [
          { title: 'Photography Basics: Beginner’s Guide', url: 'https://photographylife.com/photography-basics' },
          { title: 'Photo Editing Basics', url: 'https://www.rei.com/learn/expert-advice/photo-editing-basics.html' },
          { title: 'Basic Video Editing Principles (2025)', url: 'https://www.descript.com/blog/article/11-basic-video-editing-principles-for-budding-filmmakers' },
        ],
        videos: [
          { title: 'Editing a Photo from Beginning to End', url: 'https://youtu.be/5agWcQlzXpU?si=TEmuqI94FlE9Uo3H' },
          { title: 'Canva Video Editor Tutorial', url: 'https://youtu.be/AlrC-XaKwew?si=1-ewAz1eIq3ZcHaG' },
        ],
      },
    },
    {
      key: 'mixedMediaInstallation',
      title: 'Mixed Media & Installation',
      grade: '9-12',
      color: '#C2185B',
      description:
        'Combining multiple materials or creating site-specific works.',
      learn: [
        { heading: 'Beyond a Single Medium', body: "Mixed media artwork deliberately combines two or more distinct materials or techniques — like paint, collage, and found objects — in a single piece, letting the artist use each material's unique texture, color, or meaning." },
        { heading: 'Art That Responds to Space', body: 'Installation and site-specific art is created for, and responds to, a particular location. The artist considers how viewers move through and experience the space itself, not just how a flat piece looks on a wall.' },
      ],
      practice: [
        { question: 'What defines "mixed media" artwork?', options: ['Art made only with paint', 'Art that combines two or more different materials or techniques', 'Art displayed only in museums', 'Art that must be digital'], answerIndex: 1, explanation: 'Mixed media art deliberately combines multiple materials or techniques, such as paint, paper, and found objects, within one piece.' },
        { question: 'What makes a work "site-specific"?', options: ['It is created to be displayed anywhere', 'It is designed for and responds to a particular location', 'It can only be made of clay', 'It has no relationship to its surroundings'], answerIndex: 1, explanation: 'Site-specific art is conceived for a particular place and takes that location\'s space, history, or context into account.' },
      ],
      apply: {
        prompt: 'Create a small mixed-media piece combining at least three different materials (for example, drawing, torn paper or collage, and a found object like fabric or cardboard) that responds to a specific space in your home or school.',
        checklist: ['Used at least 3 different materials or techniques', 'Considered how the piece relates to the specific space you chose', 'Can explain why you chose to combine those particular materials'],
      },
      help: {
        readings: [
          { title: 'Mixed Media and Installation Art', url: 'https://irishartmart.ie/mixed-media-and-installation-art/' },
        ],
        videos: [
          { title: 'What is Mixed Media? Beginner Guide', url: 'https://youtu.be/D3ge0isut60?si=W24-GNEBh1ypWBvf' },
        ],
      },
    },
    {
      key: 'elementsPrinciples',
      title: 'Elements & Principles of Art',
      grade: '3-5',
      color: '#388E3C',
      description:
        'Line, shape, form, color, texture, space, balance, contrast, emphasis, movement, pattern, rhythm, unity.',
      learn: [
        { heading: 'Elements Are the Ingredients', body: 'The elements of art — line, shape, form, color, texture, and space — are the basic building blocks every artist works with, like ingredients in a recipe. Every artwork, no matter the style, is built from some combination of these.' },
        { heading: 'Principles Are How You Arrange Them', body: 'The principles of art — balance, contrast, emphasis, movement, pattern, rhythm, and unity — describe how an artist organizes the elements to make a piece feel complete and interesting, the way a recipe tells you how to combine ingredients.' },
      ],
      practice: [
        { question: 'Which of these is an "element of art" rather than a "principle of art"?', options: ['Balance', 'Color', 'Emphasis', 'Unity'], answerIndex: 1, explanation: 'Color is a basic building block, an element; balance, emphasis, and unity describe how those elements are arranged, which makes them principles.' },
        { question: 'If an artist repeats a shape across a painting to create visual flow, which principle are they using?', options: ['Contrast', 'Pattern', 'Space', 'Line'], answerIndex: 1, explanation: 'Repeating a shape or motif to create rhythm and visual flow is the principle of pattern.' },
      ],
      apply: {
        prompt: 'Create a small artwork (a drawing or collage) that intentionally uses at least 3 elements of art (like line, shape, and color) and 2 principles of art (like balance, contrast, or pattern).',
        checklist: ['Can point out 3 elements of art you used', 'Can point out 2 principles of art you used', 'The piece feels intentional, not random'],
      },
      help: {
        readings: [
          { title: 'Elements & Principles of Art', url: 'https://human.libretexts.org/Courses/Solano_Community_College/ART_002%3A_Art_History/01%3A_A_World_Perspective_of_Art_Appreciation/1.06%3A_What_Are_the_Elements_of_Art_and_the_Principles_of_Art' },
        ],
        videos: [],
      },
    },
    {
      key: 'artHistoryCriticism',
      title: 'Art History & Criticism',
      grade: '9-12',
      color: '#455A64',
      description:
        'Survey of major movements, styles, and critical analysis of artworks.',
      learn: [
        { heading: 'Art Movements Tell a Story', body: 'Art history is organized into movements — Renaissance, Impressionism, Cubism, and more — each reflecting the ideas, technology, and events of its time period. Knowing the movement helps explain why an artwork looks and means what it does.' },
        { heading: 'The Four Steps of Art Criticism', body: 'Formal art criticism follows four steps, in order: description (what do you literally see), analysis (how are elements and principles used), interpretation (what does it mean), and judgment (how well does it succeed). Skipping straight to judgment leads to shallow opinions.' },
      ],
      practice: [
        { question: 'Why do art historians group artworks into "movements" like Impressionism or Cubism?', options: ['Because all artists in a movement used the same brand of paint', 'Because these groupings reflect shared ideas, techniques, or historical context of a time period', 'Movements are randomly assigned by museums', 'Movements only apply to sculpture'], answerIndex: 1, explanation: 'Art movements group works that share stylistic approaches or ideas, often shaped by the historical or cultural moment they came from.' },
        { question: 'In the four steps of art criticism, what comes right before "judgment"?', options: ['Interpretation', 'Nothing — judgment comes first', 'Framing', 'Pricing'], answerIndex: 0, explanation: 'The standard order is description, analysis, interpretation, then judgment — forming an opinion should come only after understanding the work.' },
      ],
      apply: {
        prompt: 'Choose one famous artwork (from a book, museum website, or class example) and write a short critique following the four steps: describe what you see, analyze the elements and principles used, interpret its meaning, and give your judgment.',
        checklist: ['Described only what is visible, without opinions, in step 1', 'Identified at least 2 elements or principles used in the piece', 'Gave a final judgment supported by your analysis'],
      },
      help: {
        readings: [
          { title: 'Art criticism', url: 'https://www.britannica.com/art/art-criticism' },
          { title: 'Art history', url: 'https://www.khanacademy.org/humanities/art-history' },
        ],
        videos: [],
      },
    },
  ];

export default function VisualArts() {
  return <ClassTopicScreen title={"Visual Arts"} classKey="VisualArt" fallbackTopics={topics} />;
}
