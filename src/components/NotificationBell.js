// src/components/NotificationBell.js
// The top-bar bell: opens the Notification Center and shows how many notices
// are new. It's also what keeps the center's data and the phone's scheduled
// notifications fresh — it lives in the one TopBar the whole app shares, so
// it refreshes on launch, whenever the app comes back to the foreground, and
// every few minutes while it stays open.

import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useNoticeFeed, refreshAndSync } from '../logic/noticeStore';

const EVERY_MS = 5 * 60000;

export default function NotificationBell({ userId }) {
  const navigation = useNavigation();
  const { colors: c } = useTheme();
  const { unread } = useNoticeFeed();

  useEffect(() => {
    const go = () => refreshAndSync(userId).catch(() => {});
    go();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') go(); });
    const timer = setInterval(go, EVERY_MS);
    return () => { sub.remove(); clearInterval(timer); };
  }, [userId]);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} new` : 'Notifications'}
      hitSlop={8}
      style={{ padding: 6, marginLeft: 6 }}
    >
      <Ionicons name={unread ? 'notifications' : 'notifications-outline'} size={20} color={unread ? c.gold : c.text2} />
      {unread > 0 && (
        <View style={{ position: 'absolute', top: 1, right: 0, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, backgroundColor: c.error, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
