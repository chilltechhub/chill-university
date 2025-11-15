// src/screens/MatchmakingScreen.js
import React from "react";
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { currentUser, otherUsers } from "../../../../data/sampleUsers";
import { getMatchScore } from "../../../../logic/matchScore";

export default function MatchmakingScreen() {
  const sortedMatches = otherUsers
    .map((user) => ({
      ...user,
      matchScore: getMatchScore(currentUser, user)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={item.avatar} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.displayName}</Text>
        <Text style={styles.score}>Match Score: {item.matchScore}</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>View Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={sortedMatches}
      keyExtractor={(item) => item.uid}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  card: {
    flexDirection: "row",
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12
  },
  info: {
    flex: 1,
    justifyContent: "center"
  },
  name: {
    fontSize: 18,
    fontWeight: "600"
  },
  score: {
    fontSize: 14,
    color: "gray",
    marginVertical: 4
  },
  button: {
    backgroundColor: "#4a90e2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start"
  },
  buttonText: {
    color: "white",
    fontWeight: "500"
  }
});
