import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";

export default function ResearchScreen() {
  const [topic, setTopic] = useState("");
  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState("");

  const [citations, setCitations] = useState([]);
  const [citationInput, setCitationInput] = useState("");

  const [notes, setNotes] = useState("");

  const [checklist, setChecklist] = useState([
    { item: "Understand the topic", done: false },
    { item: "Find 3–5 credible sources", done: false },
    { item: "Take key notes", done: false },
    { item: "Create citations", done: false },
    { item: "Write summary", done: false },
  ]);

  const toggleChecklist = (index) => {
    const updated = [...checklist];
    updated[index].done = !updated[index].done;
    setChecklist(updated);
  };

  const addSource = () => {
    if (!newSource.trim()) return;
    setSources([...sources, newSource.trim()]);
    setNewSource("");
  };

  const addCitation = () => {
    if (!citationInput.trim()) return;
    setCitations([...citations, citationInput.trim()]);
    setCitationInput("");
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#0c0f1a" }}>
      <Text style={{ color: "white", fontSize: 26, fontWeight: "bold", marginBottom: 10 }}>
        Research Center
      </Text>

      {/* Topic */}
      <Text style={{ color: "#9ca3af", marginBottom: 6 }}>Research Topic</Text>
      <TextInput
        value={topic}
        onChangeText={setTopic}
        placeholder="What are you researching?"
        placeholderTextColor="#6b7280"
        style={{
          backgroundColor: "#111827",
          color: "white",
          padding: 12,
          borderRadius: 10,
          marginBottom: 16
        }}
      />

      {/* Sources */}
      <Text style={{ color: "white", fontSize: 18, fontWeight: "bold", marginBottom: 6 }}>
        Sources / Links
      </Text>
      <TextInput
        value={newSource}
        onChangeText={setNewSource}
        placeholder="Paste article link, book, video, etc."
        placeholderTextColor="#6b7280"
        style={{
          backgroundColor: "#111827",
          color: "white",
          padding: 12,
          borderRadius: 10
        }}
      />
      <TouchableOpacity
        onPress={addSource}
        style={{
          backgroundColor: "#2563eb",
          padding: 10,
          borderRadius: 10,
          marginTop: 8,
          marginBottom: 10
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Add Source</Text>
      </TouchableOpacity>

      {sources.map((s, i) => (
        <Text key={i} style={{ color: "#cbd5f5", marginBottom: 4 }}>
          • {s}
        </Text>
      ))}

      {/* Checklist */}
      <Text
        style={{
          color: "white",
          fontSize: 18,
          fontWeight: "bold",
          marginTop: 18,
          marginBottom: 6
        }}
      >
        Research Checklist
      </Text>

      {checklist.map((c, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => toggleChecklist(i)}
          style={{
            backgroundColor: "#111827",
            padding: 10,
            borderRadius: 10,
            marginBottom: 6,
            flexDirection: "row",
            justifyContent: "space-between"
          }}
        >
          <Text style={{ color: "white" }}>{c.item}</Text>
          <Text style={{ color: c.done ? "#4ade80" : "#9ca3af" }}>
            {c.done ? "✔" : "○"}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Citation Builder */}
      <Text
        style={{
          color: "white",
          fontSize: 18,
          fontWeight: "bold",
          marginTop: 18,
          marginBottom: 6
        }}
      >
        Citation Builder
      </Text>

      <TextInput
        value={citationInput}
        onChangeText={setCitationInput}
        placeholder="Paste or type citation here"
        placeholderTextColor="#6b7280"
        style={{
          backgroundColor: "#111827",
          color: "white",
          padding: 12,
          borderRadius: 10
        }}
      />

      <TouchableOpacity
        onPress={addCitation}
        style={{
          backgroundColor: "#7c3aed",
          padding: 10,
          borderRadius: 10,
          marginTop: 8,
          marginBottom: 10
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Save Citation</Text>
      </TouchableOpacity>

      {citations.map((c, i) => (
        <Text key={i} style={{ color: "#c4b5fd", marginBottom: 4 }}>
          ● {c}
        </Text>
      ))}

      {/* Notes */}
      <Text
        style={{
          color: "white",
          fontSize: 18,
          fontWeight: "bold",
          marginTop: 18,
          marginBottom: 6
        }}
      >
        Research Notes
      </Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Write key ideas, summaries, quotes..."
        placeholderTextColor="#6b7280"
        multiline
        style={{
          backgroundColor: "#111827",
          color: "white",
          padding: 12,
          borderRadius: 10,
          minHeight: 120,
          textAlignVertical: "top"
        }}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
