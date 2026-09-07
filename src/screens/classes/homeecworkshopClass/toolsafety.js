// src/screens/classes/homeecworkshopClass/toolsafety.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    {
      key: 'ppe',
      title: 'Personal Protective Equipment (PPE)',
      grade: '3-5',
      color: '#607D8B', // Blue Grey
      description:
        'Using gloves, goggles, ear protection, and appropriate clothing to stay safe while working with tools.',
      learn: [
        { heading: 'PPE Matches the Hazard', body: 'Different tools create different dangers, so PPE is chosen to match: safety goggles protect eyes from flying wood chips or metal shavings, gloves protect hands from sharp edges or splinters, and ear protection guards against hearing damage from loud power tools. Wearing the wrong or no PPE for a task is one of the most common causes of workshop injuries.' },
        { heading: 'Clothing Matters Too', body: 'Loose sleeves, dangling jewelry, or untied long hair can get caught in moving tools like drills or saws, so proper workshop clothing means snug sleeves, no dangling accessories, and hair tied back. Closed-toe shoes protect feet from dropped tools or materials.' },
      ],
      practice: [
        { question: 'Which piece of PPE protects your eyes from flying wood chips or metal shavings?', options: ['Ear protection', 'Safety goggles', 'Gloves', 'Closed-toe shoes'], answerIndex: 1, explanation: 'Safety goggles create a barrier that protects the eyes from flying debris produced by many shop tools.' },
        { question: 'Why should loose sleeves or dangling jewelry be avoided in a workshop?', options: ['They look unprofessional', 'They can get caught in moving tool parts', 'They make tools slower', 'They have no safety impact'], answerIndex: 1, explanation: 'Loose clothing or jewelry can be pulled into spinning or moving tool parts, causing serious injury.' },
      ],
      apply: {
        prompt: 'Before your next workshop or craft activity, put together the correct PPE (like goggles and gloves) for the task and have an adult check that your clothing and hair are secured safely.',
        checklist: ['Identified PPE needed for the task', 'Put on goggles or gloves as needed', 'Secured loose hair or sleeves', 'Had an adult check your setup'],
      },
      help: {
        readings: [
          {
            title: 'Personal Protective Equipment',
            url: 'https://www.osha.gov/personal-protective-equipment',
          },
        ],
        videos: [],
      },
    },
    {
      key: 'maintenanceOrganization',
      title: 'Tool Maintenance & Organization',
      grade: '6-8',
      color: '#FF9800', // Orange
      description:
        'Regular cleaning, sharpening, and proper storage of tools, plus techniques for organizing your workspace.',
      learn: [
        { heading: 'Clean and Sharp Tools Are Safer Tools', body: 'A dull blade or bit actually requires more force to use, which increases the chance of slipping and causing injury — regularly sharpening cutting tools keeps them working safely and efficiently. Wiping tools clean after each use, especially removing sawdust or moisture, prevents rust and keeps them working longer.' },
        { heading: 'Organization Saves Time and Prevents Accidents', body: 'Storing tools in a designated spot — like a pegboard, labeled drawer, or toolbox — means you always know where to find them and can quickly spot if one is missing. A cluttered workspace with tools scattered on the floor is a tripping hazard and makes it easy to accidentally step on or grab something sharp.' },
      ],
      practice: [
        { question: 'Why is a dull cutting tool actually more dangerous than a sharp one?', options: ['Dull tools never need force', 'It requires more force to use, increasing the chance of it slipping', 'Dull tools are always locked away', 'There is no safety difference'], answerIndex: 1, explanation: 'A dull tool needs more force to cut, which raises the risk of it slipping and causing an injury.' },
        { question: 'What is one benefit of storing tools in a labeled, designated spot?', options: ['It makes tools rust faster', 'You always know where to find them and can spot if one is missing', 'It has no real benefit', 'It hides tools from being used at all'], answerIndex: 1, explanation: 'Designated storage keeps a workspace organized, saves time searching, and helps you notice a missing tool right away.' },
      ],
      apply: {
        prompt: 'With an adult, clean and inspect one hand tool at home (like a hammer or screwdriver), checking for rust or damage, then find or create a proper storage spot for it.',
        checklist: ['Cleaned the tool', 'Checked for rust or damage', 'Reported any damage to an adult', 'Stored the tool in a designated spot'],
      },
      help: {
        readings: [],
        videos: [
          {
            title:
              'Workshop Maintenance: Hand Tools and Machine Care',
            url: 'https://youtu.be/kSmkQfw19CQ?si=aj60e19KrdVf9yjK',
          },
          {
            title: '11 Simple Ways to Organize Any Workshop',
            url: 'https://youtu.be/sSaKwxtrNmk?si=Z9h5X56eL6ktscgW',
          },
        ],
      },
    },
    {
      key: 'ergonomicsCleanup',
      title: 'Workshop Ergonomics & Clean‑up',
      grade: '9-12',
      color: '#8E24AA', // Purple
      description:
        'Setting up tools and workstations for proper posture, efficient workflow, and routine cleaning for safety and productivity.',
      learn: [
        { heading: 'Ergonomics Reduces Strain', body: 'Good workshop ergonomics means setting workbench height so you don\'t have to hunch over, positioning frequently used tools within easy reach, and taking breaks during repetitive tasks to avoid muscle strain. Standing with a stable, balanced stance while using tools also reduces fatigue and improves control.' },
        { heading: 'Clean-Up Is Part of the Job', body: 'A tidy workspace isn\'t just about appearance — sawdust, scraps, and spilled liquids on the floor create slip and fire hazards, so cleaning as you go (not just at the end) keeps a shop safer throughout the whole project. Returning tools to their storage spot immediately after use prevents them from becoming tripping hazards or getting lost.' },
      ],
      practice: [
        { question: 'Why should a workbench be set to an appropriate height?', options: ['It has no effect on the body', 'To prevent hunching over and reduce strain on the back', 'To make tools harder to reach', 'Only for decoration'], answerIndex: 1, explanation: 'A properly set workbench height helps maintain good posture and reduces physical strain during long tasks.' },
        { question: 'Why is cleaning up sawdust and scraps during a project important, not just at the end?', options: ['It slows down the work for no reason', 'It reduces slip and fire hazards throughout the project', 'Sawdust is not a hazard', 'Clean-up should only happen once a year'], answerIndex: 1, explanation: 'Ongoing clean-up keeps the workspace safe throughout the project instead of letting hazards build up.' },
      ],
      apply: {
        prompt: 'Set up a small workstation for a task (like a desk or table) at a height where your elbows are roughly level with the work surface, and practice cleaning up scraps immediately after finishing.',
        checklist: ['Adjusted or checked workstation height', 'Positioned tools within easy reach', 'Completed a short task', 'Cleaned up immediately afterward'],
      },
      help: {
        readings: [],
        videos: [
          {
            title: 'Shop Ergonomics',
            url: 'https://youtu.be/8a6515TaZ3s?si=YjtKYSNDfuBtv5pp',
          },
          {
            title:
              '11 Ways to Keep Your Workshop Neat and Tidy',
            url: 'https://www.familyhandyman.com/list/tips-for-a-tidy-workshop/?srsltid=AfmBOorVUDyzl8JWBGe3kFjD2oTj-MWxjk8ZKuVFdsr-kbHBJT1t_yC6',
          },
        ],
      },
    },
  ];

export default function ToolSafetyAndShopPracticesScreen() {
  return <ClassTopicScreen title={"Tool Safety & Shop Practices"} classKey="ToolSafetyAndShopPractices" fallbackTopics={topics} />;
}
