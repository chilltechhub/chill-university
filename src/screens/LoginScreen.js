// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper: check profile and route to onboarding or main app
  const goAfterAuth = async () => {
    try {
      console.log('goAfterAuth: checking authenticated user');
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        console.warn('goAfterAuth: getUser error', userErr);
        return;
      }
      const user = userData?.user;
      if (!user) {
        console.log('goAfterAuth: no active user session found');
        return;
      }

      console.log('goAfterAuth: user id', user.id);

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) {
        console.warn('goAfterAuth: profile fetch error', profileErr);
        // fallback to onboarding if profile couldn't be read
        navigation.replace('MultiStepOnboarding');
        return;
      }

      const needsOnboarding = !profile || profile.onboarding_completed === false;
      console.log('goAfterAuth: needsOnboarding', needsOnboarding);

      if (needsOnboarding) {
        navigation.replace('MultiStepOnboarding');
      } else {
        navigation.replace('MainTabs');
      }
    } catch (err) {
      console.error('goAfterAuth unexpected error', err);
    }
  };

  // 🔹 Handle Login
  const handleLogin = async () => {
    try {
      setLoading(true);
      console.log('Attempting login:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('signInWithPassword result:', { data, error });
      if (error) {
        Alert.alert('Login Error', error.message);
        return;
      }

      const sessionRes = await supabase.auth.getSession();
      console.log('Session after login:', sessionRes);

      if (sessionRes?.data?.session) {
        // Session exists: decide where to route the user
        await goAfterAuth();
      } else {
        // Most likely requires email confirmation
        Alert.alert('Login', 'Check your email to confirm your account (if required).');
      }
    } catch (err) {
      console.error('Unexpected login error', err);
      Alert.alert('Login Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle Signup
  const handleSignup = async () => {
    try {
      setLoading(true);
      console.log('Attempting signup:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('signUp result:', { data, error });

      if (error) {
        Alert.alert('Signup Error', error.message);
        return;
      }

      // If a session is created immediately, route user
      const sessionRes = await supabase.auth.getSession();
      if (sessionRes?.data?.session) {
        await goAfterAuth();
      } else {
        // No session—email confirmation required in many Supabase setups
        Alert.alert('Signed up', 'Check your email for a confirmation link before you can log in.');
      }
    } catch (err) {
      console.error('Unexpected signup error', err);
      Alert.alert('Signup Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={handleSignup}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  signupButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});
