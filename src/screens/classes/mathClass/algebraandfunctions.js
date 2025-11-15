// src/screens/AlgebraFunctionsScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function AlgebraFunctionsScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'patterns',
      title: 'Patterns & Relationships',
      color: '#9C27B0', // bright purple
      description:
        'Identifying and describing regularities in numbers or shapes, using tables, charts, or simple rules to predict what comes next.',
      help: {
        readings: [
          {
            title: 'Recognizing Patterns (LibreTexts)',
            url: 'https://math.libretexts.org/Courses/Coalinga_College/Math_for_Educators_(MATH_010A_and_010B_CID120)/05%3A_Problem_Solving/5.06%3A_Recognizing_Patterns',
          },
        ],
        videos: [
          {
            title: 'Finding the Rule for the Pattern (using a table)',
            url: 'https://youtu.be/OlUBFXfLE0c?feature=shared',
          },
        ],
      },
    },
    {
      key: 'expressions',
      title: 'Expressions & Equations',
      color: '#03A9F4', // bright sky blue
      description:
        'Writing and manipulating symbolic expressions (e.g., 3x + 5), solving equations and inequalities (linear, quadratic), and understanding equivalent forms.',
      help: {
        readings: [
          {
            title: 'Equivalent Expressions Guide',
            url: 'https://thirdspacelearning.com/us/math-resources/topic-guides/algebra/equivalent-expressions/',
          },
        ],
        videos: [
          {
            title: 'Writing Algebraic Expressions',
            url: 'https://youtu.be/o_Ubm7OI8t4?feature=shared',
          },
          {
            title: 'How To Solve Linear Inequalities (Basic Introduction)',
            url: 'https://youtu.be/DrZJKdXlZ3I?feature=shared',
          },
          {
            title: 'Quadratic Equation Explained Step-by-Step',
            url: 'https://youtu.be/gagj6GHZqnE?feature=shared',
          },
          {
            title: 'The Quadratic Formula Song',
            url: 'https://youtu.be/VOXYMRcWbF8?feature=shared',
          },
          {
            title: 'How To Solve Quadratic Equations Using The Quadratic Formula',
            url: 'https://youtu.be/IlNAJl36-10?feature=shared',
          },
        ],
      },
    },
    {
      key: 'functions',
      title: 'Functions & Modeling',
      color: '#FF9800', // bright orange
      description:
        'Interpreting and using the idea of a function—an input–output relationship—to model real-world situations with linear, quadratic, exponential, or other function types.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Input-Output Relationships (basic)',
            url: 'https://youtu.be/XAJ8LdOLmlk?feature=shared',
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
      <Text style={styles.mainTitle}>Algebra & Functions</Text>

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
    backgroundColor: '#FDFDFD',
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
