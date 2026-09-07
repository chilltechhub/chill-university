// src/screens/classes/languageartClass/speakinglistening.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    // Comprehension & Collaboration (Teal)
    {
      key: 'activeListening',
      title: 'Active Listening',
      grade: 'K-2',
      color: '#009688',
      description:
        'Focusing fully on the speaker, understanding their message, and responding thoughtfully.',
      learn: [
        {
          heading: 'What Is Active Listening?',
          body: 'Active listening means using your ears, eyes, and body to show someone you are paying attention to what they say. You look at the speaker, stay quiet while they talk, and think about their words instead of planning what to say next.',
        },
        {
          heading: "Showing You're Listening",
          body: 'You can show you are listening by nodding your head, keeping your body still, and asking a question about what the person said. Good listeners repeat back the main idea to make sure they understood correctly.',
        },
      ],
      practice: [
        {
          question: 'What should you do with your eyes when someone is talking to you?',
          options: ['Look at the speaker', 'Look at your shoes', 'Look out the window', 'Close them'],
          answerIndex: 0,
          explanation: 'Looking at the speaker shows you are paying attention and helps you catch their words.',
        },
        {
          question: 'Which of these is an active listening behavior?',
          options: ['Interrupting to talk about yourself', 'Nodding and asking a question', 'Playing with a toy', 'Walking away'],
          answerIndex: 1,
          explanation: 'Nodding and asking a question shows you heard and understood the speaker.',
        },
      ],
      apply: {
        prompt: "Play a 'Listen and Repeat' game with a partner: one person tells a short story about their day, and the listener repeats back three details they heard.",
        checklist: [
          'Sit facing your partner and make eye contact',
          "Let your partner finish without interrupting",
          'Repeat back 3 things you remember hearing',
          "Ask your partner one question about their story",
        ],
      },
      help: {
        videos: [
          {
            title: '3 Ways To Be A Better Listener',
            url: 'https://youtu.be/mnUp7WgZ2TU?si=N8seRIklqHtmCjUr',
          },
        ],
      },
    },
    {
      key: 'participatingDiscussions',
      title: 'Participating in Discussions',
      grade: '3-5',
      color: '#009688',
      description:
        'Engaging respectfully with others by sharing ideas, asking questions, and building on peers’ contributions.',
      learn: [
        {
          heading: 'Joining a Group Discussion',
          body: 'Participating in a discussion means sharing your own ideas while also listening to what classmates say. Good discussion partners wait for a turn to speak, stay on topic, and connect their comment to something someone else just said.',
        },
        {
          heading: "Building on Others' Ideas",
          body: "Instead of just stating a new idea, strong discussion participants say things like 'I agree with what you said, and I also think...' This shows you were listening and helps the group build a deeper understanding together.",
        },
      ],
      practice: [
        {
          question: 'What is a good way to add to a discussion after someone else speaks?',
          options: ['Say the exact same thing again', 'Build on their idea by adding something new', 'Ignore what they said and change the subject', 'Talk over them'],
          answerIndex: 1,
          explanation: 'Building on an idea shows you listened and moves the group\'s thinking forward.',
        },
        {
          question: 'Why is it important to wait your turn in a group discussion?',
          options: ['So everyone gets a chance to share ideas', 'Because talking is not allowed', 'So the teacher can leave the room', 'Because it makes the discussion shorter'],
          answerIndex: 0,
          explanation: "Waiting your turn makes sure everyone's ideas are heard and respected.",
        },
      ],
      apply: {
        prompt: 'Hold a 4-person discussion circle about a class book or topic where each person must connect their comment to the previous speaker.',
        checklist: [
          'Everyone shares at least one idea',
          "Each comment starts with 'I agree/disagree because...' or 'Building on that...'",
          'No one interrupts while another person is talking',
          'The group summarizes one thing they learned from each other',
        ],
      },
      help: {
        videos: [
          {
            title: 'All About Social Skill for Kids',
            url: 'https://youtu.be/Myf2CUx9E60?si=dJ1JbVX3HozDDq0B',
          },
        ],
      },
    },
    {
      key: 'askingAnsweringQuestions',
      title: 'Asking & Answering Questions',
      grade: 'K-2',
      color: '#009688',
      description:
        'Formulating clear questions and providing thoughtful answers in conversations or group settings.',
      learn: [
        {
          heading: 'Asking Good Questions',
          body: "A good question starts with a question word like who, what, where, when, why, or how, and it asks for information you don't already know. Asking questions helps you understand a story or lesson better.",
        },
        {
          heading: 'Giving Clear Answers',
          body: "When you answer a question, try to answer in a full sentence and stay on topic. For example, if someone asks 'What is your favorite animal?' a clear answer is 'My favorite animal is a dog' instead of just 'Dog.'",
        },
      ],
      practice: [
        {
          question: 'Which word usually starts a question?',
          options: ['Because', 'What', 'And', 'The'],
          answerIndex: 1,
          explanation: 'Question words like what, who, where, when, why, and how are used to start questions.',
        },
        {
          question: "Which is the clearest answer to 'What did you eat for breakfast?'",
          options: ['Cereal.', 'I ate cereal for breakfast.', 'Yes.', 'Maybe.'],
          answerIndex: 1,
          explanation: 'A full sentence answer clearly tells the listener exactly what was eaten.',
        },
      ],
      apply: {
        prompt: 'Play a question-and-answer interview game where you ask a family member 5 questions about their favorite things and write down their answers in full sentences.',
        checklist: [
          'Write 5 questions using different question words',
          'Ask each question out loud and listen carefully',
          'Write down each answer in a complete sentence',
          'Share one interesting answer with the class',
        ],
      },
      help: {
        videos: [
          {
            title: 'Daily Use Questions and Answers For Kids',
            url: 'https://youtu.be/jW6uB7KmB8s?si=r6C6MDPUOfPzxIvO',
          },
        ],
      },
    },

    // Presentation of Knowledge & Ideas (Amber)
    {
      key: 'oralPresentations',
      title: 'Oral Presentations',
      grade: '6-8',
      color: '#FFC107',
      description:
        'Organizing and delivering information verbally to inform or persuade an audience.',
      learn: [
        {
          heading: 'Structuring a Presentation',
          body: 'An effective oral presentation has a clear introduction that states your topic, a body that presents your main points with evidence or examples, and a conclusion that sums up your message. Organizing your ideas ahead of time keeps your audience following along.',
        },
        {
          heading: 'Delivery Matters',
          body: 'How you say something is as important as what you say. Speaking clearly, making eye contact, using a strong volume, and pacing yourself instead of rushing all help your audience understand and stay engaged with your message.',
        },
      ],
      practice: [
        {
          question: 'What should the introduction of an oral presentation do?',
          options: ['List every source you used', 'Introduce the topic and grab attention', 'Restate the conclusion', 'Ask the audience to leave'],
          answerIndex: 1,
          explanation: "An introduction should clearly state the topic and hook the audience's interest.",
        },
        {
          question: 'Which delivery habit most improves an oral presentation?',
          options: ['Reading silently from note cards', 'Speaking in a monotone voice', 'Making eye contact and speaking clearly', 'Facing away from the audience'],
          answerIndex: 2,
          explanation: 'Eye contact and clear speech help the audience stay engaged and understand the message.',
        },
      ],
      apply: {
        prompt: 'Prepare and deliver a 2-minute oral presentation on a topic you know well, using notecards with only key points (not full sentences).',
        checklist: [
          'Write an intro, 2-3 main points, and a conclusion',
          'Practice out loud at least twice before presenting',
          'Use eye contact and a clear, audible voice',
          'Time yourself to stay close to 2 minutes',
        ],
      },
      help: {
        videos: [],
      },
    },
    {
      key: 'storytellingDramaticReadings',
      title: 'Storytelling & Dramatic Readings',
      grade: '3-5',
      color: '#FFC107',
      description:
        'Using expressive voice and gestures to tell stories or perform excerpts from texts.',
      learn: [
        {
          heading: 'Bringing Stories to Life',
          body: 'Storytelling and dramatic reading use your voice and body to make a story more exciting for listeners. Changing your voice for different characters, pausing at exciting moments, and using facial expressions all help bring a story to life.',
        },
        {
          heading: 'Voice and Gesture Choices',
          body: 'Skilled storytellers change their pace and volume to match the mood of a scene—speaking slowly and quietly for a sad moment, or fast and loud for an exciting chase. Gestures and expressions add extra meaning without needing more words.',
        },
      ],
      practice: [
        {
          question: 'What can a storyteller change to show a character is scared?',
          options: ['The color of the book', 'Their tone of voice and pace', 'The title of the story', 'Nothing, voice never changes'],
          answerIndex: 1,
          explanation: "Changing tone and pace helps show a character's emotion, like fear.",
        },
        {
          question: 'Why do dramatic readers use gestures?',
          options: ['To confuse the audience', 'To add meaning and expression without extra words', 'To end the story early', 'Because it is required by law'],
          answerIndex: 1,
          explanation: 'Gestures add expression and help convey meaning beyond the words alone.',
        },
      ],
      apply: {
        prompt: 'Choose a short passage from a favorite book and perform a 1-minute dramatic reading using different voices for at least two characters.',
        checklist: [
          'Pick a passage with dialogue between two or more characters',
          'Practice a distinct voice for each character',
          'Use pauses and volume changes to build excitement',
          'Perform it for a family member or classmate',
        ],
      },
      help: {
        videos: [],
      },
    },
    {
      key: 'multimediaVisualAids',
      title: 'Use of Multimedia/Visual Aids',
      grade: '9-12',
      color: '#FFC107',
      description:
        'Incorporating images, slides, or audio to enhance understanding during a presentation.',
      learn: [
        {
          heading: 'Choosing the Right Visual Aid',
          body: 'Multimedia and visual aids—slides, charts, images, or audio clips—should support your spoken message, not replace it. Each visual should be simple, readable from a distance, and directly tied to the point you are currently making.',
        },
        {
          heading: 'Avoiding Common Pitfalls',
          body: 'A common mistake is cramming too much text onto a slide or reading directly from it, which disengages the audience. Effective presenters use visuals as a backdrop—brief labels, a compelling image, or a simple graph—while the speaker delivers the explanation.',
        },
      ],
      practice: [
        {
          question: 'What is the main purpose of a visual aid in a presentation?',
          options: ['To replace the need for speaking', 'To support and clarify the spoken message', 'To fill time', 'To distract the audience'],
          answerIndex: 1,
          explanation: 'Visual aids should reinforce and clarify what the speaker is saying, not replace it.',
        },
        {
          question: 'Which slide design mistake most commonly disengages an audience?',
          options: ['Using one clear image per slide', 'Cramming dense paragraphs of text onto a slide', 'Using a large, readable font', 'Including a simple, relevant chart'],
          answerIndex: 1,
          explanation: 'Dense text forces the audience to read instead of listen, disengaging them from the speaker.',
        },
      ],
      apply: {
        prompt: 'Design a 5-slide visual aid deck for a presentation on a topic of your choice, using no more than 8 words of text per slide.',
        checklist: [
          'Each slide supports one main point of your talk',
          'No slide has more than 8 words of text',
          'At least one slide uses an image, chart, or diagram',
          'Present it aloud without reading directly from the slides',
        ],
      },
      help: {
        videos: [],
      },
    },
  ];

export default function SpeakingAndListening() {
  return <ClassTopicScreen title={"Speaking & Listening"} classKey="SpeakingAndListening" fallbackTopics={topics} />;
}
