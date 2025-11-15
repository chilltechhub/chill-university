import React from 'react';
import { View, Button, StyleSheet } from 'react-native';

export default function AnswerButtons({ onAnswer }) {
  return (
    <View style={styles.container}>
      <Button title="Yes" onPress={() => onAnswer(true)} />
      <Button title="No" onPress={() => onAnswer(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
});
