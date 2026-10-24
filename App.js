// App.js
import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { View, Platform, AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { JetBrainsMono_500Medium, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';

import { UserProgressProvider } from './context/UserProgressContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { UIPrefsProvider } from './context/UIPrefsContext';
import { ProfileAccountsProvider } from './context/ProfileAccountsContext';
import { FabPositionProvider } from './context/FabPositionContext';
import { RemoteConfigProvider, useFeatureFlag, useConfigValue } from './context/RemoteConfigContext';
import { AccessProvider, useAccess } from './context/AccessContext';
import { featureForScreen } from './src/data/featureCatalog';
import { PlusProvider } from './context/PlusContext';
import { TourProvider, useTour } from './context/TourContext';
import { CommandPaletteProvider } from './context/CommandPaletteContext';
import { loadRemotePets } from './src/data/petOptions';
import { loadRemoteBackgrounds } from './src/data/backgroundOptions';
import { ensureAndroidChannel } from './src/logic/notificationScheduler';
import { initPlanReminders } from './src/logic/planReminderActions';
import { initHubNotifications, flushPendingTarget } from './src/logic/hubNotifications';
import ShareIntentListener from './src/components/ShareIntentListener';
import { flushQueue } from './src/api/offlineCache';
import { loadMyBuilds } from './src/api/buildService';
import { onActiveProfileChange } from './src/logic/activeProfile';
import { notify } from './src/logic/confirm';
import * as ScreenOrientation from 'expo-screen-orientation';
import TourOverlay from './src/components/TourOverlay';
import TourSpot from './src/components/TourSpot';
import { rootStackRouter } from './src/logic/navRules';
import DrillToast from './src/components/DrillToast';
import QuickToast from './src/components/QuickToast';
import RewardToast from './src/components/RewardToast';

import HomeScreen    from './src/screens/HomeScreen';
import LibraryNav    from './src/screens/library/LibraryNav';
import TrainingNav   from './src/screens/TrainingNav';
import { WORKSHOP_SCREENS, blueprintPaper } from './src/screens/library/blueprint';

import LoginScreen        from './src/screens/LoginScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import MultiStepOnboarding from './src/screens/MultiStepOnboarding';
import WelcomeScreen from './src/screens/welcome/WelcomeScreen';
import { loadWelcome, isWelcomeOn } from './src/api/welcomeStore';
import { bootTarget } from './src/logic/welcomeCards';
import ProfileScreen   from './src/screens/ProfileScreen';
import YouScreen       from './src/screens/you/YouScreen';
import useTabsV2       from './src/logic/useTabsV2';
import SettingsScreen  from './src/screens/SettingsScreen';
import NotificationCenterScreen from './src/screens/NotificationCenterScreen';
import PlayScreen      from './src/screens/PlayScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import AllProfilesScreen from './src/screens/AllProfilesScreen';
import TopBar           from './src/components/TopBar';
import FloatingActionButton from './src/components/FloatingActionButton';
import CommandPalette from './src/components/CommandPalette';
import HelpScreen       from './src/screens/HelpScreen';
import OpenSourceCreditsScreen from './src/screens/OpenSourceCreditsScreen';
import SharedScreen from './src/screens/SharedScreen';
import { tokenFromPath } from './src/api/shareLinkService';
import MakeItYoursScreen from './src/screens/MakeItYoursScreen';
import MyFeaturesScreen from './src/screens/MyFeaturesScreen';
import ConnectedAppsScreen from './src/screens/ConnectedAppsScreen';
import CompassScreen  from './src/screens/CompassScreen';
import PlusScreen     from './src/screens/PlusScreen';
import StatsScreen      from './src/screens/StatsScreen';
import WorkModeScreen   from './src/screens/WorkModeScreen';
import { gatedScreen } from './src/components/FeatureGate';
import AnnouncementBanner from './src/components/AnnouncementBanner';
import LevelUpNotification from './src/components/LevelUpNotification';
import UnlockNotification from './src/components/UnlockNotification';
import MaintenanceScreen from './src/components/MaintenanceScreen';
import ErrorBoundary from './src/components/ErrorBoundary';
import FamilyScreen from './src/screens/family/FamilyScreen';
import ChildProgressScreen from './src/screens/family/ChildProgressScreen';
import OrganizationScreen from './src/screens/organization/OrganizationScreen';
import CohortRosterScreen from './src/screens/organization/CohortRosterScreen';
import { useUserProgress } from './context/UserProgressContext';

// Screens that show SignInPrompt to a guest instead of their content.
// Empty since the shake-up: the Planner left in P1 (a guest plans on the
// phone, plannerService.js) and Profile in P2 (a guest's You: their Dream,
// their page, Save my progress). Putting a name back here, with
// SignInPrompt back on that screen, is the rollback.
const ACCOUNT_ONLY_SCREENS = new Set([]);
import { supabase } from './src/api/supabaseClient';
import { needsSecondStep } from './src/api/mfa';
import useFirstVisitTutorial from './src/logic/useFirstVisitTutorial';
import useGuidedFirstGoal from './src/logic/useGuidedFirstGoal';
import useWelcomeTour from './src/logic/useWelcomeTour';
import useGuide from './src/logic/guide/useGuide';
import AboutPageSheet from './src/components/AboutPageSheet';
import { goToScreen, routeLabel } from './src/logic/appRoutes';
import { installWebAlertShim } from './src/logic/webAlertShim';
import { loadA11yPrefs, useA11yPrefs, READABLE_FONTS } from './src/logic/a11yPrefs';

installWebAlertShim(); // web only: Alert.alert → the browser's dialogs

// Compass-gated root routes. Built at module scope so the navigator gets a
// stable component reference (an inline wrapper would remount the screen on
// every render). StatsScreen has been complete but unreachable since the
// rebuild — nothing anywhere linked to it, the same state Discover was in —
// so this is both its first route and its gate.
const GatedStats        = gatedScreen('insights', StatsScreen);
// Screens the + button stays off (see where it's rendered below).
const NO_FAB_ROUTES = new Set(['Play', 'PlayGame', 'Profile', 'You', 'WorkMode', 'Plus', 'Shared']);
// Work Mode from Home's Focus buttons. Inside the Library stack it had to be
// reached by switching tabs first, which flashed the Library (setting off its
// first-visit tutorial over the timer) and made closing land on whatever the
// Library had open, not on Home. Here, closing goes back to where you were.
const GatedWorkMode     = gatedScreen('work-mode', WorkModeScreen);
// Organization is NOT gated here: joining a class with a code, and seeing the
// classes you're in, is free. Only creating an organization is Plus — the
// screen gates that one section itself, and create_organization() checks the
// plan server-side.


// NOTE: the old OnboardingScreen.js and ProfileQuickSetup.js now live in
// archive/src/screens/ — MultiStepOnboarding.js and SettingsScreen.js replaced
// them under one consistent `profiles` schema. Parent/child linking is back — see FamilyScreen.js /
// ChildProgressScreen.js (rebuilt from scratch; the old ParentHome/ChildDashboard/
// AddChildByCode/ChildInviteCode prototype in archive/src/screens/ referenced a
// `profiles` schema — role, grade, goals_completed — that never existed).

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:     { active: 'home',    inactive: 'home-outline' },
  // Shown as "Learn" (2026-10-18): classes first, games as practice. The
  // route stays 'Training' so tours, the guide and the pet keep working.
  Training: { active: 'school', inactive: 'school-outline' },
  Library:  { active: 'book',    inactive: 'book-outline' },
};
// The new tabs (TABS_V2, shake-up P4): Today · Learn · Make. Routes unchanged.
const TAB_ICONS_V2 = {
  Home:     { active: 'today',      inactive: 'today-outline' },
  Training: { active: 'school',     inactive: 'school-outline' },
  Library:  { active: 'color-wand', inactive: 'color-wand-outline' },
};

// You drops down from the top bar (shake-up P4, §2.2): a transparent modal
// on the root stack that slides from the top, so the tabs underneath keep
// their place. A swipe up closes it.
const forDropDown = ({ current, layouts }) => ({
  cardStyle: {
    transform: [{
      translateY: current.progress.interpolate({ inputRange: [0, 1], outputRange: [-layouts.screen.height, 0], extrapolate: 'clamp' }),
    }],
  },
  overlayStyle: { opacity: current.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35], extrapolate: 'clamp' }) },
});
const YOU_OPTIONS = {
  title: 'You',
  presentation: 'transparentModal',
  gestureEnabled: true,
  gestureDirection: 'vertical-inverted',
  cardOverlayEnabled: true,
  cardStyle: { flex: 1 },
  cardStyleInterpolator: forDropDown,
};
// The Profile route renders You too once the new tabs are on, so every
// navigate('Profile') lands there; off, it's the old Profile (the rollback).
function ProfileRoute({ navigation }) {
  const [tabsV2] = useTabsV2();
  React.useEffect(() => { navigation.setOptions({ title: tabsV2 ? 'You' : 'Profile' }); }, [navigation, tabsV2]);
  return tabsV2 ? <YouScreen /> : <ProfileScreen />;
}

