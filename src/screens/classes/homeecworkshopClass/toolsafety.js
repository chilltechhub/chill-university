// src/screens/ToolSafetyAndShopPracticesScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function ToolSafetyAndShopPracticesScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'ppe',
      title: 'Personal Protective Equipment (PPE)',
      color: '#607D8B', // Blue Grey
      description:
        'Using gloves, goggles, ear protection, and appropriate clothing to stay safe while working with tools.',
      help: {
        readings: [
          {
            title: 'Personal Protective Equipment',
            url: 'https://www.osha.gov/personal-protective-equipment',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'maintenanceOrganization',
      title: 'Tool Maintenance & Organization',
      color: '#FF9800', // Orange
      description:
        'Regular cleaning, sharpening, and proper storage of tools, plus techniques for organizing your workspace.',
      help: {
        readings: [],
        videos: [
          {
            title:
              'Workshop Maintenance: Hand Tools and Machine Care',
            url: 'https://youtu.be/kSmkQfw19CQ?si=aj60e19KrdVf9yjK',
          },
          {
            title: '11 Simple Ways to Organize Any Workshop',
            url: 'https://youtu.be/sSaKwxtrNmk?si=Z9h5X56eL6ktscgW',
          },
        ],
      },
    },
    {
      key: 'ergonomicsCleanup',
      title: 'Workshop Ergonomics & Clean‑up',
      color: '#8E24AA', // Purple
      description:
        'Setting up tools and workstations for proper posture, efficient workflow, and routine cleaning for safety and productivity.',
      help: {
        readings: [],
        videos: [
          {
            title: 'Shop Ergonomics',
            url: 'https://youtu.be/8a6515TaZ3s?si=YjtKYSNDfuBtv5pp',
          },
          {
            title:
              '11 Ways to Keep Your Workshop Neat and Tidy',
            url: 'https://www.familyhandyman.com/list/tips-for-a-tidy-workshop/?srsltid=AfmBOorVUDyzl8JWBGe3kFjD2oTj-MWxjk8ZKuVFdsr-kbHBJT1t_yC6',
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
      <Text style={styles.mainTitle}>Tool Safety & Shop Practices</Text>

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
