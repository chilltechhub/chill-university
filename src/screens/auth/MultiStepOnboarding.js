// src/screens/MultiStepOnboarding.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../api/supabaseClient'; // adjust path
import Home from '../screens/HomeScreen';

const SINGLE = 'single';
const MULTI = 'multi';

const QUESTIONS = [
  {
    key: 'motivation',
    type: MULTI,
    title: 'What brings you here?',
    choices: [
      'Learn new skills',
      'Understand tech',
      'Grow personally',
      'Curious',
      'Connect with others',
    ],
  },
  {
    key: 'growth_areas',
    type: MULTI,
    title: 'What areas of growth matter most to you?',
    choices: [
      'Career and Professional Skills',
      'Personal Growth and Self-Discovery',
      'Social and Emotional Intelligence',
      'Problem-Solving and Critical Thinking',
      'Creativity and Innovation',
    ],
  },
  {
    key: 'life_stage',
    type: SINGLE,
    title: 'Where are you at in life?',
    choices: [
      'High school',
      'College',
      'Trade School',
      'Beginner', 
      'Mid',
      'End of career',
      'Just coastin',
      'Lost?',
    ],
  },
  {
    key: 'topics',
    type: MULTI,
    title: 'Which topics interest you most?',
    choices: [
      'AI and Machine Learning',
      'Cybersecurity',
      'Personal Finance',
      'Entrepreneurship',
      'Mental Health and Well-being',
      'Creativity and Design',
      'Renewable Energy and Sustainability',
      'Leadership and Communication',
      'Philosophy and Critical Thinking',
    ],
  },
  {
    key: 'formats',
    type: MULTI,
    title: 'How do you like to engage with information?',
    choices: [
      'Reading articles',
      'Watching short videos',
      'Listening to audio/podcasts',
      'Taking quizzes or challenges',
      'Discussing with others',
    ],
  },
  {
    key: 'primary_goal',
    type: MULTI,
    title: "What's one goal you'd like to achieve in the next 3 months?",
    choices: [
      'Improve my critical thinking',
      'Become more financially independent',
      'Start a personal project',
      'Develop better habits',
      'Understand AI better',
      'Learn to communicate more effectively',
      'Grow professionally',
      'Feel more confident about the future',
    ],
  },
  {
    key: 'tech_level',
    type: SINGLE,
    title: 'How familiar are you with technology and the topics you chose?',
    choices: ['Beginner', 'Intermediate', 'Advanced'],
  },
  {
    key: 'wants_reflection',
    type: SINGLE,
    title: 'Would you like to reflect on what you learned?',
    choices: ['Yes, track thoughts', 'No, just explore'],
  },
];

