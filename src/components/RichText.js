// src/components/RichText.js
// Text with **bold** marked inline, for copy people skim: the guide's
// bubbles, tutorials and short hints. The bold words are the ones to act on
// (a button name, the one idea), so a glance gets the point without reading
// the sentence.
//
//   <RichText style={...} boldStyle={{ color: c.text1 }}>Tap **Add** to plan it.</RichText>

import React from 'react';
import { Text } from 'react-native';

export function splitBold(text) {
  return String(text ?? '').split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(part => (
    part.startsWith('**') && part.endsWith('**')
      ? { bold: true, text: part.slice(2, -2) }
      : { bold: false, text: part }
  ));
}

// The same text with the markers taken out, for screen readers and anywhere
// that can only show plain text.
export const plainText = (text) => String(text ?? '').replace(/\*\*([^*]+)\*\*/g, '$1');

export default function RichText({ children, style, boldStyle, ...rest }) {
  return (
    <Text style={style} accessibilityLabel={plainText(children)} {...rest}>
      {splitBold(children).map((part, i) => (part.bold
        ? <Text key={i} style={[{ fontWeight: '700' }, boldStyle]}>{part.text}</Text>
        : part.text))}
    </Text>
  );
}
