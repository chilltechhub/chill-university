// src/components/BuildPreview.js
// Shows a Studio Build's real file (src/logic/buildRender.js) live: the
// exact HTML they'll export, so the preview never lies about what they
// take home.
//
// react-native-webview has no web implementation (see ideagarden.js), so
// web gets a sandboxed iframe with the same HTML. Both run the made
// thing's own script (the game loop, the beat) and nothing else: the HTML
// is ours, and everything they typed in it is escaped.
import React from 'react';
import { View, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

let WebView = null;
if (Platform.OS !== 'web') {
  // Lazy require: touching the native module on web throws.
  WebView = require('react-native-webview').WebView;
}

export default function BuildPreview({ html, height = 340, style }) {
  const { colors: c, radius: r } = useTheme();
  const frame = { height, borderRadius: r.lg, overflow: 'hidden', borderWidth: 0.5, borderColor: c.border, backgroundColor: c.bg0 };

  if (Platform.OS === 'web') {
    return (
      <View style={[frame, style]}>
        {React.createElement('iframe', {
          title: 'Preview',
          srcDoc: html,
          sandbox: 'allow-scripts',
          style: { border: 0, width: '100%', height: '100%' },
        })}
      </View>
    );
  }

  return (
    <View style={[frame, style]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        // The beat's Play button is the gesture that starts its audio.
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        scrollEnabled={false}
        // Links in a made thing are placeholders; never leave the preview.
        onShouldStartLoadWithRequest={(req) => !/^(https?|mailto|tel|intent):/i.test(req.url)}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
}
