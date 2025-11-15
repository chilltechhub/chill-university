import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Question({ text }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  text: { fontSize: 18, fontWeight: 'bold' },
});
