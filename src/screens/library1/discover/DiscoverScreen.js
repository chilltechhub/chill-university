import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import BreakthroughsScreen from './BreakthroughsScreen';
import FellowScholarsScreen from './FellowScholarsScreen';
import MentorsScreen from './MentorsScreen'
import TopTalentScreen from './TopTalentScreen';

export default function DiscoverScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Discover</Text>

      <View style={styles.searchSection}>
        <Ionicons name="search" size={24} color="black" />
        <TextInput
          placeholder="Search..."
          style={styles.searchInput}
        />
      </View>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('DiscoverPScreen')}
        >
          <Image source={require('../../../../assets/projects-icon.png')} style={styles.icon} />
          <Text style={styles.textCenter}>Projects{"\n"}Help Wanted & Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('BreakthroughsScreen')}
        >
          <Image source={require('../../../../assets/breakthrough-icon.png')} style={styles.icon} />
          <Text style={styles.textCenter}>Breakthroughs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('FellowScholarsScreen')}
        >
          <Image source={require('../../../../assets/fellows-icon.png')} style={styles.icon} />
          <Text style={styles.textCenter}>Fellow{"\n"}Scholars</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('TopTalentScreen')}
        >
          <Image source={require('../../../../assets/toptalent-icon.png')} style={styles.icon} />
          <Text style={styles.textCenter}>Top Talent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('MentorsScreen')}
        >
          <Image source={require('../../../../assets/master-icon.png')} style={styles.icon} />
          <Text style={styles.textCenter}>Masters{"\n"}Experts{"\n"}Mentors</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    marginBottom: 10,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 30,
    height: 40,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  textCenter: {
    textAlign: 'center',
  },
});