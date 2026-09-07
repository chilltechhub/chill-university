// src/components/BuildItGame.js
// A construction puzzle — tap a piece, then tap the slot it belongs in.
// Unlike Recipe Builder (strict step ORDER), slots can be filled in any
// order; the challenge is matching the right piece to the right slot out
// of a bank that also holds a couple of decoy pieces that fit nowhere.

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GameShell, { useGameTheme } from './GameShell';
import GameOver from './GameOver';
import GradeSelectCard from './GradeSelectCard';
import RoundCompleteScreen from './RoundCompleteScreen';
import useGame from '../logic/useGame';
import useGradeLevel, { tierForLevel } from '../logic/useGradeLevel';
import { BUILD_BANK } from '../data/gameContent/buildIt';

const BLURBS = {
  'K-2': 'Simple 3-4 piece builds — houses and trees.',
  '3-5': 'Houses, plants, and sentences (4-5 pieces).',
  '6-8': 'Circuits, cells, and government (4 pieces).',
  '9-12': 'Circuits, careers, and personal finance (5-6 pieces).',
};

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function BuildItGame({ onGameEnd }) {
  const navigation = useNavigation();
  const G = useGameTheme();
  const s = makeStyles(G);
  const { level, setLevel } = useGradeLevel('build');
  const [started, setStarted] = useState(false);

  const [queue, setQueue] = useState([]);
  const [projectIndex, setProjectIndex] = useState(0);
  const [project, setProject] = useState(null);
  const [bank, setBank] = useState([]);
  const [filledSlots, setFilledSlots] = useState({});
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [roundMisses, setRoundMisses] = useState(0);
  const [roundComplete, setRoundComplete] = useState(null);

  const game = useGame({ subject: 'technology', difficulty: 2, skillLevel: level, onGameEnd, manualScoring: true });

  const loadProject = (proj) => {
    setProject(proj);
    setBank(shuffle([...proj.slots.map(s => s.correct), ...proj.decoys]));
    setFilledSlots({});
    setSelectedPieceId(null);
    setFeedback(null);
    setRoundMisses(0);
  };

  const beginRun = () => {
    const shuffledQueue = shuffle(BUILD_BANK[level]);
    setQueue(shuffledQueue);
    setProjectIndex(0);
    loadProject(shuffledQueue[0]);
    setStarted(true);
  };

  const handlePiecePress = (piece) => {
    if (feedback) return;
    setSelectedPieceId(prev => prev === piece.id ? null : piece.id);
  };

  const handleSlotPress = useCallback((slot) => {
    if (feedback || filledSlots[slot.key] || !selectedPieceId) return;
    const piece = bank.find(p => p.id === selectedPieceId);
    if (!piece) return;

    const isCorrect = piece.id === slot.correct.id;
    game.answer(isCorrect);

    if (isCorrect) {
      const newFilled = { ...filledSlots, [slot.key]: piece.id };
      setFilledSlots(newFilled);
      setBank(prev => prev.filter(p => p.id !== piece.id));
      setSelectedPieceId(null);

      if (Object.keys(newFilled).length === project.slots.length) {
        setFeedback({ isCorrect: true, msg: `✓ ${project.name} complete!`, done: true });
        setTimeout(() => {
          setFeedback(null);
          const nextIdx = projectIndex + 1;
          setRoundComplete({
            correct: project.slots.length,
            total: project.slots.length + roundMisses,
            roundNumber: projectIndex + 1,
            isLastStage: nextIdx >= queue.length || game.lives <= 0,
          });
        }, 1800);
      }
    } else {
      setFeedback({ isCorrect: false, msg: `✗ That doesn't belong in ${slot.label}` });
      setSelectedPieceId(null);
      setRoundMisses(m => m + 1);
      setTimeout(() => setFeedback(null), 1100);
    }
  }, [feedback, filledSlots, selectedPieceId, bank, project, game, projectIndex, queue, roundMisses]);

  const handleClaimPrize = useCallback(() => {
    setRoundComplete(null);
    if (roundComplete?.isLastStage) {
      game.endGame();
      return;
    }
    const nextIdx = projectIndex + 1;
    setProjectIndex(nextIdx);
    loadProject(queue[nextIdx]);
  }, [game, roundComplete, projectIndex, queue]);

  if (!started) {
    return (
      <GradeSelectCard gameId="build"
        title="Build It!" emoji="🏗️" subjectLabel="Construction & Design"
        blurbs={BLURBS} level={level} onSelectLevel={setLevel} onStart={beginRun}
      />
    );
  }

  if (game.done) return (
    <GameOver gameId="build"
      score={game.score} correct={game.correct} total={game.attempted}
      streak={game.bestStreak} title="Master Builder!"
      onPlayAgain={() => { game.reset(); setStarted(false); }}
      onQuit={() => navigation.goBack()}
    />
  );

  if (roundComplete) {
    return (
      <GameShell gameId="build" disableFactToast
        title="Build It!" emoji="🏗️" subject={`Construction & Design · ${level}`}
        score={game.score} lives={game.lives} streak={game.streak}
      >
        <RoundCompleteScreen
          roundNumber={roundComplete.roundNumber}
          correct={roundComplete.correct}
          total={roundComplete.total}
          streak={game.streak}
          difficulty={tierForLevel(level)}
          onAward={game.addPoints}
          onAdvance={handleClaimPrize}
        />
      </GameShell>
    );
  }

  if (!project) return null;

  return (
    <GameShell gameId="build"
      title="Build It!" emoji="🏗️" subject={`Construction & Design · ${level}`}
      score={game.score} lives={game.lives} streak={game.streak}
      progress={projectIndex / queue.length}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.progress}>Project {projectIndex + 1} of {queue.length}</Text>
        <Text style={s.projectName}>{project.emoji} {project.name}</Text>
        <Text style={s.instruction}>Tap a piece below, then tap the slot it belongs in</Text>

        {/* Slots */}
        <View style={s.slotsGrid}>
          {project.slots.map(slot => {
            const isFilled = !!filledSlots[slot.key];
            return (
              <TouchableOpacity
                key={slot.key}
                style={[s.slot, isFilled && s.slotFilled]}
                onPress={() => handleSlotPress(slot)}
                disabled={isFilled}
              >
                <Text style={s.slotLabel}>{slot.label}</Text>
                {isFilled ? (
                  <Text style={s.slotFilledText}>✓ {slot.correct.label}</Text>
                ) : (
                  <Text style={s.slotEmptyText}>empty</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={[s.feedback, { borderColor: feedback.isCorrect ? G.success : G.error }]}>
            <Text style={[s.feedbackText, { color: feedback.isCorrect ? G.success : G.error }]}>{feedback.msg}</Text>
          </View>
        )}

        {/* Piece bank */}
        <Text style={s.bankLabel}>Pieces</Text>
        <View style={s.bank}>
          {bank.map(piece => (
            <TouchableOpacity
              key={piece.id}
              style={[s.piece, selectedPieceId === piece.id && s.pieceSelected]}
              onPress={() => handlePiecePress(piece)}
              disabled={!!feedback}
            >
              <Text style={[s.pieceText, selectedPieceId === piece.id && { color: G.bg }]}>{piece.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </GameShell>
  );
}

const makeStyles = (G) => StyleSheet.create({
  scroll:        { padding: 16, paddingBottom: 40 },
  progress:      { fontSize: 11, color: G.muted, textAlign: 'center', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  projectName:   { fontSize: 20, fontWeight: '700', color: G.cream, textAlign: 'center', marginBottom: 4 },
  instruction:   { fontSize: 12, color: G.muted, textAlign: 'center', marginBottom: 16 },
  slotsGrid:     { gap: 8, marginBottom: 14 },
  slot:          { backgroundColor: G.card, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: G.border, borderStyle: 'dashed' },
  slotFilled:    { borderStyle: 'solid', borderColor: G.success, backgroundColor: G.success + '15' },
  slotLabel:     { fontSize: 11, color: G.gold, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  slotEmptyText: { fontSize: 13, color: G.faint, fontStyle: 'italic' },
  slotFilledText:{ fontSize: 13, color: G.success, fontWeight: '600' },
  feedback:      { backgroundColor: G.card, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14, alignItems: 'center' },
  feedbackText:  { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  bankLabel:     { fontSize: 11, color: G.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  bank:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  piece:         { backgroundColor: G.card, borderWidth: 1, borderColor: G.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  pieceSelected: { backgroundColor: G.gold, borderColor: G.gold },
  pieceText:     { fontSize: 13, color: G.cream, fontWeight: '600' },
});
