// src/screens/HouseholdAndResourceManagementScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function HouseholdAndResourceManagementScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'homeOrganization',
      title: 'Home Organization & Time Management',
      color: '#FF5722', // Deep Orange
      description:
        'Techniques to keep home orderly and strategies to manage daily tasks efficiently.',
      help: {
        readings: [
          {
            title: '59 Home Organization Ideas for a Tidier Space',
            url: 'https://www.architecturaldigest.com/story/home-organization-ideas',
          },
          {
            title: 'Time Management: 10 Strategies for Better Time Management',
            url: 'https://extension.uga.edu/publications/detail.html?number=C1042&title=time-management-10-strategies-for-better-time-management',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'interiorDesign',
      title: 'Interior Design & Housing Choices',
      color: '#3F51B5', // Indigo
      description:
        'Basics of arranging living spaces, decorating principles, and evaluating housing options.',
      help: {
        readings: [
          {
            title: 'Beginners Guide To Interior Decorating',
            url: 'https://katrinaandco.com/blogs/katrina-co-blog/beginners-guide-to-interior-decorating?srsltid=AfmBOoqCBgacyeA7qb7XIKhyexWZ16UqkRlni0S4iVPe59JHxAVExWGe',
          },
          {
            title: 'Pros and Cons of Different Housing Options',
            url: 'https://www.marketprohomebuyers.com/pros-and-cons-of-different-housing-options/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'sustainability',
      title: 'Environmental Sustainability & Energy Conservation',
      color: '#4CAF50', // Green
      description:
        'Practices to reduce environmental impact, conserve resources, and save energy at home.',
      help: {
        readings: [
          {
            title: 'Defining Environmental Sustainability',
            url: 'https://sphera.com/resources/glossary/what-is-environmental-sustainability/',
          },
          {
            title: 'Sustainable Living Tips',
            url: 'https://www.conservation.org/act/sustainable-living-tips',
          },
          {
            title: 'What is Energy Conservation? Your Guide',
            url: 'https://www.digitalenergyby5.com/blog/what-is-energy-conservation/',
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
      <Text style={styles.mainTitle}>Household & Resource Management</Text>

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
