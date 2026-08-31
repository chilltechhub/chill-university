// src/logic/exportUtils.js
// Shared Markdown/CSV formatters — used by the Import Hub's export section
// and by the per-section Export buttons on Projects, Notes, and the Idea
// Garden, so every export looks and behaves the same way across the app.

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const tagLine = (tags) => (tags && tags.length ? tags.map(t => `#${t}`).join(' ') : '');

// ─── Generic capture-shaped items (used by ImportScreen) ──────────────────
export function itemsToMarkdown(items) {
  return items.map(it => [
    `## ${it.title || 'Untitled'}`,
    it.url || null,
    it.description || it.body || null,
    tagLine(it.tags) || null,
  ].filter(Boolean).join('\n')).join('\n\n');
}

export function itemsToCSV(items) {
  const header = ['title', 'url', 'type', 'tags', 'description'].join(',');
  const rows = items.map(it => [
    esc(it.title), esc(it.url || ''), esc(it.type || ''), esc((it.tags || []).join('; ')), esc(it.description || it.body || ''),
  ].join(','));
  return [header, ...rows].join('\n');
}

// ─── One project, with everything in its workspace ─────────────────────────
export function projectToMarkdown(project, { tasks = [], journal = [], research = [], milestones = [] } = {}) {
  const lines = [`# ${project.emoji ? project.emoji + ' ' : ''}${project.title}`];
  if (project.objective) lines.push('', `> ${project.objective}`);
  lines.push('', `Status: ${(project.status || 'active')}`);

  if (tasks.length) {
    lines.push('', '## Tasks');
    tasks.forEach(tk => lines.push(`- [${tk.completed ? 'x' : ' '}] ${tk.title}`));
  }

  const notes = journal.filter(j => !j.type || j.type === 'note');
  const ideas = journal.filter(j => j.type === 'idea');
  const questions = journal.filter(j => j.type === 'question');

  if (notes.length) {
    lines.push('', '## Notes');
    notes.forEach(n => lines.push(`- ${n.title ? n.title + ' — ' : ''}${n.body || ''}`));
  }
  if (ideas.length) {
    lines.push('', '## Ideas');
    ideas.forEach(n => lines.push(`- ${n.title ? n.title + ' — ' : ''}${n.body || ''}`));
  }
  if (questions.length) {
    lines.push('', '## Open Questions');
    questions.forEach(n => lines.push(`- ${n.title ? n.title + ' — ' : ''}${n.body || ''}`));
  }
  if (research.length) {
    lines.push('', '## Research');
    research.forEach(r => lines.push(`- ${r.title}${r.url ? ' — ' + r.url : ''}${r.notes ? `\n  ${r.notes}` : ''}`));
  }
  if (milestones.length) {
    lines.push('', '## Milestones');
    milestones.forEach(m => {
      const date = m.created_at ? ` (${new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})` : '';
      lines.push(`- ${m.title || m.body || 'Milestone'}${date}`);
    });
  }
  return lines.join('\n');
}

// ─── Notes (captures, type: 'note') ────────────────────────────────────────
export function notesToMarkdown(notes) {
  return notes.map(n => {
    const date = n.created_at ? new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    return [
      `## ${n.title || 'Untitled note'}`,
      date ? `_${date}_` : null,
      n.body || null,
      tagLine(n.tags) || null,
    ].filter(Boolean).join('\n');
  }).join('\n\n');
}

export function notesToCSV(notes) {
  const header = ['title', 'body', 'tags', 'created_at'].join(',');
  const rows = notes.map(n => [
    esc(n.title || ''), esc(n.body || ''), esc((n.tags || []).join('; ')), esc(n.created_at || ''),
  ].join(','));
  return [header, ...rows].join('\n');
}

// ─── Idea Garden cores (+ petals as a checklist) ───────────────────────────
export function ideasToMarkdown(cores) {
  return cores.map(core => {
    const petals = core.garden_petals || core.petals || [];
    const petalLines = petals.map(p => `- [${p.completed ? 'x' : ' '}] ${p.title}`).join('\n');
    return [
      `## ${core.title}`,
      core.is_project ? `Progress: ${core.project_progress || 0}%` : null,
      core.description || null,
      petalLines || null,
    ].filter(Boolean).join('\n');
  }).join('\n\n');
}

export function ideasToCSV(cores) {
  const header = ['title', 'type', 'is_project', 'progress', 'petal_count'].join(',');
  const rows = cores.map(c => {
    const petals = c.garden_petals || c.petals || [];
    return [
      esc(c.title), esc(c.plant_type || ''), esc(c.is_project ? 'yes' : 'no'), esc(c.project_progress || 0), esc(petals.length),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}
