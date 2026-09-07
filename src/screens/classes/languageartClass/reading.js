// src/screens/classes/languageartClass/reading.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    // Foundational Skills (Purple)
    {
      key: 'printConcepts',
      title: 'Print Concepts',
      grade: 'K-2',
      color: '#8E24AA',
      description:
        'Understanding how books and print work (e.g., reading left to right, top to bottom, how to turn pages, recognizing that words are made of letters).',
      learn: [
        { heading: 'How Books Work', body: 'Books have a front cover, a back cover, and pages that turn one at a time. In English, we read words from left to right and from the top of the page to the bottom, then sweep back to the left for the next line.' },
        { heading: 'Letters Make Words', body: 'A letter is a single symbol like "b" or "t." When we put letters together, they make a word, and when we put words together with spaces between them, they make a sentence.' },
      ],
      practice: [
        { question: 'When reading a page in English, which way do your eyes move first?', options: ['Bottom to top', 'Right to left', 'Left to right', 'In circles'], answerIndex: 2, explanation: 'English print is read left to right, then top to bottom.' },
        { question: 'What do we call the space between two words?', options: ['A period', 'A word space', 'A letter', 'A title'], answerIndex: 1, explanation: 'Spaces separate one word from the next so readers know where each word starts and ends.' },
      ],
      apply: {
        prompt: 'Grab any picture book. Point to the front cover, then point to the title. Open to the first page and use your finger to track each line of words from left to right as a grown-up reads it aloud.',
        checklist: ['Pointed to the front cover', 'Pointed to the title', 'Tracked words left to right with a finger', 'Turned pages one at a time in order'],
      },
      help: {
        videos: [
          {
            title: 'Concepts of Print for Kindergarten',
            url: 'https://youtu.be/T-ybpyBWH2o?si=thyBAb1NXK87i7nd',
          },
        ],
      },
    },
    {
      key: 'phonologicalAwareness',
      title: 'Phonological Awareness',
      grade: 'K-2',
      color: '#8E24AA',
      description:
        'The ability to hear and manipulate sounds in spoken language. Includes skills like rhyming; syllable segmentation; blending and segmenting onset-rime; phonemic awareness (individual sounds in words).',
      learn: [
        { heading: 'Rhyming & Word Families', body: 'Words rhyme when they end with the same sound — cat, hat, mat. Changing just the first letter creates a new word in the same "word family."' },
        { heading: 'Why It Matters', body: 'Hearing and playing with sounds in words is one of the strongest early predictors of reading success — before kids ever sound out a letter, they need to hear how words are built.' },
      ],
      practice: [
        { question: 'Which word rhymes with "bug"?', options: ['Bag', 'Hug', 'Big', 'Bud'], answerIndex: 1, explanation: '"Hug" ends with the same "-ug" sound as "bug."' },
        { question: '"Cat," "hat," and "mat" all belong to the same...', options: ['Color group', 'Word family', 'Number family', 'Shape'], answerIndex: 1, explanation: 'They share the "-at" ending, so swapping the first sound makes a new rhyming word.' },
      ],
      apply: {
        prompt: 'Draw a picture of a cat wearing a hat sitting on a mat. Label all three rhyming words in your drawing.',
        checklist: ['Drew a cat', 'Drew a hat', 'Drew a mat', 'Labeled all three words'],
      },
      help: {
        videos: [
          {
            title: 'Rhyming Words',
            url: 'https://youtu.be/4PW3_LErVZk?si=HKt6zrULKIhfbIOA',
          },
          {
            title: 'Open and Closed Syllables',
            url: 'https://youtu.be/epk-hnVC10k?si=7nGZ5YvC4TBofqnM',
          },
          {
            title: 'What are Syllables',
            url: 'https://youtu.be/Um7ukvphdHY?si=OdpfjT59aEyajM-J',
          },
        ],
      },
    },
    {
      key: 'phonicsWordRecognition',
      title: 'Phonics & Word Recognition',
      grade: 'K-2',
      color: '#8E24AA',
      description:
        'Phonics – Connecting sounds to letters (letter-sound correspondence). Helps children decode (sound out) words when reading. Word Recognition – The ability to recognize words quickly and effortlessly. Includes sight word recognition and decoding strategies.',
      learn: [
        { heading: 'Letters Have Sounds', body: 'Every letter (or group of letters) stands for a sound. The letter "b" makes a /b/ sound like in "bat," and "sh" makes one sound /sh/ like in "ship." Sounding out letters in order helps you read a new word.' },
        { heading: 'Sight Words', body: 'Some common words, like "the" or "said," don\'t sound out the normal way, so readers learn to recognize them instantly by sight instead of sounding them out every time.' },
      ],
      practice: [
        { question: 'What sound does the letter "m" make at the start of "map"?', options: ['/s/', '/m/', '/t/', '/p/'], answerIndex: 1, explanation: 'The letter "m" makes the /m/ sound, as heard at the beginning of "map."' },
        { question: 'Which word is a "sight word" kids usually memorize instead of sounding out?', options: ['cat', 'said', 'jump', 'run'], answerIndex: 1, explanation: '"Said" is not spelled the way it sounds, so readers learn to recognize it by sight.' },
      ],
      apply: {
        prompt: 'Pick 5 words from a book you are reading. Sound out each letter slowly, then blend the sounds together to say the whole word.',
        checklist: ['Chose 5 words', 'Sounded out each letter', 'Blended sounds into the whole word', 'Read each word out loud'],
      },
      help: {
        videos: [
          {
            title: 'Phonics Song',
            url: 'https://youtu.be/BELlZKpi1Zs?si=LeLmN4KaNvK3aodr',
          },
          {
            title: 'Letter Sound - Phonics for Kids',
            url: 'https://youtu.be/jiEv6VTDt5c?si=dEEEGVLSftui5YBL',
          },
          {
            title: 'Word recognition/site words',
            url: 'https://youtu.be/gIZjrcG9pW0?si=HPzkNjgF1dAUD13S',
          },
        ],
      },
    },
    {
      key: 'fluency',
      title: 'Fluency',
      grade: 'K-2',
      color: '#8E24AA',
      description:
        'Reading with speed, accuracy, and proper expression. Fluency bridges the gap between word recognition and comprehension.',
      learn: [
        { heading: 'Speed, Accuracy, and Expression', body: 'Fluent reading means reading words correctly (accuracy), at a smooth pace (speed), and with your voice going up and down to match the meaning (expression) — not just saying words one by one like a robot.' },
        { heading: 'Practice Makes It Automatic', body: 'The more you read the same words and stories, the more automatic word recognition becomes, which frees up your brain to focus on understanding the story instead of decoding every word.' },
      ],
      practice: [
        { question: 'Which of these best describes a fluent reader?', options: ['Reads very slowly and stops on every word', 'Reads smoothly, accurately, and with expression', 'Only reads silently', 'Skips words they do not know'], answerIndex: 1, explanation: 'Fluency means accurate, smooth reading with expression, not just fast reading.' },
        { question: 'Why does re-reading the same story help fluency?', options: ['It makes the story shorter', 'It helps word recognition become automatic', 'It changes the words', 'It is required by teachers'], answerIndex: 1, explanation: 'Repeated reading builds automatic word recognition, which frees attention for meaning and expression.' },
      ],
      apply: {
        prompt: 'Choose a short page from a favorite book. Read it aloud three times, trying to sound more smooth and expressive each time — like a character talking, not a robot.',
        checklist: ['Read the page aloud 3 times', 'Used a different voice for excited or sad parts', 'Read without stopping on every word by the 3rd try', 'Had someone listen to the last read-aloud'],
      },
      help: {
        videos: [
          {
            title: 'Reading Fluency: Speed, Accuracy, and Expression',
            url: 'https://youtu.be/i0cQu7vnDzs?si=NiK07cZVwQHYNSlw',
          },
        ],
      },
    },

    // Literature (Blue)
    {
      key: 'storyElements',
      title: 'Story Elements',
      grade: '3-5',
      color: '#039BE5',
      description:
        'Story Elements (plot, character, setting).',
      learn: [
        { heading: 'Character, Setting, Plot', body: 'Every story has characters (the people or animals it happens to), a setting (the time and place it happens), and a plot (the sequence of events, including a problem and how it gets solved).' },
        { heading: 'How They Work Together', body: 'The setting can shape what problems characters face, and the plot usually follows a pattern: a problem starts the story, events build tension, and a resolution wraps it up.' },
      ],
      practice: [
        { question: 'In a story, the "setting" refers to...', options: ['The main character', 'The time and place the story happens', 'The problem in the story', 'The ending'], answerIndex: 1, explanation: 'Setting is the when and where of a story.' },
        { question: 'The series of events in a story, including the problem and how it is solved, is called the...', options: ['Setting', 'Theme', 'Plot', 'Genre'], answerIndex: 2, explanation: 'Plot is the sequence of events that make up the story, centered on a problem and its resolution.' },
      ],
      apply: {
        prompt: 'Pick a story you have read recently. Create a simple chart identifying its main character, setting, the problem, and how the problem was resolved.',
        checklist: ['Identified the main character', 'Identified the setting (time and place)', 'Described the problem', 'Described how the problem was solved'],
      },
      help: {
        videos: [
          {
            title: 'Story Elements Song | Character, Setting and Plot!',
            url: 'https://youtu.be/m3WHmmYTHeE?si=ma9elO11dO6LwOPM',
          },
        ],
      },
    },
    {
      key: 'themesAuthorsPurpose',
      title: 'Themes & Author’s Purpose',
      grade: '3-5',
      color: '#039BE5',
      description:
        'Themes & Author’s Purpose.',
      learn: [
        { heading: 'Finding the Theme', body: 'A theme is the underlying message or life lesson a story teaches — like "kindness matters" or "honesty is important." It is not stated directly; readers figure it out from what happens to the characters.' },
        { heading: "Author's Purpose (PIE)", body: 'Authors write for a reason: to Persuade (convince you of something), Inform (teach you facts), or Entertain (tell an enjoyable story). Looking at word choice and content helps you figure out which one.' },
      ],
      practice: [
        { question: 'A story about a boy who learns to share his toys probably has the theme...', options: ['Sharing is important', 'Toys are expensive', 'Boys like trucks', 'Sharing is boring'], answerIndex: 0, explanation: 'The lesson the character learns points to the underlying theme of the story.' },
        { question: 'A magazine article listing facts about volcanoes was most likely written to...', options: ['Persuade', 'Inform', 'Entertain', 'Confuse'], answerIndex: 1, explanation: 'An article full of facts is meant to inform readers about a topic.' },
      ],
      apply: {
        prompt: 'Read a short story or article. Write one sentence stating its theme (if a story) or its purpose (if nonfiction), and give one piece of evidence from the text that supports your answer.',
        checklist: ['Named the theme or purpose', 'Gave one piece of text evidence', 'Explained why that evidence supports the answer', 'Used a complete sentence'],
      },
      help: {
        videos: [
          {
            title: 'Theme',
            url: 'https://youtu.be/xwkKBIzpRXE?si=T5etTG1nn67v3Mdc',
          },
          {
            title: "Author's Purpose",
            url: 'https://youtu.be/enm4afX-izA?si=k48sPixqvR9AU8Xw',
          },
        ],
      },
    },
    {
      key: 'literaryDevices',
      title: 'Literary Devices',
      grade: '6-8',
      color: '#039BE5',
      description:
        'Literary Devices (metaphor, symbolism, etc.).',
      learn: [
        { heading: 'Metaphor vs. Simile', body: 'A simile compares two things using "like" or "as" ("brave as a lion"), while a metaphor states that one thing IS another without those words ("he is a lion in battle") to create a vivid image.' },
        { heading: 'Symbolism', body: 'Symbolism is when an object, person, or color represents an idea beyond its literal meaning — a dove often symbolizes peace, and a storm often symbolizes conflict or turmoil in a story.' },
      ],
      practice: [
        { question: 'Which sentence contains a simile?', options: ['Her smile was sunshine.', 'Her smile was as bright as sunshine.', 'The sunshine smiled.', 'She never smiled.'], answerIndex: 1, explanation: 'A simile uses "like" or "as" to compare two things; this sentence uses "as."' },
        { question: 'A dove appearing at the end of a war story most likely symbolizes...', options: ['Danger', 'Peace', 'Hunger', 'Speed'], answerIndex: 1, explanation: 'Doves are a traditional symbol for peace, especially after conflict.' },
      ],
      apply: {
        prompt: 'Write three original sentences about your day: one using a simile, one using a metaphor, and one that uses a simple symbol (an object that represents a feeling or idea).',
        checklist: ['Wrote a sentence with a simile using "like" or "as"', 'Wrote a sentence with a metaphor (no "like"/"as")', 'Wrote a sentence using an object as a symbol', 'Labeled which device is which'],
      },
      help: {
        videos: [
          {
            title:
              'Literary Devices (Onomatopoeia, Personification, Simile, and Metaphor)',
            url: 'https://youtu.be/JaYPoeMJECg?si=R30S0NpJ-LbNMkAv',
          },
        ],
      },
    },

    // Informational Text (Orange)
    {
      key: 'mainIdea',
      title: 'Main Idea & Supporting Details',
      grade: '3-5',
      color: '#FB8C00',
      description:
        'Main Idea & Supporting Details.',
      learn: [
        { heading: 'What Is the Main Idea?', body: 'The main idea is the most important point a paragraph or passage is making — what it is mostly about. Everything else in the passage is there to support or explain that one central point.' },
        { heading: 'Supporting Details', body: 'Supporting details are the facts, examples, and explanations that back up the main idea. A good way to find the main idea is to ask, "What do all these details have in common?"' },
      ],
      practice: [
        { question: 'The main idea of a paragraph is best described as...', options: ['A random fact', 'The most important point the paragraph makes', 'The last sentence only', 'The title of the book'], answerIndex: 1, explanation: 'The main idea is the central point that everything else in the paragraph supports.' },
        { question: 'Supporting details in a paragraph mainly serve to...', options: ['Confuse the reader', 'Back up and explain the main idea', 'Replace the main idea', 'End the paragraph'], answerIndex: 1, explanation: 'Supporting details provide evidence and explanation for the main idea.' },
      ],
      apply: {
        prompt: 'Read a short nonfiction paragraph (from a book, magazine, or website). Write the main idea in one sentence, then list two supporting details from the text.',
        checklist: ['Read a nonfiction paragraph', 'Wrote the main idea in one sentence', 'Listed two supporting details', 'Checked that details connect to the main idea'],
      },
      help: {
        videos: [
          {
            title: 'Main Idea and Supporting Details',
            url: 'https://youtu.be/LWFnpeimPfE?si=t6Wxkg-3-Zd_VrUB',
          },
        ],
      },
    },
    {
      key: 'textFeatures',
      title: 'Text Features',
      grade: '3-5',
      color: '#FB8C00',
      description:
        'Text Features (headings, charts, captions).',
      learn: [
        { heading: 'What Are Text Features?', body: 'Text features are the parts of a nonfiction text besides the main paragraphs — headings, bold words, captions, charts, diagrams, and the table of contents — that help readers find and understand information faster.' },
        { heading: 'Using Them Strategically', body: 'Headings preview what a section is about, captions explain pictures, and charts organize data visually — good readers glance at these features before reading closely to build a preview of the whole text.' },
      ],
      practice: [
        { question: 'A short sentence under a photo that explains what it shows is called a...', options: ['Heading', 'Caption', 'Index', 'Glossary'], answerIndex: 1, explanation: 'A caption is text that describes or explains an image.' },
        { question: 'Which text feature would help you find the page number for a specific chapter?', options: ['Table of contents', 'Caption', 'Bold word', 'Diagram'], answerIndex: 0, explanation: 'The table of contents lists chapters or sections with their page numbers.' },
      ],
      apply: {
        prompt: 'Find a nonfiction book or magazine article. List every text feature you can spot (headings, captions, charts, bold words, etc.) and explain what each one helps you understand.',
        checklist: ['Found at least 4 text features', 'Named each feature correctly', 'Explained what each feature shows', 'Used a real nonfiction source'],
      },
      help: {
        videos: [
          {
            title: 'Nonfiction Text Features',
            url: 'https://youtu.be/GQ03w1Igolc?si=4NluGSeDvhgmV9s4',
          },
        ],
      },
    },
    {
      key: 'textStructure',
      title: 'Text Structure',
      grade: '6-8',
      color: '#FB8C00',
      description:
        'Text Structure (cause/effect, compare/contrast, sequence).',
      learn: [
        { heading: 'Five Common Structures', body: 'Authors organize informational text in patterns: cause/effect (why something happened), compare/contrast (how two things are alike/different), sequence (order of events), problem/solution, and description.' },
        { heading: 'Signal Words Give It Away', body: 'You can identify structure by its clue words: "because" and "as a result" signal cause/effect; "however" and "similarly" signal compare/contrast; "first," "next," "finally" signal sequence.' },
      ],
      practice: [
        { question: 'A passage using words like "however" and "in contrast" is probably using which structure?', options: ['Sequence', 'Compare/contrast', 'Cause/effect', 'Description'], answerIndex: 1, explanation: '"However" and "in contrast" are signal words for the compare/contrast structure.' },
        { question: 'A passage that explains why a volcano erupted and what happened afterward uses which structure?', options: ['Cause/effect', 'Sequence', 'Description', 'Compare/contrast'], answerIndex: 0, explanation: 'Explaining why something happened and its result is the cause/effect structure.' },
      ],
      apply: {
        prompt: 'Find a short informational article. Identify which text structure it mainly uses and highlight or list at least two signal words that helped you decide.',
        checklist: ['Identified the text structure', 'Found at least 2 signal words', 'Explained why those words point to that structure', 'Used a real article'],
      },
      help: {
        videos: [
          {
            title:
              'The 5 Types of Text Structure | Educational Rap',
            url: 'https://youtu.be/7kWGQ-_ipBY?si=pgAj0eo48YkWOOSU',
          },
        ],
      },
    },

    // Vocabulary (Green)
    {
      key: 'contextClues',
      title: 'Context Clues',
      grade: '3-5',
      color: '#43A047',
      description:
        'Context Clues.',
      learn: [
        { heading: 'Using the Sentence Around a Word', body: 'When you hit a word you don\'t know, look at the words and sentences around it — those "context clues" often hint at the meaning through definitions, examples, synonyms, or contrast within the same passage.' },
        { heading: 'Types of Clues', body: 'Sometimes the author gives a direct definition ("a mammal, an animal with fur, that..."), sometimes an example ("pets, such as dogs and cats"), and sometimes a contrast word like "but" or "unlike" that hints at an opposite meaning.' },
      ],
      practice: [
        { question: 'In "The arid desert had almost no rainfall," what does "arid" most likely mean?', options: ['Wet', 'Dry', 'Cold', 'Green'], answerIndex: 1, explanation: '"Almost no rainfall" is a context clue showing "arid" means dry.' },
        { question: 'Which strategy uses the words around an unknown word to figure out its meaning?', options: ['Skipping the word', 'Context clues', 'Reading faster', 'Looking at the cover'], answerIndex: 1, explanation: 'Context clues use surrounding text to infer meaning.' },
      ],
      apply: {
        prompt: 'Find three unfamiliar words in a book you are reading. For each one, write the sentence it appears in, guess its meaning using context clues, then check a dictionary to see how close you were.',
        checklist: ['Found 3 unfamiliar words', 'Wrote down the sentence for each', 'Guessed a meaning using context clues', 'Checked each guess against a dictionary'],
      },
      help: {
        videos: [
          {
            title: 'Context Clues',
            url: 'https://youtu.be/eHCpJ86XDY4?si=sSEmA05h27xCQS5u',
          },
        ],
      },
    },
    {
      key: 'wordRootsAffixes',
      title: 'Word Roots & Affixes',
      grade: '6-8',
      color: '#43A047',
      description:
        'Word Roots & Affixes.',
      learn: [
        { heading: 'Roots, Prefixes, Suffixes', body: 'A root carries a word\'s core meaning (like "port," meaning "to carry"). A prefix attaches to the front ("trans-" means across, so "transport" = carry across); a suffix attaches to the end and can change meaning or part of speech.' },
        { heading: 'Why Learning Them Helps', body: 'Once you know that "bio" means life and "-ology" means study of, you can figure out that "biology" means the study of life — and unlock dozens of related words without memorizing each one separately.' },
      ],
      practice: [
        { question: 'The root "spect" means "to look." What does "inspect" most likely mean?', options: ['To look inside/closely at', 'To listen', 'To run away', 'To build'], answerIndex: 0, explanation: '"In-" (into) + "spect" (look) suggests looking closely at or into something.' },
        { question: 'Which prefix means "not" or "opposite of," as in "unhappy"?', options: ['re-', 'un-', 'pre-', '-ful'], answerIndex: 1, explanation: 'The prefix "un-" reverses or negates a word\'s meaning.' },
      ],
      apply: {
        prompt: 'Choose one Greek or Latin root (like "bio," "graph," "tele," or "spect"). List at least 4 English words built from it, and explain how the root\'s meaning shows up in each one.',
        checklist: ['Chose a root and stated its meaning', 'Listed at least 4 words using that root', 'Explained the meaning connection for each word', 'Used a dictionary to check any doubts'],
      },
      help: {
        videos: [
          {
            title: 'Root Word and Affixes',
            url: 'https://youtu.be/H2NZuH8dUW0?si=7YcrghiLkwGmCuog',
          },
        ],
      },
    },
    {
      key: 'academicDomainTerms',
      title: 'Academic & Domain-Specific Terms',
      grade: '9-12',
      color: '#43A047',
      description:
        'Academic & Domain-Specific Terms.',
      learn: [
        { heading: 'What Are Academic & Domain-Specific Terms?', body: 'Academic vocabulary (like "analyze," "synthesize," "hypothesis") appears across many subjects in school writing, while domain-specific terms (like "mitochondria" or "amendment") belong to one particular field of study.' },
        { heading: 'Reading Across Subjects', body: 'Strong readers in high school build a working vocabulary of these terms because they appear constantly in textbooks and exams — precise understanding of a term like "correlation" versus "causation" can change how you interpret an entire passage.' },
      ],
      practice: [
        { question: 'Which term is a general academic word likely to appear across many subjects?', options: ['Photosynthesis', 'Analyze', 'Amendment', 'Mitochondria'], answerIndex: 1, explanation: '"Analyze" is a general academic verb used across subjects, unlike the other domain-specific terms.' },
        { question: '"Amendment" is a domain-specific term most associated with which subject?', options: ['Biology', 'Government/History', 'Chemistry', 'Art'], answerIndex: 1, explanation: '"Amendment" refers to a formal change to a law or constitution, a term specific to government and history.' },
      ],
      apply: {
        prompt: 'Pick a chapter from one of your textbooks (science, history, or math). List 5 domain-specific terms from it, and write a precise one-sentence definition for each using context from the chapter.',
        checklist: ['Chose a textbook chapter', 'Listed 5 domain-specific terms', 'Wrote a precise definition for each', 'Used context from the chapter, not just a dictionary copy'],
      },
      help: {
        videos: [
          {
            title:
              'Academic and Domain-Specific Words, Context Clues',
            url: 'https://youtu.be/1LZH7iEvqFg?si=S9TpqgEhkLWCZH5E',
          },
        ],
      },
    },

    // Comprehension Strategies (Red)
    {
      key: 'makingInferences',
      title: 'Making Inferences',
      grade: '6-8',
      color: '#D32F2F',
      description:
        'Making Inferences.',
      learn: [
        { heading: 'What Is an Inference?', body: 'An inference is a logical conclusion you draw by combining clues the author gives with what you already know — the author doesn\'t state it directly, but the text plus your background knowledge lead you there.' },
        { heading: 'Text Evidence + Background Knowledge', body: 'A strong inference always has two parts: specific evidence from the text and a piece of your own knowledge or reasoning that connects the dots — "the text says X, and I know Y, so I can infer Z."' },
      ],
      practice: [
        { question: 'An inference is best described as...', options: ['A fact directly stated in the text', 'A conclusion drawn from clues plus background knowledge', 'A random guess with no evidence', 'The title of the passage'], answerIndex: 1, explanation: 'Inferences combine textual evidence with prior knowledge to reach a logical conclusion.' },
        { question: 'If a character "slammed the door and threw her backpack on the floor," you can infer she is probably feeling...', options: ['Relaxed', 'Angry or upset', 'Sleepy', 'Bored'], answerIndex: 1, explanation: 'Slamming a door and throwing a backpack are actions that suggest frustration, even though the text never says "angry."' },
      ],
      apply: {
        prompt: 'Read a short passage or a page of a novel. Write one inference about a character or situation, then explain the specific text evidence and background knowledge that led you there.',
        checklist: ['Wrote a clear inference (not a directly stated fact)', 'Cited specific text evidence', 'Explained the background knowledge used', 'Connected both to the conclusion'],
      },
      help: {
        videos: [
          {
            title: 'Inferences | Making Inferences',
            url: 'https://youtu.be/JdaD2FZQFEY?si=uXXvzgOD7KQs1OBU',
          },
        ],
      },
    },
    {
      key: 'summarizing',
      title: 'Summarizing',
      grade: '3-5',
      color: '#D32F2F',
      description:
        'Summarizing.',
      learn: [
        { heading: 'What Belongs in a Summary', body: 'A summary retells the most important events or ideas of a text in your own words, in a much shorter form — it leaves out small details and never adds your personal opinion.' },
        { heading: 'Somebody-Wanted-But-So-Then', body: 'A handy trick for summarizing a story: Somebody (the character) Wanted (a goal) But (a problem) So (what they did) Then (the result) — this keeps a summary short and focused on the essentials.' },
      ],
      practice: [
        { question: 'A good summary should...', options: ['Include every single detail', 'Retell the main points in your own words, briefly', 'Give your personal opinion of the story', 'Be longer than the original text'], answerIndex: 1, explanation: 'Summaries are brief restatements of the most important ideas, not full retellings or opinions.' },
        { question: 'In the "Somebody-Wanted-But-So" strategy, the "But" stands for...', options: ['The setting', 'The character\'s problem', 'The ending', 'The title'], answerIndex: 1, explanation: '"But" identifies the obstacle or problem that gets in the way of what the character wanted.' },
      ],
      apply: {
        prompt: 'Read a short story. Write a 3-4 sentence summary using the Somebody-Wanted-But-So-Then structure, without copying full sentences from the original text.',
        checklist: ['Identified the somebody (character)', 'Identified what they wanted and the problem (but)', 'Explained what they did and the result (so-then)', 'Wrote it in your own words, 3-4 sentences'],
      },
      help: {
        videos: [
          {
            title: 'Summarizing a Story',
            url: 'https://youtu.be/4jUi0pSQ-bU?si=fcP2L_2o8fG-ky1O',
          },
        ],
      },
    },
    {
      key: 'monitoringSelfQuestioning',
      title: 'Monitoring & Self-Questioning',
      grade: '9-12',
      color: '#D32F2F',
      description:
        'Monitoring & Self-Questioning.',
      learn: [
        { heading: 'What Is Self-Monitoring?', body: 'Self-monitoring means noticing, while you read, whether you are actually understanding the text — catching the moment your mind wanders or a passage stops making sense, instead of reading blindly to the end.' },
        { heading: 'Fix-Up Strategies', body: 'When comprehension breaks down, strong readers pause and use fix-up strategies: re-reading the confusing part, reading on for more context, looking up an unfamiliar word, or asking themselves a clarifying question before continuing.' },
      ],
      practice: [
        { question: 'Self-monitoring while reading means...', options: ['Reading as fast as possible', 'Tracking whether you understand what you are reading', 'Skipping difficult sections', 'Reading only the first and last paragraph'], answerIndex: 1, explanation: 'Self-monitoring is the ongoing awareness of your own comprehension as you read.' },
        { question: 'If you realize you have no idea what the last paragraph said, the best "fix-up" strategy is to...', options: ['Keep reading forward without stopping', 'Close the book', 'Re-read the confusing paragraph', 'Skip to the next chapter'], answerIndex: 2, explanation: 'Re-reading a confusing section is a core fix-up strategy for restoring comprehension.' },
      ],
      apply: {
        prompt: 'Read a challenging article or textbook section. Every paragraph, pause and jot a quick self-check note ("got it" or "confused, re-read"). Where you got confused, apply one fix-up strategy and note what helped.',
        checklist: ['Paused after each paragraph to self-check', 'Marked at least one point of confusion', 'Applied a specific fix-up strategy', 'Noted whether the strategy helped'],
      },
      help: {
        videos: [
          {
            title: 'Self-Monitoring',
            url: 'https://youtu.be/SK6tl16dKo0?si=OMWDt9AFFKt4g1Tp',
          },
        ],
      },
    },
  ];

export default function ReadingScreen() {
  return <ClassTopicScreen title={"Reading"} classKey="Reading" fallbackTopics={topics} />;
}
