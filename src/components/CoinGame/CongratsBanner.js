import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CongratsBanner({ level }) {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>🎉 Congratulations! You moved to Level {level}! 🎉</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#ffe680',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
