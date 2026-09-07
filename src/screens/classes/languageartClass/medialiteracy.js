// src/screens/classes/languageartClass/medialiteracy.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    // Analyzing Media Messages (Deep Blue)
    {
      key: 'identifyingPurposeBias',
      title: 'Identifying Purpose & Bias',
      grade: '6-8',
      color: '#1565C0',
      description:
        'Recognizing why a media message was created and detecting any subjective slant or agenda.',
      learn: [
        {
          heading: 'Why Was This Made?',
          body: 'Every media message—an ad, article, or video—was created for a purpose, such as to inform, persuade, entertain, or sell something. Identifying the purpose helps you understand why certain information was included and other information left out.',
        },
        {
          heading: 'Spotting Bias',
          body: "Bias is a slant or leaning toward one side of an issue, often shown through loaded language, one-sided facts, or an unbalanced selection of sources. Recognizing bias doesn't mean a source is useless—it means you should look for other perspectives too.",
        },
      ],
      practice: [
        {
          question: 'What is the purpose of most advertisements?',
          options: ['To provide unbiased news', 'To persuade you to buy something', 'To entertain with no other goal', 'To teach history'],
          answerIndex: 1,
          explanation: 'Advertisements are created primarily to persuade viewers to purchase a product or service.',
        },
        {
          question: 'Which is a sign that a media message might be biased?',
          options: ['It presents multiple perspectives equally', 'It uses loaded, emotional language for one side only', 'It cites its sources clearly', 'It includes statistics from research studies'],
          answerIndex: 1,
          explanation: 'Using emotional or loaded language for only one side is a common sign of bias.',
        },
      ],
      apply: {
        prompt: 'Find two news articles about the same event from different sources and compare their word choices and what facts each one emphasizes or leaves out.',
        checklist: [
          'Choose two articles covering the same event',
          'Identify the likely purpose of each article',
          'List at least 3 examples of loaded or emotional language, if present',
          'Write a sentence describing which facts each source emphasized or omitted',
        ],
      },
      help: {
        videos: [
          {
            title: 'How to Detect Bias in Media',
            url: 'https://youtu.be/6R6-2_8m4Co?si=RTnJSeWV8sB8SaFA',
          },
        ],
      },
    },
    {
      key: 'evaluatingSources',
      title: 'Evaluating Sources',
      grade: '6-8',
      color: '#1565C0',
      description:
        'Assessing credibility, accuracy, and trustworthiness of media outlets and authors.',
      learn: [
        {
          heading: 'Checking Credibility',
          body: "Evaluating a source means checking whether it's trustworthy before believing or sharing it. Ask who wrote it, what their expertise is, when it was published, and whether other reliable sources report the same information.",
        },
        {
          heading: 'Red Flags to Watch For',
          body: 'Warning signs of an unreliable source include no listed author, no publication date, extreme or emotional claims, and a lack of links or citations to evidence. Reliable sources are usually transparent about where their information comes from.',
        },
      ],
      practice: [
        {
          question: 'Which question helps you evaluate whether a source is credible?',
          options: ["Is the website's font size large?", 'Who wrote it and what is their expertise?', 'Is the article long?', 'Does it have colorful pictures?'],
          answerIndex: 1,
          explanation: "Checking the author's identity and expertise is a key step in evaluating credibility.",
        },
        {
          question: 'Which is a red flag that a source might be unreliable?',
          options: ['It cites named research studies', 'It has a clear author and publish date', 'It makes extreme claims with no evidence', 'It is written by a known expert'],
          answerIndex: 2,
          explanation: 'Extreme claims without supporting evidence are a common warning sign of unreliable sources.',
        },
      ],
      apply: {
        prompt: 'Pick a website or article you found online and evaluate its credibility using at least 4 criteria (author, date, evidence, purpose).',
        checklist: [
          'Identify the author and their credentials, if listed',
          'Check the publication or last-updated date',
          'Note whether claims are backed by evidence or sources',
          'Decide and explain whether you would trust this source',
        ],
      },
      help: {
        videos: [
          {
            title: 'Evaluating Media Sources',
            url: 'https://youtu.be/PCGWwXdpOxQ?si=TYTdQaIzcxQtkTin',
          },
        ],
      },
    },

    // Creating Multimedia (Teal)
    {
      key: 'integratingMedia',
      title: 'Integrating Text, Images, Audio & Video',
      grade: '9-12',
      color: '#00897B',
      description:
        'Combining different media elements to produce engaging multimedia content.',
      learn: [
        {
          heading: 'Combining Media Elements',
          body: "Integrating multimedia means purposefully combining text, images, audio, and video so each element adds something the others can't. For example, a chart might show data a paragraph can't easily convey, while narration adds emotional tone that plain text lacks.",
        },
        {
          heading: 'Avoiding Media Overload',
          body: 'Effective multimedia integration is intentional, not just decorative—every image, clip, or graphic should serve the message. Cluttering a project with unrelated media can distract the audience and weaken the overall impact.',
        },
      ],
      practice: [
        {
          question: 'What is the main goal of integrating multiple media types in a project?',
          options: ['To make the project as long as possible', 'To have each element add something unique to the message', 'To use every media type available regardless of fit', 'To avoid using any text at all'],
          answerIndex: 1,
          explanation: 'Good multimedia integration is purposeful—each element should contribute something the others cannot.',
        },
        {
          question: 'What is a risk of adding too much unrelated media to a project?',
          options: ['It always makes the project more persuasive', 'It can distract from the message and weaken impact', 'It automatically improves credibility', 'It has no effect on the audience'],
          answerIndex: 1,
          explanation: 'Unrelated or excessive media can distract the audience and dilute the overall message.',
        },
      ],
      apply: {
        prompt: 'Create a short multimedia project (a slide, webpage mockup, or video storyboard) on a topic of your choice that combines text, at least one image, and either audio or video.',
        checklist: [
          'Include text that explains your main point',
          'Include at least one image or graphic that adds information',
          'Include an audio or video element that adds tone or explanation not covered by the text',
          'Explain in one sentence why you chose each media element',
        ],
      },
      help: {
        videos: [
          {
            title:
              'Introduction to Multimedia Systems: Combining Text, Audio, Images, and Video',
            url: 'https://youtu.be/bEyEN94MW64?si=9NVWki8RZNdu6ap3',
          },
        ],
      },
    },
    {
      key: 'digitalStorytelling',
      title: 'Digital Storytelling',
      grade: '6-8',
      color: '#00897B',
      description:
        'Using digital tools (images, video, audio, text) to craft and share narratives online.',
      learn: [
        {
          heading: 'What Is Digital Storytelling?',
          body: 'Digital storytelling combines traditional narrative elements—character, setting, conflict—with digital tools like images, video, music, and voice narration to share a story in a new format, such as a short video or interactive slideshow.',
        },
        {
          heading: 'Planning Before Creating',
          body: 'Successful digital stories usually start with a storyboard—a plan that maps out each scene, what will be shown, and what will be said or heard before any recording or editing begins. Planning ahead saves time and keeps the story focused.',
        },
      ],
      practice: [
        {
          question: 'What is a storyboard used for in digital storytelling?',
          options: ['To publish the final story online', 'To plan out scenes before creating the digital story', "To edit video after it's filmed", 'To choose background music only'],
          answerIndex: 1,
          explanation: 'A storyboard maps out each scene in advance, helping creators plan before producing their story.',
        },
        {
          question: 'Which combination best describes digital storytelling?',
          options: ['Only spoken narration with no visuals', 'Traditional story elements combined with digital tools like images and audio', 'A story written only on paper', 'A story with no plot or characters'],
          answerIndex: 1,
          explanation: 'Digital storytelling blends narrative elements like character and plot with digital media tools.',
        },
      ],
      apply: {
        prompt: 'Create a storyboard for a 1-minute digital story (personal narrative or fictional) that plans out at least 4 scenes with images, text, and narration ideas.',
        checklist: [
          'Sketch or describe at least 4 scenes in order',
          'Note what image or visual goes with each scene',
          'Write a short line of narration or text for each scene',
          'Share your storyboard plan with a partner for feedback',
        ],
      },
      help: {
        videos: [
          {
            title: 'What is Digital Storytelling',
            url: 'https://youtu.be/JIix-yVzheM?si=nEuOQEdXZSI3yHVT',
          },
        ],
      },
    },
  ];

export default function MediaDigitalLiteracy() {
  return <ClassTopicScreen title={"Media & Digital Literacy"} classKey="MediaDigitalLiteracy" fallbackTopics={topics} />;
}
