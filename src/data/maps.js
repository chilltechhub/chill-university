// src/data/maps.js
// Map cards (docs/shake-up-plan-2026-10-21.md §4.2, P6): one road per card,
// side by side, so a choice is between things you can see. The template is
// the same for every map: what it is, what it takes, what it costs, where it
// leads, a first step, and where the facts come from.
//
// DRAFT WORDING, for the founder's review with the units (founder answer
// 12; docs/p6-content-review.md). No figures here on purpose: pay, time and
// cost change, so each card links out to the source that keeps them current.
// Map cards about jobs use O*NET (CC BY 4.0) and the BLS Handbook.
//
// Plain data. Its one import is the review date the units share.

import { REVIEWED } from './units';

const BLS = { name: 'BLS Occupational Outlook Handbook', url: 'https://www.bls.gov/ooh/', license: 'US government work (public domain)', reviewed: REVIEWED };
const FSA = { name: 'Federal Student Aid', url: 'https://studentaid.gov/', license: 'US government work (link out)', reviewed: REVIEWED };
const APP = { name: 'Apprenticeship.gov', url: 'https://www.apprenticeship.gov/', license: 'US government work (link out)', reviewed: REVIEWED };
const COS = { name: 'CareerOneStop', url: 'https://www.careeronestop.org/', license: 'US Dept. of Labor (link out)', reviewed: REVIEWED };

// "The map after school" (What's next, unit 1). Trades included.
export const AFTER_SCHOOL = [
  {
    id: 'college', title: 'A four-year college', icon: 'school-outline',
    what: 'A bachelor\'s degree in a subject you pick.',
    takes: 'About four years of classes.',
    costs: 'Tuition and living costs. **Aid and scholarships** can cut it a lot.',
    leadsTo: 'Jobs that ask for a degree, or more school.',
    firstStep: 'Look up one college\'s net price calculator.',
    link: { label: 'Federal Student Aid', url: 'https://studentaid.gov/' },
    sources: [FSA, BLS],
  },
  {
    id: 'community', title: 'Community college', icon: 'library-outline',
    what: 'Two-year degrees and short certificates, close to home.',
    takes: 'Months to about two years.',
    costs: 'Usually **far less** than a four-year college.',
    leadsTo: 'A job, a certificate, or a transfer to a four-year school.',
    firstStep: 'Look at one program at your nearest community college.',
    link: { label: 'CareerOneStop training finder', url: 'https://www.careeronestop.org/' },
    sources: [COS, FSA],
  },
  {
    id: 'trade', title: 'Trade school', icon: 'construct-outline',
    what: 'Hands-on training for one trade: electrical, welding, HVAC and more.',
    takes: 'Months to a couple of years.',
    costs: 'Tuition varies a lot. **Compare what you get** for it.',
    leadsTo: 'Skilled work, and often a license.',
    firstStep: 'Look up the trade in the Occupational Outlook Handbook.',
    link: { label: 'The Handbook', url: 'https://www.bls.gov/ooh/' },
    sources: [BLS],
  },
  {
    id: 'apprentice', title: 'An apprenticeship', icon: 'hammer-outline',
    what: 'A **paid job** with training built in.',
    takes: 'Often one to five years, earning as you learn.',
    costs: 'You are paid while you train.',
    leadsTo: 'A certified skill and a job.',
    firstStep: 'Search open apprenticeships near you.',
    link: { label: 'Apprenticeship.gov', url: 'https://www.apprenticeship.gov/' },
    sources: [APP],
  },
  {
    id: 'work', title: 'Straight to work', icon: 'briefcase-outline',
    what: 'A job now, learning on the way.',
    takes: 'As soon as you are hired.',
    costs: 'Nothing up front. **You earn from day one.**',
    leadsTo: 'Experience, references, and later choices.',
    firstStep: 'Pick a job you could apply to this week.',
    link: { label: 'CareerOneStop job search', url: 'https://www.careeronestop.org/' },
    sources: [COS],
  },
  {
    id: 'military', title: 'The military', icon: 'shield-outline',
    what: 'Service with training in a specific job.',
    takes: 'A commitment of several years.',
    costs: 'Paid service. Education benefits can come with it.',
    leadsTo: 'A trained skill, benefits, and later choices.',
    firstStep: 'Read about one military job in the Handbook.',
    link: { label: 'The Handbook', url: 'https://www.bls.gov/ooh/' },
    sources: [BLS],
  },
  {
    id: 'gap', title: 'A gap year', icon: 'compass-outline',
    what: 'A planned year to work, volunteer or travel first.',
    takes: 'About a year, **with a plan**.',
    costs: 'Depends on the plan. Work can pay for it.',
    leadsTo: 'Clearer choices, and stories you can tell.',
    firstStep: 'Write what the year would be for, in one line.',
    link: null,
    sources: [],
  },
];

export const MAPS = { afterSchool: { title: 'The map after school', cards: AFTER_SCHOOL } };
