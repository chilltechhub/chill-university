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
  Linking
} from "react-native";

export default function ProjectsScreen() {
  const [projects, setProjects] = useState([]);

  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  // Create form
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");

  const [links, setLinks] = useState([]);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);

  // -------------------
  // TASKS
  const addTask = () => {
    if (!taskInput.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: taskInput, done: false }]);
    setTaskInput("");
  };

  const toggleTask = (projectId, taskId) => {
    setProjects(projects.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        tasks: p.tasks.map(t =>
          t.id === taskId ? { ...t, done: !t.done } : t
        )
      };
    }));
  };

  // -------------------
  // LINKS
  const addLink = () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    setLinks([...links, { id: Date.now().toString(), label: linkLabel, url: linkUrl }]);
    setLinkLabel("");
    setLinkUrl("");
  };

  const removeLinkFromEdit = (projectId, linkId) => {
    setProjects(projects.map(p =>
      p.id === projectId
        ? { ...p, links: p.links.filter(l => l.id !== linkId) }
        : p
    ));
  };

  const openLink = async (url) => {
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    }
  };

  // -------------------
  // CREATE PROJECT
  const addProject = () => {
    if (!title.trim()) return;

    const newProj = {
      id: Date.now().toString(),
      title,
      goal,
      deadline,
      priority,
      status,
      notes,
      tasks,
      links,
    };

    setProjects([...projects, newProj]);

    setTitle("");
    setGoal("");
    setDeadline("");
    setPriority("");
    setStatus("");
    setNotes("");
    setTasks([]);
    setLinks([]);

    setCreateModal(false);
  };

  // -------------------
  // OPEN EDIT
  const openEdit = (project) => {
    setSelectedProject(project);
    setEditModal(true);
  };

  // -------------------
  // SAVE EDIT
  const saveEdit = () => {
    setProjects(projects.map(p =>
      p.id === selectedProject.id ? selectedProject : p
    ));
    setEditModal(false);
  };

  // -------------------
  const renderProject = ({ item }) => {
    const completed = item.tasks.filter(t => t.done).length;
    const progress =
      item.tasks.length === 0
        ? 0
        : Math.round((completed / item.tasks.length) * 100);

    return (
      <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
        <Text style={styles.cardTitle}>{item.title}</Text>

        {item.goal ? <Text style={styles.cardText}>🎯 {item.goal}</Text> : null}
        {item.deadline ? <Text style={styles.cardText}>📅 {item.deadline}</Text> : null}
        {item.priority ? <Text style={styles.cardText}>🔥 Priority: {item.priority}</Text> : null}
        {item.status ? <Text style={styles.cardText}>📌 {item.status}</Text> : null}

        <Text style={styles.progressText}>
          Progress: {progress}%
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠 Projects</Text>

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setCreateModal(true)}
      >
        <Text style={styles.addBtnText}>+ New Project</Text>
      </TouchableOpacity>

      <FlatList
        data={projects}
        keyExtractor={(i) => i.id}
        renderItem={renderProject}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No projects yet.</Text>
        }
      />

      {/* ---------------- CREATE PROJECT MODAL ---------------- */}
      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>Create Project</Text>

              <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
              <TextInput style={styles.input} placeholder="Goal" value={goal} onChangeText={setGoal} />
              <TextInput style={styles.input} placeholder="Deadline" value={deadline} onChangeText={setDeadline} />
              <TextInput style={styles.input} placeholder="Priority" value={priority} onChangeText={setPriority} />
              <TextInput style={styles.input} placeholder="Status" value={status} onChangeText={setStatus} />

              <Text style={styles.sectionTitle}>Tasks</Text>

              <View style={{ flexDirection: "row", gap: 6 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Add task"
                  value={taskInput}
                  onChangeText={setTaskInput}
                />
                <TouchableOpacity style={styles.taskBtn} onPress={addTask}>
                  <Text style={{ color: "white" }}>Add</Text>
                </TouchableOpacity>
              </View>

              {tasks.map(t => (
                <Text key={t.id} style={styles.taskPreview}>• {t.text}</Text>
              ))}

              <Text style={styles.sectionTitle}>Helpful Links / Tools</Text>

              <TextInput
                style={styles.input}
                placeholder="Label (ex: Research Article)"
                value={linkLabel}
                onChangeText={setLinkLabel}
              />
              <TextInput
                style={styles.input}
                placeholder="URL"
                value={linkUrl}
                onChangeText={setLinkUrl}
              />
              <TouchableOpacity style={styles.addLinkBtn} onPress={addLink}>
                <Text style={{ color: "white", textAlign: "center" }}>
                  Add Link
                </Text>
              </TouchableOpacity>

              {links.map(l => (
                <Text key={l.id} style={styles.linkPreview}>
                  🔗 {l.label} — {l.url}
                </Text>
              ))}

              <Text style={styles.sectionTitle}>Notes</Text>

              <TextInput
                style={[styles.input, { height: 90 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Notes..."
                multiline
              />

              <View style={styles.modalActions}>
                <Button title="Cancel" onPress={() => setCreateModal(false)} />
                <Button title="Save" onPress={addProject} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---------------- EDIT PROJECT MODAL ---------------- */}
      {selectedProject && (
        <Modal visible={editModal} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <ScrollView>
                <Text style={styles.modalTitle}>
                  Edit: {selectedProject.title}
                </Text>

                <TextInput
                  style={styles.input}
                  value={selectedProject.title}
                  onChangeText={t => setSelectedProject({ ...selectedProject, title: t })}
                />

                <TextInput
                  style={styles.input}
                  value={selectedProject.goal}
                  onChangeText={g => setSelectedProject({ ...selectedProject, goal: g })}
                  placeholder="Goal"
                />

                <TextInput
                  style={styles.input}
                  value={selectedProject.status}
                  onChangeText={s => setSelectedProject({ ...selectedProject, status: s })}
                  placeholder="Status"
                />

                <Text style={styles.sectionTitle}>Tasks</Text>

                {selectedProject.tasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskItem}
                    onPress={() => toggleTask(selectedProject.id, task.id)}
                  >
                    <Text
                      style={{
                        textDecorationLine: task.done ? "line-through" : "none",
                        color: task.done ? "green" : "black",
                      }}
                    >
                      {task.text}
                    </Text>
                    <Text>{task.done ? "✔" : "○"}</Text>
                  </TouchableOpacity>
                ))}

                <Text style={styles.sectionTitle}>Helpful Links</Text>

                {selectedProject.links.map(link => (
                  <View key={link.id} style={styles.linkItem}>
                    <TouchableOpacity onPress={() => openLink(link.url)}>
                      <Text style={styles.linkText}>🔗 {link.label}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        removeLinkFromEdit(selectedProject.id, link.id)
                      }
                    >
                      <Text style={{ color: "red" }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={styles.sectionTitle}>Notes</Text>

                <TextInput
                  style={[styles.input, { height: 100 }]}
                  value={selectedProject.notes}
                  onChangeText={n =>
                    setSelectedProject({ ...selectedProject, notes: n })
                  }
                  multiline
                />

                <View style={styles.modalActions}>
                  <Button title="Close" onPress={() => setEditModal(false)} />
                  <Button title="Save Changes" onPress={saveEdit} />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12 },

  addBtn: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  addBtnText: { color: "white", fontWeight: "bold" },

  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  cardText: { marginTop: 4, color: "#444" },
  progressText: { marginTop: 6, fontWeight: "bold" },

  emptyText: { textAlign: "center", marginTop: 40, color: "#777" },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "92%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 18,
    maxHeight: "90%",
  },

  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  sectionTitle: { fontWeight: "bold", marginTop: 10, marginBottom: 4 },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  taskBtn: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: "center",
  },

  taskItem: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  taskPreview: { marginLeft: 8, color: "#444" },

  addLinkBtn: {
    backgroundColor: "#10b981",
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },

  linkPreview: { marginLeft: 6, color: "#333" },

  linkItem: {
    backgroundColor: "#f3f3f3",
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  linkText: { color: "#2563eb", fontWeight: "600" },
});
