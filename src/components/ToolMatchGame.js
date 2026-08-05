// src/components/ToolMatchGame.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { G } from './GameShell';
import GameOver from './GameOver';
import useGame from '../logic/useGame';

const QUESTIONS = [
  { tool:'🔨 Hammer',     correct:'Hammering nails into wood',         distractors:['Mixing batter','Cutting wood','Digging holes'],         explanation:'A hammer drives nails into surfaces.',            funFact:'First hammers were just rocks — 3 million years ago!',  tip:'Wear safety goggles when hammering.' },
  { tool:'🥄 Whisk',      correct:'Mixing eggs and batter',            distractors:['Painting walls','Hammering nails','Cutting pipes'],      explanation:'A whisk mixes ingredients smoothly.',             funFact:'Whisks can have up to 12 wires!',                        tip:'Wash your whisk before and after cooking.' },
  { tool:'🪚 Saw',        correct:'Cutting wood into pieces',          distractors:['Digging holes','Mixing ingredients','Painting'],         explanation:'Saw teeth cut through wood when pushed and pulled.',funFact:'Some saws can cut a tree trunk in minutes!',              tip:'Only use saws with adult supervision.' },
  { tool:'⛏️ Shovel',     correct:'Digging holes in the ground',       distractors:['Hammering nails','Mixing cake batter','Painting'],       explanation:'A shovel digs, lifts dirt, and moves sand.',      funFact:'Shovels helped build the pyramids 5,000 years ago!',     tip:'Bend your knees when digging.' },
  { tool:'🎨 Paintbrush', correct:'Painting walls and surfaces',       distractors:['Cutting materials','Mixing eggs','Measuring lengths'],   explanation:'Soft bristles spread paint evenly on surfaces.',  funFact:'Brushes can be made from horsehair or synthetic fibers!', tip:'Clean your brush right after painting.' },
  { tool:'🔧 Screwdriver',correct:'Turning screws to fasten things',   distractors:['Painting furniture','Measuring angles','Digging holes'], explanation:'Clockwise tightens, counter-clockwise loosens.',   funFact:'There are 30+ types of screwdriver heads!',              tip:'Always use the right size for your screw.' },
  { tool:'🔩 Wrench',     correct:'Tightening nuts and bolts',         distractors:['Cutting pipes','Painting metal','Measuring lengths'],    explanation:'A wrench grips and turns nuts and bolts.',        funFact:'The adjustable wrench was invented in 1892!',            tip:'Turn the wrench away from your body.' },
  { tool:'📏 Ruler',      correct:'Measuring lengths accurately',      distractors:['Cutting paper','Hammering nails','Mixing paint'],        explanation:'A ruler measures in inches or centimeters.',      funFact:'The longest ruler ever was 100 feet — blue whale size!', tip:'Metal rulers can have sharp edges.' },
  { tool:'✂️ Scissors',   correct:'Cutting paper, fabric, and thread', distractors:['Measuring things','Hammering tacks','Mixing liquids'],   explanation:'Two blades slide past each other to cut.',        funFact:'Scissors were invented in ancient Egypt in 1500 BC!',   tip:'Never run with scissors. Walk with them pointing down.' },
  { tool:'🪜 Ladder',     correct:'Reaching high places safely',       distractors:['Measuring heights','Digging holes','Cutting tall items'], explanation:'Rungs let you safely climb to reach high places.', funFact:'Longest firefighter ladder: 135 feet tall!',             tip:'Have someone hold the ladder when you climb.' },
  { tool:'🚽 Plunger',    correct:'Unclogging drains and toilets',     distractors:['Hammering tiles','Mixing cement','Painting pipes'],      explanation:'Suction pushes blockages through pipes.',         funFact:'Plungers work by changing water pressure!',              tip:'Wear gloves when using a plunger.' },
  { tool:'🪛 Drill',      correct:'Making holes in wood or walls',     distractors:['Cutting wood','Painting surfaces','Measuring angles'],   explanation:'A spinning bit makes holes in hard materials.',   funFact:'First electric drill invented in 1889 — weighed 10 lbs!',tip:'Secure your material before drilling.' },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function ToolMatchGame({ onGameEnd }) {
  const navigation = useNavigation();
  const [idx, setIdx]         = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());

  const game = useGame({ subject: 'general', difficulty: 1, onGameEnd });
  const q = QUESTIONS[idx];
  const options = useState(() => shuffle([q.correct, ...q.distractors]))[0];

  // Rebuild options when idx changes
  const [currentOptions, setCurrentOptions] = useState(() =>
    shuffle([QUESTIONS[0].correct, ...QUESTIONS[0].distractors])
  );

  const handleAnswer = useCallback((opt) => {
    if (selected) return;
    setSelected(opt);
    const isCorrect = opt === q.correct;
    const speed = (Date.now() - startTime) / 1000;
    const speedBonus = speed < 4 ? 5 : 0;
    game.answer(isCorrect, { speedBonus });
    setFeedback({ isCorrect, explanation: q.explanation, funFact: q.funFact, tip: q.tip });

    setTimeout(() => {
      setFeedback(null);
      setSelected(null);
      setStartTime(Date.now());
      const nextIdx = idx + 1;
      if (game.lives - (isCorrect ? 0 : 1) <= 0 || nextIdx >= QUESTIONS.length) {
        game.endGame();
      } else {
        setIdx(nextIdx);
        setCurrentOptions(shuffle([QUESTIONS[nextIdx].correct, ...QUESTIONS[nextIdx].distractors]));
      }
    }, 2200);
  }, [selected, q, startTime, game, idx]);

  if (showTutorial) return (
    <GameShell title="Tool Match" emoji="🔧" subject="Home Economics" score={0} lives={3} streak={0}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.tutTitle}>🔧 Tool Match Game! 🔨</Text>
        <Text style={s.tutSub}>Learn what every tool is for</Text>
        {[
          { e:'🔧', t:'Read the tool name' },
          { e:'🎯', t:'Pick what it\'s used for' },
          { e:'📚', t:'Learn a fun fact' },
          { e:'🔥', t:'Keep your streak going!' },
        ].map((item, i) => (
          <View key={i} style={s.tutRow}>
            <Text style={s.tutEmoji}>{item.e}</Text>
            <Text style={s.tutText}>{item.t}</Text>
          </View>
        ))}
        <TouchableOpacity style={s.startBtn} onPress={() => setShowTutorial(false)}>
          <Text style={s.startBtnText}>✦ Start Quest</Text>
        </TouchableOpacity>
      </ScrollView>
    </GameShell>
  );

  if (game.done) return (
    <GameOver
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Tools Mastered!"
      onPlayAgain={() => { game.reset(); setIdx(0); setSelected(null); setFeedback(null); setCurrentOptions(shuffle([QUESTIONS[0].correct, ...QUESTIONS[0].distractors])); }}
      onQuit={() => navigation.goBack()}
    />
  );

  return (
    <GameShell
      title="Tool Match" emoji="🔧" subject="Home Economics"
      score={game.score} lives={game.lives} streak={game.streak}
      progress={idx / QUESTIONS.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Tool {idx + 1} of {QUESTIONS.length}</Text>

        <View style={s.toolCard}>
          <Text style={s.toolEmoji}>{q.tool.split(' ')[0]}</Text>
          <Text style={s.toolName}>{q.tool.replace(/^\S+\s/, '')}</Text>
          <Text style={s.toolQuestion}>What is this tool used for?</Text>
        </View>

        <View style={s.options}>
          {currentOptions.map(opt => {
            let bg = G.card, border = G.border;
            if (selected) {
              if (opt === q.correct) { bg = G.success + '22'; border = G.success; }
              else if (opt === selected) { bg = G.error + '22'; border = G.error; }
            }
            return (
              <TouchableOpacity key={opt} style={[s.option, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleAnswer(opt)} disabled={!!selected}>
                <Text style={s.optionText}>{opt}</Text>
                {selected && opt === q.correct && <Text style={{ color: G.success, fontSize: 18 }}>✓</Text>}
                {selected && opt === selected && !feedback?.isCorrect && <Text style={{ color: G.error, fontSize: 18 }}>✗</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackTitle, { color: feedback.isCorrect ? G.success : G.error }]}>
              {feedback.isCorrect ? '✓ Correct!' : '✗ Not quite!'}
            </Text>
            <Text style={s.feedbackText}>{feedback.explanation}</Text>
            <View style={s.factBox}>
              <Text style={s.factLabel}>💡 Fun Fact</Text>
              <Text style={s.factText}>{feedback.funFact}</Text>
            </View>
            <Text style={s.tipText}>🦺 {feedback.tip}</Text>
          </View>
        )}
      </ScrollView>
    </GameShell>
  );
}

const s = StyleSheet.create({
  scroll:     { padding: 16, paddingBottom: 40 },
  progress:   { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  tutTitle:   { fontSize: 22, fontWeight: '700', color: G.cream, textAlign: 'center', marginBottom: 6 },
  tutSub:     { fontSize: 14, color: G.muted, textAlign: 'center', marginBottom: 24 },
  tutRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: G.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 0.5, borderColor: G.border },
  tutEmoji:   { fontSize: 24 },
  tutText:    { fontSize: 14, color: G.cream },
  startBtn:   { backgroundColor: G.gold, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  startBtnText:{ fontSize: 16, fontWeight: '700', color: G.bg },
  toolCard:   { backgroundColor: G.card, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 0.5, borderColor: G.border, marginBottom: 16 },
  toolEmoji:  { fontSize: 52, marginBottom: 8 },
  toolName:   { fontSize: 22, fontWeight: '700', color: G.cream, marginBottom: 6 },
  toolQuestion:{ fontSize: 13, color: G.muted },
  options:    { gap: 10, marginBottom: 16 },
  option:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16 },
  optionText: { fontSize: 14, color: G.cream, flex: 1 },
  feedback:   { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 16, gap: 10 },
  feedbackTitle:{ fontSize: 15, fontWeight: '700' },
  feedbackText:{ fontSize: 13, color: G.cream, lineHeight: 18 },
  factBox:    { backgroundColor: G.border, borderRadius: 8, padding: 10 },
  factLabel:  { fontSize: 11, color: G.gold, fontWeight: '600', marginBottom: 4 },
  factText:   { fontSize: 12, color: G.cream, lineHeight: 16 },
  tipText:    { fontSize: 12, color: G.muted, fontStyle: 'italic' },
});