export default function MultiStepOnboarding() {
  const nav = useNavigation();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingStep, setSavingStep] = useState(false);

  useEffect(() => {
    // Optionally fetch existing profile answers to pre-fill
    let mounted = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;
        const { data, error } = await supabase.from('profiles').select('motivation,growth_areas,life_stage,topics,formats,primary_goal,tech_level,wants_reflection').eq('id', user.id).maybeSingle();
        if (!error && data && mounted) {
          setAnswers({
            motivation: data.motivation ?? null,
            growth_areas: data.growth_areas ?? [],
            life_stage: data.life_stage ?? null,
            topics: data.topics ?? [],
            formats: data.formats ?? [],
            primary_goal: data.primary_goal ?? null,
            tech_level: data.tech_level ?? null,
            wants_reflection: data.wants_reflection ?? false,
          });
        }
      } catch (e) {
        console.warn('prefill onboarding', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const currentQ = QUESTIONS[stepIndex];

  const toggleMulti = (key, val) => {
    const cur = answers[key] || [];
    if (cur.includes(val)) {
      setAnswers({ ...answers, [key]: cur.filter(x => x !== val) });
    } else {
      setAnswers({ ...answers, [key]: [...cur, val] });
    }
  };

  const selectSingle = (key, val) => {
    setAnswers({ ...answers, [key]: val });
  };

  const saveStep = async (advance = true) => {
  setSavingStep(true);
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to save progress.');
      setSavingStep(false);
      return;
    }

    // Build partial payload of all answers currently present
    const payload = {};
    QUESTIONS.forEach(q => {
      if (answers[q.key] !== undefined) {
        // Convert wants_reflection to boolean
        if (q.key === 'wants_reflection') {
          payload[q.key] = answers[q.key] === 'Yes, track thoughts';
        } else {
          payload[q.key] = answers[q.key];
        }
      }
    });

    console.log('saveStep: upserting profile payload', { id: user.id, ...payload });

    // ... rest of your code stays the same
    // Upsert profile partial
    const { data: upsertData, error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...payload }, { returning: 'minimal' });

    if (upsertErr) {
      console.error('saveStep: profiles upsert error', upsertErr);
      Alert.alert('Save error', upsertErr.message || 'Unable to save progress.');
      setSavingStep(false);
      return;
    }

    console.log('saveStep: profile upsert success');

    // Optional analytics insert: wrapped in try/catch so missing table or RLS won't break onboarding
    try {
      const eventPayload = {
        user_id: user.id,
        event: 'onboarding_step_saved',
        meta: { step: currentQ.key },
        created_at: new Date().toISOString(),
      };

      const { data: analyticsData, error: analyticsErr } = await supabase
        .from('analytics_events')
        .insert([eventPayload]);

      if (analyticsErr) {
        // Log but don't block user
        console.warn('saveStep: analytics insert warning', analyticsErr);
      } else {
        console.log('saveStep: analytics logged', analyticsData);
      }
    } catch (e) {
      // defensive: if the .from(...).insert call structure differs in your SDK/version
      console.warn('saveStep: analytics insert failed (caught)', e);
    }

    // success -> advance if requested
    if (advance) nextStep();
  } catch (err) {
    console.error('saveStep unexpected error', err);
    Alert.alert('Error', 'Unable to save progress. See logs for details.');
  } finally {
    setSavingStep(false);
  }
};


  const nextStep = () => {
    if (stepIndex < QUESTIONS.length - 1) setStepIndex(stepIndex + 1);
    else finishOnboarding();
  };

  const prevStep = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const skipOnboarding = () => {
    // mark onboarding complete=false or leave as-is; here we finish but do not mark complete
    Alert.alert('Skip onboarding', 'You can complete onboarding later in Profile settings.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Skip',
        onPress: () => nav.replace('MainTabs'),
        style: 'destructive',
      },
    ]);
  };

  const finishOnboarding = async () => {
  setLoading(true);
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in to finish onboarding.');
      setLoading(false);
      return;
    }

    // Map the reflection answer into boolean
    const wants_reflection_val = answers.wants_reflection === 'Yes, track thoughts';

    const payload = {
      id: user.id,
      motivation: answers.motivation ?? null,
      growth_areas: answers.growth_areas ?? [],
      life_stage: answers.life_stage ?? null,
      topics: answers.topics ?? [],
      formats: answers.formats ?? [],
      primary_goal: answers.primary_goal ?? null,
      tech_level: answers.tech_level ?? null,
      wants_reflection: wants_reflection_val,
      onboarding_completed: true,
    };

    const { error } = await supabase.from('profiles').upsert(payload, { returning: 'representation' });
    if (error) {
      console.error('finishOnboarding upsert error', error);
      Alert.alert('Error', 'Unable to save onboarding. Try again.');
      setLoading(false);
      return;
    }

    // optional analytics event - wrapped in try/catch
    try {
      await supabase.from('analytics_events').insert([{ 
        user_id: user.id, 
        event: 'onboarding_completed', 
        meta: {} 
      }]);
    } catch (analyticsError) {
      console.warn('Analytics insert failed:', analyticsError);
    }

    // navigate into app
    nav.replace('MainTabs');
  } catch (err) {
    console.error('finishOnboarding error', err);
    Alert.alert('Error', 'Unexpected error finishing onboarding.');
  } finally {
    setLoading(false);
  }
};

  // Render choice button
  const Choice = ({ label, selected, onPress }) => (
    <TouchableOpacity style={[styles.choice, selected && styles.choiceSelected]} onPress={onPress}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  if (!currentQ) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.progress}>{stepIndex + 1} / {QUESTIONS.length}</Text>
      <Text style={styles.title}>{currentQ.title}</Text>

      <FlatList
        data={currentQ.choices}
        keyExtractor={(i) => i}
        renderItem={({ item }) => {
          if (currentQ.type === MULTI) {
            const sel = (answers[currentQ.key] || []).includes(item);
            return <Choice label={item} selected={sel} onPress={() => toggleMulti(currentQ.key, item)} />;
          } else {
            const sel = answers[currentQ.key] === item;
            return <Choice label={item} selected={sel} onPress={() => selectSingle(currentQ.key, item)} />;
          }
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <View style={styles.controls}>
        {stepIndex > 0 ? <TouchableOpacity style={styles.smallButton} onPress={prevStep}><Text>Back</Text></TouchableOpacity> : <View />}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.smallButton} onPress={skipOnboarding}><Text>Skip</Text></TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, (savingStep || loading) && { opacity: 0.6 }]}
            onPress={() => saveStep(true)}
            disabled={savingStep || loading}
          >
            {savingStep ? <ActivityIndicator color="#fff" /> : <Text style={{ color: 'white' }}>{stepIndex === QUESTIONS.length - 1 ? 'Finish' : 'Next'}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'flex-start' },
  progress: { alignSelf: 'flex-end', color: '#666' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  choice: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  choiceSelected: { backgroundColor: '#0047AB', borderColor: '#00307a' },
  choiceText: { color: '#222' },
  choiceTextSelected: { color: 'white' },
  controls: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallButton: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  nextButton: { padding: 12, borderRadius: 10, backgroundColor: '#0b63d6', alignItems: 'center' },
});
