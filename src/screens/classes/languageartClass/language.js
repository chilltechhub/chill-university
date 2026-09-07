// src/screens/classes/languageartClass/language.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    // Conventions of Standard English (Blue)
    {
      key: 'grammarSyntax',
      title: 'Grammar & Syntax',
      grade: '3-5',
      color: '#039BE5',
      description:
        'Understanding the rules for structuring sentences, including parts of speech and sentence construction.',
      learn: [
        {
          heading: 'Parts of a Sentence',
          body: "Grammar and syntax are the rules for how words fit together to make sentences that make sense. Every complete sentence needs a subject (who or what it's about) and a predicate (what the subject does or is).",
        },
        {
          heading: 'Word Order Matters',
          body: "In English, changing the order of words in a sentence can change its meaning. For example, 'The dog chased the cat' means something different from 'The cat chased the dog,' even though both sentences use the exact same words.",
        },
      ],
      practice: [
        {
          question: 'What two parts does a complete sentence need?',
          options: ['A noun and an adjective', 'A subject and a predicate', 'A question and an answer', 'A comma and a period'],
          answerIndex: 1,
          explanation: 'A complete sentence needs a subject and a predicate to express a full thought.',
        },
        {
          question: 'Which sentence is grammatically complete?',
          options: ['Running to the store quickly.', 'The boy ran to the store.', 'Because it was raining outside.', 'Under the big oak tree.'],
          answerIndex: 1,
          explanation: "'The boy ran to the store' has both a subject (the boy) and a predicate (ran to the store).",
        },
      ],
      apply: {
        prompt: 'Write 5 sentences about your weekend, then underline the subject once and the predicate twice in each sentence.',
        checklist: [
          'Write 5 complete sentences',
          'Underline the subject of each sentence once',
          'Underline the predicate of each sentence twice',
          'Check that each sentence expresses a full thought',
        ],
      },
      help: {
        videos: [
          {
            title: 'The Importance of Grammar and Syntax',
            url: 'https://youtu.be/vy7P29_XdR4?si=uPS5U28XXJC_LonS',
          },
        ],
      },
    },
    {
      key: 'punctuationMechanics',
      title: 'Punctuation & Mechanics',
      grade: 'K-2',
      color: '#039BE5',
      description:
        'Using punctuation marks (commas, periods, question marks, etc.) and mechanics (capitalization) correctly in writing.',
      learn: [
        {
          heading: 'End Marks',
          body: 'Every sentence needs an end mark to show the reader it is finished. A period (.) ends a telling sentence, a question mark (?) ends an asking sentence, and an exclamation point (!) ends an excited sentence.',
        },
        {
          heading: 'Capital Letters',
          body: "Capitalization rules tell us when to use a big letter. We capitalize the first word of every sentence, the word 'I,' and names of people and places, so readers know these are important.",
        },
      ],
      practice: [
        {
          question: 'Which punctuation mark ends a question?',
          options: ['Period (.)', 'Question mark (?)', 'Comma (,)', 'Exclamation point (!)'],
          answerIndex: 1,
          explanation: 'A question mark shows the sentence is asking something.',
        },
        {
          question: 'Which word should always be capitalized no matter where it appears in a sentence?',
          options: ['the', 'and', 'I', 'dog'],
          answerIndex: 2,
          explanation: "The word 'I' is always capitalized in English, even in the middle of a sentence.",
        },
      ],
      apply: {
        prompt: 'Write 4 short sentences about your favorite game: one telling, one asking, one excited, and one with your name in it, using correct end marks and capital letters.',
        checklist: [
          'One sentence ends with a period',
          'One sentence ends with a question mark',
          'One sentence ends with an exclamation point',
          'Your name and the first word of each sentence are capitalized',
        ],
      },
      help: {
        videos: [
          {
            title: 'Punctuation Explained',
            url: 'https://youtu.be/LdCOswMeXFQ?si=PNn-2BmPlHwAoKEx',
          },
        ],
      },
    },
    {
      key: 'spelling',
      title: 'Spelling',
      grade: 'K-2',
      color: '#039BE5',
      description:
        'Knowing and applying correct spelling patterns and rules to write words accurately.',
      learn: [
        {
          heading: 'Sound It Out',
          body: "Spelling means putting letters in the right order to write a word correctly. One way to spell a word you don't know is to say it slowly and listen for each sound, then write the letter that matches each sound.",
        },
        {
          heading: 'Word Patterns',
          body: "Many words follow patterns, like words that end in 'ake' (cake, make, lake) or start with 'sh' (ship, shop, shell). Learning these patterns helps you spell new words that sound similar to ones you already know.",
        },
      ],
      practice: [
        {
          question: 'What is a good strategy for spelling an unfamiliar word?',
          options: ['Guess without thinking', 'Say it slowly and listen for each sound', 'Skip the word entirely', 'Write a different word instead'],
          answerIndex: 1,
          explanation: 'Sounding out a word slowly helps you identify each letter sound to spell it.',
        },
        {
          question: "Which word follows the same 'ake' pattern as 'cake'?",
          options: ['dog', 'lake', 'sun', 'cup'],
          answerIndex: 1,
          explanation: "'Lake' ends in the same 'ake' pattern as 'cake.'",
        },
      ],
      apply: {
        prompt: "Make a list of 5 words that all share the same spelling pattern (like 'at,' 'ake,' or 'sh'), and practice writing each one 3 times.",
        checklist: [
          'Choose one spelling pattern to focus on',
          'List 5 words that use that pattern',
          'Write each word 3 times correctly',
          'Ask someone to quiz you on the words',
        ],
      },
      help: {
        videos: [
          {
            title: 'Learn How to Spell | Spelling Basic Words',
            url: 'https://youtu.be/r1uUwrQy_4g?si=YovMaYqhZQvj9_XI',
          },
        ],
      },
    },

    // Knowledge of Language (Teal) – leave help empty
    {
      key: 'registersStyleChoices',
      title: 'Registers & Style Choices',
      grade: '9-12',
      color: '#00897B',
      description:
        'Selecting appropriate tone, word choice, and formality for different audiences and purposes.',
      learn: [
        {
          heading: 'What Is Register?',
          body: 'Register refers to the level of formality a writer or speaker chooses based on audience and purpose—for example, a text message to a friend uses casual language, while a college application essay requires formal, precise language.',
        },
        {
          heading: 'Matching Style to Purpose',
          body: 'Skilled writers adjust word choice, sentence length, and tone to fit the situation. Using slang in a job application or overly formal language in a casual conversation both create a mismatch that can confuse or alienate the audience.',
        },
      ],
      practice: [
        {
          question: 'Which situation calls for a formal register?',
          options: ['Texting a close friend', 'Writing a cover letter for a job', 'Posting a casual comment online', 'Chatting with a sibling'],
          answerIndex: 1,
          explanation: 'A cover letter is a professional document requiring formal language and tone.',
        },
        {
          question: "What does 'register' mean in the context of language?",
          options: ['The pitch of your voice', 'The level of formality used for a given audience and purpose', 'The number of words in a sentence', 'A type of punctuation mark'],
          answerIndex: 1,
          explanation: 'Register describes how formal or informal language is, adjusted for audience and purpose.',
        },
      ],
      apply: {
        prompt: 'Write the same short message (e.g., asking for an extension on an assignment) in two versions: one casual text to a friend, and one formal email to a teacher.',
        checklist: [
          'Write a casual version using informal language and contractions',
          'Write a formal version using complete sentences and polite phrasing',
          'Identify at least 3 specific word or phrase differences between the two',
          'Explain why each version fits its audience',
        ],
      },
      help: {
        videos: [],
      },
    },
    {
      key: 'sentenceVariety',
      title: 'Sentence Variety',
      grade: '6-8',
      color: '#00897B',
      description:
        'Using a mix of simple, compound, and complex sentences to create engaging writing.',
      learn: [
        {
          heading: 'Types of Sentences',
          body: 'Sentence variety means mixing simple sentences (one independent clause), compound sentences (two independent clauses joined by a conjunction), and complex sentences (an independent clause plus a dependent clause) to keep writing interesting.',
        },
        {
          heading: 'Why Variety Matters',
          body: 'Using only short, simple sentences can make writing feel choppy, while relying only on long sentences can confuse readers. Mixing sentence lengths and structures creates rhythm and helps emphasize your most important ideas.',
        },
      ],
      practice: [
        {
          question: 'What is a compound sentence?',
          options: ['A single independent clause', 'Two independent clauses joined by a conjunction', 'A sentence with no verb', 'A question with two parts'],
          answerIndex: 1,
          explanation: "A compound sentence joins two independent clauses, often with a conjunction like 'and' or 'but.'",
        },
        {
          question: 'Why should writers use a mix of sentence types?',
          options: ['To make the essay longer', 'To create rhythm and avoid choppy or confusing writing', 'Because teachers require exactly 3 types', 'To use every punctuation mark at least once'],
          answerIndex: 1,
          explanation: 'Varying sentence types creates rhythm and keeps readers engaged.',
        },
      ],
      apply: {
        prompt: "Take a paragraph you've written that uses only simple sentences and revise it to include at least one compound and one complex sentence.",
        checklist: [
          'Identify all simple sentences in your paragraph',
          'Combine two related simple sentences into a compound sentence',
          'Turn one simple sentence into a complex sentence using a dependent clause',
          'Read the revised paragraph aloud to check its flow',
        ],
      },
      help: {
        videos: [],
      },
    },

    // Vocabulary Acquisition & Use (Green)
    {
      key: 'wordRelationships',
      title: 'Word Relationships (Synonyms & Antonyms)',
      grade: '3-5',
      color: '#43A047',
      description:
        'Understanding how words relate to each other—words with similar meanings (synonyms) and opposite meanings (antonyms).',
      learn: [
        {
          heading: 'Synonyms and Antonyms',
          body: "Synonyms are words that have the same or nearly the same meaning, like 'happy' and 'joyful.' Antonyms are words with opposite meanings, like 'hot' and 'cold.' Knowing both helps you choose more precise words in your writing.",
        },
        {
          heading: 'Why Word Choice Matters',
          body: "Using synonyms lets you avoid repeating the same word too often and can add more specific shades of meaning—for example, 'sprint' is more specific than just 'run.' Understanding antonyms also helps you describe contrasts clearly.",
        },
      ],
      practice: [
        {
          question: "Which word is a synonym for 'happy'?",
          options: ['Sad', 'Joyful', 'Angry', 'Tired'],
          answerIndex: 1,
          explanation: "'Joyful' means nearly the same thing as 'happy,' making it a synonym.",
        },
        {
          question: "Which word is an antonym for 'hot'?",
          options: ['Warm', 'Cold', 'Sunny', 'Bright'],
          answerIndex: 1,
          explanation: "'Cold' means the opposite of 'hot,' making it an antonym.",
        },
      ],
      apply: {
        prompt: "Pick 5 overused words from your own writing (like 'good,' 'said,' 'nice') and create a synonym list of 3 alternatives for each.",
        checklist: [
          'List 5 words you use too often',
          'Find 3 synonyms for each word using a thesaurus',
          'Rewrite one sentence for each word using a stronger synonym',
          'Share your favorite improved sentence with a classmate',
        ],
      },
      help: {
        videos: [
          {
            title: 'Antonyms and Synonyms',
            url: 'https://youtu.be/bBWm3-mxL1U?si=y_XYKoKfLcDdsxyr',
          },
        ],
      },
    },
    {
      key: 'nuancesWordMeaning',
      title: 'Nuances in Word Meaning',
      grade: '9-12',
      color: '#43A047',
      description:
        'Recognizing subtle differences in word meanings to choose the most precise word for the context.',
      learn: [
        {
          heading: 'Denotation vs. Connotation',
          body: "Nuance in word meaning involves understanding both denotation (a word's dictionary definition) and connotation (the feelings or associations a word carries). For example, 'thrifty' and 'stingy' both mean careful with money, but 'thrifty' feels positive while 'stingy' feels negative.",
        },
        {
          heading: 'Precision in Word Choice',
          body: "Skilled writers select the word that most precisely captures their intended meaning and tone, rather than settling for the first synonym that comes to mind. Choosing between 'assertive,' 'aggressive,' and 'confident' can completely change how a reader perceives a character.",
        },
      ],
      practice: [
        {
          question: "What is 'connotation'?",
          options: ["A word's dictionary definition", 'The feeling or association a word carries beyond its literal meaning', 'A type of punctuation', 'The number of syllables in a word'],
          answerIndex: 1,
          explanation: 'Connotation refers to the emotional or cultural associations attached to a word.',
        },
        {
          question: 'Which pair of words best illustrates a nuance in meaning despite similar denotation?',
          options: ['Cat and dog', 'Thrifty and stingy', 'Blue and red', 'Run and jump'],
          answerIndex: 1,
          explanation: "'Thrifty' and 'stingy' both describe careful spending but carry very different connotations.",
        },
      ],
      apply: {
        prompt: "Choose 3 pairs of near-synonyms (e.g., 'confident/arrogant,' 'curious/nosy') and write a sentence with each word showing how the connotation changes the meaning.",
        checklist: [
          'Choose 3 pairs of near-synonym words with different connotations',
          'Write one sentence using each word (6 sentences total)',
          'Explain in one sentence how the connotation changes the tone',
          'Identify whether each word is positive, negative, or neutral',
        ],
      },
      help: {
        videos: [
          {
            title: 'Word relationships and nuances',
            url: 'https://youtu.be/OXL0fXCIkMw?si=JVNdVch6BrI2Saev',
          },
        ],
      },
    },
  ];

export default function Language() {
  return <ClassTopicScreen title={"Language"} classKey="Language" fallbackTopics={topics} />;
}
