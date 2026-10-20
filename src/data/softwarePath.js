// src/data/softwarePath.js
// "Software for You": the founder's belief (docs/north-star.md) taught,
// shown, practised and done.
//
//   "Non-engineer people can finally witness what awesome things software
//    can do for them if they don't have to pay extensive money and license
//    costs for it."
//
// Four missions. Each one runs the same four beats, in order:
//
//   teach     2-3 cards, under 40 words each. **bold** is the idea to keep.
//   show      the app does it in front of them, live:
//               { build, answers, line }  a real Build, made on the spot
//               { compare }               what a free tool and a paid one
//                                         both do, side by side
//               { own, line }             their own Builds, as files they own
//   practice  a quick round with instant feedback. { q, options, answer, why }
//   doIt      a real step, done for real and recorded (src/logic/softwarePath.js):
//               type 'build'   they make a Build of `kind` in the Studio
//               type 'try'     they open one of `finds` and say they tried it
//               type 'export'  they take a Build home as a file
//
// A mission is done when its practice round is finished and its step is
// done. Each finished mission sends 'software-mission:<id>', which ticks the
// matching step of the Software for You goal (objectives.js).
//
// Wrong options are written about as long as the right one;
// scripts/check-games.mjs checks every question here too.
//
// No imports on purpose: plain data.

