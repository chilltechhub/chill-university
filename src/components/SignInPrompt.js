// src/components/SignInPrompt.js
// What an account-only screen shows a guest: what the screen is for, and a
// Sign in button that opens the same sign-in sheet as the top bar. Replaces
// bare "Not signed in" / "Sign in to use X" lines that offered no way
// forward. Screens that use it are listed in App.js's ACCOUNT_ONLY_SCREENS
// so their first-visit tutorial doesn't point at things a guest can't see.
import React, { useState } from 'react';
import { View, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { EmptyState } from './ui';
import LoginScreen from '../screens/LoginScreen';

export default function SignInPrompt({ icon = 'person-circle-outline', title, body }) {
  const { colors: c } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg0, padding: 24 }}>
      <EmptyState
        icon={icon}
        title={title}
        body={body}
        action={{ label: 'Sign in', icon: 'log-in-outline', onPress: () => setOpen(true) }}
      />
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <LoginScreen onSuccess={() => setOpen(false)} onClose={() => setOpen(false)} />
      </Modal>
    </View>
  );
}
