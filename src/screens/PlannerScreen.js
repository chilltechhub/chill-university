// src/screens/PlannerScreen.js
// Full agenda/planner — time-based + list view, full CRUD, reminders, sync.
// Its parts live in src/screens/today/ (docs/shake-up-plan-2026-10-21.md P1)
// and its state and actions in usePlanner (P3), the same hook Today runs.
//
// With DASHBOARD_V2 on, Today *is* the Planner: this route only redirects
// there, carrying its params (editInstance, review, date, addFor, view), so
// every old link, reminder and saved plan link opens Today on the right
// day. Off, it is the Planner as before. It stays registered for one
// release either way (P3 rollback).
//
// A guest plans too: their plans stay on the phone (plannerService.js), and
// only copying them to the phone's calendar asks for an account.

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { SkeletonRows } from '../components/Skeleton';
import useDashboardV2 from '../logic/useDashboardV2';
import { goToScreen } from '../logic/appRoutes';
import DayView from './today/DayView';
import WeekView from './today/WeekView';
import MonthView from './today/MonthView';
import PlannerHeader from './today/PlannerHeader';
import usePlanner, { PlannerSheets } from './today/usePlanner';

// Today is the Planner now: hand the link over and step off the stack, so
// coming back to the Library doesn't land here again.
function PlannerRedirect() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: c } = useTheme();
  useEffect(() => {
    // Go to Today first, then take this screen off the Library stack. The
    // other way round, the jump comes from a screen that's already gone and
    // loses its params (the day, the item to edit).
    const params = route.params;
    goToScreen(navigation, 'Home', params);
    if (navigation.canGoBack()) navigation.goBack();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <View style={{ flex: 1, backgroundColor: c.bg0 }} />;
}

function Planner() {
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();
  const { showEmojis } = useUIPrefs();
  const navigation = useNavigation();
  const route = useRoute();
  const p = usePlanner({ route, navigation });

  // NOTE: no full-screen loading gate. The first visit is the one with no
  // cache behind it, so a spinner over the whole screen meant the header —
  // and the <TourSpot id="planner-add"> in it — did not exist yet when the
  // guide arrived pointing at Add. The header is static chrome; only the
  // agenda below it waits.
  return (
    <View style={{ flex: 1, backgroundColor: c.bg0 }}>
      <PlannerHeader
        view={p.view} onView={p.setView}
        isToday={p.isToday} label={p.periodLabel()} shortLabel={p.shortPeriodLabel()}
        onPrev={p.prev} onNext={p.next} onToday={p.goToday}
        onAdd={p.openAdd}
        // Fill with AI writes into the account.
        showFillWithAI={!p.guest}
        menuItems={p.menuItems()}
        areaCount={p.activeAreas.size} onFilter={p.openFilter}
        showEmojis={showEmojis}
        c={c} t={t} s={s} r={r}
      />

      {p.loading ? (
        <SkeletonRows count={4} style={{ padding: s.lg }} />
      ) : p.view === 'Daily' ? (
        <DayView
          key={`daily-${p.anchor.toDateString()}-${p.showingAll ? 'all' : 'one'}`}
          userId={p.userId} date={p.anchor} onAdd={p.openAdd}
          reviewAt={p.reviewAt}
          quickArea={p.defaultArea}
          onQuickAdded={(saved) => p.afterAdded(saved)}
          activeAreas={p.activeAreas} timeMode={p.timeMode}
          onOpen={p.setDetail}
          showingAll={p.showingAll}
          refreshKey={p.refreshKey} c={c} t={t} s={s} r={r}
        />
      ) : p.view === 'Weekly' ? (
        <WeekView userId={p.userId} anchor={p.anchor} activeAreas={p.activeAreas}
          onDayPress={p.onDayPress} refreshKey={p.refreshKey} showingAll={p.showingAll} c={c} t={t} s={s} />
      ) : (
        <MonthView userId={p.userId} anchor={p.anchor} activeAreas={p.activeAreas}
          onDayPress={p.onDayPress} refreshKey={p.refreshKey} showingAll={p.showingAll} c={c} t={t} s={s} />
      )}

      <PlannerSheets planner={p} navigation={navigation} c={c} t={t} s={s} r={r} />
    </View>
  );
}

export default function PlannerScreen() {
  const [v2, , , settled] = useDashboardV2();
  const { colors: c } = useTheme();
  // Undecided: draw nothing yet. The old Planner would read (and clear) a
  // link's params before the redirect got them.
  if (!settled) return <View style={{ flex: 1, backgroundColor: c.bg0 }} />;
  return v2 ? <PlannerRedirect /> : <Planner />;
}
