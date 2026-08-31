// context/ThemeContext.js
// Add isDark state + setIsDark to your existing ThemeContext
// Find your existing ThemeProvider and add this pattern:

// STEP 1: Import AsyncStorage at the top
// import AsyncStorage from '@react-native-async-storage/async-storage';

// STEP 2: Inside ThemeProvider, replace the static theme selection with:
/*
  const [isDark, setIsDark] = React.useState(true); // default dark

  // Load saved preference on mount
  React.useEffect(() => {
    AsyncStorage.getItem('theme_preference').then(val => {
      if (val !== null) setIsDark(val === 'dark');
    });
  }, []);

  // Save preference on change
  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem('theme_preference', next ? 'dark' : 'light');
  };

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  // Include isDark and toggleTheme in context value:
  return (
    <ThemeContext.Provider value={{ colors, typography, spacing, radius, shadows, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
*/

// STEP 3: Add LIGHT_COLORS to your theme file alongside your existing DARK_COLORS:
export const LIGHT_COLORS = {
  bg0:         '#f5f5f0',
  bg1:         '#ffffff',
  bg2:         '#f0ede8',
  bg3:         '#e8e4dc',
  border:      '#d8d4cc',
  headerBg:    '#ffffff',
  tabBar:      '#ffffff',
  tabActive:   '#2bb5a0',
  tabInactive: '#9a9a8a',
  text1:       '#1a1208',
  text2:       '#2a2218',
  text3:       '#6a6258',
  text4:       '#9a9288',
  gold:        '#b8860b',
  goldMid:     '#c9a84c',
  goldLight:   '#f5edd6',
  teal:        '#2bb5a0',
  tealLight:   '#e0f5f2',
  purple:      '#7b5ea7',
  error:       '#c0392b',
  inputBg:     '#ffffff',
  inputBorder: '#d8d4cc',
  modalBg:     '#ffffff',
};
