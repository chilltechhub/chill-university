// src/screens/HealthAndWellnessScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function HealthAndWellnessScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'personalHygiene',
      title: 'Personal Hygiene & Self-Care',
      color: '#009688', // Teal
      description:
        'Practicing proper hygiene habits and self-care routines to maintain cleanliness and overall health.',
      help: {
        readings: [
          {
            title: 'Creating a Personal Hygiene Routine: Tips and Benefits',
            url: 'https://www.healthline.com/health/personal-hygiene',
          },
          {
            title: '7 Tips for Practicing Self-Care',
            url: 'https://turningpointcare.com/blog/7-tips-for-practicing-self-care/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'stressManagement',
      title: 'Stress Management & Mental Health',
      color: '#9C27B0', // Purple
      description:
        'Techniques to manage stress, support mental well-being, and recognize signs of emotional health needs.',
      help: {
        readings: [
          {
            title: 'Caring for Your Mental Health',
            url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health',
          },
          {
            title: 'Managing Stress',
            url: 'https://www.cdc.gov/mental-health/living-with/index.html',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'firstAid',
      title: 'First Aid & Safety Basics',
      color: '#F44336', // Red
      description:
        'Basic emergency response skills to treat common injuries and ensure safety in everyday situations.',
      help: {
        readings: [
          {
            title: 'First Aid Steps',
            url: 'https://www.redcross.org/take-a-class/first-aid/performing-first-aid/first-aid-steps?srsltid=AfmBOooDbmE2tmoBx-6eEkKe-6YMl_PMe-0hQ0gdC3fCKaSY10k_6Zbo',
          },
          {
            title: 'Basic First Aid Skills Everyone Should Learn',
            url: 'https://www.idahomedicalacademy.com/basic-first-aid-skills-everyone-should-learn/',
          },
          {
            title: 'Cuts and Scrapes: First Aid',
            url: 'https://www.mayoclinic.org/first-aid/first-aid-cuts/basics/art-20056711',
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
      <Text style={styles.mainTitle}>Health & Wellness</Text>

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
