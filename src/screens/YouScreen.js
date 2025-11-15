// src/components/YouScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MissionsScreen from '../screens/MissionsScreen';
import DailyTasksScreen from '../screens/DailyTasksScreen';
import { useNavigation } from '@react-navigation/native';
import ProfileScreen from '../screens/ProfileScreen';


export default function YouScreen({ onPlay }) {
  const [showMissions, setShowMissions] = useState(false);
  const [showTasks, setShowTasks]       = useState(false);
  const navigation = useNavigation();

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Avatar + Pet */}
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatarWrapper}>
            <Image
              source={require('../../assets/character1.png')}
              style={styles.avatar}
            />
            <Image
              source={require('../../assets/pet1.png')}
              style={styles.pet}
            />
          </View>
        </TouchableOpacity>

        {/* Play Button */}
        <TouchableOpacity style={styles.playButton} onPress={() => navigation.navigate('Play', { index: 0 })}>
  <Text style={styles.playText}>PLAY</Text>
</TouchableOpacity>

        {/* Missions + Tasks Buttons */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.box}
            onPress={() => setShowMissions(true)}
          >
            <Text style={styles.boxText}>Missions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.box}
            onPress={() => setShowTasks(true)}
          >
            <Text style={styles.boxText}>Upcoming Tasks</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Missions Modal */}
      <Modal
        visible={showMissions}
        animationType="slide"
        onRequestClose={() => setShowMissions(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <MissionsScreen onClose={() => setShowMissions(false)} />
        </SafeAreaView>
      </Modal>

      {/* Daily Tasks Modal */}
      <Modal
        visible={showTasks}
        animationType="slide"
        onRequestClose={() => setShowTasks(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <DailyTasksScreen onClose={() => setShowTasks(false)} />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  avatar: {
    width: 140,
    height: 180,
    resizeMode: 'contain',
  },
  pet: {
    position: 'absolute',
    width: 60,
    height: 60,
    resizeMode: 'contain',
    left: 0,
    bottom: 0,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    width: '80%',
    alignItems: 'center',
  },
  playText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    gap: 16,
  },
  box: {
    backgroundColor: '#ffa500',
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  boxText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
