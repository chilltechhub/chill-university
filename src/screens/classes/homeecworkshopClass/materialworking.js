// src/screens/MaterialWorkingScreen.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function MaterialWorkingScreen() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'woodworking',
      title: 'Woodworking',
      color: '#795548', // Brown
      description:
        'Working with wood using hand and power tools, precise measuring, joinery, and finishing techniques.',
      help: {
        readings: [
          {
            title: "A Beginner’s Guide to Hand Tools for Woodworking",
            url: 'https://www.wagnermeters.com/moisture-meters/wood-info/a-beginners-guide-to-hand-tools-for-woodworking/',
          },
          {
            title: 'Guide to Essential Woodworking Power Tools',
            url: 'https://www.tractorsupply.com/tsc/cms/life-out-here/tool-shop/tool-tips/essential-woodworking-power-tools',
          },
          {
            title: 'Layout, Measuring, and Marking',
            url: 'https://www.woodmagazine.com/woodworking-how-to/layout-measuring-marking',
          },
          {
            title: '13 Types of Wood Joinery',
            url: 'https://www.thesprucecrafts.com/wood-joinery-types-3536631',
          },
          {
            title: 'Woodworking Finishing Techniques',
            url: 'https://www.thecrucible.org/guides/woodworking/finishing-techniques/',
          },
          {
            title: 'A Complete Guide to All Types of Wood Finishes',
            url: 'https://octaneseating.com/blog/wood-finishes/',
          },
          {
            title: 'Ultimate Guide to Wood Treatment',
            url: 'https://abatec-pools.com/en/the-ultimate-guide-to-wood-treatment/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'metalworking',
      title: 'Metalworking',
      color: '#607D8B', // Blue Grey
      description:
        'Shaping, cutting, joining, and finishing metal using appropriate tools, safety practices, and machining techniques.',
      help: {
        readings: [
          {
            title: 'Safety Tips for Working With Metal',
            url: 'https://calderamfg.com/resources/blog/metal-working-safety-tips/',
          },
          {
            title: 'Properties of Metals: Choosing Metal for Fabrication',
            url: 'https://metaltech.us/blog/properties-of-metal-choosing-a-type-of-metal/',
          },
          {
            title: 'What is Metalworking: Forming, Cutting and Joining',
            url: 'https://www.treatstock.com/guide/article/130-what-is-metalworking-forming-cutting-and-joining',
          },
          {
            title: 'Overview of Metal Forming',
            url: 'https://www.tfgusa.com/the-ultimate-overview-of-metal-forming/',
          },
          {
            title: 'Types of Welding in Metal Fabrication',
            url: 'https://kneesengineering.co.uk/news/what-are-the-different-types-of-welding-used-in-metal-fabrication/',
          },
          {
            title: '4 Common Welding Techniques',
            url: 'https://msistructuralsteel.com/4-common-welding-techniques-metal-fabrication/',
          },
          {
            title: 'Comprehensive Guide to Soldering',
            url: 'https://www.instructables.com/A-Comprehensive-Guide-to-Soldering-Techniques-Tool/',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'basicMachining',
      title: 'Basic Machining',
      color: '#FFEB3B', // Yellow
      description:
        'Using machine tools like lathes and mills to cut, shape, and finish metal components accurately.',
      help: {
        readings: [],
        videos: [],
      },
    },
  ];

  const toggleHelp = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.mainTitle}>Material Working</Text>

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
