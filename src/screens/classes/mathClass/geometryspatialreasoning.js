// src/screens/GeometrySpatialScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function GeometrySpatialReasoning() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'plane',
      title: 'Plane Geometry',
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

  const toggleHelp = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainTitle}>Geometry & Spatial Reasoning</Text>

      {topics.map((topic) => (
        <View key={topic.key} style={styles.card}>
          {/* Colored Header */}
          <View style={[styles.headerBar, { backgroundColor: topic.color }]}>
            <Text style={styles.headerText}>{topic.title}</Text>
          </View>

          {/* Body */}
          <View style={styles.sectionBody}>
            <Text style={styles.subtitle}>What is it?</Text>
            <Text style={styles.description}>{topic.description}</Text>

            {/* “Need help?” toggle */}
            <TouchableOpacity
              style={styles.helpToggle}
              onPress={() => toggleHelp(topic.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.helpTitle}>
                Need help? {openSections[topic.key] ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {/* Collapsible help content */}
            {openSections[topic.key] && (
              <View style={styles.helpContent}>
                {topic.help.readings.length > 0 && (
                  <>
                    <Text style={styles.helpLabel}>Readings</Text>
                    {topic.help.readings.map((item, idx) => (
                      <Text
                        key={idx}
                        style={styles.linkText}
                        onPress={() => Linking.openURL(item.url)}
                      >
                        • {item.title}
                      </Text>
                    ))}
                  </>
                )}

                {topic.help.videos.length > 0 && (
                  <>
                    <Text style={styles.helpLabel}>Videos</Text>
                    {topic.help.videos.map((video, idx) => (
                      <Text
                        key={idx}
                        style={styles.linkText}
                        onPress={() => Linking.openURL(video.url)}
                      >
                        • {video.title}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F3F7F7',
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#555',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    color: '#444',
  },
  helpToggle: {
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  helpContent: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
  },
  helpLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  linkText: {
    fontSize: 14,
    color: '#1e88e5',
    marginLeft: 8,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
});
