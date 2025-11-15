// src/screens/MediaDigitalLiteracy.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function MediaDigitalLiteracy() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    // Analyzing Media Messages (Deep Blue)
    {
      key: 'identifyingPurposeBias',
      title: 'Identifying Purpose & Bias',
      color: '#1565C0',
      description:
        'Recognizing why a media message was created and detecting any subjective slant or agenda.',
      help: {
        videos: [
          {
            title: 'How to Detect Bias in Media',
            url: 'https://youtu.be/6R6-2_8m4Co?si=RTnJSeWV8sB8SaFA',
          },
        ],
      },
    },
    {
      key: 'evaluatingSources',
      title: 'Evaluating Sources',
      color: '#1565C0',
      description:
        'Assessing credibility, accuracy, and trustworthiness of media outlets and authors.',
      help: {
        videos: [
          {
            title: 'Evaluating Media Sources',
            url: 'https://youtu.be/PCGWwXdpOxQ?si=TYTdQaIzcxQtkTin',
          },
        ],
      },
    },

    // Creating Multimedia (Teal)
    {
      key: 'integratingMedia',
      title: 'Integrating Text, Images, Audio & Video',
      color: '#00897B',
      description:
        'Combining different media elements to produce engaging multimedia content.',
      help: {
        videos: [
          {
            title:
              'Introduction to Multimedia Systems: Combining Text, Audio, Images, and Video',
            url: 'https://youtu.be/bEyEN94MW64?si=9NVWki8RZNdu6ap3',
          },
        ],
      },
    },
    {
      key: 'digitalStorytelling',
      title: 'Digital Storytelling',
      color: '#00897B',
      description:
        'Using digital tools (images, video, audio, text) to craft and share narratives online.',
      help: {
        videos: [
          {
            title: 'What is Digital Storytelling',
            url: 'https://youtu.be/JIix-yVzheM?si=nEuOQEdXZSI3yHVT',
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
      <Text style={styles.mainTitle}>Media & Digital Literacy</Text>

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

            {/* Show “Need help?” only if there are videos */}
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
