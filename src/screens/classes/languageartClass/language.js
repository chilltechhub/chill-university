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