// bottom-tabs' own 'shift' interpolator parks every inactive tab at opacity 0
// AND translateX ±50. On web (no react-native-screens) inactive tabs stay laid
// out inside the shared scene container, which is overflow: hidden — so the
// tab to the right of the current one pokes 50px past the right edge (a
// 1024px viewport gets a 1074px scrollWidth), and any focus or scrollIntoView
// near the right edge of ANY tab scrolls that container sideways, shoving the
// visible screen 50px left. Same fade + slide while switching, but a tab at
// rest (progress exactly ±1) sits at 0 — the snap between 0 and ±49.5 happens
// at 1% opacity, so it can't be seen.
const forShiftWeb = ({ current }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({
      inputRange:  [-1, 0, 1],
      outputRange: [0, 1, 0],
    }),
    transform: [{
      translateX: current.progress.interpolate({
        inputRange:  [-1, -0.99, 0, 0.99, 1],
        outputRange: [0, -49.5, 0, 49.5, 0],
      }),
    }],
  },
});

function MainTabs() {
  const { colors: c, isDark } = useTheme();
  // Untick Training games AND Classes on "Pick your features" and its tab
  // goes. The screen stays mounted (the pet on it finds coins while the app
  // is open), and a goal step or Home's Play button can still get there.
  const { isFeatureShown } = useAccess();
  // With the new tabs, Learn is also your path and Finds, so it always shows.
  const [tabsV2] = useTabsV2();
  const trainingTab = tabsV2 || isFeatureShown('training') || isFeatureShown('classes');
  const icons = tabsV2 ? TAB_ICONS_V2 : TAB_ICONS;
  // The tab labels come from react-navigation's own Text, which the
  // accessibility swap (src/components/AppText.js) doesn't reach. Capped at
  // Larger so three labels still fit across.
  const a11y = useA11yPrefs();
  const tabLabelA11y = {
    fontSize: Math.round(12 * Math.min(a11y.textScale, 1.3)),
    ...(a11y.boldText ? { fontWeight: '800' } : null),
    ...(a11y.font === 'readable' ? { fontFamily: READABLE_FONTS.bold } : null),
  };
  return (
    <Tab.Navigator
      initialRouteName="Home"
      // Wrapped so the welcome tour can light up the real bar rather than a
      // guessed rectangle at the bottom of the screen.
      tabBar={(props) => (
        <TourSpot id="nav-tabbar" radius={0}>
          <BottomTabBar {...props} />
        </TourSpot>
      )}
      screenOptions={({ route }) => ({
        headerShown: false,
        // Unset default is an instant hard cut between tabs — the most
        // frequent "screen switch" in the app (Library/Home/Training),
        // so it's the one most worth smoothing. 'shift' cross-fades with a
        // slight horizontal offset, same motion modern iOS/Android tab
        // bars use natively.
        animation: 'shift',
        ...(Platform.OS === 'web' && { sceneStyleInterpolator: forShiftWeb }),
        tabBarStyle: {
          backgroundColor: c.tabBar,
          borderTopWidth: 0.5,
          borderTopColor: c.border,
          // Lifted over the page, like the top bar (2026-10-21 depth pass).
          boxShadow: isDark ? '0 -6px 20px rgba(0, 0, 0, 0.35)' : '0 -6px 20px rgba(42, 34, 20, 0.07)',
          paddingBottom: Platform.OS === 'ios' ? 10 : 3,
          paddingTop: 3,
          height: Platform.OS === 'ios' ? 66 : 60, // 52 squeezed the labels to an 8px box on Android/web
        },
        tabBarActiveTintColor:   c.tabActive,
        tabBarInactiveTintColor: c.tabInactive,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 0, ...tabLabelA11y, lineHeight: tabLabelA11y.fontSize + 4 },
        tabBarIcon: ({ focused, color, size }) => {
          const icon = icons[route.name];
          return <Ionicons name={focused ? icon.active : icon.inactive} size={size} color={color} />;
        },
      })}

    >
      {/* Old order Library · Home · Learn; with the new tabs (TABS_V2,
          shake-up P4) Today · Learn · Make. Same routes either way. */}
      {(tabsV2 ? ['Home', 'Training', 'Library'] : ['Library', 'Home', 'Training']).map(name => {
        // The Library tab always opens on the Library itself, not on
        // whichever tool was last open inside it (a life area the guide
        // took you to, say). Tapping it while already there did this
        // before; tapping it from another tab now does too.
        if (name === 'Library') return (
          <Tab.Screen
            name="Library"
            key="Library"
            component={LibraryNav}
            options={tabsV2 ? { tabBarLabel: 'Make', title: 'Make' } : undefined}
            listeners={({ navigation, route }) => ({
              tabPress: (e) => {
                const inner = route.state;
                if (inner && inner.index > 0) {
                  e.preventDefault();
                  navigation.navigate('Library', { screen: 'LibraryScreen' });
                }
              },
            })}
          />
        );
        if (name === 'Home') return (
          <Tab.Screen name="Home" key="Home" component={HomeScreen} options={tabsV2 ? { tabBarLabel: 'Today', title: 'Today' } : undefined} />
        );
        // Mounted at launch, not on first visit: the pet on this tab finds
        // coins while the app is open on any screen (src/logic/useCoinRewards.js),
        // so it has to be out from the start. Classes sit inside it
        // (src/screens/TrainingNav.js). Like the Library, tapping the tab
        // returns to its first screen.
        return (
          <Tab.Screen
            name="Training"
            key="Training"
            component={TrainingNav}
            options={{ lazy: false, tabBarLabel: 'Learn', title: 'Learn', ...(trainingTab ? null : { tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }) }}
            listeners={({ navigation, route }) => ({
              tabPress: (e) => {
                const inner = route.state;
                if (inner && inner.index > 0) {
                  e.preventDefault();
                  navigation.navigate('Training', { screen: inner.routes[0].name });
                }
              },
            })}
          />
        );
      })}
    </Tab.Navigator>
  );
}

