// src/screens/FamilyAndHumanDevelopmentScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function FamilyAndHumanDevelopmentScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'lifeStages',
      title: 'Life Stages & Relationships',
      color: '#FF5722', // Deep Orange
      description:
        'Understanding developmental stages from infancy through adulthood and key relationship types.',
      help: {
        readings: [
          {
            title:
              'What Is Human Development and Why Is It Important?',
            url:
              'https://online.maryville.edu/online-bachelors-degrees/human-development-and-family-studies/resources/stages-of-human-development/',
          },
          {
            title:
              '6 Types of Relationships and Their Effect on Your Life',
            url:
              'https://www.verywellmind.com/6-types-of-relationships-and-their-effect-on-your-life-5209431',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'parentingChildDev',
      title: 'Parenting & Child Development',
      color: '#4CAF50', // Green
      description:
        'Guidance on effective parenting strategies and understanding milestones in child growth.',
      help: {
        readings: [
          {
            title:
              '9 Steps to More Effective Parenting',
            url:
              'https://kidshealth.org/en/parents/nine-steps.html',
          },
          {
            title:
              'Child Development Guide: Ages and Stages',
            url:
              'https://choc.org/ages-stages/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'agingElderCare',
      title: 'Aging & Elder Care',
      color: '#3F51B5', // Indigo
      description:
        'Insights on healthy aging, elder care practices, and safety for older adults.',
      help: {
        readings: [
          {
            title: 'Ageing and health (WHO)',
            url: 'https://www.who.int/news-room/fact-sheets/detail/ageing-and-health',
          },
          {
            title:
              'Home Safety Tips for Older Adults',
            url:
              'https://www.nia.nih.gov/health/aging-place/home-safety-tips-older-adults',
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
      <Text style={styles.mainTitle}>Family & Human Development</Text>

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
