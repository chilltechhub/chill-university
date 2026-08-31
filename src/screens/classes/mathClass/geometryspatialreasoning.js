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
