// src/components/StageProps.js
// The objects that dress a character's stage: trees, rocks and plants
// outdoors, furniture in the room, and an NPC idling in some scenes. Read
// from the background's own `props` and `npc` (src/data/backgroundOptions.js).
// Drawn behind the walker (LandscapeBackground puts this before its
// children), and never catches taps.
//
// Sizes follow the stage's height (a prop's `scale` is relative to a 300px
// stage), so Training's short stage and Profile's taller one keep the same
// proportions. A prop with `minLevel` shows up once you reach that level:
// the room fills up as you go.
//
// `decor` is the player's own layout for this scene (stageDecor.js), used
// instead of the scene's props when they've decorated it. `hideItems` leaves
// only the NPC: the Decorate sheet draws the items itself, draggable.

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PixelArt from './PixelArt';
import AnimatedSprite from './AnimatedSprite';
import { ART, NPCS } from '../data/sceneArt';
import { groundFor, decorAllowed } from '../logic/stageDecor';

export default function StageProps({ background, level = 1, decor, hideItems = false }) {
  const [size, setSize] = useState(null);
  const props = hideItems ? []
    : decor?.items ? decor.items.filter(it => decorAllowed(it.art, level, background))
    : (background?.props || []).filter(p => (p.minLevel || 1) <= level);
  const npc = background?.npc && NPCS[background.npc.id] ? background.npc : null;
  if (!props.length && !npc) return null;
  const ground = groundFor(background);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setSize(e.nativeEvent.layout)}>
      {size && props.map((p, i) => {
        const a = ART[p.art];
        if (!a) return null;
        const k = (size.height / 300) * (p.scale || 1);
        const pos = p.y != null ? { bottom: ground + p.y * size.height }
          : p.top != null ? { top: p.top * size.height }
          : { bottom: ground + (p.lift || 0) * size.height };
        return (
          <PixelArt
            key={`${p.art}-${i}`}
            art={a} scale={k} flip={p.flip}
            style={{ position: 'absolute', left: p.x * size.width - (a.w * k) / 2, ...pos }}
          />
        );
      })}
      {size && npc && (() => {
        const h = size.height * (npc.size || 0.5);
        return (
          <View style={{ position: 'absolute', left: npc.x * size.width - h / 2, bottom: ground + (npc.lift || 0) * size.height, transform: [{ scaleX: npc.flip ? -1 : 1 }] }}>
            <AnimatedSprite sheet={NPCS[npc.id]} size={h} />
          </View>
        );
      })()}
    </View>
  );
}
