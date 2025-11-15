// src/screens/ClassesScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function ClassesScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'counting',
      title: 'Counting & Cardinality',
      // Bright red background
      color: '#FF6B6B',
      description:
        'Understanding how to count objects, recognize that the last number in a count names the quantity, and use place-value concepts (e.g., ones, tens, hundreds) to represent and compare numbers.',
      help: {
        videos: [
          {
            title: 'Counting',
            url: 'https://youtu.be/mKSNQuQrsm0?feature=shared',
          },
          {
            title: 'Cardinal counting principle',
            url: 'https://youtu.be/ieRYzlFWWUg?feature=shared',
          },
          {
            title: 'Counting and cardinality',
            url: 'https://youtu.be/aSDi_PN2YoA?feature=shared',
          },
          {
            title: 'Place Value Song For Kids | Ones, Tens, & Hundreds',
            url: 'https://youtu.be/a4FXl4zb3E4?feature=shared',
          },
          {
            title: 'Place Value',
            url: 'https://youtu.be/T5Qf0qSSJFI?feature=shared',
          },
        ],
      },
    },
    {
      key: 'whole',
      title: 'Whole Number Operations',
      // Bright blue background
      color: '#4D96FF',
      description:
        'Mastery of addition, subtraction, multiplication, and division with nonnegative integers, including strategies (e.g., regrouping, arrays) and properties (commutative, associative).',
      help: {
        videos: [
          {
            title: 'Multiplying whole numbers',
            url: 'https://youtu.be/SuC_ufEOHQc?feature=shared',
          },
          {
            title: 'Dividing whole numbers',
            url: 'https://youtu.be/oNxjGOxTaOc?feature=shared',
          },
          {
            title: 'Adding whole numbers',
            url: 'https://youtu.be/-MiH40ZUwq4?feature=shared',
          },
          {
            title: 'Subtracting whole numbers',
            url: 'https://youtu.be/gIHYlZcr_1Y?feature=shared',
          },
          {
            title: 'Regrouping whole number place values',
            url: 'https://youtu.be/i7lqWXKuhhQ?feature=shared',
          },
          {
            title: 'Multiplication with Arrays',
            url: 'https://youtu.be/QphXFi30aFk?feature=shared',
          },
          {
            title:
              'Multiplication Properties | Commutative, Associative, Identity, & Zero',
            url: 'https://youtu.be/Doqt7bb8Gno?feature=shared',
          },
        ],
      },
    },
    {
      key: 'fractions',
      title: 'Fractions & Decimals',
      // Bright green background
      color: '#4CAF50',
      description:
        'Representing parts of a whole or group, comparing and ordering fractional and decimal values, and performing operations (addition, subtraction, multiplication, division) on them.',
      help: {
        videos: [
          {
            title: 'Comparing and Ordering Fractions, Decimals, and Percents',
            url: 'https://youtu.be/5vv--qrUJXo?feature=shared',
          },
          {
            title: 'Converting Fractions to Decimals Song',
            url: 'https://youtu.be/WV5VY76Pf5U?feature=shared',
          },
          {
            title: 'Compare & Order Fractions by Equivalency',
            url: 'https://youtu.be/bj5fSn96Cns?feature=shared',
          },
          {
            title: 'Comparing Decimal Numbers',
            url: 'https://youtu.be/rALUd3wW29s?feature=shared',
          },
          {
            title: 'Adding and Subtracting Fractions',
            url: 'https://youtu.be/5juto2ze8Lg?feature=shared',
          },
          {
            title: 'Multiplication and Division of Fractions',
            url: 'https://youtu.be/Q9MCRjrrd6E?feature=shared',
          },
          {
            title: 'Adding & Subtracting Decimals Song',
            url: 'https://youtu.be/n-OcbG1FlBQ?feature=shared',
          },
          {
            title: 'How to Multiply Decimals and Divide Decimals',
            url: 'https://youtu.be/jtstmHefBW8?feature=shared',
          },
        ],
      },
    },
    {
      key: 'rational',
      title: 'Rational & Real Numbers',
      // Bright orange background
      color: '#FFB74D',
      description:
        'Extending number sense to include negatives, fractional and decimal numbers, and recognizing that both rational (e.g., ¾, –2) and irrational (e.g., √2, π) numbers fill out the number line.',
      help: {
        videos: [
          {
            title: 'Natural, Whole, Integers, Rational, Irrational, Real, Imaginary',
            url: 'https://youtu.be/WxXZaP8Y8pI?feature=shared',
          },
          {
            title: 'An Intro to Rational and Irrational Numbers',
            url: 'https://youtu.be/Th9mT4TxvOI?feature=shared',
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
      <Text style={styles.mainTitle}>Numbers & Operations</Text>

      {topics.map((topic) => (
        <View key={topic.key} style={styles.card}>
          {/* Colored header bar */}
          <View style={[styles.headerBar, { backgroundColor: topic.color }]}>
            <Text style={styles.headerText}>{topic.title}</Text>
          </View>

          {/* “What is it?” */}
          <View style={styles.sectionBody}>
            <Text style={styles.subtitle}>What is it?</Text>
            <Text style={styles.description}>{topic.description}</Text>

            {/* “Need help?” toggle button */}
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
    backgroundColor: '#F9F9F9',
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
    // subtle shadow (iOS) / elevation (Android)
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
