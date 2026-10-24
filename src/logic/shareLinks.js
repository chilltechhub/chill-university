// src/logic/shareLinks.js
// Share link addresses (shake-up P8): /s/<token>, the token being the 64
// hex characters the server makes (20261024120000_shakeup_p8_share_links.sql).
// Pure, so scripts/check-deliverables.mjs runs it.

const TOKEN = /^[0-9a-f]{64}$/;

/** The token in a /s/<token> path, or null. */
export function tokenFromPath(path) {
  const m = String(path || '').match(/^\/s\/([0-9a-f]{64})\/?$/);
  return m ? m[1] : null;
}

/** The link for a token on a base address ('https://…'), or null. */
export function shareUrlFor(base, token) {
  if (!base || !TOKEN.test(String(token || ''))) return null;
  return `${String(base).replace(/\/+$/, '')}/s/${token}`;
}
