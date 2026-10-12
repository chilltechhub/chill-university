// scripts/babel-plugin-app-text.js
// Points the app's own `Text` and `TextInput` imports from 'react-native'
// at src/components/AppText.js, which applies the accessibility choices
// (text size, bold text, easy-read font; see src/logic/a11yPrefs.js).
//
//   import { View, Text as T } from 'react-native';
// becomes
//   import { View } from 'react-native';
//   import { Text as T } from '../components/AppText';
//
// Only files inside this project, never node_modules, and never AppText.js
// itself (it wraps the originals).

const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TARGET = path.join(ROOT, 'src', 'components', 'AppText.js');
const SWAPPED = new Set(['Text', 'TextInput']);

module.exports = function appTextPlugin({ types: t }) {
  return {
    name: 'app-text',
    visitor: {
      ImportDeclaration(nodePath, state) {
        if (nodePath.node.source.value !== 'react-native') return;
        const file = state.filename && path.resolve(state.filename);
        if (!file || !file.startsWith(ROOT) || file.includes(`${path.sep}node_modules${path.sep}`)) return;
        if (file === TARGET) return;

        const moved = nodePath.node.specifiers.filter(s => (
          t.isImportSpecifier(s) && SWAPPED.has(s.imported.name || s.imported.value)
        ));
        if (!moved.length) return;

        let rel = path.relative(path.dirname(file), TARGET).split(path.sep).join('/').replace(/\.js$/, '');
        if (!rel.startsWith('.')) rel = `./${rel}`;

        nodePath.node.specifiers = nodePath.node.specifiers.filter(s => !moved.includes(s));
        const added = t.importDeclaration(moved, t.stringLiteral(rel));
        if (nodePath.node.specifiers.length) nodePath.insertAfter(added);
        else nodePath.replaceWith(added);
      },
    },
  };
};
