// src/screens/ConstructionAndCarpentryScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function ConstructionAndCarpentryScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'blueprintReading',
      title: 'Blueprint Reading & Sketching',
      color: '#FF5722', // Deep Orange
      description:
        'Interpreting construction blueprints and creating hand sketches to accurately plan structures.',
      help: {
        readings: [
          {
            title: 'Basic Blueprint Reading Principles',
            url: 'https://nabtu.personalearning.com/warehouse/nabtu/documents/course/387/8HR%20Blueprint%20Reading%20Principles%20-%20INST%20PPT.pdf',
          },
          {
            title: '5 Tips on How to Draw a Blueprint by Hand',
            url: 'https://www.roomsketcher.com/blog/how-to-draw-a-blueprint/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'framingStructural',
      title: 'Framing & Structural Concepts',
      color: '#4CAF50', // Green
      description:
        'Building structural frameworks including walls, floors, and roofs by applying carpentry principles.',
      help: {
        readings: [
          {
            title: 'Framing Carpentry',
            url: 'https://www.mycarpentry.com/framing-carpentry.html',
          },
        ],
        videos: [
          {
            title: 'Basic Structural Principles and Elements',
            url: 'https://youtu.be/u73gMakQuw0?si=iYF3S8o_7vX3vMqk',
          },
        ],
      },
    },
    {
      key: 'finishingWork',
      title: 'Drywall, Flooring & Finishing Work',
      color: '#3F51B5', // Indigo
      description:
        'Installing and finishing drywall, flooring materials, and carpentry trim for final project completion.',
      help: {
        readings: [
          {
            title: 'Drywall Tips and Tricks',
            url: 'https://www.finehomebuilding.com/list/drywall-tips-and-tricks',
          },
          {
            title: 'Flooring Project Tips: A Guide for DIYers and Contractors',
            url: 'https://www.41lumber.com/blogs/news/flooring-project-tips-a-guide-for-diyers-and-contractors',
          },
          {
            title: '10 Rules for Finish Carpentry',
            url: 'https://www.finehomebuilding.com/project-guides/finish-trim-carpentry/ten-rules-for-finish-carpentry',
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
      <Text style={styles.mainTitle}>Construction & Carpentry</Text>

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