// Routes that own their own full-screen auth chrome — the global TopBar
// (rank/points/sign-in) would just duplicate or clash with them.
// Plus is a paywall you close with its own X; the HUD and FAB over it would
// be buttons that lead away mid-decision.
// 'Shared': a share link's page (shake-up P8), shown to anyone, app chrome-free.
const NO_TOPBAR_ROUTES = new Set(['Welcome', 'Login', 'MultiStepOnboarding', 'ResetPassword', 'Plus', 'Shared']);

// Browser tab title on web. Screens without a title option used to show the
// raw route name ("WorkModeScreen", "ClassesMain"); spell it out instead.
function webTitle(options, route) {
  const name = options?.title || String(route?.name || '')
    .replace(/(Screen|Main)$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  return name ? `${name} · Deskartes` : 'Deskartes';
}

function AppInner() {
  const { colors: c, isDark } = useTheme();
  const navigationRef = useRef(null);
  const [initialRoute, setInitialRoute] = React.useState(null);
  const [showTopBar, setShowTopBar] = React.useState(true);
  const [currentRouteName, setCurrentRouteName] = React.useState(null);
  const [currentRouteParams, setCurrentRouteParams] = React.useState(null);
  const [resetLinkInvalid, setResetLinkInvalid] = React.useState(false);

  // Remote kill switch — flip app_config.maintenance_mode.enabled in
  // Supabase to take the whole app down (and back up) for every user
  // instantly, no build required. Checked before auth so it also blocks
  // logged-out users.
  const maintenanceOn  = useFeatureFlag('maintenance_mode', false);
  const maintenanceCfg = useConfigValue('maintenance_mode', {});
  // No startIfFirstTime here any more. Landing on Home used to auto-fire
  // the whole fourteen-step tour off a device-level "seen it?" flag — from
  // BOTH onReady and onStateChange — which meant it ambushed people straight
  // out of onboarding and never ran again for a second account on the same
  // device. The full tour is now offered from the Getting Started card on
  // Home and from Settings → Replay Tutorial.
  //
  // In its place: a short tutorial the first time you open each screen,
  // taught where it's relevant rather than all at once up front. See
  // src/logic/useFirstVisitTutorial.js.
  // The enabled flag is read inside the hook rather than with useSetting
  // here: useSetting is built on useFocusEffect, and AppInner sits ABOVE
  // NavigationContainer, where there is no navigation context to focus.
  const { registerNavigator, startScreenTour, noteRoute, active: tourActive } = useTour();
  // The guide walks a new account through its first goal, and while it
  // does, screens don't also teach themselves (src/logic/useGuidedFirstGoal.js).
  // Before either of those, a new account gets the welcome tour: how to get
  // around (src/logic/useWelcomeTour.js). Both wait for it.
  //
  // With the new tabs (shake-up P7) the guide is src/logic/guide/useGuide.js:
  // the first-day walk, guided units and one mentor note per new page. The
  // welcome tour and first-visit tutorials below only run with them off.
  const [tabsV2] = useTabsV2();
  const { holding: welcomeTourDue } = useWelcomeTour(currentRouteName, { enabled: !tabsV2 });
  const [guidingNow, setGuidingNow] = React.useState(false);
  const { user: tutorialUser } = useUserProgress();
  // A guest on an account-only screen sees a sign-in prompt, and a locked
  // screen its lock card: neither is the page a note would describe.
  const { accessFor: accessForGuide } = useAccess();
  const canTeach = React.useCallback((name) => {
    if (!tutorialUser && ACCOUNT_ONLY_SCREENS.has(name)) return false;
    const feature = featureForScreen(name);
    return !(feature && !accessForGuide(feature.id).available);
  }, [tutorialUser, accessForGuide]);
  const { holding: walkDue } = useGuide({ route: currentRouteName, params: currentRouteParams, enabled: tabsV2, guiding: guidingNow, canTeach });
  const { guiding } = useGuidedFirstGoal(currentRouteName, { hold: welcomeTourDue || walkDue });
  React.useEffect(() => { setGuidingNow(guiding); }, [guiding]);
  const teachScreen = useFirstVisitTutorial({ tourActive, startScreenTour, paused: guiding || welcomeTourDue, userId: tutorialUser?.id });
  // A guest on an account-only screen sees a sign-in prompt, not the screen
  // its tutorial describes ("Your rank" pointing at nothing), so those wait
  // until there's an account. See src/components/SignInPrompt.js.
  const { user: signedInUser } = useUserProgress();
  // A locked screen shows its lock card, not the screen its tutorial
  // describes ("Your stats" over a padlock), so it teaches once it's open.
  const { accessFor } = useAccess();
  const maybeTeachScreen = (name) => {
    if (tabsV2) return; // the guide (useGuide) teaches with the new tabs
    if (!signedInUser && ACCOUNT_ONLY_SCREENS.has(name)) return;
    const feature = featureForScreen(name);
    if (feature && !accessFor(feature.id).available) return;
    teachScreen(name);
  };

  // Pulls in any admin-added pets/backgrounds from Supabase Storage (see
  // supabase/migrations/20260828_remote_art_storage.sql) once per app
  // launch — appends onto the existing PET_TIERS/BACKGROUNDS arrays in
  // place, so every screen's character picker picks them up automatically.
  React.useEffect(() => {
    loadRemotePets();
    loadRemoteBackgrounds();
    // Studio Builds: their trophies dress every stage, not just the Studio.
    loadMyBuilds();
    ensureAndroidChannel(); // silent — no permission prompt, just registers the channel

    // Plan-aware reminders — registers the Done/Snooze/Reschedule action
    // set a planner-instance notification uses and starts listening for
    // taps on them (see src/logic/planReminderActions.js). No permission
    // prompt here either; that happens the first time an actual reminder
    // is scheduled from PlannerScreen's InstanceModal.
    initPlanReminders();

    // The Notification Center's phone side: shows reminders while the app
    // is open, and opens whatever a tapped notification points at —
    // including a tap that cold-starts the app (flushed from onReady below).
    initHubNotifications(() => navigationRef.current);

    // Replay anything stranded in the offline write queue (captures/tasks
    // saved while isOnline() thought we were offline) against Supabase now
    // that we're definitely running. Nothing drained this queue before —
    // see src/api/offlineCache.js — so a queued write could sit invisibly
    // in AsyncStorage indefinitely. Safe to call even when the queue is
    // empty; it's a no-op.
    // Also replayed when the connection comes back, when the app returns to
    // the foreground, and once the active profile is known (a row queued by
    // an older build has no profile_id yet, and gets the active one stamped
    // at replay). The raw client on purpose: see flushQueue.
    const flush = () => flushQueue(supabase).then(({ synced, remaining, dropped }) => {
      if (synced) console.log(`[queue] synced ${synced} pending write(s)${remaining ? `, ${remaining} still waiting` : ''}`);
      if (dropped) notify(
        dropped === 1 ? "One change couldn't be saved" : `${dropped} changes couldn't be saved`,
        'They were made while offline, and the server turned them down when they synced.',
      );
    }).catch(() => {});
    flush();
    let wasOffline = false;
    const unsubNet = NetInfo.addEventListener((state) => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      if (wasOffline && !offline) flush();
      wasOffline = offline;
    });
    const appStateSub = AppState.addEventListener('change', (s) => { if (s === 'active') flush(); });
    const unsubProfile = onActiveProfileChange((id) => { if (id) flush(); });

    // app.json's "orientation": "portrait" is a manifest hint that iPad
    // (and Expo Go generally) doesn't reliably honor on its own — nothing
    // in this app's layout was built for landscape, so lock it for real.
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});

    return () => { unsubNet?.(); appStateSub?.remove?.(); unsubProfile?.(); };
  }, []);

  React.useEffect(() => {
    // A password-reset (or other auth) link redirects back to the app with
    // the token — or an error — in the URL hash (web only; detectSessionInUrl
    // is web-only too, see supabaseClient.js). Three distinct cases, checked
    // before the normal session check below ever runs:
    const hash = (Platform.OS === 'web' && typeof window !== 'undefined') ? window.location.hash : '';
    const clearHash = () => window.history.replaceState(null, '', window.location.pathname + window.location.search);

    // 0. A share link (/s/<token>, shake-up P8): its read-only page, for
    // anyone, before any welcome or sign-in.
    if (Platform.OS === 'web' && typeof window !== 'undefined' && tokenFromPath(window.location.pathname)) {
      setInitialRoute('Shared');
      setShowTopBar(false);
      setCurrentRouteName('Shared');
      return;
    }

    // 1. An expired/already-used/invalid link. supabase-js's own URL
    // handling just silently drops this case rather than surfacing it —
    // this is the only way to actually tell the user what happened instead
    // of leaving them on whatever the normal logged-out/in route is.
    if (hash.includes('error=')) {
      setResetLinkInvalid(true);
      setInitialRoute('ResetPassword');
      setShowTopBar(false);
      setCurrentRouteName('ResetPassword');
      clearHash();
      return;
    }

    // 2. A valid recovery link. Wait for supabase-js to turn it into a
    // session and fire PASSWORD_RECOVERY (not SIGNED_IN) — and don't run
    // the normal getSession() check below in the meantime, since the
    // moment that session exists it would resolve too and race this to
    // MainTabs before the user ever sees the "choose a new password" screen.
    if (hash.includes('type=recovery')) {
      let settled = false;
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          settled = true;
          setResetLinkInvalid(false);
          setInitialRoute('ResetPassword');
          setShowTopBar(false);
          setCurrentRouteName('ResetPassword');
          clearHash();
        }
      });
      // Not every bad token comes back as an `error=` hash (case 1 above) —
      // a token supabase-js can't validate at all just never fires
      // PASSWORD_RECOVERY, and without this the app sits on the splash
      // screen (`if (!initialRoute) return null`) forever. Give it a few
      // seconds, then fall back to the same "invalid" screen.
      const timeout = setTimeout(() => {
        if (!settled) {
          setResetLinkInvalid(true);
          setInitialRoute('ResetPassword');
          setShowTopBar(false);
          setCurrentRouteName('ResetPassword');
          clearHash();
        }
      }, 5000);
      return () => { authListener?.subscription?.unsubscribe(); clearTimeout(timeout); };
    }

    // 3. Normal launch — check auth state.
    //
    // `initialRoute` stays null (a blank splash) until this settles, so it
    // must always settle: a rejection or a hang used to leave the app blank
    // forever. Any failure, or no answer in 10s, starts at Login — which is
    // recoverable — instead of nowhere; a guest who chose to keep going
    // starts on Today instead.
    //
    // Where each case goes is src/logic/welcomeCards.js bootTarget (the
    // shake-up's §7.2 table, checked in scripts/check-tailoring.mjs):
    // signed in → Today or onboarding, never the welcome; signed out → the
    // welcome until it's done, then Today as a guest or Login.
    const welcomeState = Promise.all([loadWelcome(), isWelcomeOn()]).catch(() => [null, false]);
    let settled = false;
    const startAt = (route) => {
      if (settled) return;
      settled = true;
      setInitialRoute(route);
      setShowTopBar(!NO_TOPBAR_ROUTES.has(route));
      setCurrentRouteName(route);
    };
    const startSlow = async (why, e) => {
      const [welcome, welcomeOn] = await welcomeState;
      const { route } = bootTarget({ timedOut: true, welcome, welcomeOn });
      console.warn(`[boot] session check ${why} — starting at ${route}`, e?.message || e || '');
      startAt(route);
    };
    const bootTimeout = setTimeout(() => { startSlow('took over 10s'); }, 10000);

    (async () => {
      const [welcome, welcomeOn] = await welcomeState;
      const { data: { session } } = await supabase.auth.getSession();
      // A session that hasn't done its two-step code yet (2FA on):
      // LoginScreen asks for the code.
      if (session && await needsSecondStep().catch(() => false)) {
        startAt('Login');
        return;
      }
      if (!session) {
        startAt(bootTarget({ hasSession: false, welcome, welcomeOn }).route);
        return;
      }
      // Logged in — check onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, metadata')
        .eq('id', session.user.id)
        .maybeSingle();

      startAt(bootTarget({
        hasSession: true,
        onboardingCompleted: profile?.onboarding_completed,
        hasPathKey: !!profile?.metadata?.path_key,
        welcome, welcomeOn,
      }).route);
    })()
      .catch((e) => startSlow('failed', e))
      .finally(() => clearTimeout(bootTimeout));
    return () => clearTimeout(bootTimeout);
  }, []);

  if (maintenanceOn) return <MaintenanceScreen message={maintenanceCfg?.message} />;
  if (!initialRoute) return null; // splash while checking

  return (
    <NavigationContainer
      ref={navigationRef}
      documentTitle={{ formatter: webTitle }}
      onReady={() => {
        // onStateChange doesn't fire for the initial route — without this,
        // currentRouteName stays stuck on the coarse 'MainTabs'/etc value
        // set before the container mounted, instead of e.g. 'Home'.
        const name = routeLabel(navigationRef.current?.getCurrentRoute()?.name);
        setShowTopBar(!NO_TOPBAR_ROUTES.has(name));
        setCurrentRouteName(name);
        setCurrentRouteParams(navigationRef.current?.getCurrentRoute()?.params || null);
        registerNavigator(
          (routeName, params) => navigationRef.current?.navigate(routeName, params),
          (screen, params) => goToScreen(navigationRef.current, screen, params),
          () => routeLabel(navigationRef.current?.getCurrentRoute()?.name),
        );
        maybeTeachScreen(name);
        flushPendingTarget();
      }}
      // A bare navigate('KnowledgeScreen') from a screen whose own navigator
      // doesn't have it (Classes moved from the Library to Training) lands
      // through the resolver instead of being dropped.
      onUnhandledAction={(action) => {
        const name = action?.type === 'NAVIGATE' ? action.payload?.name : null;
        if (name && name !== 'MainTabs') goToScreen(navigationRef.current, name, action.payload?.params);
      }}
      onStateChange={() => {
        const name = routeLabel(navigationRef.current?.getCurrentRoute()?.name);
        setShowTopBar(!NO_TOPBAR_ROUTES.has(name));
        setCurrentRouteName(name);
        setCurrentRouteParams(navigationRef.current?.getCurrentRoute()?.params || null);
        noteRoute(name); // a screen's own tutorial ends when you leave it
        maybeTeachScreen(name);
      }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: WORKSHOP_SCREENS.has(currentRouteName) ? blueprintPaper(isDark).paper : c.headerBg }} edges={['top']}>
        {showTopBar && <TopBar currentScreen={currentRouteName} />}
        {showTopBar && <AnnouncementBanner />}
        <Stack.Navigator
          initialRouteName={initialRoute}
          // "Go to X" returns to X when it's already open instead of
          // stacking another copy (React Navigation 7). src/logic/navRules.js
          UNSTABLE_router={rootStackRouter}
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            // Explicit, platform-uniform slide — the un-set default splits
            // between iOS's slide and Android's scale/fade preset, so the
            // same push read as two different transitions depending on the
            // device. One consistent motion everywhere reads as smoother
            // and more intentional than either platform default alone.
            ...TransitionPresets.SlideFromRightIOS,
          }}>
          {/* flex 1: on web a stack card otherwise grows past the viewport,
              the page itself scrolls, and the welcome's guide spotlights
              land off-target. Its own ScrollView scrolls instead. */}
          <Stack.Screen name="Welcome"             component={WelcomeScreen} options={{ title: 'Welcome', cardStyle: { flex: 1 } }} />
          <Stack.Screen name="Login"               component={LoginScreen} />
          <Stack.Screen name="ResetPassword">
            {() => <ResetPasswordScreen linkInvalid={resetLinkInvalid} />}
          </Stack.Screen>
          <Stack.Screen name="MultiStepOnboarding" component={MultiStepOnboarding} />
          <Stack.Screen name="MainTabs"            component={MainTabs} />
          <Stack.Screen name="Profile"             component={ProfileRoute} />
          <Stack.Screen name="You"                 component={YouScreen} options={YOU_OPTIONS} />
          <Stack.Screen name="Settings"            component={SettingsScreen} />
          <Stack.Screen name="Notifications"       component={NotificationCenterScreen} />
          <Stack.Screen name="Play"                component={PlayScreen} />
          <Stack.Screen name="PlayGame"            component={PlayScreen} />
          <Stack.Screen name="Leaderboard"         component={LeaderboardScreen} />
          <Stack.Screen name="AllProfiles"         component={AllProfilesScreen} />
          <Stack.Screen name="Family"              component={FamilyScreen} />
          <Stack.Screen name="ChildProgress"       component={ChildProgressScreen} />
          <Stack.Screen name="Organization"        component={OrganizationScreen} />
          <Stack.Screen name="CohortRoster"        component={CohortRosterScreen} />
          <Stack.Screen name="Help"                component={HelpScreen} />
          <Stack.Screen name="Credits"             component={OpenSourceCreditsScreen} options={{ title: 'Sources and credits' }} />
          <Stack.Screen name="Shared"              component={SharedScreen} options={{ title: 'Shared work' }} />
          <Stack.Screen name="MakeItYours"         component={MakeItYoursScreen} options={{ title: 'Make it yours' }} />
          <Stack.Screen name="MyFeatures"          component={MyFeaturesScreen} options={{ title: 'My features' }} />
          <Stack.Screen name="ConnectedApps"       component={ConnectedAppsScreen} options={{ title: 'Connected apps' }} />
          {/* The Compass — purpose, the one active objective, and the
              locked / experimental / Plus rosters. Reachable from Home's
              card, Settings, the Library header and every unlock sheet,
              so it lives on the root stack rather than inside a tab. */}
          <Stack.Screen name="Compass"           component={CompassScreen} options={{ title: 'Goals' }} />
          <Stack.Screen name="Stats"               component={GatedStats} options={{ title: 'Insights' }} />
          <Stack.Screen name="WorkMode"            component={GatedWorkMode} />
          {/* The paywall / "your plan" page. Slides up rather than across,
              because it's a detour you close, not a place you go. */}
          <Stack.Screen
            name="Plus"
            component={PlusScreen}
            options={{ ...TransitionPresets.ModalSlideFromBottomIOS }}
          />
        </Stack.Navigator>
        <LevelUpNotification />
        <UnlockNotification />
        {/* Not over a game: it sat on top of Start and the answer rows, and
            nothing in it is something you'd reach for mid-round. Nor over
            screens with their own bottom button (Profile's Save changes, the
            Plus buy button) or Work Mode, where it's a distraction. */}
        {showTopBar && !NO_FAB_ROUTES.has(currentRouteName) && (
          <FloatingActionButton currentScreen={currentRouteName} navigationRef={navigationRef} />
        )}
        {/* Global search (Cmd/Ctrl+K, or the FAB's Search action). Sits
            beside the FAB for the same reason: it has to be reachable from
            every screen, and it navigates rather than belonging to any one
            of them. */}
        {showTopBar && <CommandPalette />}
      </SafeAreaView>
      <TourOverlay />
      {/* "About this page" (shake-up P7), opened from You and the top bar. */}
      <AboutPageSheet navigationRef={navigationRef} />
      <DrillToast />
      {/* Pet coins (not on Training, where you watch it eat them) and the
          XP real work earns. */}
      <RewardToast hideCoins={currentRouteName === 'Training'} />
      <QuickToast />
      <ShareIntentListener navigationRef={navigationRef} />
    </NavigationContainer>
  );
}
// Text size, bold text, easy-read font, high contrast (Settings →
// Accessibility). Started at import so it's usually in before first paint.
loadA11yPrefs();

