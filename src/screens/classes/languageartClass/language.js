// src/screens/Language.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function Language() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    // Conventions of Standard English (Blue)
    {
      key: 'grammarSyntax',
      title: 'Grammar & Syntax',
      color: '#039BE5',
      description:
        'Understanding the rules for structuring sentences, including parts of speech and sentence construction.',
      help: {
        videos: [
          {
            title: 'The Importance of Grammar and Syntax',
            url: 'https://youtu.be/vy7P29_XdR4?si=uPS5U28XXJC_LonS',
          },
        ],
      },
    },
    {
      key: 'punctuationMechanics',
      title: 'Punctuation & Mechanics',
      color: '#039BE5',
      description:
        'Using punctuation marks (commas, periods, question marks, etc.) and mechanics (capitalization) correctly in writing.',
      help: {
        videos: [
          {
            title: 'Punctuation Explained',
            url: 'https://youtu.be/LdCOswMeXFQ?si=PNn-2BmPlHwAoKEx',
          },
        ],
      },
    },
    {
      key: 'spelling',
      title: 'Spelling',
      color: '#039BE5',
      description:
        'Knowing and applying correct spelling patterns and rules to write words accurately.',
      help: {
        videos: [
          {
            title: 'Learn How to Spell | Spelling Basic Words',
            url: 'https://youtu.be/r1uUwrQy_4g?si=YovMaYqhZQvj9_XI',
          },
        ],
      },
    },

    // Knowledge of Language (Teal) – leave help empty
    {
      key: 'registersStyleChoices',
      title: 'Registers & Style Choices',
      color: '#00897B',
      description:
        'Selecting appropriate tone, word choice, and formality for different audiences and purposes.',
      help: {
        videos: [],
      },
    },
    {
      key: 'sentenceVariety',
      title: 'Sentence Variety',
      color: '#00897B',
      description:
        'Using a mix of simple, compound, and complex sentences to create engaging writing.',
      help: {
        videos: [],
      },
    },

    // Vocabulary Acquisition & Use (Green)
    {
      key: 'wordRelationships',
      title: 'Word Relationships (Synonyms & Antonyms)',
      color: '#43A047',
      description:
        'Understanding how words relate to each other—words with similar meanings (synonyms) and opposite meanings (antonyms).',
      help: {
        videos: [
          {
            title: 'Antonyms and Synonyms',
            url: 'https://youtu.be/bBWm3-mxL1U?si=y_XYKoKfLcDdsxyr',
          },
        ],
      },
    },
    {
      key: 'nuancesWordMeaning',
      title: 'Nuances in Word Meaning',
      color: '#43A047',
      description:
        'Recognizing subtle differences in word meanings to choose the most precise word for the context.',
      help: {
        videos: [
          {
            title: 'Word relationships and nuances',
            url: 'https://youtu.be/OXL0fXCIkMw?si=JVNdVch6BrI2Saev',
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
      <Text style={styles.mainTitle}>Language</Text>

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
