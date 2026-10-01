// src/components/ErrorBoundary.js
// What the app shows when a screen crashes while drawing, instead of going
// blank. Before this there was no boundary anywhere: one render error in any
// screen unmounted the whole tree, which on a phone is a white screen or a
// close to the home screen, with nothing reported.
//
// It sits outside every provider in App.js so a crash in a provider is caught
// too. That also means no theme context: the colors below are the same
// light/dark values as src/theme.js, picked from the phone's own setting.
//
// "Try again" remounts everything under it, which reruns the launch check in
// App.js and lands on Home. Saved work is on the server, so only what was
// being typed at that moment is lost.
//
// Error boundaries have to be class components — React has no hook for it.

import React from 'react';
import { View, Text, TouchableOpacity, Appearance, Platform } from 'react-native';
import { reportError } from '../logic/errorReporting';

const PALETTE = {
  light: { bg: '#eef1f6', card: '#ffffff', border: '#c7cedd', text1: '#161b28', text2: '#454f66', btn: '#167a6c', onBtn: '#ffffff' },
  // Dark buttons take dark text: white on #3fcf9e is under 2:1.
  dark:  { bg: '#12161f', card: '#1a2030', border: '#2c3550', text1: '#eef1f8', text2: '#a7b0c6', btn: '#3fcf9e', onBtn: '#0d1119' },
};

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, attempt: 0 };
    this.retry = this.retry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // The component stack says which screen broke; it holds component
    // names only, nothing the person typed.
    reportError(error, 'ErrorBoundary', { componentStack: info?.componentStack?.slice(0, 2000) });
  }

  retry() {
    // A new key remounts the whole subtree fresh, rather than re-rendering
    // the one that just threw with the same state.
    this.setState(s => ({ error: null, attempt: s.attempt + 1 }));
  }

  render() {
    const { error, attempt } = this.state;
    if (!error) {
      return <React.Fragment key={attempt}>{this.props.children}</React.Fragment>;
    }

    const p = PALETTE[Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'];
    return (
      <View style={{ flex: 1, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View
          accessibilityRole="alert"
          style={{ width: '100%', maxWidth: 420, backgroundColor: p.card, borderColor: p.border, borderWidth: 1, borderRadius: 16, padding: 24 }}
        >
          <Text style={{ fontSize: 20, fontWeight: '800', color: p.text1, marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: p.text2, marginBottom: 20 }}>
            This screen hit an error it couldn't recover from. Anything you'd already saved is safe.
            Try again to go back to Home.
          </Text>
          {__DEV__ && (
            <Text selectable style={{ fontSize: 12, color: p.text2, marginBottom: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
              {String(error?.message || error)}
            </Text>
          )}
          <TouchableOpacity
            onPress={this.retry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={{ backgroundColor: p.btn, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: p.onBtn, fontSize: 16, fontWeight: '700' }}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
