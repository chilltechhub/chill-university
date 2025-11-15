// src/screens/SpeakingAndListening.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function SpeakingAndListening() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    // Comprehension & Collaboration (Teal)
    {
      key: 'activeListening',
      title: 'Active Listening',
      color: '#009688',
      description:
        'Focusing fully on the speaker, understanding their message, and responding thoughtfully.',
      help: {
        videos: [
          {
            title: '3 Ways To Be A Better Listener',
            url: 'https://youtu.be/mnUp7WgZ2TU?si=N8seRIklqHtmCjUr',
          },
        ],
      },
    },
    {
      key: 'participatingDiscussions',
      title: 'Participating in Discussions',
      color: '#009688',
      description:
        'Engaging respectfully with others by sharing ideas, asking questions, and building on peers’ contributions.',
      help: {
        videos: [
          {
            title: 'All About Social Skill for Kids',
            url: 'https://youtu.be/Myf2CUx9E60?si=dJ1JbVX3HozDDq0B',
          },
        ],
      },
    },
    {
      key: 'askingAnsweringQuestions',
      title: 'Asking & Answering Questions',
      color: '#009688',
      description:
        'Formulating clear questions and providing thoughtful answers in conversations or group settings.',
      help: {
        videos: [
          {
            title: 'Daily Use Questions and Answers For Kids',
            url: 'https://youtu.be/jW6uB7KmB8s?si=r6C6MDPUOfPzxIvO',
          },
        ],
      },
    },

    // Presentation of Knowledge & Ideas (Amber)
    {
      key: 'oralPresentations',
      title: 'Oral Presentations',
      color: '#FFC107',
      description:
        'Organizing and delivering information verbally to inform or persuade an audience.',
      help: {
        videos: [],
      },
    },
    {
      key: 'storytellingDramaticReadings',
      title: 'Storytelling & Dramatic Readings',
      color: '#FFC107',
      description:
        'Using expressive voice and gestures to tell stories or perform excerpts from texts.',
      help: {
        videos: [],
      },
    },
    {
      key: 'multimediaVisualAids',
      title: 'Use of Multimedia/Visual Aids',
      color: '#FFC107',
      description:
        'Incorporating images, slides, or audio to enhance understanding during a presentation.',
      help: {
        videos: [],
      },
    },
  ];

  const toggleHelp = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainTitle}>Speaking & Listening</Text>

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

            {/* Show “Need help?” toggle only if there are videos */}
            {topic.help.videos.length > 0 && (
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
