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
