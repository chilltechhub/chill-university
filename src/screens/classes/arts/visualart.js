// src/screens/VisualArts.js

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';

export default function VisualArts() {
  const [openSections, setOpenSections] = useState({});

  const topics = [
    {
      key: 'drawingIllustration',
      title: 'Drawing & Illustration',
      color: '#8E24AA',
      description:
        'Techniques in line, shading, perspective, and observational drawing.',
      help: {
        videos: [
          { title: '6 Habits for Good Line Quality', url: 'https://youtu.be/lTslVOUJ0jI?si=IxqGrYvThJQCm32o' },
          { title: '13 Types of Lines and How to Use Them', url: 'https://youtu.be/mysAqNK6CHI?si=Abwl1wEJXXC0zNFG' },
          { title: 'Top 5 Shading Techniques for Beginners', url: 'https://youtu.be/225mwT-gGu8?si=rfRyP9z1GW6yDKot' },
        ],
        readings: [
          { title: 'The complete guide to shading techniques', url: 'https://www.gathered.how/arts-crafts/art/shading-techniques' },
          { title: 'How to Draw Perspective - A Simple Guide', url: 'https://www.youtube.com/watch?v=vs9f9shBpNI' },
          { title: 'Observation Drawing For Beginners', url: 'https://ccmonstersart.com/observation-drawing-for-beginners-101/' },
        ],
      },
    },
    {
      key: 'painting',
      title: 'Painting',
      color: '#D32F2F',
      description:
        'Exploration of media (watercolor, acrylic, oil), color mixing, brushwork, and composition.',
      help: {
        readings: [
          { title: 'The Difference Between Acrylic, Oils and Watercolor', url: 'https://www.josielewis.com/the-blog/the-difference-between-acrylic-oils-and-watercolor' },
          { title: 'Color Theory Part 4: Mixing Paint', url: 'https://www.muddycolors.com/2022/01/color-theory-part-4-mixing-paint/' },
          { title: 'Color Mixing Guide', url: 'https://goldenartistcolors.com/resources/color-mixing-guide' },
        ],
        videos: [
          { title: '5 Easy Brush Strokes To Help You Paint ANYTHING!', url: 'https://youtu.be/Oqagavq0hH0?si=UdwLksg4MQwgGjsU' },
          { title: '3 Rules for Better Composition in Your Art', url: 'https://youtu.be/te9Efr1VT9U?si=zIN9zOo-qQN78P-K' },
        ],
      },
    },
    {
      key: 'sculpture3d',
      title: 'Sculpture & 3D Media',
      color: '#FF8F00',
      description:
        'Working in clay, wood, metal, or mixed materials to create three-dimensional forms.',
      help: {
        videos: [
          { title: 'Intro to 3D Form - Soft Geometry - Clay', url: 'https://youtu.be/0pUegki8vcc?si=wfKTbqEBqfOVEjS0' },
          { title: 'How to Carve in 3 Dimensions - Intro', url: 'https://youtu.be/HNMYtpucQHs?si=R5qT52oTbePiRvwb' },
        ],
        readings: [
          { title: '3D Art: Creating with Mixed Media', url: 'https://www.bookbaker.com/es/v/Exploring-Art-A-Comprehensive-Guide-for-Middle-School-Students-3D-Art-Creating-with-Mixed-Media/8acc5310-ee77-4452-af79-4f59605cdcaa/7' },
        ],
      },
    },
    {
      key: 'printmaking',
      title: 'Printmaking',
      color: '#00796B',
      description:
        'Relief, intaglio, screen-printing, and monotype processes for producing editions.',
      help: {
        readings: [
          { title: 'Printmaking 101: Relief, Intaglio, Screen Printing & More', url: 'https://opusartsupplies.com/en-us/blogs/resource-library/printmaking-101-an-introduction-to-relief-printing-intaglio-printing-screen-printing-more?srsltid=AfmBOopFQeb12VrUOQutv9-N8zUhjDm4mI9sRqC1LJNvJ4T0JXKn978P' },
        ],
        videos: [],
      },
    },
    {
      key: 'ceramicsFiber',
      title: 'Ceramics & Fiber Arts',
      color: '#5D4037',
      description:
        'Hand-building, wheel-throwing, weaving, textile design, and mixed-media fibers.',
      help: {
        videos: [
          { title: 'Basics of Ceramic Handbuilding', url: 'https://youtu.be/HgKodiI2MMc?si=-artPjQeNSPUh7qe' },
          { title: 'Wheel Throwing For Beginners', url: 'https://youtu.be/dmgMKbHyDFw?si=BuKREbTcGygE989j' },
          { title: 'Ceramic Weaving', url: 'https://youtu.be/30hADtVn-4U?si=9xiAwv70Ztsft4ex' },
          { title: 'Intro to Textile & Surface Pattern Design', url: 'https://www.youtube.com/watch?v=4dp-yP_GapU' },
          { title: '19 kinds of Textile Design', url: 'https://youtu.be/JGR2H5zKJhM?si=-0_0W08fVmpgNJn6' },
          { title: 'Mixed Media Adventures', url: 'https://youtu.be/VwIAnmhCBcU?si=kL8GjBMLdXMgsnxz' },
        ],
        readings: [],
      },
    },
    {
      key: 'photographyDigital',
      title: 'Photography & Digital Media',
      color: '#303F9F',
      description:
        'Camera basics, digital editing, composition, and experimental media.',
      help: {
        readings: [
          { title: 'Photography Basics: Beginner’s Guide', url: 'https://photographylife.com/photography-basics' },
          { title: 'Photo Editing Basics', url: 'https://www.rei.com/learn/expert-advice/photo-editing-basics.html' },
          { title: 'Basic Video Editing Principles (2025)', url: 'https://www.descript.com/blog/article/11-basic-video-editing-principles-for-budding-filmmakers' },
        ],
        videos: [
          { title: 'Editing a Photo from Beginning to End', url: 'https://youtu.be/5agWcQlzXpU?si=TEmuqI94FlE9Uo3H' },
          { title: 'Canva Video Editor Tutorial', url: 'https://youtu.be/AlrC-XaKwew?si=1-ewAz1eIq3ZcHaG' },
        ],
      },
    },
    {
      key: 'mixedMediaInstallation',
      title: 'Mixed Media & Installation',
      color: '#C2185B',
      description:
        'Combining multiple materials or creating site-specific works.',
      help: {
        readings: [
          { title: 'Mixed Media and Installation Art', url: 'https://irishartmart.ie/mixed-media-and-installation-art/' },
        ],
        videos: [
          { title: 'What is Mixed Media? Beginner Guide', url: 'https://youtu.be/D3ge0isut60?si=W24-GNEBh1ypWBvf' },
        ],
      },
    },
    {
      key: 'elementsPrinciples',
      title: 'Elements & Principles of Art',
      color: '#388E3C',
      description:
        'Line, shape, form, color, texture, space, balance, contrast, emphasis, movement, pattern, rhythm, unity.',
      help: {
        readings: [
          { title: 'Elements & Principles of Art', url: 'https://human.libretexts.org/Courses/Solano_Community_College/ART_002%3A_Art_History/01%3A_A_World_Perspective_of_Art_Appreciation/1.06%3A_What_Are_the_Elements_of_Art_and_the_Principles_of_Art' },
        ],
        videos: [],
      },
    },
    {
      key: 'artHistoryCriticism',
      title: 'Art History & Criticism',
      color: '#455A64',
      description:
        'Survey of major movements, styles, and critical analysis of artworks.',
      help: {
        readings: [
          { title: 'Art criticism', url: 'https://www.britannica.com/art/art-criticism' },
          { title: 'Art history', url: 'https://www.khanacademy.org/humanities/art-history' },
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
      <Text style={styles.mainTitle}>Visual Arts</Text>

      {topics.map((topic) => (
        <View key={topic.key} style={styles.card}>
          <View style={[styles.headerBar, { backgroundColor: topic.color }]}>
            <Text style={styles.headerText}>{topic.title}</Text>
          </View>
          <View style={styles.sectionBody}>
            <Text style={styles.subtitle}>What is it?</Text>
            <Text style={styles.description}>{topic.description}</Text>
            {(topic.help.videos.length > 0 || topic.help.readings.length > 0) && (
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
                    <Text style={styles.helpLabel}>Readings</Text>
                    {topic.help.readings.map((item, i) => (
                      <Text
                        key={i}
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
                    {topic.help.videos.map((video, i) => (
                      <Text
                        key={i}
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
