// src/screens/TextilesAndApparelScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function TextilesAndApparelScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'fabricProperties',
      title: 'Fabric Properties & Selection',
      color: '#3F51B5', // Indigo
      description:
        'Understanding characteristics like strength, stretch, drape, and texture to choose appropriate materials.',
      help: {
        readings: [
          {
            title:
              'What Are The Properties Of FABRIC ~ Important Characteristics Of Fabrics',
            url: 'https://youtu.be/ga_Q1jNqy5w?si=OI1QSYVE8bBkDfk1',
          },
          {
            title:
              'Fabric Selection and Textiles in Fashion Design: Understanding Materials',
            url: 'https://theartcareerproject.com/fabric-selection-fashion-design-materials/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'sewingTechniques',
      title: 'Sewing Techniques & Garment Construction',
      color: '#009688', // Teal
      description:
        'Mastering various stitches, seams, and methods to assemble and finish clothing.',
      help: {
        readings: [
          {
            title:
              '29 Basic And Complex Sewing Techniques Sewers Should Master',
            url: 'https://sewing.com/sewing-techniques-sewers-should-master/',
          },
          {
            title: 'What is Garment Construction?',
            url: 'https://www.uphance.com/blog/what-is-garment-construction/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'fashionDesign',
      title: 'Fashion Design & Trends',
      color: '#E91E63', // Pink
      description:
        'Exploring how styles evolve, trend forecasting, and applying design principles to apparel.',
      help: {
        readings: [
          {
            title: 'How Do Fashion Trends Start',
            url: 'https://glamobserver.com/how-do-fashion-trends-start/',
          },
          {
            title: 'Elements and Principles of Fashion Design',
            url: 'https://www.fitnyc.edu/museum/documents/elements-and-principles-of-fashion-design.pdf',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'textileCare',
      title: 'Textile Care & Maintenance',
      color: '#FFC107', // Amber
      description:
        'Best practices for cleaning, storing, and preserving fabrics and garments.',
      help: {
        readings: [
          {
            title: 'Caring for Textiles',
            url: 'https://museum.gwu.edu/caring-textiles',
          },
          {
            title: 'How to Care for Your Textiles',
            url: 'https://www.ncmuseumofhistory.org/collections/how-care-your-artifacts/how-care-your-textiles',
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
      <Text style={styles.mainTitle}>Textiles & Apparel</Text>

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
