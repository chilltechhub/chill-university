// src/components/MissionPopup.js
import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList } from 'react-native';

const MissionPopup = ({ visible, onClose, missions = [] }) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.header}>🎯 Active Missions</Text>

          {/* Mission List */}
          <FlatList
            data={missions}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={({ item }) => {
              const data = item.missions || {};
              const progress = `${item.current_value || 0} / ${item.target_value || 0}`;
              const completed = item.status === 'completed';

              return (
                <View style={[styles.missionItem, completed && styles.completed]}>
                  <Text style={styles.title}>{data.title}</Text>
                  <Text style={styles.description}>{data.description}</Text>

                  <Text style={styles.progress}>
                    Progress: {progress}
                  </Text>

                  <View style={styles.rewardRow}>
                    <Text style={styles.reward}>⭐ {data.point_reward || 0}</Text>
                    <Text style={styles.reward}>✨ {data.xp_reward || 0} XP</Text>
                  </View>

                  {completed && (
                    <Text style={styles.completedText}>✓ Ready to Claim</Text>
                  )}
                </View>
              );
            }}
          />

          {/* Close Button */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '90%',
    height: '75%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  missionItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  completed: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginVertical: 6,
    color: '#555',
  },
  progress: {
    fontSize: 12,
    color: '#666',
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  reward: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  completedText: {
    marginTop: 6,
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MissionPopup;
