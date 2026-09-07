// src/data/orgLabels.js
// One adaptive vocabulary for the institutional layer — "organization",
// "cohort", "manager", "member" everywhere in code and data (see
// organizationService.js, supabase/migrations/20260901_institutional_layer.sql)
// — relabeled per organizations.type here, in one place, instead of
// scattering `if (type === 'school')` checks across every screen.
//
// "Assignment" is deliberately NOT relabeled per type ("Homework" for
// school, etc.) — it's kept distinct from the app's existing personal
// `tasks` feature, and there's no real payoff for the extra branching.

const LABELS = {
  school: {
    org: 'School', orgPlural: 'Schools',
    cohort: 'Class', cohortPlural: 'Classes',
    manager: 'Teacher', managerPlural: 'Teachers',
    member: 'Student', memberPlural: 'Students',
    joinPrompt: 'Join your class',
  },
  business: {
    org: 'Organization', orgPlural: 'Organizations',
    cohort: 'Team', cohortPlural: 'Teams',
    manager: 'Manager', managerPlural: 'Managers',
    member: 'Employee', memberPlural: 'Employees',
    joinPrompt: 'Join your team',
  },
  other: {
    org: 'Organization', orgPlural: 'Organizations',
    cohort: 'Group', cohortPlural: 'Groups',
    manager: 'Lead', managerPlural: 'Leads',
    member: 'Member', memberPlural: 'Members',
    joinPrompt: 'Join your group',
  },
};

export const ORG_TYPES = [
  { key: 'school',   label: 'School',   emoji: '🏫', blurb: 'Classes, teachers, students' },
  { key: 'business', label: 'Business', emoji: '💼', blurb: 'Teams, managers, employees' },
  { key: 'other',    label: 'Other',    emoji: '✨', blurb: 'Groups, leads, members' },
];

export function getOrgLabels(type) {
  return LABELS[type] || LABELS.other;
}

// role: 'owner' | 'admin' | 'member' (organization_members.role) — owner
// and admin both read as the "manager" word in the UI; only a plain
// member reads as "member".
export function getRoleLabel(type, role) {
  const l = getOrgLabels(type);
  return role === 'member' ? l.member : l.manager;
}
