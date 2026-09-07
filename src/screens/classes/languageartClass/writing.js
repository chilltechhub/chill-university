// src/screens/classes/languageartClass/writing.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    // Text Types & Purposes (Purple)
    {
      key: 'opinionArgumentative',
      title: 'Opinion/Argumentative',
      grade: '6-8',
      color: '#8E24AA',
      description:
        'Writing that expresses a clear viewpoint and supports it with reasons and evidence.',
      learn: [
        { heading: 'Claim + Evidence + Reasoning', body: 'Argumentative writing states a clear claim (your position), then supports it with evidence (facts, examples, data) and reasoning that explains how the evidence proves your claim.' },
        { heading: 'Addressing the Other Side', body: 'Strong argumentative writing also acknowledges a counterargument — an opposing view — and explains why your position still holds up, which makes your argument more persuasive and credible.' },
      ],
      practice: [
        { question: 'The sentence that states your position in an argumentative essay is called the...', options: ['Counterargument', 'Claim', 'Citation', 'Conclusion'], answerIndex: 1, explanation: 'The claim is the writer\'s stated position or thesis.' },
        { question: 'Addressing an opposing viewpoint in your essay and explaining why your position still stands is called...', options: ['Plagiarism', 'A counterargument rebuttal', 'A hook', 'Formatting'], answerIndex: 1, explanation: 'Acknowledging and responding to the other side strengthens the credibility of an argument.' },
      ],
      apply: {
        prompt: 'Write a short argumentative paragraph on a topic you care about (like school lunch, homework, or screen time). Include a clear claim, two pieces of evidence, and one sentence addressing a counterargument.',
        checklist: ['Stated a clear claim', 'Included two pieces of evidence', 'Addressed one counterargument', 'Wrote in a full paragraph'],
      },
      help: {
        videos: [
          {
            title: 'Text Types (Narrative, Informative, Argumentative)',
            url: 'https://youtu.be/EKpFKe8eQ3U?si=Mv-JINsX6XlwcXzJ',
          },
        ],
      },
    },
    {
      key: 'informativeExplanatory',
      title: 'Informative/Explanatory',
      grade: '3-5',
      color: '#8E24AA',
      description:
        'Writing that explains facts or concepts clearly to inform the reader.',
      learn: [
        { heading: 'Explaining, Not Persuading', body: 'Informative/explanatory writing teaches the reader about a topic using facts, definitions, and examples — its goal is to make something clear, not to convince the reader of an opinion.' },
        { heading: 'Organizing with Structure', body: 'Good informative writing groups related facts together under clear topic sentences, often using text features like headings, and ends with a concluding statement that wraps up the information.' },
      ],
      practice: [
        { question: 'The main goal of informative/explanatory writing is to...', options: ['Convince the reader of an opinion', 'Tell an exciting story', 'Clearly explain facts about a topic', 'Persuade with emotional language'], answerIndex: 2, explanation: 'Informative writing is meant to inform and explain, not persuade or entertain.' },
        { question: 'Which sentence would fit best in an informative paragraph about sharks?', options: ['I think sharks are the scariest animal!', 'Sharks have been around for over 400 million years.', 'Once upon a time, a shark went on an adventure.', 'You should never go in the ocean.'], answerIndex: 1, explanation: 'This is a factual, informative statement — not an opinion or a story.' },
      ],
      apply: {
        prompt: 'Choose an animal, place, or object you know facts about. Write an informative paragraph with a topic sentence, three supporting facts, and a concluding sentence.',
        checklist: ['Wrote a clear topic sentence', 'Included 3 supporting facts', 'Avoided personal opinions', 'Wrote a concluding sentence'],
      },
      help: {
        videos: [
          {
            title: 'Text Types (Narrative, Informative, Argumentative)',
            url: 'https://youtu.be/EKpFKe8eQ3U?si=Mv-JINsX6XlwcXzJ',
          },
        ],
      },
    },
    {
      key: 'narrative',
      title: 'Narrative',
      grade: 'K-2',
      color: '#8E24AA',
      description: 'Writing that tells a story with characters, setting, and plot.',
      learn: [
        { heading: 'Telling a Story', body: 'A narrative tells a story that happened (or a made-up one) with characters, a setting (where and when), and events that happen in order — usually a beginning, middle, and end.' },
        { heading: 'Using Your Senses and Feelings', body: 'Good narratives include small details — what things looked, sounded, or felt like — and tell how the character felt, which helps the reader picture the story and care about what happens.' },
      ],
      practice: [
        { question: 'A narrative is a piece of writing that...', options: ['Lists facts about animals', 'Tells a story with a beginning, middle, and end', 'Gives directions for a recipe', 'Argues an opinion'], answerIndex: 1, explanation: 'Narratives tell stories in order, from beginning to end.' },
        { question: 'Which sentence belongs in a narrative story?', options: ['Dogs have four legs and fur.', 'She grabbed her umbrella and ran through the rain.', 'The capital of France is Paris.', 'Water boils at 100 degrees Celsius.'], answerIndex: 1, explanation: 'This sentence describes an action happening to a character — part of a story, not a fact list.' },
      ],
      apply: {
        prompt: 'Write a short story (4-6 sentences) about something fun that happened to you, or make one up. Include a beginning, a middle event, and an end.',
        checklist: ['Has a clear beginning', 'Has a middle event or problem', 'Has an ending', 'Tells events in order'],
      },
      help: {
        videos: [
          {
            title: 'Text Types (Narrative, Informative, Argumentative)',
            url: 'https://youtu.be/EKpFKe8eQ3U?si=Mv-JINsX6XlwcXzJ',
          },
        ],
      },
    },

    // Writing Process (Blue)
    {
      key: 'planningResearch',
      title: 'Planning & Research',
      grade: '3-5',
      color: '#039BE5',
      description: 'Gathering ideas and information before writing.',
      learn: [
        { heading: 'Why Plan First', body: 'Before writing, good writers gather ideas and information — brainstorming topics, jotting notes, or making a simple outline — so they know what they want to say before they start drafting.' },
        { heading: 'Graphic Organizers', body: 'Tools like webs, outlines, or T-charts help writers sort their ideas into groups before writing, which makes the actual drafting faster and keeps the writing organized.' },
      ],
      practice: [
        { question: 'What is the main purpose of the planning stage of writing?', options: ['To publish the final piece', 'To gather and organize ideas before drafting', 'To fix spelling mistakes', 'To share your writing with others'], answerIndex: 1, explanation: 'Planning happens before drafting, to gather and organize ideas.' },
        { question: 'A tool like a web or outline used before writing is called a...', options: ['Rough draft', 'Graphic organizer', 'Final copy', 'Citation'], answerIndex: 1, explanation: 'Graphic organizers help writers visually sort ideas during the planning stage.' },
      ],
      apply: {
        prompt: 'Pick a topic you want to write about. Make a simple graphic organizer (a web or list) with at least 4 ideas or facts you could include in your writing.',
        checklist: ['Chose a specific topic', 'Made a graphic organizer or outline', 'Listed at least 4 ideas', 'Grouped related ideas together'],
      },
      help: {
        videos: [
          {
            title: 'The Writing Process: A Step by Step Guide to Academic Writing',
            url: 'https://youtu.be/1JQxCNgr5MQ?si=67_xEW35jZ_Y4BhJ',
          },
        ],
      },
    },
    {
      key: 'drafting',
      title: 'Drafting',
      grade: '3-5',
      color: '#039BE5',
      description: 'Putting ideas into a first draft to get the writing on paper.',
      learn: [
        { heading: 'Getting Ideas on Paper', body: 'Drafting means writing your first version of a piece using your plan as a guide — the goal is to get all your ideas down in order, not to make it perfect yet.' },
        { heading: "It's Okay to Be Messy", body: 'A first draft is expected to have mistakes and rough spots — writers focus on content and organization during drafting, and save fixing spelling, grammar, and word choice for the revising and editing stage later.' },
      ],
      practice: [
        { question: 'The main goal while drafting is to...', options: ['Get your ideas written down in order', 'Fix every spelling mistake', 'Publish the final copy', 'Share it with the class'], answerIndex: 0, explanation: 'Drafting is about getting ideas on paper using your plan, not perfecting the writing.' },
        { question: 'It is normal for a first draft to...', options: ['Be completely perfect', 'Have some mistakes and rough spots', 'Be shorter than the final published piece', 'Skip the topic entirely'], answerIndex: 1, explanation: 'First drafts are expected to be imperfect — polishing happens during revising and editing.' },
      ],
      apply: {
        prompt: 'Using a graphic organizer or plan you already made (or make a quick one now), write a first draft paragraph. Do not stop to fix small mistakes — just get your ideas down.',
        checklist: ['Used a plan or organizer to guide the draft', 'Wrote a full paragraph', 'Kept writing without stopping to fix every mistake', 'Included all main ideas from the plan'],
      },
      help: {
        videos: [
          {
            title: 'The Writing Process: A Step by Step Guide to Academic Writing',
            url: 'https://youtu.be/1JQxCNgr5MQ?si=67_xEW35jZ_Y4BhJ',
          },
        ],
      },
    },
    {
      key: 'revisingEditing',
      title: 'Revising & Editing',
      grade: '6-8',
      color: '#039BE5',
      description:
        'Improving and correcting the draft to make it clearer and error-free.',
      learn: [
        { heading: 'Revising vs. Editing', body: 'Revising means improving the content — reorganizing ideas, adding detail, cutting unclear parts, or strengthening word choice. Editing comes after and focuses on fixing mechanics: spelling, grammar, capitalization, and punctuation.' },
        { heading: 'Reading With Fresh Eyes', body: 'Effective revision often means reading your draft aloud or having someone else read it — hearing awkward phrasing or gaps in logic is much easier than just seeing it silently on the page.' },
      ],
      practice: [
        { question: 'Which task belongs to REVISING rather than editing?', options: ['Fixing a comma splice', 'Correcting a spelling error', 'Reorganizing paragraphs for clarity', 'Capitalizing a proper noun'], answerIndex: 2, explanation: 'Reorganizing ideas for clarity is a content-level change, which is revising, not editing.' },
        { question: 'Editing mainly focuses on fixing...', options: ['The order of ideas', 'Spelling, grammar, and punctuation', 'The topic of the essay', 'The audience'], answerIndex: 1, explanation: 'Editing addresses surface-level mechanics like spelling and grammar.' },
      ],
      apply: {
        prompt: 'Take a draft paragraph you already wrote (or write a quick one). First revise it for content — add a detail, cut something unclear. Then edit it for spelling, grammar, and punctuation.',
        checklist: ['Revised for content (added or cut something)', 'Edited for spelling and grammar', 'Read the paragraph aloud at least once', 'Compared the final version to the original'],
      },
      help: {
        videos: [
          {
            title: 'The Writing Process: A Step by Step Guide to Academic Writing',
            url: 'https://youtu.be/1JQxCNgr5MQ?si=67_xEW35jZ_Y4BhJ',
          },
        ],
      },
    },
    {
      key: 'publishing',
      title: 'Publishing',
      grade: '6-8',
      color: '#039BE5',
      description: 'Sharing the final version of writing with others.',
      learn: [
        { heading: 'Sharing the Final Piece', body: 'Publishing is the last step of the writing process — presenting a polished, error-free piece to its intended audience, whether that\'s reading it aloud, posting it online, printing it, or turning it in.' },
        { heading: 'Formatting for the Audience', body: 'Publishing often includes formatting choices — adding a title, neat handwriting or typed text, illustrations, or a proper layout — that make the piece look finished and considerate of the reader.' },
      ],
      practice: [
        { question: 'Publishing happens...', options: ['Before planning', 'As the last step, after revising and editing', 'Instead of drafting', 'Before the topic is chosen'], answerIndex: 1, explanation: 'Publishing is the final stage, coming after the piece has been revised and edited.' },
        { question: 'A piece that is ready to publish should be...', options: ['A rough first draft with mistakes', 'Polished, edited, and formatted for the audience', 'Unfinished', 'Missing a title'], answerIndex: 1, explanation: 'Published work should be in its most polished, finished form.' },
      ],
      apply: {
        prompt: 'Take a piece of writing you have revised and edited. Prepare it for publishing: give it a title, format it neatly (typed or handwritten clearly), and share it with a family member or friend.',
        checklist: ['Gave the piece a title', 'Formatted it neatly', 'Made sure it was fully revised and edited', 'Shared it with a real audience'],
      },
      help: {
        videos: [
          {
            title: 'The Writing Process: A Step by Step Guide to Academic Writing',
            url: 'https://youtu.be/1JQxCNgr5MQ?si=67_xEW35jZ_Y4BhJ',
          },
        ],
      },
    },

    // Research & Inquiry (Green)
    {
      key: 'gatheringSources',
      title: 'Gathering Sources',
      grade: '9-12',
      color: '#43A047',
      description: 'Finding reliable books, websites, or other materials for research.',
      learn: [
        { heading: 'Evaluating Credibility', body: 'Reliable sources are current, written by qualified authors or reputable organizations, and can be fact-checked against other sources. Watch for bias, outdated information, and sites without a clear author or publisher.' },
        { heading: 'Primary vs. Secondary Sources', body: 'A primary source is firsthand evidence — an original document, interview, or dataset — while a secondary source analyzes or interprets primary sources, like a textbook or news article summarizing research.' },
      ],
      practice: [
        { question: 'Which is a red flag that a website might be an unreliable source?', options: ['It cites its data', 'It has a clear publish date and author', 'It has no author, date, or way to verify claims', 'It is published by a university'], answerIndex: 2, explanation: 'Missing authorship, dates, and verifiability are strong signs a source may be unreliable.' },
        { question: 'An original interview transcript used as research evidence is an example of a...', options: ['Secondary source', 'Primary source', 'Unreliable source', 'Citation'], answerIndex: 1, explanation: 'A primary source is firsthand, original material, like an interview transcript.' },
      ],
      apply: {
        prompt: 'Pick a research topic. Find two potential sources online and evaluate each for credibility — check the author, publish date, and whether claims can be verified elsewhere. Decide which is more reliable and explain why.',
        checklist: ['Found two potential sources', 'Checked author and publish date for each', 'Checked whether claims are verifiable', 'Explained which source is more reliable and why'],
      },
      help: {
        videos: [
          {
            title: 'How to Evaluate Sources for Reliability',
            url: 'https://youtu.be/q1k8rcYUmbQ?si=qlGJ_749QbC3Q5Cf',
          },
        ],
      },
    },
    {
      key: 'noteTakingOrganizing',
      title: 'Note-taking & Organizing',
      grade: '6-8',
      color: '#43A047',
      description: 'Recording and arranging important information from sources.',
      learn: [
        { heading: 'Taking Notes in Your Own Words', body: 'Good research notes paraphrase key information in your own words rather than copying full sentences — this helps you understand the material and avoids accidentally plagiarizing later.' },
        { heading: 'Organizing by Topic', body: 'Sorting notes into categories or subtopics — using headings, color-coding, or note cards — makes it much easier to find information again and see how ideas from different sources connect.' },
      ],
      practice: [
        { question: 'Why should research notes usually be written in your own words instead of copied exactly?', options: ['It takes less time', 'It helps you understand and avoids plagiarism', 'Copying is required', 'It makes notes longer'], answerIndex: 1, explanation: 'Paraphrasing builds understanding and prevents accidental plagiarism.' },
        { question: 'Sorting notes into categories by subtopic mainly helps you...', options: ['Forget the source', 'Find and connect information more easily later', 'Make the notes longer', 'Avoid needing an outline'], answerIndex: 1, explanation: 'Organized notes are easier to retrieve and connect when drafting.' },
      ],
      apply: {
        prompt: 'Research a topic using two sources. Take notes in your own words, sorted into at least two categories or subtopics, and record where each note came from.',
        checklist: ['Used two sources', 'Paraphrased notes in your own words', 'Sorted notes into categories', 'Recorded the source for each note'],
      },
      help: {
        videos: [
          {
            title: 'How to Take Notes for Research | Elementary Research',
            url: 'https://youtu.be/127HrnYcav0?si=Kx-K1RfkD9CjvI0Y',
          },
          {
            title: 'Research Paper - Organizing Your Notes',
            url: 'https://youtu.be/qi8lJDHpQRM?si=qZgAjvHXrvw7MnkJ',
          },
        ],
      },
    },
    {
      key: 'citingEvidence',
      title: 'Citing Evidence',
      grade: '9-12',
      color: '#43A047',
      description: 'Giving credit to sources to show where information came from.',
      learn: [
        { heading: 'Why We Cite', body: 'Citing evidence gives credit to the original source of information or ideas, allows readers to verify claims, and helps you avoid plagiarism — presenting someone else\'s words or ideas as your own.' },
        { heading: 'In-Text Citations', body: 'An in-text citation, like an APA citation (Author, Year), appears right where you use a source\'s information in your writing, and connects to a full reference listed at the end of your paper.' },
      ],
      practice: [
        { question: 'The main reason writers cite their sources is to...', options: ['Make the paper longer', 'Give credit and let readers verify claims', 'Confuse the reader', 'Avoid writing an introduction'], answerIndex: 1, explanation: 'Citations credit original authors and allow readers to check claims.' },
        { question: 'In APA style, an in-text citation typically includes the...', options: ["Author's name and the year", 'Full title only', 'Page count', "The reader's name"], answerIndex: 0, explanation: 'APA in-text citations typically use (Author, Year) format.' },
      ],
      apply: {
        prompt: 'Find a short fact or quote from a reliable source. Write a sentence using that evidence in your own paragraph, with a properly formatted in-text citation, and create the matching reference list entry.',
        checklist: ['Used evidence from a real source', 'Included a correct in-text citation', 'Created a matching reference list entry', 'Did not copy the source word-for-word without quotation marks'],
      },
      help: {
        videos: [
          {
            title: 'Citing Sources: Why & How to Do It',
            url: 'https://youtu.be/-JV9cLDCgas?si=JLghEeG73OyV7TgJ',
          },
          {
            title: 'APA 7th Edition: The Basics of APA In-text Citations',
            url: 'https://youtu.be/opp259YvaoE?si=mAfk2SnDLvOzVl8F',
          },
        ],
      },
    },

    // Handwriting & Keyboarding (Orange)
    {
      key: 'handwritingKeyboarding',
      title: 'Handwriting & Keyboarding',
      grade: 'K-2',
      color: '#FB8C00',
      description:
        'Learning to write letters neatly by hand and using a keyboard effectively.',
      learn: [
        { heading: 'Forming Letters Correctly', body: 'Handwriting means forming each letter with consistent shape and size, starting and ending strokes in the right place — practicing this helps your writing become neat and easy for others to read.' },
        { heading: 'Learning to Type', body: 'Keyboarding means learning where letters are on a keyboard and using the correct fingers for each key, which helps you type faster and more accurately as you write more on computers.' },
      ],
      practice: [
        { question: 'When holding a pencil to write, your grip should be...', options: ['Very tight, with a fist', 'Relaxed, usually with three fingers', 'Not holding it at all', 'Held in your mouth'], answerIndex: 1, explanation: 'A relaxed, three-finger (tripod) grip helps with control and reduces hand fatigue.' },
        { question: 'Learning where letters are on a keyboard and using the right fingers to press them is called...', options: ['Handwriting', 'Keyboarding', 'Drafting', 'Editing'], answerIndex: 1, explanation: 'Keyboarding is the skill of typing accurately and efficiently using proper finger placement.' },
      ],
      apply: {
        prompt: 'Practice writing your full name and the alphabet neatly on paper. Then, if you have access to a keyboard, practice typing the same words, trying to use the correct fingers for each key.',
        checklist: ['Wrote your name neatly', 'Wrote the alphabet in order', 'Practiced typing the same words (if keyboard available)', 'Checked letters are consistent in size and shape'],
      },
      help: {
        videos: [
          {
            title:
              'Learning How to Write the English Alphabet Uppercase and Lowercase Letters',
            url: 'https://youtu.be/EOX784OXmPs?si=1lu8ERmG4SN0-NqZ',
          },
          {
            title: 'How to HOLD A PENCIL',
            url: 'https://youtu.be/RclxBdiuvOM?si=G2RFG--lci7gIvK6',
          },
          {
            title: 'Intro to Typing for Kids and Teens',
            url: 'https://youtu.be/SPz9rF5KUcg?si=d1px0W2esWADl4T3',
          },
        ],
      },
    },
  ];

export default function WritingScreen() {
  return <ClassTopicScreen title={"Writing"} classKey="Writing" fallbackTopics={topics} />;
}
