// src/screens/classes/mathClass/geometryspatialreasoning.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'plane',
      title: 'Plane Geometry',
      grade: '3-5',
      color: '#009688', // Teal
      description:
        'Studying properties and relationships of flat shapes (points, lines, angles, triangles, polygons, and circles), including congruence and similarity.',
      learn: [
        { heading: 'The Building Blocks of Shapes', body: 'A point marks an exact location, a line goes on forever in both directions, and a line segment is a piece of a line with two endpoints. Angles form where two segments or rays meet, and shapes like triangles and polygons are built from segments connected end to end.' },
        { heading: 'Congruent vs. Similar', body: 'Two shapes are congruent if they are exactly the same size and shape — one could be placed exactly on top of the other. Two shapes are similar if they have the same shape but different sizes, like a photo and its enlargement — their angles match but their side lengths are scaled.' },
      ],
      practice: [
        { question: 'A triangle with all three sides the same length is called what?', options: ['Scalene', 'Equilateral', 'Right', 'Obtuse'], answerIndex: 1, explanation: 'An equilateral triangle has three equal sides and three equal angles.' },
        { question: 'Two triangles have the same angle measures but one is twice as big as the other. What is their relationship?', options: ['Congruent', 'Similar', 'Parallel', 'Perpendicular'], answerIndex: 1, explanation: 'Same shape but different size means the triangles are similar, not congruent.' },
      ],
      apply: {
        prompt: 'Draw two triangles on paper: one congruent copy of a triangle you traced, and one similar but larger version of the same triangle. Use a ruler and tracing paper to check your work.',
        checklist: ['Traced or drew an original triangle', 'Created a congruent copy using tracing paper', 'Created a similar, larger version using a ruler to scale each side', 'Measured angles to confirm they matched in both copies'],
      },
      help: {
        readings: [
          {
            title: 'Plane geometry (Math is Fun)',
            url: 'https://www.mathsisfun.com/geometry/plane-geometry.html',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'coordinate',
      title: 'Coordinate Geometry',
      grade: '6-8',
      color: '#3F51B5', // Indigo
      description:
        'Placing and analyzing geometric figures in the plane using an (x,y) coordinate system; applying distance, midpoint, and slope formulas.',
      learn: [
        { heading: 'Reading the Coordinate Plane', body: 'Every point on the plane is named by an ordered pair (x, y): x tells you how far to move left or right from the origin, and y tells you how far to move up or down. The plane is divided into four quadrants, and the signs of x and y tell you which quadrant a point is in.' },
        { heading: 'Distance, Midpoint, and Slope', body: 'The distance formula (built from the Pythagorean theorem) finds the straight-line length between two points. The midpoint formula averages the x-coordinates and averages the y-coordinates to find the point exactly between them. Slope measures steepness as "rise over run" — how much y changes for each step in x.' },
      ],
      practice: [
        { question: 'In which quadrant is the point (-3, 5) located?', options: ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'], answerIndex: 1, explanation: 'Negative x and positive y place the point in Quadrant II (upper left).' },
        { question: 'What is the slope of the line through points (1, 2) and (4, 8)?', options: ['2', '3', '6', '1/2'], answerIndex: 0, explanation: 'Slope = (8 - 2) / (4 - 1) = 6 / 3 = 2.' },
      ],
      apply: {
        prompt: 'On graph paper, plot 5 points to make a simple "treasure map" (like a pirate ship, a chest, and an island). Label the coordinates of each point, then calculate the distance and midpoint between two of them.',
        checklist: ['Plotted at least 5 labeled points on graph paper', 'Recorded each point\'s (x, y) coordinates', 'Calculated the distance between two of the points', 'Calculated the midpoint between two of the points'],
      },
      help: {
        readings: [
          {
            title: 'Introduction to coordinate geometry (BYJU\'s)',
            url: 'https://byjus.com/maths/coordinate-geometry/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'transformations',
      title: 'Transformations & Symmetry',
      grade: '6-8',
      color: '#E91E63', // Pink
      description:
        'Exploring how shapes change under translations, rotations, reflections, and dilations, and understanding lines of symmetry.',
      learn: [
        { heading: 'Four Types of Transformations', body: 'A translation slides a shape to a new position without turning or flipping it. A rotation turns a shape around a fixed point. A reflection flips a shape over a line, like a mirror image. A dilation changes the size of a shape, making it bigger or smaller while keeping its shape the same.' },
        { heading: 'Lines of Symmetry', body: 'A shape has a line of symmetry if you can fold it along that line and both halves match up exactly. Some shapes, like a square, have several lines of symmetry; others, like a scalene triangle, have none.' },
      ],
      practice: [
        { question: 'A shape slides 3 units to the right without turning or flipping. This is an example of what transformation?', options: ['Rotation', 'Reflection', 'Translation', 'Dilation'], answerIndex: 2, explanation: 'Sliding a shape without turning or flipping is a translation.' },
        { question: 'How many lines of symmetry does a square have?', options: ['0', '1', '2', '4'], answerIndex: 3, explanation: 'A square can be folded along 2 diagonals and 2 lines through the midpoints of opposite sides — 4 lines total.' },
      ],
      apply: {
        prompt: 'Cut out a few paper shapes (square, rectangle, triangle, heart). Fold each one to find all its lines of symmetry, then trace one shape onto a grid and draw its reflection across a line.',
        checklist: ['Cut out at least 3 different paper shapes', 'Found and marked every line of symmetry by folding', 'Traced one shape onto a grid', 'Drew an accurate reflection of that shape across a line'],
      },
      help: {
        readings: [
          {
            title: 'Symmetry in geometry (MathBitsNotebook)',
            url: 'https://mathbitsnotebook.com/Geometry/Transformations/TRSymmetry.html',
          },
        ],
        videos: [
          {
            title: 'Symmetry and Transformations (Simplifying Math)',
            url: 'https://youtu.be/XH8nSD4g0hg?feature=shared',
          },
        ],
      },
    },
    {
      key: 'solid',
      title: 'Solid Geometry',
      grade: '9-12',
      color: '#FFC107', // Amber
      description:
        'Examining three-dimensional figures (prisms, cylinders, pyramids, cones, spheres), focusing on their nets, surface areas, and volumes.',
      learn: [
        { heading: 'Nets: Unfolding 3D Shapes', body: 'A net is a flat, 2D pattern that folds up into a 3D solid — like cutting a cardboard box along its edges and laying it flat. Seeing the net of a shape helps you visualize exactly which flat faces make up its surface.' },
        { heading: 'Surface Area vs. Volume', body: 'Surface area is the total area of all the outer faces of a solid — how much wrapping paper you\'d need to cover it — found by adding up the areas of every face in its net. Volume is how much space is inside the solid — how much it could hold — usually found by multiplying base area by height for prisms and cylinders.' },
      ],
      practice: [
        { question: 'What is the volume of a rectangular prism with length 4, width 3, and height 5?', options: ['12', '60', '35', '20'], answerIndex: 1, explanation: 'Volume = length × width × height = 4 × 3 × 5 = 60.' },
        { question: 'A net made of one rectangle rolled into a tube plus two circles on the ends forms which solid?', options: ['Cube', 'Cone', 'Cylinder', 'Sphere'], answerIndex: 2, explanation: 'A cylinder\'s net is a rectangle (the curved side) plus two circles (the top and bottom).' },
      ],
      apply: {
        prompt: 'Build a small 3D solid (a cube or rectangular prism) out of paper or cardboard by first drawing its net, cutting it out, and folding it together. Measure its dimensions and calculate its surface area and volume.',
        checklist: ['Drew an accurate net for a chosen solid', 'Cut out and folded the net into a 3D shape', 'Measured the dimensions of the solid', 'Calculated both surface area and volume'],
      },
      help: {
        readings: [
          {
            title: 'Formulas for surface area and volume of 3D figures (ThoughtCo)',
            url: 'https://www.thoughtco.com/surface-area-and-volume-2312247',
          },
        ],
        videos: [
          {
            title: 'Nets Of 3D Shapes Explained',
            url: 'https://youtu.be/s7GrS0b3FRw?feature=shared',
          },
        ],
      },
    },
  ];

export default function GeometrySpatialReasoning() {
  return <ClassTopicScreen title={"Geometry & Spatial Reasoning"} classKey="GeometrySpatialReasoning" fallbackTopics={topics} />;
}
