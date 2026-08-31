// src/components/StickmanAvatar.js
//
// Flat 2D player avatar, styled after the "Stickman Customizable" asset pack
// (Downloads/Stickman Customizable Blender). That pack is a 3D FBX rig with
// swappable color textures — not something React Native can render directly
// — so this redraws the same idea as a lightweight react-native-svg icon:
// one skin tone + a customizable outfit color pulled from the pack's palette
// (Black/Brown/Green/LightBlue/Orange/Pink/Purple/Red/White/Yellow).
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export const STICKMAN_SKIN = '#E8B594';

export const STICKMAN_COLORS = [
  { id: 'red',        label: 'Red',        hex: '#E5484D' },
  { id: 'orange',      label: 'Orange',     hex: '#FF8A3D' },
  { id: 'yellow',      label: 'Yellow',     hex: '#F5C518' },
  { id: 'green',       label: 'Green',      hex: '#3DBE64' },
  { id: 'lightblue',   label: 'Light Blue', hex: '#4FC3E8' },
  { id: 'purple',      label: 'Purple',     hex: '#9B59D9' },
  { id: 'pink',        label: 'Pink',       hex: '#FF6FA5' },
  { id: 'brown',       label: 'Brown',      hex: '#8A5A34' },
  { id: 'black',       label: 'Black',      hex: '#2B2B2E' },
  { id: 'white',       label: 'White',      hex: '#F2F2F2' },
];

export const DEFAULT_STICKMAN_COLOR = STICKMAN_COLORS[4].hex; // Light Blue

// Darken a hex color for legs/shading (negative amt) — cheap two-tone shading
// without needing a second user-facing color picker.
function shade(hex, amt) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + amt;
  let g = ((num >> 8) & 0xff) + amt;
  let b = (num & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export default function StickmanAvatar({ color = DEFAULT_STICKMAN_COLOR, size = 96, style }) {
  const limbColor = shade(color, -30);
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* raised/waving arm */}
        <Path d="M 62 46 Q 78 40 82 24" stroke={color} strokeWidth={7} strokeLinecap="round" fill="none" />
        <Circle cx={82} cy={22} r={4.5} fill={STICKMAN_SKIN} />
        {/* legs */}
        <Path d="M 44 70 L 40 92" stroke={limbColor} strokeWidth={8} strokeLinecap="round" fill="none" />
        <Path d="M 56 70 L 60 92" stroke={limbColor} strokeWidth={8} strokeLinecap="round" fill="none" />
        {/* feet */}
        <Rect x={33} y={90} width={14} height={6} rx={3} fill="#2B2B2E" />
        <Rect x={53} y={90} width={14} height={6} rx={3} fill="#2B2B2E" />
        {/* lowered arm */}
        <Path d="M 40 46 Q 30 58 32 72" stroke={color} strokeWidth={7} strokeLinecap="round" fill="none" />
        <Circle cx={32} cy={74} r={4.5} fill={STICKMAN_SKIN} />
        {/* torso */}
        <Rect x={36} y={40} width={28} height={34} rx={12} fill={color} />
        {/* head + face */}
        <Circle cx={50} cy={24} r={15} fill={STICKMAN_SKIN} />
        <Circle cx={45} cy={23} r={1.8} fill="#2B2B2E" />
        <Circle cx={55} cy={23} r={1.8} fill="#2B2B2E" />
        <Path d="M 45 30 Q 50 33 55 30" stroke="#2B2B2E" strokeWidth={1.6} strokeLinecap="round" fill="none" />
      </Svg>
    </View>
  );
}
