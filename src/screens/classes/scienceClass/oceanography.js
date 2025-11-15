// src/screens/AdvancedElectiveTopicsScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function AdvancedElectiveTopicsScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'trigonometry',
      title: 'Trigonometry',
      color: '#673AB7', // Deep purple
      description:
        'Defining sine, cosine, and tangent ratios in right and non-right triangles; exploring unit-circle definitions, graph behavior, and identities.',
      help: {
        readings: [
          {
            title: 'Sine; Cosine; Tangent (Math is Fun)',
            url: 'https://www.mathsisfun.com/sine-cosine-tangent.html',
          },
        ],
        videos: [
          {
            title: 'Intro to Trigonometry - sine, cosine, and tangent ratios',
            url: 'https://youtu.be/Q9mjsjOenQQ?si=koZN_KFMj-8p77ck',
          },
          {
            title: 'Non Right angled Trigonometry, the Sine and Cosine rules',
            url: 'https://youtu.be/5iYQCdL-bz4?si=_DrZADRqE-YeZgLa',
          },
          {
            title: 'The Unit Circle, Basic Introduction, Trigonometry',
            url: 'https://youtu.be/57VrEiEPD1I?si=8M13tnSCCSfQ9Nhnaa',
          },
        ],
      },
    },
    {
      key: 'precalculus',
      title: 'Precalculus',
      color: '#00BCD4', // Bright cyan
      description:
        'Delving into complex numbers, vectors, parametric and polar equations, advanced function families, and sequence/series fundamentals.',
      help: {
        readings: [
          {
            title: 'Intro to complex numbers (Khan Academy)',
            url: 'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:complex/x2ec2f6f830c9fb89:complex-num/a/intro-to-complex-numbers',
          },
          {
            title: 'Vectors (BYJU\'s)',
            url: 'https://byjus.com/maths/vectors/',
          },
          {
            title: 'Sequence and Series (BYJU\'s)',
            url: 'https://byjus.com/maths/sequence-and-series/',
          },
        ],
        videos: [
          {
            title:
              'Parametric Equations Introduction, Eliminating The Parameter t, Graphing Plane Curves, Precalculus',
            url: 'https://youtu.be/97pe-QlSGqA?si=JIYJlufBcOZbLSqf',
          },
          {
            title: 'Function Families',
            url: 'https://youtu.be/JzaeBxmvHl8?si=hiH5OcZFKKEGWqZB',
          },
        ],
      },
    },
    {
      key: 'calculus',
      title: 'Calculus',
      color: '#FF9800', // Bright orange
      description:
        'Introducing limits and continuity, computing derivatives and integrals, and applying them to rate-of-change and area-under-curve problems.',
      help: {
        readings: [
          {
            title: 'Derivatives and Integrals (BYJU\'s)',
            url: 'https://byjus.com/maths/calculus/',
          },
        ],
        videos: [
          {
            title: 'Limits and Continuity',
            url: 'https://youtu.be/9brk313DjV8?si=AhPWiFxsra9naUJ-',
          },
          {
            title: 'Derivatives and Rate of Change',
            url: 'https://youtu.be/xLE4C7y5Pn4?si=Q13q7N70Bl__c3p5',
          },
          {
            title:
              'Finding The Area Under The Curve Using Definite Integrals',
            url: 'https://youtu.be/UjTTx2eYrx8?si=Y8zqAQAH5E3dBf8s',
          },
        ],
      },
    },
    {
      key: 'discrete',
      title: 'Discrete Mathematics',
      color: '#8BC34A', // Light green
      description:
        '(Elective) Investigating logic and set theory, graph theory basics, recursion, and combinatorial reasoning for algorithmic thinking.',
      help: {
        readings: [
          {
            title: 'Graph Theory (DataCamp)',
            url:
              'https://www.datacamp.com/tutorial/introduction-to-graph-theory',
          },
        ],
        videos: [
          {
            title: 'Logic and Set Theory',
            url: 'https://youtu.be/dH4RHHsTf6Q?si=YBf1_L4W-s3Ul7l6',
          },
          {
            title: 'Recursive Formulas For Sequences',
            url: 'https://youtu.be/IFHZQ6MaG6w?si=SoCKhh_iesFq6uBW',
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
      <Text style={styles.mainTitle}>Advanced & Elective Topics</Text>

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

            {/* Show “Need help?” toggle if there are any links */}
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
    backgroundColor: '#F5F5F5',
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
