import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CoinDisplay({ coins }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coins:</Text>
      <View style={styles.coins}>
        {coins.map((coin, index) => (
          <Text key={index} style={styles.coin}>{coin}¢</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold' },
  coins: { flexDirection: 'row', flexWrap: 'wrap' },
  coin: { margin: 5, fontSize: 16, backgroundColor: '#d3f8d3', padding: 5, borderRadius: 5 },
});
