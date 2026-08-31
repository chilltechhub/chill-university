// src/components/LinkifiedText.js
// Renders a block of plain text with any http(s) URLs inside it turned into
// tappable links — for freeform bodies (notes, project items) where the URL
// isn't its own field, just part of what someone typed or pasted.
import React from 'react';
import { Text, Linking, Alert } from 'react-native';

const URL_RE = /(https?:\/\/[^\s]+)/g;

export default function LinkifiedText({ text, style, linkColor, numberOfLines }) {
  if (!text) return null;

  const openLink = async (raw) => {
    // Drop trailing punctuation a sentence would leave stuck to the URL.
    const url = raw.replace(/[),.;:!?]+$/, '');
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open link', url);
    }
  };

  // String.split with a capturing group alternates: text, match, text, match...
  const parts = text.split(URL_RE);
  if (parts.length === 1) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <Text key={i} style={{ color: linkColor, textDecorationLine: 'underline' }} onPress={() => openLink(part)}>{part}</Text>
          : part
      )}
    </Text>
  );
}
