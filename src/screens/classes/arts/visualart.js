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
