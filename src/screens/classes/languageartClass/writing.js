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
