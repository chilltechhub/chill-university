// src/screens/classes/homeecworkshopClass/materialworking.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'woodworking',
      title: 'Woodworking',
      grade: '6-8',
      color: '#795548', // Brown
      description:
        'Working with wood using hand and power tools, precise measuring, joinery, and finishing techniques.',
      learn: [
        { heading: 'Measure Twice, Cut Once', body: 'Accurate woodworking starts with precise measuring and marking — using a tape measure, square, and pencil to mark cut lines clearly before touching a saw. The old rule "measure twice, cut once" exists because wood cut too short can\'t be uncut, so double-checking measurements saves material and time.' },
        { heading: 'Joinery Holds Wood Together', body: 'Joinery is how two pieces of wood are connected — simple butt joints are easy but weaker, while interlocking joints like dovetails or dados are stronger and don\'t rely only on glue or nails. Finishing with sanding, stain, or sealant protects the wood from moisture and wear after the piece is built.' },
      ],
      practice: [
        { question: 'Why do woodworkers follow the rule "measure twice, cut once"?', options: ['To waste time', 'Because a board cut too short cannot be uncut', 'Because saws are inaccurate', 'It is just a superstition'], answerIndex: 1, explanation: 'A mismeasured cut wastes material, so double-checking before cutting prevents costly mistakes.' },
        { question: 'What is the purpose of a wood joint like a dovetail?', options: ['To make the wood a different color', 'To create a strong mechanical connection between two pieces', 'To weaken the wood on purpose', 'To replace the need for sanding'], answerIndex: 1, explanation: 'Interlocking joints like dovetails create strong connections that hold pieces together without relying solely on glue or nails.' },
      ],
      apply: {
        prompt: 'With adult supervision, measure and mark a cut line on a piece of scrap wood using a tape measure and square, checking the measurement twice before marking.',
        checklist: ['Used a tape measure to find the length', 'Used a square to mark a straight line', 'Double-checked the measurement', 'Had adult supervision'],
      },
      help: {
        readings: [
          {
            title: "A Beginner’s Guide to Hand Tools for Woodworking",
            url: 'https://www.wagnermeters.com/moisture-meters/wood-info/a-beginners-guide-to-hand-tools-for-woodworking/',
          },
          {
            title: 'Guide to Essential Woodworking Power Tools',
            url: 'https://www.tractorsupply.com/tsc/cms/life-out-here/tool-shop/tool-tips/essential-woodworking-power-tools',
          },
          {
            title: 'Layout, Measuring, and Marking',
            url: 'https://www.woodmagazine.com/woodworking-how-to/layout-measuring-marking',
          },
          {
            title: '13 Types of Wood Joinery',
            url: 'https://www.thesprucecrafts.com/wood-joinery-types-3536631',
          },
          {
            title: 'Woodworking Finishing Techniques',
            url: 'https://www.thecrucible.org/guides/woodworking/finishing-techniques/',
          },
          {
            title: 'A Complete Guide to All Types of Wood Finishes',
            url: 'https://octaneseating.com/blog/wood-finishes/',
          },
          {
            title: 'Ultimate Guide to Wood Treatment',
            url: 'https://abatec-pools.com/en/the-ultimate-guide-to-wood-treatment/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'metalworking',
      title: 'Metalworking',
      grade: '9-12',
      color: '#607D8B', // Blue Grey
      description:
        'Shaping, cutting, joining, and finishing metal using appropriate tools, safety practices, and machining techniques.',
      learn: [
        { heading: 'Metal Properties Guide the Process', body: 'Different metals behave differently under heat and force — steel is strong and can be welded, aluminum is lighter and resists rust but has a lower melting point, and copper conducts electricity and heat well. Choosing the right metal depends on the project\'s strength, weight, and corrosion needs.' },
        { heading: 'Joining Methods Vary in Strength', body: 'Welding melts metal pieces together at their edges to form a permanent, very strong bond, while soldering uses a lower-temperature filler metal to join pieces without melting them — common for electronics or small joints. Safety gear like face shields, heat-resistant gloves, and proper ventilation is essential any time metal is heated or cut.' },
      ],
      practice: [
        { question: 'What is a key difference between welding and soldering?', options: ['They are the same process', 'Welding melts the base metal itself; soldering uses a lower-temperature filler metal', 'Soldering is only used on steel', 'Welding never requires safety gear'], answerIndex: 1, explanation: 'Welding fuses the actual metal pieces together, while soldering joins them with a separate melted filler metal at a lower temperature.' },
        { question: 'Why might aluminum be chosen over steel for a project?', options: ['It is heavier', 'It is lighter and resists rust', 'It cannot be shaped', 'It is always cheaper'], answerIndex: 1, explanation: 'Aluminum is prized for being lightweight and naturally resistant to rust compared to steel.' },
      ],
      apply: {
        prompt: 'Research two metals (like steel and aluminum) and compare their strength, weight, and rust resistance in a short chart.',
        checklist: ['Chose two metals to compare', 'Compared their strength', 'Compared their weight', 'Compared their rust resistance'],
      },
      help: {
        readings: [
          {
            title: 'Safety Tips for Working With Metal',
            url: 'https://calderamfg.com/resources/blog/metal-working-safety-tips/',
          },
          {
            title: 'Properties of Metals: Choosing Metal for Fabrication',
            url: 'https://metaltech.us/blog/properties-of-metal-choosing-a-type-of-metal/',
          },
          {
            title: 'What is Metalworking: Forming, Cutting and Joining',
            url: 'https://www.treatstock.com/guide/article/130-what-is-metalworking-forming-cutting-and-joining',
          },
          {
            title: 'Overview of Metal Forming',
            url: 'https://www.tfgusa.com/the-ultimate-overview-of-metal-forming/',
          },
          {
            title: 'Types of Welding in Metal Fabrication',
            url: 'https://kneesengineering.co.uk/news/what-are-the-different-types-of-welding-used-in-metal-fabrication/',
          },
          {
            title: '4 Common Welding Techniques',
            url: 'https://msistructuralsteel.com/4-common-welding-techniques-metal-fabrication/',
          },
          {
            title: 'Comprehensive Guide to Soldering',
            url: 'https://www.instructables.com/A-Comprehensive-Guide-to-Soldering-Techniques-Tool/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'basicMachining',
      title: 'Basic Machining',
      grade: '9-12',
      color: '#FFEB3B', // Yellow
      description:
        'Using machine tools like lathes and mills to cut, shape, and finish metal components accurately.',
      learn: [
        { heading: 'Lathes Spin, Mills Cut', body: 'A lathe spins a piece of metal rapidly while a cutting tool shapes it from the outside, ideal for making round parts like shafts or bolts. A mill instead spins the cutting tool itself and moves it across a stationary workpiece, making it useful for flat surfaces, slots, and precise holes.' },
        { heading: 'Precision Requires Careful Setup', body: 'Basic machining relies on precise measurement tools like calipers and micrometers to check that a part matches the design within tiny tolerances, sometimes as small as a thousandth of an inch. Machines spin or move very fast and can catch loose clothing, jewelry, or hair, so proper PPE and following safety procedures is critical before ever turning a machine on.' },
      ],
      practice: [
        { question: 'What is the main difference between a lathe and a mill?', options: ['A lathe spins the workpiece; a mill spins the cutting tool', 'They are the exact same machine', 'A mill only works on wood', 'A lathe cannot make round parts'], answerIndex: 0, explanation: 'A lathe rotates the workpiece against a fixed tool, while a mill rotates the cutting tool over a stationary workpiece.' },
        { question: 'Why is loose clothing or jewelry dangerous near a lathe or mill?', options: ['It can get caught in the spinning machine parts', 'It makes the machine slower', 'It has no safety impact', 'It only matters for wood machines'], answerIndex: 0, explanation: 'Fast-spinning machine parts can catch loose clothing, jewelry, or hair, leading to serious injury.' },
      ],
      apply: {
        prompt: 'Research the difference between a lathe and a milling machine, then sketch or describe one small part you could make with each and why that machine fits the job.',
        checklist: ['Described what a lathe does', 'Described what a mill does', 'Sketched or described a lathe project', 'Sketched or described a milling project'],
      },
      help: {
        readings: [],
        videos: [],
      },
    },
  ];

export default function MaterialWorkingScreen() {
  return <ClassTopicScreen title={"Material Working"} classKey="MaterialWorking" fallbackTopics={topics} />;
}
