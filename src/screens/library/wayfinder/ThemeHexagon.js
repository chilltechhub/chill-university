// src/screens/library/wayfinder/ThemeHexagon.js
//
// The map's signature visual. Holland's model is literally a hexagon —
// neighbouring themes are related, opposite ones aren't — so this draws the
// person's answers on the real shape rather than a bar chart that throws
// that structure away.
//
// Two layers, kept visually distinct because they mean different things:
//   filled shape   — what pulls you (activity answers)
//   dashed outline — what you've already done (experience)
//
// Labels are plain RN Views laid over the SVG, not SvgText — SVG text
// renders with inconsistent fonts and baselines between web and native.

import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { useTheme } from '../../../../context/ThemeContext';
import { THEMES } from '../../../data/wayfinder';

const LABEL_W = 88;

export default function ThemeHexagon({ interest = {}, experience = {}, size = 280, showExperience = true }) {
  const { colors: c } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 52;

  const angle = (i) => ((-90 + i * 60) * Math.PI) / 180;
  const point = (i, frac) => [cx + R * frac * Math.cos(angle(i)), cy + R * frac * Math.sin(angle(i))];
  const polygon = (fracs) => fracs.map((f, i) => point(i, f).map(n => n.toFixed(1)).join(',')).join(' ');

  // A theme scored 0 still gets a sliver so the shape stays a shape.
  const interestFracs = THEMES.map(t => Math.max(0.05, (interest[t.id] ?? 0) / 100));
  const experienceFracs = THEMES.map(t => Math.max(0.05, (experience[t.id] ?? 0) / 100));
  const hasExperience = showExperience && THEMES.some(t => (experience[t.id] || 0) > 0);

  const summary = THEMES
    .map(t => `${t.label} ${interest[t.id] ?? 'not answered'}`)
    .join(', ');

  return (
    <View
      style={{ width: size, height: size, alignSelf: 'center' }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Interest map. ${summary}.`}
    >
      <Svg width={size} height={size}>
        {[1 / 3, 2 / 3, 1].map(ring => (
          <Polygon
            key={ring}
            points={polygon(Array(6).fill(ring))}
            fill="none"
            stroke={c.border}
            strokeWidth={ring === 1 ? 1.2 : 0.8}
          />
        ))}
        {THEMES.map((t, i) => {
          const [x, y] = point(i, 1);
          return <Line key={t.id} x1={cx} y1={cy} x2={x} y2={y} stroke={c.border} strokeWidth={0.8} />;
        })}

        {hasExperience && (
          <Polygon
            points={polygon(experienceFracs)}
            fill="none"
            stroke={c.text3}
            strokeWidth={1.5}
            strokeDasharray="5,4"
          />
        )}

        <Polygon
          points={polygon(interestFracs)}
          fill={c.teal}
          fillOpacity={0.22}
          stroke={c.teal}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {THEMES.map((t, i) => {
          const [x, y] = point(i, interestFracs[i]);
          return <Circle key={t.id} cx={x} cy={y} r={4.5} fill={t.color} stroke={c.bg1} strokeWidth={1.5} />;
        })}
      </Svg>

      {THEMES.map((t, i) => {
        const x = cx + (R + 30) * Math.cos(angle(i));
        const y = cy + (R + 24) * Math.sin(angle(i));
        const score = interest[t.id];
        return (
          <View
            key={t.id}
            pointerEvents="none"
            style={{ position: 'absolute', width: LABEL_W, left: x - LABEL_W / 2, top: y - 16, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.color }} numberOfLines={1}>
              {t.emoji} {t.short}
            </Text>
            <Text style={{ fontSize: 10, color: c.text3 }}>
              {score === null || score === undefined ? '—' : score}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
