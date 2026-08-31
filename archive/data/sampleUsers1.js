// src/data/sampleUsers.js
export const currentUser = {
  uid: "user_001",
  interests: ["ai", "gaming", "music production"],
  hobbies: ["gardening", "circuit building"],
  skills: ["react", "arduino"],
  goals: ["learn embedded systems", "launch a game"]
};

export const otherUsers = [
  {
    uid: "user_002",
    displayName: "Nova Smith",
    avatar: require("../assets/character2.jpg"),
    interests: ["ai", "music production", "travel"],
    hobbies: ["gardening", "reading"],
    skills: ["react", "python"],
    goals: ["launch a game", "build a smart home"]
  },
  {
    uid: "user_003",
    displayName: "Riko Blaze",
    avatar: require("../assets/character3.jpg"),
    interests: ["robotics", "ai", "cars"],
    hobbies: ["circuit building", "fishing"],
    skills: ["arduino", "c++"],
    goals: ["learn embedded systems"]
  }
];