export const SOFTWARE_PATH = {
  id: 'software-for-you',
  title: 'Software for You',
  promise: 'See what software can do for you, for free. Then do it.',
  missions: [
    {
      id: 'what',
      title: 'What software can do for you',
      icon: 'flash-outline',
      teach: [
        'Software is **instructions a computer follows**. Once written, it works all day, never gets tired, and copies for free.',
        'That’s why one person can now make what used to take a company: **the hard parts are already written.** You put them together.',
        'You don’t need to be an engineer to use that. **You need to know it exists**, and where to find it.',
      ],
      show: {
        build: 'page',
        answers: { name: 'You', line: 'Making something real, for free.' },
        line: 'Watch: a real web page, made in one second from one line.',
      },
      practice: [
        { q: 'You type the same email to 20 people. What can software do?', options: ['Fill in each name for you', 'Nothing, it has to be by hand', 'Only if you pay a developer'], answer: 0, why: 'Mail merge does this in most free email and office tools.' },
        { q: 'Who can make a working web page in a minute today?', options: ['Only trained web engineers', 'Anyone, with a free tool', 'Only people with paid software'], answer: 1, why: 'You just watched it happen. The tools are free.' },
        { q: 'What does “the hard parts are already written” mean?', options: ['Others built blocks you reuse', 'Software now writes itself', 'Nobody needs to learn anything'], answer: 0, why: 'Free building blocks exist. Knowing how to put them together is the skill.' },
      ],
      doIt: { type: 'build', kind: 'page', label: 'Make your own page', how: 'The Studio makes it with you. Change one part so it’s yours.' },
    },
    {
      id: 'free',
      title: 'Free, and actually good',
      icon: 'gift-outline',
      teach: [
        '**Open source** means the code is public: anyone can read it, fix it and improve it. Thousands of people can work on one tool.',
        'Who pays? Volunteers, non-profits and companies that rely on it. **Free doesn’t mean bad**: Blender and Godot are used on real films and games.',
        'The honest catch: **more to learn, less hand-holding.** One beginner video usually gets you going.',
      ],
      show: {
        compare: {
          task: 'Edit a photo',
          paid: 'A paid photo editor, usually a monthly subscription',
          free: 'GIMP: free and open source',
          both: ['Crop and resize', 'Work in layers', 'Fix colour and light', 'Remove blemishes'],
        },
        line: 'Same job. One asks for a card every month, one doesn’t.',
      },
      practice: [
        { q: 'You want to edit photos. Which is free and open source?', options: ['GIMP', 'A photo editor subscription', 'A trial that bills after 7 days'], answer: 0, why: 'GIMP is free and open source, and has been for decades.' },
        { q: 'You want to make a game and sell it. Which engine takes no royalties?', options: ['Godot', 'Any engine, they all charge', 'Only engines with a paid plan'], answer: 0, why: 'Godot is free and open source under the MIT licence: what you make is yours.' },
        { q: 'What does “open source” mean?', options: ['Its code is public', 'It costs money to open', 'It only works online'], answer: 0, why: 'Public code means anyone can check it, fix it and build on it.' },
        { q: 'What’s the usual catch with free, open-source tools?', options: ['More to learn at first', 'They all contain viruses', 'They stop working after a month'], answer: 0, why: 'Less hand-holding than a paid product. A tutorial closes most of the gap.' },
      ],
      doIt: { type: 'try', label: 'Try one free tool', how: 'Pick one, open it, look around for ten minutes. Then say you tried it.', finds: ['fs1', 'fs6', 'fs8', 'fs9', 'fs3', 'fs5'] },
    },
    {
      id: 'ai',
      title: 'AI you can use today',
      icon: 'sparkles-outline',
      teach: [
        'AI chats **predict likely words**, very well. That makes them great at drafts, plans, explaining and brainstorming.',
        'They don’t look facts up unless they say so. **AI can sound sure and be wrong.** Check anything that matters: money, health, law.',
        'Free versions are enough for most everyday jobs. **Good instructions** matter more than a paid plan.',
      ],
      show: {
        build: 'ai',
        answers: { task: 'plan cheap, healthy dinners for a week', name: 'Dinner Buddy' },
        line: 'Watch: instructions that turn any free AI chat into your helper.',
      },
      practice: [
        { q: 'Which is a great everyday job for a free AI chat?', options: ['A first draft of an email', 'Your exact tax bill this year', 'A diagnosis for a symptom'], answer: 0, why: 'Drafting is what it’s best at. Taxes and health need a real source.' },
        { q: 'An AI gives a confident answer about a medicine. What now?', options: ['Check with a pharmacist', 'Trust it, it sounded so sure', 'Just ask the same AI again'], answer: 0, why: 'Sounding sure isn’t being right. Medicine is one to check.' },
        { q: 'What improves AI answers the most?', options: ['Clear instructions', 'A paid plan', 'Typing in capitals'], answer: 0, why: 'A role, a tone and an answer shape do more than any upgrade.' },
        { q: 'How does an AI chat mostly work?', options: ['It predicts likely words', 'It looks up every single fact', 'It thinks just like a person'], answer: 0, why: 'It writes what’s likely to come next. That’s why it can be fluent and wrong.' },
      ],
      doIt: { type: 'build', kind: 'ai', label: 'Make your AI helper', how: 'Then copy its instructions into a free AI chat and ask it one real thing.' },
    },
    {
      id: 'own',
      title: 'Yours to keep',
      icon: 'key-outline',
      teach: [
        'A **subscription is renting**: stop paying and it can stop working. Owning is a file you keep, that opens anywhere.',
        '**Open formats** like .html, .txt and .png open in lots of free programs. Your work isn’t locked inside one company’s app.',
        'Before paying monthly, ask two things: **is there a free tool, and will I own what I make?**',
      ],
      show: {
        own: true,
        line: 'Everything you make in the Studio is a file you own. No account needed to open it.',
      },
      practice: [
        { q: 'You stop paying for a subscription app. What can happen?', options: ['You can lose access', 'Nothing ever changes at all', 'You get a full refund back'], answer: 0, why: 'Renting ends when the payments do. A file you own doesn’t.' },
        { q: 'Which file opens in lots of free programs?', options: ['A .png picture', 'A file only one paid app opens', 'A file stuck inside an app'], answer: 0, why: 'Open formats work everywhere. Locked ones keep you paying.' },
        { q: 'Before paying monthly for software, ask…', options: ['Is there a free tool?', 'Is it the most expensive?', 'Does it have the most ads?'], answer: 0, why: 'Often there is. And ask whether you’ll own what you make.' },
      ],
      doIt: { type: 'export', label: 'Take one Build home', how: 'Open a Build and tap Take it home. Keep the file somewhere you’ll find it.' },
    },
  ],
};

export const PATH_MISSION_MAP = Object.fromEntries(SOFTWARE_PATH.missions.map(m => [m.id, m]));
