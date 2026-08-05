// src/features/discover/data.js
export const PROJECT_STATUSES = ['Idea', 'Prototype', 'In Progress', 'Finished'];

export const sampleProjects = [
  {
    id: 'p1',
    title: 'Solar Greenhouse Monitor',
    owner: 'Team Sprout',
    status: 'In Progress',
    summary:
      'Low-cost sensor + dashboard for temperature, humidity, soil moisture. Helps kids learn IoT + data.',
    thumbnail:
      'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=800&auto=format&fit=crop',
    tags: ['IoT', 'React Native', 'Arduino', 'STEM'],
    needs: [
      { id: 'n1', role: 'Mobile Dev (React Native)', commitment: 'Ongoing', skills: ['JS', 'Expo'] },
      { id: 'n2', role: 'Hardware Helper', commitment: 'One-time', skills: ['Arduino', 'Soldering'] },
    ],
    links: [
      { type: 'github', label: 'GitHub Repo', url: 'https://github.com/example/greenhouse' },
      { type: 'figma', label: 'Figma', url: 'https://www.figma.com/file/EXAMPLE' },
      { type: 'video', label: 'Demo on YouTube', url: 'https://youtu.be/dQw4w9WgXcQ' },
    ],
    progress: 62,
    contributors: 6,
  },
  {
    id: 'p2',
    title: 'Math Quest (K‑6)',
    owner: 'KidLearn Lab',
    status: 'Prototype',
    summary:
      'Mini‑games for number sense and fractions. Open to educators and artists for kid‑friendly UI.',
    thumbnail:
      'https://images.unsplash.com/photo-1600195077909-46cf2c8df8e1?q=80&w=800&auto=format&fit=crop',
    tags: ['Education', 'Games', 'UX', 'Math'],
    needs: [
      { id: 'n3', role: 'Illustrator', commitment: 'Part-time', skills: ['Vector', 'Canva or Figma'] },
      { id: 'n4', role: 'Curriculum Reviewer', commitment: 'One-time', skills: ['K-6 Math'] },
    ],
    links: [
      { type: 'codesandbox', label: 'CodeSandbox', url: 'https://codesandbox.io/s/example' },
      { type: 'notion', label: 'Design Doc (Notion)', url: 'https://notion.so/EXAMPLE' },
    ],
    progress: 35,
    contributors: 4,
  },
];