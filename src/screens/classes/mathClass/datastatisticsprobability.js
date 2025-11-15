// src/screens/DataStatisticsScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function DataStatisticsScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'collection',
      title: 'Data Collection & Representation',
      color: '#9C27B0', // Bright purple
      description:
        'Gathering data through surveys or experiments and displaying it in tables, bar graphs, line plots, histograms, or box plots.',
      help: {
        readings: [],
        videos: [
          {
            title:
              'Science of Data Visualization | Bar, scatter plot, line, histograms, pie, box plots, bubble chart',
            url: 'https://youtu.be/csXmVBw8cdo?feature=shared',
          },
        ],
      },
    },
    {
      key: 'descriptive',
      title: 'Descriptive Statistics',
      color: '#E91E63', // Bright pink
      description:
        'Summarizing data sets using measures of central tendency (mean, median, mode) and spread (range, interquartile range, standard deviation).',
      help: {
        readings: [
          {
            title:
              'Interquartile Range vs. Standard Deviation: What’s the Difference?',
            url:
              'https://www.statology.org/interquartile-range-vs-standard-deviation/',
          },
        ],
        videos: [
          {
            title: 'Mean, Median, Mode, and Range - How To Find It!',
            url: 'https://youtu.be/A1mQ9kD-i9I?feature=shared',
          },
          {
            title:
              'Standard Deviation, Variance, Range and Interquartile Range - Measures of dispersion',
            url: 'https://youtu.be/WnMXXWWlylo?feature=shared',
          },
        ],
      },
    },
    {
      key: 'probability',
      title: 'Probability',
      color: '#03A9F4', // Bright sky blue
      description:
        'Calculating the likelihood of simple and compound events, using basic counting methods (permutations, combinations), and understanding theoretical vs. experimental probability.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Basic Probability',
            url: 'https://youtu.be/KzfWUEJjG18?si=Q-XZEX9GvoLzpxJ6',
          },
        ],
      },
    },
    {
      key: 'inference',
      title: 'Statistical Inference',
      color: '#4CAF50', // Bright green
      description:
        '(High school) Designing samples, making estimates (confidence intervals), and testing hypotheses to draw conclusions about populations from data.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Understanding Statistical Inference',
            url: 'https://youtu.be/tFRXsngz4UQ?si=vQEOTf5SdXlM9jtS',
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
      <Text style={styles.mainTitle}>Data, Statistics & Probability</Text>

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
