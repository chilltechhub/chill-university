// Example: src/wellness/NutritionScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NutritionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Nutrition tracking coming soon!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});