export default function App() {
  const [fontsLoaded] = useFonts({
    Rajdhani_600SemiBold, Rajdhani_700Bold,
    JetBrainsMono_500Medium, JetBrainsMono_600SemiBold,
    // The "Easy read" font (Settings → Accessibility).
    AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold,
  });
  if (!fontsLoaded) return null; // splash while the HUD fonts load

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      {/* Outside every provider, so a crash in one of them still shows
          the "Something went wrong" screen rather than a blank app. */}
      <ErrorBoundary>
      <ThemeProvider>
        <UIPrefsProvider>
          <RemoteConfigProvider>
            <UserProgressProvider>
              {/* Inside UserProgressProvider on purpose — it reads `user`
                  and `profile` from there for is_minor (the age gate on the
                  adult profile types) and active_profile_id. */}
              <ProfileAccountsProvider>
                {/* Inside both on purpose: the gate logic reads the profile,
                    streak, level and points from UserProgressProvider to decide
                    what is unlocked and which objective steps have ticked
                    themselves, and sits inside ProfileAccountsProvider so
                    access can follow the active profile rather than the
                    account. */}
                <AccessProvider>
                {/* Inside AccessProvider: reads the plan and the
                    plus_on_sale switch from there. */}
                <PlusProvider>
                <FabPositionProvider>
                  <CommandPaletteProvider>
                  <TourProvider>
                    <AppInner />
                  </TourProvider>
                  </CommandPaletteProvider>
                </FabPositionProvider>
                </PlusProvider>
                </AccessProvider>
              </ProfileAccountsProvider>
            </UserProgressProvider>
          </RemoteConfigProvider>
        </UIPrefsProvider>
      </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
