// src/config/chilltech.js
//
// The business behind the app, in one place.
//
// Two jobs:
//
//  1. Every outbound link to chilltechhub.com lives here rather than being
//     typed into a screen. The site's canonical URLs drop the `.html` (a
//     request for /grow-shed.html 307s to /grow-shed), so linking the bare
//     path avoids a redirect hop on every tap.
//
//  2. Worked examples for the tutorials. A walkthrough that says "let's make
//     your first project" needs something to put in the title field, and a
//     brand-new account has nothing of its own to point at. These are the
//     filler — real divisions of the business rather than "Lorem ipsum" or
//     "My first project", so the example teaches the shape of a good entry
//     while it's teaching the button.
//
// Nothing here is ever written to the database on its own. Tutorial steps
// pass an example into a real create form as a PREFILL; it only becomes a
// row if the user hits save. See `prefill` in context/TourContext.js.

export const SITE_URL = 'https://chilltechhub.com';

const page = (slug) => `${SITE_URL}/${slug}`;

// The public divisions, as they appear in the site's own nav.
export const DIVISIONS = [
  { key: 'home-tech',   label: 'Home Tech',          url: page('home-tech'),          blurb: 'Smart-home installs and repairs' },
  { key: 'grow-shed',   label: 'Grow Shed',          url: page('grow-shed'),          blurb: 'Controlled-environment growing' },
  { key: 'analytics',   label: 'Business Analytics', url: page('business-analytics'), blurb: 'Reporting and business intelligence' },
  { key: 'recovery',    label: 'CTH Recovery',       url: 'https://cthrecovery.com',  blurb: 'Data and device recovery' },
  { key: 'wiki',        label: 'CT Encyclopedia',    url: page('wiki'),               blurb: 'Reference wiki, incl. 3D printing and manufacturing' },
  { key: 'chuni',       label: 'Chuni',              url: page('ct-app'),             blurb: 'This app' },
];

export const LINKS = {
  site:    SITE_URL,
  about:   page('about'),
  blog:    page('blog'),
  contact: page('contact'),
  privacy: page('privacy-policy'),
};

// ─── Worked examples ────────────────────────────────────────────────────────
// Keyed by what the tutorial is teaching. Each shape matches the fields of
// the form it prefills.

export const EXAMPLES = {
  // library/projects.js — NewBuildModal's fields are `title` and `objective`
  project: {
    title: 'Grow Shed sensor rig',
    objective: 'Temperature and humidity monitoring, logging to a dashboard.',
  },

  // library/ideagarden.js — a new core, and a second one to vine it to, so
  // "connect two ideas" has two ideas to connect. The tutorial plants the
  // first and suggests the second.
  // ideagarden.js — coreDraft's fields are `title` and `description`
  ideas: [
    { title: 'Sell the sensor rig as a kit', description: 'Same build, boxed — parts list, printed enclosure, setup guide.' },
    { title: '3D-print the enclosures in-house', description: 'Already have the printers. Cheaper per unit than sourcing cases.' },
  ],
  vineNote: 'The kit needs an enclosure, and we already print them — one feeds the other.',

  // CaptureInbox.js — capture → label → process
  capture: {
    text: 'Humidity sensor options for the grow shed',
    url: page('grow-shed'),
    // Matches a key in CaptureInbox's own type list.
    type: 'link',
  },

  // A second, differently-shaped capture, for the step explaining that the
  // label decides where it can be routed.
  captureAlt: {
    text: 'Write up the recovery intake checklist',
    type: 'task',
  },
};
