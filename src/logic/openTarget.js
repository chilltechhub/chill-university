// src/logic/openTarget.js
// A "target" is a small, serializable pointer to one place in the app. It's
// what a notification carries in its data, what a notice's button opens, and
// what a reminder is linked to — so all three open things the same way.
//
//   { kind: 'project', id }          ProjectDetail (fetches the row it needs)
//   { kind: 'quest', key }           the quest, inside ClassesStack
//   { kind: 'idea', id }             Idea Garden, focused on that plant
//   { kind: 'vault', id }            Knowledge Vault, that item open
//   { kind: 'area', key }            a Life Area hub
//   { kind: 'planner' }              the Planner
//   { kind: 'inbox' }                the Capture Inbox
//   { kind: 'home' }                 the Home tab
//   { kind: 'ai', params }           Fill with AI ({ target, idea })
//   { kind: 'screen', key, params }  any other Library screen by route name
//   { kind: 'root', key, params }    any root screen by route name
//
// Planner rows store a link as link_type + link_id / link_screen
// (20260905150000_planner_links.sql, widened by
// 20260921120000_planner_link_kinds.sql); linkFieldsFor / targetFromInstance
// translate between the two.

import { supabase } from '../api/profileScopedClient';

const lib = (navigation, screen, params) => navigation.navigate('MainTabs', { screen: 'Library', params: { screen, params } });

// Resolves true when it navigated, false when the thing is gone.
export async function openTarget(navigation, target) {
  if (!navigation || !target) return false;
  switch (target.kind) {
    case 'project': {
      const { data } = await supabase.from('projects').select('*').eq('id', target.id).is('deleted_at', null).maybeSingle();
      if (!data) return false;
      lib(navigation, 'ProjectDetail', { project: data });
      return true;
    }
    case 'quest': lib(navigation, 'ClassesStack', { screen: 'Quest', params: { questId: target.key } }); return true;
    case 'idea': lib(navigation, 'IdeaGardenScreen', { focusCoreId: target.id }); return true;
    case 'vault': lib(navigation, 'KnowledgeScreen', { focusId: target.id }); return true;
    case 'area': lib(navigation, 'LifeAreaScreen', { areaId: target.key }); return true;
    case 'planner': lib(navigation, 'PlannerScreen'); return true;
    case 'inbox': lib(navigation, 'CaptureInbox'); return true;
    case 'ai': lib(navigation, 'AIBridgeScreen', target.params); return true;
    case 'screen': lib(navigation, target.key, target.params); return true;
    case 'home': navigation.navigate('MainTabs', { screen: 'Home' }); return true;
    case 'root': navigation.navigate(target.key, target.params); return true;
    case 'class': navigation.navigate('MainTabs', { screen: 'Library', params: { screen: 'ClassesStack', params: { screen: target.key } } }); return true;
    case 'game': navigation.navigate('Play', { gameId: target.key }); return true;
    default: return false;
  }
}

// Planner row link columns for a target (null link for anything else).
export function linkFieldsFor(target) {
  switch (target?.kind) {
    case 'project': return { link_type: 'project', link_id: target.id, link_screen: null };
    case 'idea':    return { link_type: 'idea', link_id: target.id, link_screen: null };
    case 'vault':   return { link_type: 'vault', link_id: target.id, link_screen: null };
    case 'quest':   return { link_type: 'quest', link_id: null, link_screen: target.key };
    case 'class':   return { link_type: 'class', link_id: null, link_screen: target.key };
    case 'game':    return { link_type: 'game', link_id: null, link_screen: target.key };
    default:        return { link_type: null, link_id: null, link_screen: null };
  }
}

export function targetFromInstance(inst) {
  switch (inst?.link_type) {
    case 'project': return inst.link_id ? { kind: 'project', id: inst.link_id } : null;
    case 'idea':    return inst.link_id ? { kind: 'idea', id: inst.link_id } : null;
    case 'vault':   return inst.link_id ? { kind: 'vault', id: inst.link_id } : null;
    case 'quest':   return inst.link_screen ? { kind: 'quest', key: inst.link_screen } : null;
    case 'class':   return inst.link_screen ? { kind: 'class', key: inst.link_screen } : null;
    case 'game':    return inst.link_screen ? { kind: 'game', key: inst.link_screen } : null;
    default:        return null;
  }
}

export const TARGET_LABEL = {
  project: 'Project', quest: 'Quest', idea: 'Idea', vault: 'Vault item', area: 'Life area',
  planner: 'Planner', inbox: 'Inbox', class: 'Class', game: 'Game',
};
