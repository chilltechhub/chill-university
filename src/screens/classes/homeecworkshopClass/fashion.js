// src/screens/classes/homeecworkshopClass/fashion.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'fabricProperties',
      title: 'Fabric Properties & Selection',
      grade: '6-8',
      color: '#3F51B5', // Indigo
      description:
        'Understanding characteristics like strength, stretch, drape, and texture to choose appropriate materials.',
      learn: [
        { heading: 'Key Fabric Properties', body: 'Fabrics are judged by properties like strength (resistance to tearing), stretch (how much it gives), drape (how it falls or hangs on a body), and texture (smooth, rough, or fuzzy to the touch). A stiff cotton canvas behaves very differently from a flowing silk, even in the same garment shape.' },
        { heading: 'Match Fabric to Function', body: 'Choosing fabric means matching properties to the garment\'s job — a swimsuit needs stretch and quick-drying fibers, while a winter coat needs warmth and durability. Natural fibers like cotton and wool differ from synthetics like polyester in breathability, stretch, and how they react to washing.' },
      ],
      practice: [
        { question: 'Which fabric property describes how a fabric hangs or falls on the body?', options: ['Strength', 'Drape', 'Texture', 'Color'], answerIndex: 1, explanation: 'Drape describes how fluidly or stiffly a fabric falls, which affects the silhouette of a garment.' },
        { question: 'Why would a swimsuit fabric need to have good stretch?', options: ['To make it stiffer', 'So it moves with the body and fits snugly', 'To make it heavier', 'It does not need stretch'], answerIndex: 1, explanation: 'Stretch allows the fabric to move with the body and maintain a snug, flexible fit while swimming.' },
      ],
      apply: {
        prompt: 'Collect three different fabric scraps or clothing items at home. Test and record their strength, stretch, and texture by hand.',
        checklist: ['Gathered three fabric samples', 'Tested stretch by hand', 'Noted texture (smooth/rough)', 'Wrote down which fabric would suit which garment'],
      },
      help: {
        readings: [
          {
            title:
              'What Are The Properties Of FABRIC ~ Important Characteristics Of Fabrics',
            url: 'https://youtu.be/ga_Q1jNqy5w?si=OI1QSYVE8bBkDfk1',
          },
          {
            title:
              'Fabric Selection and Textiles in Fashion Design: Understanding Materials',
            url: 'https://theartcareerproject.com/fabric-selection-fashion-design-materials/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'sewingTechniques',
      title: 'Sewing Techniques & Garment Construction',
      grade: '6-8',
      color: '#009688', // Teal
      description:
        'Mastering various stitches, seams, and methods to assemble and finish clothing.',
      learn: [
        { heading: 'Stitches Build the Garment', body: 'A running stitch is the simplest hand stitch for basic seams, while a backstitch is stronger and used where a seam needs to hold up to stress. Machine stitching uses a straight stitch for most seams and a zigzag stitch to finish raw edges so they don\'t fray.' },
        { heading: 'Seams Hold It Together', body: 'A seam is where two fabric pieces are joined, and seam allowance (usually 1/2 to 5/8 inch) is the extra fabric left beyond the stitch line so the seam doesn\'t pull apart. Garment construction follows an order — like sewing darts and shoulder seams before side seams — so the piece keeps its shape.' },
      ],
      practice: [
        { question: 'What is a "seam allowance"?', options: ['The color of the thread', 'Extra fabric left beyond the stitch line to prevent the seam from pulling apart', 'The type of needle used', 'A decorative stitch'], answerIndex: 1, explanation: 'Seam allowance is the margin of fabric between the stitch line and the raw edge, which keeps the seam secure.' },
        { question: 'Which hand stitch is generally stronger and better for stressed seams?', options: ['Running stitch', 'Backstitch', 'Loose basting stitch', 'None, they are all equal'], answerIndex: 1, explanation: 'A backstitch overlaps each stitch, making it much sturdier than a simple running stitch.' },
      ],
      apply: {
        prompt: 'Using scrap fabric, needle, and thread (with adult supervision if needed), practice sewing a straight running stitch seam about 4 inches long.',
        checklist: ['Threaded a needle', 'Sewed a straight running stitch', 'Kept even stitch spacing', 'Tied off the thread at the end'],
      },
      help: {
        readings: [
          {
            title:
              '29 Basic And Complex Sewing Techniques Sewers Should Master',
            url: 'https://sewing.com/sewing-techniques-sewers-should-master/',
          },
          {
            title: 'What is Garment Construction?',
            url: 'https://www.uphance.com/blog/what-is-garment-construction/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'fashionDesign',
      title: 'Fashion Design & Trends',
      grade: '9-12',
      color: '#E91E63', // Pink
      description:
        'Exploring how styles evolve, trend forecasting, and applying design principles to apparel.',
      learn: [
        { heading: 'Trends Move in Cycles', body: 'Fashion trends often start with designers or subcultures, spread through media and influencers, get mass-produced by retailers, and eventually fade as new trends emerge — many trends also cycle back decades later (like the return of 90s styles). Forecasters study color, fabric, and runway shows years in advance to predict what will be popular.' },
        { heading: 'Design Principles Guide Choices', body: 'Elements like line, shape, color, and texture combine with principles like balance, proportion, and emphasis to create a cohesive outfit or collection. For example, a bold accessory can create "emphasis" that draws the eye, while repeating a color creates visual "harmony" across a look.' },
      ],
      practice: [
        { question: 'What does it mean when a fashion trend "cycles back"?', options: ['It disappears forever', 'A past style becomes popular again years later', 'It only happens once', 'It refers to recycling old clothes'], answerIndex: 1, explanation: 'Many fashion trends fade and later resurface as popular again, often reinterpreted for a new era.' },
        { question: 'Using a bold accessory to draw the eye to one part of an outfit is an example of which design principle?', options: ['Balance', 'Emphasis', 'Repetition', 'Rhythm'], answerIndex: 1, explanation: 'Emphasis is the design principle used to create a focal point that draws attention.' },
      ],
      apply: {
        prompt: 'Create a simple mood board (drawn, printed, or digital) for an outfit idea using one color palette and one design principle (like emphasis or balance).',
        checklist: ['Chose a color palette', 'Applied one design principle', 'Included at least 3 outfit elements', 'Explained your choices in a sentence'],
      },
      help: {
        readings: [
          {
            title: 'How Do Fashion Trends Start',
            url: 'https://glamobserver.com/how-do-fashion-trends-start/',
          },
          {
            title: 'Elements and Principles of Fashion Design',
            url: 'https://www.fitnyc.edu/museum/documents/elements-and-principles-of-fashion-design.pdf',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'textileCare',
      title: 'Textile Care & Maintenance',
      grade: '3-5',
      color: '#FFC107', // Amber
      description:
        'Best practices for cleaning, storing, and preserving fabrics and garments.',
      learn: [
        { heading: 'Read the Care Label', body: 'Clothing care labels use symbols to tell you how to wash, dry, and iron a garment safely — a picture of a washtub with an X means do not wash by machine, and a triangle with an X means do not use bleach. Always check the label before washing, especially for delicate or new items.' },
        { heading: 'Storage Protects Fabric', body: 'Folding sweaters instead of hanging them prevents stretching at the shoulders, and keeping clothes out of direct sunlight prevents fading. Cedar blocks or sachets help keep moths away from wool and other natural fibers in storage.' },
      ],
      practice: [
        { question: 'What does a washtub symbol with an X through it on a care label mean?', options: ['Wash in hot water', 'Do not machine wash', 'Iron on high heat', 'Dry clean only'], answerIndex: 1, explanation: 'An X through the washtub symbol means the item should not be machine washed.' },
        { question: 'Why should sweaters usually be folded instead of hung on a hanger?', options: ['Folding uses less space', 'Hanging can stretch out the shoulders over time', 'Folded sweaters look nicer', 'It does not matter'], answerIndex: 1, explanation: 'The weight of a sweater pulling on a hanger can stretch and distort the shoulder shape over time.' },
      ],
      apply: {
        prompt: 'Find three clothing items at home and check their care labels. Write down what each symbol tells you about how to wash or dry it.',
        checklist: ['Found 3 items with care labels', 'Identified the washing symbol', 'Identified the drying symbol', 'Noted any special warnings (like no bleach)'],
      },
      help: {
        readings: [
          {
            title: 'Caring for Textiles',
            url: 'https://museum.gwu.edu/caring-textiles',
          },
          {
            title: 'How to Care for Your Textiles',
            url: 'https://www.ncmuseumofhistory.org/collections/how-care-your-artifacts/how-care-your-textiles',
          },
        ],
        videos: [],
      },
    },
  ];

export default function TextilesAndApparelScreen() {
  return <ClassTopicScreen title={"Textiles & Apparel"} classKey="TextilesAndApparel" fallbackTopics={topics} />;
}
