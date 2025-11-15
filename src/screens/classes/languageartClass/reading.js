// src/screens/ReadingScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function ReadingScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    // Foundational Skills (Purple)
    {
      key: 'printConcepts',
      title: 'Print Concepts',
      color: '#8E24AA',
      description:
        'Understanding how books and print work (e.g., reading left to right, top to bottom, how to turn pages, recognizing that words are made of letters).',
      help: {
        videos: [
          {
            title: 'Concepts of Print for Kindergarten',
            url: 'https://youtu.be/T-ybpyBWH2o?si=thyBAb1NXK87i7nd',
          },
        ],
      },
    },
    {
      key: 'phonologicalAwareness',
      title: 'Phonological Awareness',
      color: '#8E24AA',
      description:
        'The ability to hear and manipulate sounds in spoken language. Includes skills like rhyming; syllable segmentation; blending and segmenting onset-rime; phonemic awareness (individual sounds in words).',
      help: {
        videos: [
          {
            title: 'Rhyming Words',
            url: 'https://youtu.be/4PW3_LErVZk?si=HKt6zrULKIhfbIOA',
          },
          {
            title: 'Open and Closed Syllables',
            url: 'https://youtu.be/epk-hnVC10k?si=7nGZ5YvC4TBofqnM',
          },
          {
            title: 'What are Syllables',
            url: 'https://youtu.be/Um7ukvphdHY?si=OdpfjT59aEyajM-J',
          },
        ],
      },
    },
    {
      key: 'phonicsWordRecognition',
      title: 'Phonics & Word Recognition',
      color: '#8E24AA',
      description:
        'Phonics – Connecting sounds to letters (letter-sound correspondence). Helps children decode (sound out) words when reading. Word Recognition – The ability to recognize words quickly and effortlessly. Includes sight word recognition and decoding strategies.',
      help: {
        videos: [
          {
            title: 'Phonics Song',
            url: 'https://youtu.be/BELlZKpi1Zs?si=LeLmN4KaNvK3aodr',
          },
          {
            title: 'Letter Sound - Phonics for Kids',
            url: 'https://youtu.be/jiEv6VTDt5c?si=dEEEGVLSftui5YBL',
          },
          {
            title: 'Word recognition/site words',
            url: 'https://youtu.be/gIZjrcG9pW0?si=HPzkNjgF1dAUD13S',
          },
        ],
      },
    },
    {
      key: 'fluency',
      title: 'Fluency',
      color: '#8E24AA',
      description:
        'Reading with speed, accuracy, and proper expression. Fluency bridges the gap between word recognition and comprehension.',
      help: {
        videos: [
          {
            title: 'Reading Fluency: Speed, Accuracy, and Expression',
            url: 'https://youtu.be/i0cQu7vnDzs?si=NiK07cZVwQHYNSlw',
          },
        ],
      },
    },

    // Literature (Blue)
    {
      key: 'storyElements',
      title: 'Story Elements',
      color: '#039BE5',
      description:
        'Story Elements (plot, character, setting).',
      help: {
        videos: [
          {
            title: 'Story Elements Song | Character, Setting and Plot!',
            url: 'https://youtu.be/m3WHmmYTHeE?si=ma9elO11dO6LwOPM',
          },
        ],
      },
    },
    {
      key: 'themesAuthorsPurpose',
      title: 'Themes & Author’s Purpose',
      color: '#039BE5',
      description:
        'Themes & Author’s Purpose.',
      help: {
        videos: [
          {
            title: 'Theme',
            url: 'https://youtu.be/xwkKBIzpRXE?si=T5etTG1nn67v3Mdc',
          },
          {
            title: "Author's Purpose",
            url: 'https://youtu.be/enm4afX-izA?si=k48sPixqvR9AU8Xw',
          },
        ],
      },
    },
    {
      key: 'literaryDevices',
      title: 'Literary Devices',
      color: '#039BE5',
      description:
        'Literary Devices (metaphor, symbolism, etc.).',
      help: {
        videos: [
          {
            title:
              'Literary Devices (Onomatopoeia, Personification, Simile, and Metaphor)',
            url: 'https://youtu.be/JaYPoeMJECg?si=R30S0NpJ-LbNMkAv',
          },
        ],
      },
    },

    // Informational Text (Orange)
    {
      key: 'mainIdea',
      title: 'Main Idea & Supporting Details',
      color: '#FB8C00',
      description:
        'Main Idea & Supporting Details.',
      help: {
        videos: [
          {
            title: 'Main Idea and Supporting Details',
            url: 'https://youtu.be/LWFnpeimPfE?si=t6Wxkg-3-Zd_VrUB',
          },
        ],
      },
    },
    {
      key: 'textFeatures',
      title: 'Text Features',
      color: '#FB8C00',
      description:
        'Text Features (headings, charts, captions).',
      help: {
        videos: [
          {
            title: 'Nonfiction Text Features',
            url: 'https://youtu.be/GQ03w1Igolc?si=4NluGSeDvhgmV9s4',
          },
        ],
      },
    },
    {
      key: 'textStructure',
      title: 'Text Structure',
      color: '#FB8C00',
      description:
        'Text Structure (cause/effect, compare/contrast, sequence).',
      help: {
        videos: [
          {
            title:
              'The 5 Types of Text Structure | Educational Rap',
            url: 'https://youtu.be/7kWGQ-_ipBY?si=pgAj0eo48YkWOOSU',
          },
        ],
      },
    },

    // Vocabulary (Green)
    {
      key: 'contextClues',
      title: 'Context Clues',
      color: '#43A047',
      description:
        'Context Clues.',
      help: {
        videos: [
          {
            title: 'Context Clues',
            url: 'https://youtu.be/eHCpJ86XDY4?si=sSEmA05h27xCQS5u',
          },
        ],
      },
    },
    {
      key: 'wordRootsAffixes',
      title: 'Word Roots & Affixes',
      color: '#43A047',
      description:
        'Word Roots & Affixes.',
      help: {
        videos: [
          {
            title: 'Root Word and Affixes',
            url: 'https://youtu.be/H2NZuH8dUW0?si=7YcrghiLkwGmCuog',
          },
        ],
      },
    },
    {
      key: 'academicDomainTerms',
      title: 'Academic & Domain-Specific Terms',
      color: '#43A047',
      description:
        'Academic & Domain-Specific Terms.',
      help: {
        videos: [
          {
            title:
              'Academic and Domain-Specific Words, Context Clues',
            url: 'https://youtu.be/1LZH7iEvqFg?si=S9TpqgEhkLWCZH5E',
          },
        ],
      },
    },

    // Comprehension Strategies (Red)
    {
      key: 'makingInferences',
      title: 'Making Inferences',
      color: '#D32F2F',
      description:
        'Making Inferences.',
      help: {
        videos: [
          {
            title: 'Inferences | Making Inferences',
            url: 'https://youtu.be/JdaD2FZQFEY?si=uXXvzgOD7KQs1OBU',
          },
        ],
      },
    },
    {
      key: 'summarizing',
      title: 'Summarizing',
      color: '#D32F2F',
      description:
        'Summarizing.',
      help: {
        videos: [
          {
            title: 'Summarizing a Story',
            url: 'https://youtu.be/4jUi0pSQ-bU?si=fcP2L_2o8fG-ky1O',
          },
        ],
      },
    },
    {
      key: 'monitoringSelfQuestioning',
      title: 'Monitoring & Self-Questioning',
      color: '#D32F2F',
      description:
        'Monitoring & Self-Questioning.',
      help: {
        videos: [
          {
            title: 'Self-Monitoring',
            url: 'https://youtu.be/SK6tl16dKo0?si=OMWDt9AFFKt4g1Tp',
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
      <Text style={styles.mainTitle}>Reading</Text>

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
