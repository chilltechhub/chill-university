// src/components/StudioStage.js
// The top of the Studio: your own room (your backdrop and decor, with any
// trophies you've earned from Builds), your character, and your pet
// wandering it. Your pet talks you through it in a mentor voice
// (src/logic/studio.js companionLine), so the person making things is
// never alone with a blank screen.
//
// Ambient only: the pet's coins here are decoration and earn nothing
// (Training's stage is where those count), and there's no hunger, so the
// Studio never nags.
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import LandscapeBackground from './LandscapeBackground';
import CharacterWalker from './CharacterWalker';
import RichText from './RichText';

export default function StudioStage({ studio, line, height = 150, style }) {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { outfit, accessory, pet, petName, background, decor, level } = studio;
  const speaker = pet ? petName : 'Your guide';

  return (
    <View style={style}>
      <View style={{ borderRadius: r.lg, overflow: 'hidden' }}>
        <LandscapeBackground background={background} height={height} level={level} decor={decor} style={{ width: '100%' }}>
          {!!outfit && (
            <CharacterWalker
              outfit={outfit} accessory={accessory} pet={pet}
              characterSize={84} petSize={38}
              showJumpArrow={false} tapToJump
              bowlX={decor?.bowlX} petName={petName}
            />
          )}
        </LandscapeBackground>
      </View>
      {!!line && (
        <View style={{ marginTop: -s.sm, marginHorizontal: s.md, padding: s.md, borderRadius: r.lg, backgroundColor: c.bg1, borderWidth: 0.5, borderColor: c.border }}>
          <Text style={{ fontSize: t.xs, fontWeight: t.semibold, color: c.text3, marginBottom: 2 }}>{speaker}</Text>
          <RichText style={{ fontSize: t.sm, color: c.text2 }} boldStyle={{ color: c.text1 }}>{line}</RichText>
        </View>
      )}
    </View>
  );
}
