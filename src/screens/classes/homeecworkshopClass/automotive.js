// src/screens/AutomotiveTechnologyScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function AutomotiveTechnologyScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'engineFundamentals',
      title: 'Engine Fundamentals & Maintenance',
      color: '#D32F2F', // Red
      description:
        'Basics of how car engines work and essential maintenance tasks to keep them running smoothly.',
      help: {
        readings: [
          {
            title: "A Beginner’s Guide to Understanding Car Engines",
            url: 'https://beachautomotive.com/blog/a-beginners-guide-to-understanding-car-engines',
          },
        ],
        videos: [
          {
            title: 'Top 10 Car Engine Maintenance Tips For Beginners',
            url: 'https://youtu.be/FLUrVBnuqSo?si=kVSOywjXHsDqVwNh',
          },
        ],
      },
    },
    {
      key: 'brakeSteering',
      title: 'Brake, Suspension & Steering Systems',
      color: '#FF9800', // Orange
      description:
        'Understanding how brake, suspension, and steering components work and their maintenance.',
      help: {
        readings: [
          {
            title: 'How the Brake System Works',
            url: 'https://www.wagnerbrake.com/technical/parts-matter/driver-education-and-vehicle-safety/how-the-brake-system-works.html',
          },
          {
            title: 'What Is Suspension in a Car?',
            url: 'https://www.uti.edu/blog/automotive/car-suspension',
          },
          {
            title: 'Different Types of Steering Systems',
            url: 'https://www.xtramileautocare.com/blog/what-are-the-different-types-of-steering-systems',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'electricalDiagnostics',
      title: 'Electrical Diagnostics & Repair',
      color: '#03A9F4', // Sky Blue
      description:
        'Techniques to diagnose and repair common auto electrical issues, including wiring and battery systems.',
      help: {
        readings: [
          {
            title: 'Auto Electrical Repair Guide: Diagnosis, Fixes & Prevention',
            url: 'https://mayautomotivellc.com/blog/auto-electrical-repair-guide/',
          },
        ],
        videos: [],
      },
    },
  ];

  const toggleHelp = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainTitle}>Automotive Technology</Text>

      {topics.map((topic) => (
        <View key={topic.key} style={styles.card}>
          <View style={[styles.headerBar, { backgroundColor: topic.color }]}>  
            <Text style={styles.headerText}>{topic.title}</Text>
          </View>
          <View style={styles.sectionBody}>
            <Text style={styles.subtitle}>What is it?</Text>
            <Text style={styles.description}>{topic.description}</Text>

            {(topic.help.readings.length > 0 || topic.help.videos.length > 0) && (
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

            {openSections[topic.key] && (
              <View style={styles.helpContent}>
                {topic.help.readings.length > 0 && (
                  <>
                    <Text style={styles.helpLabel}>Resources</Text>
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
