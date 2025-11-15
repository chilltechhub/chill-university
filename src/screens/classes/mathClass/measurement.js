// src/screens/MeasurementScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function MeasurementScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'units',
      title: 'Units & Conversions',
      color: '#2196F3', // Bright blue
      description:
        'Selecting and converting among metric and customary units for length, weight/mass, volume/capacity, time, and temperature.',
      help: {
        readings: [
          {
            title:
              'Conversion Between the Metric and US Customary Systems of Measurement',
            url: 'https://math.libretexts.org/Courses/Rio_Hondo/Math_150%3A_Survey_of_Mathematics/06%3A_Measurement_and_Geometry/6.01%3A_Measurement/6.1.03%3A_Conversion_Between_the_Metric_and_US_Customary_Systems_of_Measurement',
          },
          {
            title: 'Converting Temperatures (CK-12)',
            url: 'https://flexbooks.ck12.org/cbook/ck-12-cbse-maths-class-6/section/6.10/primary/lesson/temperature-conversion/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'perimeter',
      title: 'Perimeter, Area & Volume',
      color: '#8BC34A', // Bright green
      description:
        'Calculating lengths around shapes, sizes of surfaces, and capacities of solids using standard formulas.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Perimeter, Area, and Volume Explained',
            url: 'https://youtu.be/2UEUWC313QY?feature=shared',
          },
        ],
      },
    },
    {
      key: 'angles',
      title: 'Angle Measurement',
      color: '#FF5722', // Deep orange
      description:
        'Measuring and classifying angles (acute, right, obtuse), and applying protractors and angle-sum properties in polygons.',
      help: {
        readings: [
          {
            title: 'How to determine acute; right; obtuse (Math is Fun)',
            url: 'https://www.mathsisfun.com/angles.html',
          },
          {
            title:
              'Sum of Angles in a Polygon (Cuemath)',
            url: 'https://www.cuemath.com/geometry/sum-of-angles-in-a-polygon/',
          },
        ],
        videos: [
          {
            title:
              'How To Use A Protractor To Measure And Draw Angles Explained From The Right And Left Side',
            url: 'https://youtu.be/CHJ7_q4cCuE?feature=shared',
          },
          {
            title: 'ANGLE THEOREMS',
            url: 'https://youtu.be/Bq1QyT-HZrU?feature=shared',
          },
          {
            title:
              'How To Calculate The Interior Angles and Exterior Angles of a Regular Polygon',
            url: 'https://youtu.be/OEzEo4XqzJQ?feature=shared',
          },
        ],
      },
    },
    {
      key: 'applications',
      title: 'Applications',
      color: '#FFEB3B', // Bright yellow
      description:
        'Applying measurement skills to real-life contexts such as reading maps (scale), cooking (units), and scheduling (time).',
      help: {
        readings: [],
        videos: [],
      },
    },
  ];

  const toggleHelp = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainTitle}>Measurement</Text>

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

            {/* Only show “Need help?” toggle if there are resources */}
            {(topic.help.readings.length > 0 ||
              topic.help.videos.length > 0) && (
              <TouchableOpacity
                style={styles.helpToggle}
                onPress={() => toggleHelp(topic.key)}
                activeOpacity={0.7}
              >
                <Text style={styles.helpTitle}>
                  Need help? {openSections[topic.key] ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
            )}

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
    backgroundColor: '#FAFAFA',
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
    color: '#333',
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
