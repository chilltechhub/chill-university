import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Button,
  ScrollView,
  Linking,
} from "react-native";

export default function PortfolioScreen() {
  const [projects, setProjects] = useState([]);
  const [research, setResearch] = useState([]);
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [hobbies, setHobbies] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [sectionType, setSectionType] = useState("");

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [link, setLink] = useState("");

  const openModal = (type) => {
    setSectionType(type);
    setModalVisible(true);
  };

  const addItem = (setter, list) => {
    if (!title.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      title,
      desc,
      link,
    };

    setter([...list, newItem]);

    setTitle("");
    setDesc("");
    setLink("");
    setModalVisible(false);
  };

  const WikiCard = ({ item }) => (
    <View style={styles.wikiCard}>
      <Text style={styles.wikiCardTitle}>{item.title}</Text>

      {item.desc ? (
        <Text style={styles.wikiCardDesc}>{item.desc}</Text>
      ) : null}

      {item.link ? (
        <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
          <Text style={styles.wikiLink}>🔗 View More</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // ✅ FIX: Section component MUST live here (NOT inside JSX)
  const Section = ({ title, data, add }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <TouchableOpacity style={styles.addBtn} onPress={add}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        scrollEnabled={false}
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <WikiCard item={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>Nothing added yet.</Text>
        }
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* FANDOM STYLE HEADER */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>My Portfolio Wiki</Text>
        <Text style={styles.bannerSubtitle}>
          An evolving archive of projects, achievements, skills & interests
        </Text>
      </View>

      {/* INFO PANEL */}
      <View style={styles.infobox}>
        <Text style={styles.infoboxTitle}>Profile Info</Text>

        <View style={styles.infoboxRow}>
          <Text style={styles.infoboxLabel}>Status:</Text>
          <Text style={styles.infoboxValue}>Active</Text>
        </View>

        <View style={styles.infoboxRow}>
          <Text style={styles.infoboxLabel}>Focus:</Text>
          <Text style={styles.infoboxValue}>Growth & Creation</Text>
        </View>

        <View style={styles.infoboxRow}>
          <Text style={styles.infoboxLabel}>Version:</Text>
          <Text style={styles.infoboxValue}>1.0</Text>
        </View>
      </View>

      {/* SECTIONS */}
      <Section
        title="🚀 Projects"
        data={projects}
        add={() => openModal("projects")}
      />

      <Section
        title="📚 Research"
        data={research}
        add={() => openModal("research")}
      />

      <Section
        title="🧠 Skills"
        data={skills}
        add={() => openModal("skills")}
      />

      <Section
        title="💼 Experience"
        data={experience}
        add={() => openModal("experience")}
      />

      <Section
        title="🎨 Hobbies & Interests"
        data={hobbies}
        add={() => openModal("hobbies")}
      />

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add {sectionType}</Text>

            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Description (optional)"
              value={desc}
              onChangeText={setDesc}
            />

            <TextInput
              style={styles.input}
              placeholder="Link (optional)"
              value={link}
              onChangeText={setLink}
            />

            <View style={styles.actions}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />

              <Button
                title="Save"
                onPress={() => {
                  if (sectionType === "projects")
                    addItem(setProjects, projects);
                  if (sectionType === "research")
                    addItem(setResearch, research);
                  if (sectionType === "skills") addItem(setSkills, skills);
                  if (sectionType === "experience")
                    addItem(setExperience, experience);
                  if (sectionType === "hobbies")
                    addItem(setHobbies, hobbies);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111", padding: 10 },

  banner: {
    backgroundColor: "#2B4C7E",
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
  },
  bannerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  bannerSubtitle: { color: "#dcdcdc", marginTop: 4 },

  infobox: {
    backgroundColor: "#1e1e1e",
    borderWidth: 2,
    borderColor: "#3a3a3a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  infoboxTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#ffcc00",
    marginBottom: 6,
  },
  infoboxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  infoboxLabel: { color: "#aaa" },
  infoboxValue: { color: "#fff" },

  section: {
    backgroundColor: "#1b1b1b",
    borderRadius: 12,
    padding: 10,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "#333",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },

  addBtn: {
    backgroundColor: "#ffcc00",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: { fontWeight: "bold" },

  wikiCard: {
    backgroundColor: "#282828",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#444",
  },
  wikiCardTitle: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  wikiCardDesc: { color: "#bbb", marginTop: 4 },
  wikiLink: { color: "#4fa3ff", marginTop: 6 },

  empty: { color: "#777", fontStyle: "italic" },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modal: { backgroundColor: "#fff", padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  actions: { flexDirection: "row", justifyContent: "space-between" },
});
