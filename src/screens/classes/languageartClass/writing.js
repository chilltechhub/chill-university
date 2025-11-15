// src/screens/WritingScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function WritingScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    // Text Types & Purposes (Purple)
    {
      key: 'opinionArgumentative',
      title: 'Opinion/Argumentative',
      color: '#8E24AA',
      description:
        'Writing that expresses a clear viewpoint and supports it with reasons and evidence.',
      help: {
        videos: [
          {
            title: 'Text Types (Narrative, Informative, Argumentative)',
            url: 'https://youtu.be/EKpFKe8eQ3U?si=Mv-JINsX6XlwcXzJ',
          },
        ],
      },
    },
    {
      key: 'informativeExplanatory',
      title: 'Informative/Explanatory',
      color: '#8E24AA',
      description:
        'Writing that explains facts or concepts clearly to inform the reader.',
      help: {
        videos: [
          {
            title: 'Text Types (Narrative, Informative, Argumentative)',
            url: 'https://youtu.be/EKpFKe8eQ3U?si=Mv-JINsX6XlwcXzJ',
          },
        ],
      },
    },
    {
      key: 'narrative',
      title: 'Narrative',
      color: '#8E24AA',
      description: 'Writing that tells a story with characters, setting, and plot.',
      help: {
        videos: [
          {
            title: 'Text Types (Narrative, Informative, Argumentative)',
            url: 'https://youtu.be/EKpFKe8eQ3U?si=Mv-JINsX6XlwcXzJ',
          },
        ],
      },
    },

    // Writing Process (Blue)
    {
      key: 'planningResearch',
      title: 'Planning & Research',
      color: '#039BE5',
      description: 'Gathering ideas and information before writing.',
      help: {
        videos: [
          {
            title: 'The Writing Process: A Step by Step Guide to Academic Writing',
            url: 'https://youtu.be/1JQxCNgr5MQ?si=67_xEW35jZ_Y4BhJ',
          },
        ],
      },
    },
    {
      key: 'drafting',
      title: 'Drafting',
      color: '#039BE5',
      description: 'Putting ideas into a first draft to get the writing on paper.',
      help: {
        videos: [
          {
            title: 'The Writing Process: A Step by Step Guide to Academic Writing',
            url: 'https://youtu.be/1JQxCNgr5MQ?si=67_xEW35jZ_Y4BhJ',
          },
        ],
      },
    },
    {
      key: 'revisingEditing',
      title: 'Revising & Editing',
      color: '#039BE5',
      description:
        'Improving and correcting the draft to make it clearer and error-free.',
      help: {
        videos: [
          {
            title: 'The Writing Process: A Step by Step Guide to Academic Writing',
            url: 'https://youtu.be/1JQxCNgr5MQ?si=67_xEW35jZ_Y4BhJ',
          },
        ],
      },
    },
    {
      key: 'publishing',
      title: 'Publishing',
      color: '#039BE5',
      description: 'Sharing the final version of writing with others.',
      help: {
        videos: [
          {
            title: 'The Writing Process: A Step by Step Guide to Academic Writing',
            url: 'https://youtu.be/1JQxCNgr5MQ?si=67_xEW35jZ_Y4BhJ',
          },
        ],
      },
    },

    // Research & Inquiry (Green)
    {
      key: 'gatheringSources',
      title: 'Gathering Sources',
      color: '#43A047',
      description: 'Finding reliable books, websites, or other materials for research.',
      help: {
        videos: [
          {
            title: 'How to Evaluate Sources for Reliability',
            url: 'https://youtu.be/q1k8rcYUmbQ?si=qlGJ_749QbC3Q5Cf',
          },
        ],
      },
    },
    {
      key: 'noteTakingOrganizing',
      title: 'Note-taking & Organizing',
      color: '#43A047',
      description: 'Recording and arranging important information from sources.',
      help: {
        videos: [
          {
            title: 'How to Take Notes for Research | Elementary Research',
            url: 'https://youtu.be/127HrnYcav0?si=Kx-K1RfkD9CjvI0Y',
          },
          {
            title: 'Research Paper - Organizing Your Notes',
            url: 'https://youtu.be/qi8lJDHpQRM?si=qZgAjvHXrvw7MnkJ',
          },
        ],
      },
    },
    {
      key: 'citingEvidence',
      title: 'Citing Evidence',
      color: '#43A047',
      description: 'Giving credit to sources to show where information came from.',
      help: {
        videos: [
          {
            title: 'Citing Sources: Why & How to Do It',
            url: 'https://youtu.be/-JV9cLDCgas?si=JLghEeG73OyV7TgJ',
          },
          {
            title: 'APA 7th Edition: The Basics of APA In-text Citations',
            url: 'https://youtu.be/opp259YvaoE?si=mAfk2SnDLvOzVl8F',
          },
        ],
      },
    },

    // Handwriting & Keyboarding (Orange)
    {
      key: 'handwritingKeyboarding',
      title: 'Handwriting & Keyboarding',
      color: '#FB8C00',
      description:
        'Learning to write letters neatly by hand and using a keyboard effectively.',
      help: {
        videos: [
          {
            title:
              'Learning How to Write the English Alphabet Uppercase and Lowercase Letters',
            url: 'https://youtu.be/EOX784OXmPs?si=1lu8ERmG4SN0-NqZ',
          },
          {
            title: 'How to HOLD A PENCIL',
            url: 'https://youtu.be/RclxBdiuvOM?si=G2RFG--lci7gIvK6',
          },
          {
            title: 'Intro to Typing for Kids and Teens',
            url: 'https://youtu.be/SPz9rF5KUcg?si=d1px0W2esWADl4T3',
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
      <Text style={styles.mainTitle}>Writing</Text>

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
