// src/components/ScienceSortGame.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { G } from './GameShell';
import GameOver from './GameOver';
import useGame from '../logic/useGame';

const TOPICS = [
  {
    title: 'Animals',
    question: 'Is this a mammal, reptile, bird, or fish?',
    items: [
      { name:'🐬 Dolphin',  correct:'Mammal',  explanation:'Dolphins breathe air and nurse their young with milk.' },
      { name:'🦎 Lizard',   correct:'Reptile', explanation:'Lizards are cold-blooded and have scales.' },
      { name:'🦅 Eagle',    correct:'Bird',    explanation:'Eagles have feathers and hollow bones for flight.' },
      { name:'🐟 Salmon',   correct:'Fish',    explanation:'Salmon have gills and live their whole life in water.' },
      { name:'🦇 Bat',      correct:'Mammal',  explanation:'Bats are the only flying mammals — they nurse with milk.' },
      { name:'🐊 Crocodile',correct:'Reptile', explanation:'Crocodiles are cold-blooded and lay eggs.' },
    ],
    categories: ['Mammal','Reptile','Bird','Fish'],
  },
  {
    title: 'States of Matter',
    question: 'Is this a solid, liquid, or gas?',
    items: [
      { name:'💎 Diamond',  correct:'Solid',  explanation:'Diamond has a fixed shape and volume.' },
      { name:'💧 Water',    correct:'Liquid', explanation:'Liquid takes the shape of its container.' },
      { name:'💨 Steam',    correct:'Gas',    explanation:'Gas expands to fill any space.' },
      { name:'🧊 Ice',      correct:'Solid',  explanation:'Ice is frozen water — fixed shape.' },
      { name:'🫧 Bubbles',  correct:'Gas',    explanation:'Bubbles are filled with gas — usually air.' },
      { name:'🍯 Honey',    correct:'Liquid', explanation:'Honey flows and takes the shape of its container.' },
    ],
    categories: ['Solid','Liquid','Gas'],
  },
  {
    title: 'Space Objects',
    question: 'What type of space object is this?',
    items: [
      { name:'☀️ Sun',      correct:'Star',   explanation:'Our Sun is a medium-sized star made of plasma.' },
      { name:'🌍 Earth',    correct:'Planet', explanation:'Earth is a rocky planet orbiting the Sun.' },
      { name:'🌙 Moon',     correct:'Moon',   explanation:'Moons orbit planets — Earth has one.' },
      { name:'⭐ Sirius',   correct:'Star',   explanation:'Sirius is the brightest star in our night sky.' },
      { name:'🌌 Galaxy',   correct:'Galaxy', explanation:'A galaxy contains billions of stars.' },
      { name:'🪐 Saturn',   correct:'Planet', explanation:'Saturn is known for its beautiful ring system.' },
    ],
    categories: ['Star','Planet','Moon','Galaxy'],
  },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function ScienceSortGame({ onGameEnd }) {
  const navigation = useNavigation();
  const [topicIdx, setTopicIdx] = useState(0);
  const [items] = useState(() => TOPICS.map(t => shuffle(t.items)).flat());
  const [allItems] = useState(() => {
    // Build flat list of all items across topics
    return TOPICS.flatMap(t => t.items.map(item => ({ ...item, topic: t })));
  });
  const [idx, setIdx]         = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'science', difficulty: 2, onGameEnd });
  const current = allItems[idx];
  const topic = current.topic;

  const handleAnswer = useCallback((cat) => {
    if (selected) return;
    setSelected(cat);
    const isCorrect = cat === current.correct;
    const speed = (Date.now() - startTime) / 1000;
    game.answer(isCorrect, { speedBonus: speed < 4 ? 5 : 0 });
    setFeedback({ isCorrect, explanation: current.explanation, correct: current.correct });

    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      setStartTime(Date.now());
      if (game.lives - (isCorrect ? 0 : 1) <= 0 || idx >= allItems.length - 1) {
        game.endGame();
      } else {
        setIdx(i => i + 1);
      }
    }, 1800);
  }, [selected, current, startTime, game, idx, allItems]);

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Science Scholar!"
      onPlayAgain={() => { game.reset(); setIdx(0); setSelected(null); setFeedback(null); }}
      onQuit={() => navigation.goBack()}
    />
  );

  return (
    <GameShell
      title="Science Sort" emoji="🔬" subject="Science"
      score={game.score} lives={game.lives} streak={game.streak}
      progress={idx / allItems.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>{idx + 1} / {allItems.length}</Text>

        <View style={s.topicBadge}>
          <Text style={s.topicText}>📚 {topic.title}</Text>
        </View>

        <View style={s.itemCard}>
          <Text style={s.itemEmoji}>{current.name.split(' ')[0]}</Text>
          <Text style={s.itemName}>{current.name.replace(/^\S+\s/, '')}</Text>
          <Text style={s.question}>{topic.question}</Text>
        </View>

        <View style={s.categories}>
          {topic.categories.map(cat => {
            let bg = G.card, border = G.border;
            if (selected) {
              if (cat === current.correct) { bg = G.success + '22'; border = G.success; }
              else if (cat === selected) { bg = G.error + '22'; border = G.error; }
            }
            return (
              <TouchableOpacity
                key={cat}
                style={[s.catBtn, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(cat)}
                disabled={!!selected}
              >
                <Text style={[s.catText, selected && cat === current.correct && { color: G.success },
                  selected && cat === selected && cat !== current.correct && { color: G.error }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? `✓ Correct! It\'s a ${feedback.correct}` : `✗ It\'s actually a ${feedback.correct}`}
            </Text>
            <Text style={s.feedbackText}>{feedback.explanation}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const s = StyleSheet.create({
  scroll:       { padding: 16, paddingBottom: 40 },
  progress:     { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  topicBadge:   { backgroundColor: G.tealL, borderRadius: 10, padding: 8, alignItems: 'center', marginBottom: 12, borderWidth: 0.5, borderColor: G.teal },
  topicText:    { fontSize: 13, color: G.teal, fontWeight: '600' },
  itemCard:     { backgroundColor: G.card, borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 0.5, borderColor: G.border, marginBottom: 16 },
  itemEmoji:    { fontSize: 56, marginBottom: 10 },
  itemName:     { fontSize: 20, fontWeight: '700', color: G.cream, marginBottom: 6 },
  question:     { fontSize: 13, color: G.muted, textAlign: 'center' },
  categories:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  catBtn:       { flex: 1, minWidth: '44%', padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  catText:      { fontSize: 14, fontWeight: '600', color: G.cream },
  feedback:     { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16 },
  feedbackTitle:{ fontSize: 14, fontWeight: '700', marginBottom: 6 },
  feedbackText: { fontSize: 13, color: G.cream, lineHeight: 18 },
});
