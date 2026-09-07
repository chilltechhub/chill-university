// src/screens/library/careerexplore.js
// Career Expeditions — not just a list of job titles and salaries anymore.
// Each career explains what the work actually is, how people typically get
// there, what tools they use day to day, a roadmap.sh-style staged learning
// path, and where to actually pursue it (schools, companies, states). Spans
// tech and non-tech fields so this isn't just a software-jobs screen.
// Cross-links to the rest of the app instead of dead-ending: "Start a
// build" pushes a matching category into The Workshop, and every screen
// points at Resources & Instruments for deeper self-directed study.
//
// Schools/companies/locations below are widely-known reputational
// associations (well-regarded programs, major employers, hiring hotspots),
// not a ranked or exhaustive list — a starting point for research, not the
// final word.
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, Linking, Modal, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useUIPrefs } from '../../../context/UIPrefsContext';
import { supabase } from '../../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline, offlineWrite } from '../../api/offlineCache';

const { width } = Dimensions.get('window');

// Targeted careers persist as tagged rows in `area_notes` (free-form area_id;
// 'professional' is already used by this table elsewhere). Without this,
// "Target This Career" — the one commitment this screen asks for, and the
// natural thing to come back to — was thrown away on unmount, and the list
// started every session with two careers pre-bookmarked that the user never
// chose.
const CAREER_AREA_ID = 'professional';
const CAREER_TAG     = 'CareerExplorer';

const FIELD_COLOR_KEY = {
  Technology: 'digital', Design: 'creative', Engineering: 'professional',
  Healthcare: 'physical', Finance: 'financial', Business: 'social', Writing: 'mental',
  Entertainment: 'creative', Science: 'physical', Education: 'mental', HR: 'social',
};

const DEMAND_RANK = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

const SORT_OPTIONS = [
  { key: 'default', label: 'Featured' },
  { key: 'salaryDesc', label: 'Salary: High → Low' },
  { key: 'salaryAsc', label: 'Salary: Low → High' },
  { key: 'demand', label: 'Highest Demand' },
  { key: 'skills', label: 'Fewest Skills' },
];

// Interest-first discovery, Road Trip Nation-style: instead of starting
// from a job title, start from what you're drawn to and see the (often
// surprising) spread of careers that connect to it. Each career below
// carries 2-3 of these tags — on purpose overlapping, since the whole
// point is that one interest fans out into many different paths, not a
// single "correct" job.
const INTERESTS = [
  { id: 'build', label: 'Build & Make', emoji: '🛠️', icon: 'hammer-outline' },
  { id: 'code', label: 'Code & Systems', emoji: '💻', icon: 'code-slash-outline' },
  { id: 'create', label: 'Create & Design', emoji: '🎨', icon: 'color-palette-outline' },
  { id: 'discover', label: 'Discover & Research', emoji: '🔬', icon: 'search-outline' },
  { id: 'care', label: 'Help & Care', emoji: '🩺', icon: 'heart-outline' },
  { id: 'lead', label: 'Lead & Strategize', emoji: '📈', icon: 'trending-up-outline' },
  { id: 'teach', label: 'Teach & Communicate', emoji: '🗣️', icon: 'chatbubbles-outline' },
  { id: 'perform', label: 'Perform & Entertain', emoji: '🎬', icon: 'film-outline' },
];

// `salaryMax` is the numeric top of the `salary` range, used for sorting.
// `buildType` matches a BUILD_TYPES entry in projects.js exactly — tapping
// "Start a build" in the modal below pre-selects it in The Workshop's new
// build sheet. `roadmapUrl` only points at roadmap.sh pages that actually
// exist for that role; roles without a real match just skip the link
// rather than pointing somewhere that 404s.
const CAREERS = [
  {
    id: '1', title: 'AI / ML Systems Architect', field: 'Technology', icon: 'hardware-chip-outline',
    salary: '$120k - $250k', salaryMax: 250, demand: 'Very High', trajectory: '+32% Growth',
    overview: 'Designs and builds the systems that let software learn from data — training models, deploying them at scale, and keeping them accurate and fast once they’re live.',
    dayToDay: [
      'Clean and prepare large datasets',
      'Train and evaluate machine learning models',
      'Deploy models into production pipelines',
      'Monitor performance and retrain as data changes',
    ],
    education: [
      'Bachelor’s or Master’s in CS, Math, or Data Science',
      'Self-taught path: strong math foundation + an ML course + a portfolio of trained models',
      'Kaggle competitions and open-source contributions count as real experience',
    ],
    skills: ['Python', 'Neural Networks', 'Math', 'Data Pipelines'],
    tools: ['PyTorch', 'TensorFlow', 'Jupyter', 'Docker', 'AWS SageMaker'],
    roadmap: [
      { stage: 'Foundations', items: ['Python programming', 'Linear algebra & statistics', 'Data structures & algorithms'] },
      { stage: 'Core Skills', items: ['Machine learning fundamentals', 'Neural networks & deep learning', 'SQL & data pipelines'] },
      { stage: 'Specialize', items: ['Model deployment (MLOps)', 'Cloud platforms (AWS/GCP)', 'Large-scale distributed training'] },
      { stage: 'Break In', items: ['Build 3-4 end-to-end ML projects', 'Contribute to an open-source ML library', 'Apply to junior ML engineer roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/ai-engineer',
    topSchools: ['MIT', 'Stanford University', 'Carnegie Mellon University', 'UC Berkeley'],
    topCompanies: ['Google DeepMind', 'OpenAI', 'Microsoft', 'NVIDIA'],
    topLocations: ['California', 'Washington', 'New York', 'Massachusetts'],
    interests: ['code','discover'],
  },
  {
    id: '2', title: 'UX / Spatial Designer', field: 'Design', icon: 'color-palette-outline',
    salary: '$75k - $145k', salaryMax: 145, demand: 'High', trajectory: '+15% Growth',
    overview: 'Shapes how people navigate digital products and immersive environments — turning research about real user needs into interfaces that feel obvious to use.',
    dayToDay: [
      'Interview users and analyze how they behave',
      'Sketch wireframes and build interactive prototypes',
      'Run usability tests and iterate on feedback',
      'Collaborate with engineers to ship the final design',
    ],
    education: [
      'Bachelor’s in Design, HCI, or Psychology (helpful, not required)',
      'Self-taught path: design courses + a strong case-study portfolio',
      'UX bootcamps with a capstone project',
    ],
    skills: ['Figma', 'User Research', 'Spatial UI', 'Prototyping'],
    tools: ['Figma', 'Adobe XD', 'Miro', 'Maze', 'Blender (spatial/AR work)'],
    roadmap: [
      { stage: 'Foundations', items: ['Design principles & color theory', 'User research basics', 'Wireframing & sketching'] },
      { stage: 'Core Skills', items: ['Prototyping in Figma', 'Usability testing', 'Information architecture'] },
      { stage: 'Specialize', items: ['Spatial / AR-VR interface design', 'Design systems', 'Motion & interaction design'] },
      { stage: 'Break In', items: ['Build a portfolio of 3-5 case studies', 'Redesign a real app and document your process', 'Apply to junior product design roles'] },
    ],
    buildType: '🎨 Art',
    roadmapUrl: 'https://roadmap.sh/ux-design',
    topSchools: ['Rhode Island School of Design (RISD)', 'Parsons School of Design', 'Carnegie Mellon (HCI)', 'Art Center College of Design'],
    topCompanies: ['Apple', 'Google', 'Airbnb', 'IDEO'],
    topLocations: ['California', 'New York', 'Washington'],
    interests: ['create','code'],
  },
  {
    id: '3', title: 'Quantum Data Engineer', field: 'Technology', icon: 'analytics-outline',
    salary: '$95k - $180k', salaryMax: 180, demand: 'Very High', trajectory: '+28% Growth',
    overview: 'Builds the pipelines and infrastructure that move and process massive datasets — increasingly for next-generation computing systems, including early quantum applications.',
    dayToDay: [
      'Design databases and data pipelines',
      'Write queries and scripts to clean and transform data',
      'Optimize systems for speed and scale',
      'Work with data scientists to make data usable',
    ],
    education: [
      'Bachelor’s in CS, Data Engineering, or Math',
      'Self-taught path: SQL + Python + a cloud certification (AWS/GCP)',
      'A physics or applied math background helps for the "quantum" specialty',
    ],
    skills: ['SQL', 'Linear Algebra', 'Python', 'Cloud Infra'],
    tools: ['SQL', 'Apache Spark', 'AWS', 'Python', 'Airflow'],
    roadmap: [
      { stage: 'Foundations', items: ['SQL & relational databases', 'Python scripting', 'Linear algebra'] },
      { stage: 'Core Skills', items: ['Data pipeline design (ETL)', 'Cloud data warehouses', 'Distributed computing basics'] },
      { stage: 'Specialize', items: ['Big data tools (Spark, Airflow)', 'Intro to quantum computing concepts', 'Performance tuning at scale'] },
      { stage: 'Break In', items: ['Build a pipeline that processes a real public dataset', 'Get a cloud data certification', 'Apply to junior data engineer roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/data-analyst',
    topSchools: ['MIT', 'Caltech', 'UC Berkeley', 'University of Waterloo'],
    topCompanies: ['IBM Quantum', 'Google Quantum AI', 'Amazon Web Services', 'Microsoft'],
    topLocations: ['California', 'New York', 'Washington', 'Massachusetts'],
    interests: ['code','discover'],
  },
  {
    id: '4', title: 'Robotics Kinematics Lead', field: 'Engineering', icon: 'cog-outline',
    salary: '$90k - $165k', salaryMax: 165, demand: 'Very High', trajectory: '+22% Growth',
    overview: 'Designs how robots move — calculating the physics and control systems that let a robotic arm, leg, or drone execute precise motion.',
    dayToDay: [
      'Model the physics of robotic movement',
      'Write control software in C++',
      'Design and test mechanical assemblies in CAD',
      'Run physical experiments and refine designs',
    ],
    education: [
      'Bachelor’s or Master’s in Mechanical or Robotics Engineering',
      'Strong physics + programming self-study path with hands-on robotics kits',
      'Hobbyist robotics competitions (FRC/FTC) count as real credibility',
    ],
    skills: ['Physics', 'C++', 'CAD', 'Control Systems'],
    tools: ['MATLAB', 'SolidWorks (CAD)', 'C++', 'ROS (Robot Operating System)'],
    roadmap: [
      { stage: 'Foundations', items: ['Physics (mechanics)', 'Calculus & linear algebra', 'Intro to programming (C++)'] },
      { stage: 'Core Skills', items: ['Kinematics & dynamics', 'CAD design', 'Control systems theory'] },
      { stage: 'Specialize', items: ['Robot Operating System (ROS)', 'Sensor integration', 'Motion planning algorithms'] },
      { stage: 'Break In', items: ['Build or join a robotics team project', 'Document a working robot build', 'Apply to robotics/mechatronics internships'] },
    ],
    buildType: '🏗️ DIY',
    roadmapUrl: null,
    topSchools: ['MIT', 'Carnegie Mellon University', 'Georgia Tech', 'Caltech'],
    topCompanies: ['Boston Dynamics', 'Tesla', 'NASA JPL', 'iRobot'],
    topLocations: ['Massachusetts', 'California', 'Pennsylvania', 'Michigan'],
    interests: ['build','code'],
  },
  {
    id: '5', title: 'Biomedical Researcher', field: 'Healthcare', icon: 'medical-outline',
    salary: '$70k - $135k', salaryMax: 135, demand: 'High', trajectory: '+12% Growth',
    overview: 'Investigates how diseases work and tests new treatments — running lab experiments and analyzing data to push medical science forward.',
    dayToDay: [
      'Design and run laboratory experiments',
      'Analyze genetic and clinical data',
      'Write up findings for publication',
      'Collaborate with clinicians and other researchers',
    ],
    education: [
      'Bachelor’s in Biology, Chemistry, or Biomedical Science, often followed by a Master’s or PhD',
      'Lab internships and undergraduate research experience are essential',
      'Some roles (clinical research) are reachable with a Bachelor’s + certification',
    ],
    skills: ['Genomics', 'Lab Analysis', 'Chemistry', 'Statistics'],
    tools: ['Lab equipment (PCR, microscopy)', 'R or Python for analysis', 'GraphPad Prism', 'NCBI genomic databases'],
    roadmap: [
      { stage: 'Foundations', items: ['Biology & chemistry fundamentals', 'Statistics', 'Lab safety & technique basics'] },
      { stage: 'Core Skills', items: ['Genomics & molecular biology', 'Data analysis (R/Python)', 'Scientific writing'] },
      { stage: 'Specialize', items: ['A specific disease area or lab technique', 'Clinical trial design', 'Grant writing'] },
      { stage: 'Break In', items: ['Get hands-on lab experience (internship or volunteer)', 'Co-author or assist on a research paper', 'Apply to research assistant roles'] },
    ],
    buildType: '🔬 Science',
    roadmapUrl: null,
    topSchools: ['Johns Hopkins University', 'Harvard University', 'Stanford University', 'UCSF'],
    topCompanies: ['Pfizer', 'Moderna', 'NIH', 'Mayo Clinic'],
    topLocations: ['Massachusetts', 'Maryland', 'California', 'North Carolina'],
    interests: ['discover','care'],
  },
  {
    id: '6', title: 'FinTech Strategist', field: 'Finance', icon: 'stats-chart-outline',
    salary: '$85k - $175k', salaryMax: 175, demand: 'Medium', trajectory: '+8% Growth',
    overview: 'Bridges finance and technology — analyzing markets and building the strategy behind digital financial products like payment apps, trading platforms, and blockchain services.',
    dayToDay: [
      'Analyze financial markets and trends',
      'Model the financial impact of new product ideas',
      'Work with engineers to shape financial products',
      'Present strategy and findings to stakeholders',
    ],
    education: [
      'Bachelor’s in Finance, Economics, or Business',
      'Self-taught path: financial modeling courses + a portfolio of market analyses',
      'An MBA helps for senior strategy roles, but isn’t required to start',
    ],
    skills: ['Financial Modeling', 'Blockchain', 'Analytics'],
    tools: ['Excel / Google Sheets', 'Bloomberg Terminal', 'Python for analytics', 'Blockchain explorers'],
    roadmap: [
      { stage: 'Foundations', items: ['Financial accounting basics', 'Economics fundamentals', 'Excel & financial modeling'] },
      { stage: 'Core Skills', items: ['Investment analysis', 'Financial statement analysis', 'Intro to blockchain & crypto'] },
      { stage: 'Specialize', items: ['Algorithmic trading concepts', 'Regulatory & compliance basics', 'Data analytics for finance'] },
      { stage: 'Break In', items: ['Build a portfolio of market analyses or trading simulations', 'Get a foundational cert (e.g. CFA Level 1)', 'Apply to analyst roles at a fintech company'] },
    ],
    buildType: '📊 Finance',
    roadmapUrl: null,
    topSchools: ['University of Pennsylvania (Wharton)', 'NYU Stern', 'Columbia Business School', 'MIT Sloan'],
    topCompanies: ['Stripe', 'PayPal', 'Goldman Sachs', 'JPMorgan Chase'],
    topLocations: ['New York', 'California', 'Illinois'],
    interests: ['lead','code'],
  },
  {
    id: '7', title: 'Frontend Developer', field: 'Technology', icon: 'code-slash-outline',
    salary: '$70k - $140k', salaryMax: 140, demand: 'Very High', trajectory: '+18% Growth',
    overview: 'Builds the part of a website or app that people actually see and interact with — turning designs into responsive, working interfaces in the browser.',
    dayToDay: [
      'Turn design mockups into working UI code',
      'Make interfaces work smoothly on any screen size',
      'Fix bugs reported by users or QA',
      'Collaborate with designers and backend developers',
    ],
    education: [
      'Bachelor’s in CS or a related field (common but not required)',
      'Self-taught path: free courses (freeCodeCamp, The Odin Project) + a portfolio site',
      'Bootcamp graduates are widely hired with a strong project portfolio',
    ],
    skills: ['HTML/CSS', 'JavaScript', 'Responsive Design', 'Git'],
    tools: ['React', 'VS Code', 'Chrome DevTools', 'Figma (for handoff)'],
    roadmap: [
      { stage: 'Foundations', items: ['HTML & CSS', 'JavaScript basics', 'Git & version control'] },
      { stage: 'Core Skills', items: ['A frontend framework (React/Vue)', 'Responsive & accessible design', 'Browser dev tools & debugging'] },
      { stage: 'Specialize', items: ['State management', 'Testing (Jest, React Testing Library)', 'Performance optimization'] },
      { stage: 'Break In', items: ['Build 3-5 real projects and deploy them', 'Contribute to an open-source frontend project', 'Apply to junior frontend roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/frontend',
    topSchools: ['UC Berkeley', 'University of Washington', 'Georgia Tech', 'General Assembly (bootcamp)'],
    topCompanies: ['Google', 'Meta', 'Airbnb', 'Shopify'],
    topLocations: ['California', 'Washington', 'New York', 'Texas'],
    interests: ['code','create'],
  },
  {
    id: '8', title: 'Backend Developer', field: 'Technology', icon: 'server-outline',
    salary: '$75k - $150k', salaryMax: 150, demand: 'Very High', trajectory: '+19% Growth',
    overview: 'Builds the server, database, and logic behind an app — the parts users never see directly but that make everything actually work.',
    dayToDay: [
      'Design APIs that the frontend calls',
      'Model and query databases',
      'Handle authentication, security, and data validation',
      'Optimize server performance under load',
    ],
    education: [
      'Bachelor’s in CS or Software Engineering',
      'Self-taught path: learn a language deeply (Node/Python/Java) + build real APIs',
      'Bootcamps that include a backend-heavy capstone project',
    ],
    skills: ['APIs', 'Databases', 'Server Logic', 'Authentication'],
    tools: ['Node.js / Python', 'PostgreSQL', 'Postman', 'Docker'],
    roadmap: [
      { stage: 'Foundations', items: ['A backend language (Node, Python, or Java)', 'SQL & database basics', 'HTTP & how the web works'] },
      { stage: 'Core Skills', items: ['REST API design', 'Authentication & security basics', 'Working with a relational database'] },
      { stage: 'Specialize', items: ['Caching & performance', 'Message queues', 'Containers (Docker)'] },
      { stage: 'Break In', items: ['Build an API-backed app end to end', 'Deploy it on a real server or cloud host', 'Apply to junior backend roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/backend',
    topSchools: ['Carnegie Mellon University', 'University of Illinois Urbana-Champaign', 'Georgia Tech', 'University of Washington'],
    topCompanies: ['Amazon', 'Microsoft', 'Google', 'Stripe'],
    topLocations: ['Washington', 'California', 'New York', 'Texas'],
    interests: ['code','build'],
  },
  {
    id: '9', title: 'Full Stack Developer', field: 'Technology', icon: 'layers-outline',
    salary: '$80k - $155k', salaryMax: 155, demand: 'Very High', trajectory: '+20% Growth',
    overview: 'Works across the entire app — comfortable building both the interface users see and the server and database behind it.',
    dayToDay: [
      'Build features end-to-end, frontend to backend',
      'Design both the UI and the API it talks to',
      'Debug issues anywhere in the stack',
      'Ship complete features independently',
    ],
    education: [
      'Bachelor’s in CS (common path)',
      'Self-taught: master frontend first, then backend, then connect them in real projects',
      'Full-stack bootcamps that cover both sides',
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'Databases'],
    tools: ['React', 'Node.js', 'PostgreSQL/MongoDB', 'Git'],
    roadmap: [
      { stage: 'Foundations', items: ['HTML/CSS/JavaScript', 'Git & version control', 'Basic command line'] },
      { stage: 'Core Skills', items: ['A frontend framework', 'A backend framework', 'Databases (SQL or NoSQL)'] },
      { stage: 'Specialize', items: ['Authentication end-to-end', 'Deployment & hosting', 'API design'] },
      { stage: 'Break In', items: ['Build and deploy 2-3 full-stack apps solo', 'Keep a public GitHub with real commits', 'Apply to full-stack or junior developer roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/full-stack',
    topSchools: ['UC Berkeley', 'University of Michigan', 'Georgia Tech', 'App Academy (bootcamp)'],
    topCompanies: ['Meta', 'Amazon', 'Shopify', 'Airbnb'],
    topLocations: ['California', 'New York', 'Texas', 'Washington'],
    interests: ['code','build'],
  },
  {
    id: '10', title: 'DevOps Engineer', field: 'Technology', icon: 'infinite-outline',
    salary: '$85k - $165k', salaryMax: 165, demand: 'Very High', trajectory: '+21% Growth',
    overview: 'Keeps software running smoothly in production — automating how code gets built, tested, deployed, and monitored so releases are fast and reliable.',
    dayToDay: [
      'Automate deployment pipelines',
      'Monitor servers and respond to outages',
      'Manage cloud infrastructure',
      'Improve how fast and safely the team can ship code',
    ],
    education: [
      'Bachelor’s in CS or IT (common but not required)',
      'Self-taught path: learn Linux + a cloud provider + scripting deeply',
      'Many DevOps engineers start as developers or sysadmins first',
    ],
    skills: ['Linux', 'CI/CD', 'Cloud Infra', 'Scripting'],
    tools: ['Docker', 'Kubernetes', 'AWS', 'GitHub Actions/Jenkins'],
    roadmap: [
      { stage: 'Foundations', items: ['Linux fundamentals', 'Networking basics', 'A scripting language (Bash/Python)'] },
      { stage: 'Core Skills', items: ['CI/CD pipelines', 'Containers (Docker)', 'Cloud basics (AWS/GCP/Azure)'] },
      { stage: 'Specialize', items: ['Kubernetes & orchestration', 'Infrastructure as code (Terraform)', 'Monitoring & observability'] },
      { stage: 'Break In', items: ['Set up a full CI/CD pipeline for a real project', 'Get a foundational cloud certification', 'Apply to junior DevOps/platform roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/devops',
    topSchools: ['Georgia Tech', 'University of Washington', 'Carnegie Mellon University'],
    topCompanies: ['Amazon Web Services', 'Google Cloud', 'HashiCorp', 'Microsoft'],
    topLocations: ['Washington', 'California', 'Virginia', 'Texas'],
    interests: ['code','build'],
  },
  {
    id: '11', title: 'Android Developer', field: 'Technology', icon: 'phone-portrait-outline',
    salary: '$75k - $145k', salaryMax: 145, demand: 'High', trajectory: '+14% Growth',
    overview: 'Builds mobile apps for Android phones and tablets — from the interface to the logic that runs on the device.',
    dayToDay: [
      'Build and test app screens and features',
      'Work with device APIs (camera, location, notifications)',
      'Optimize app performance and battery use',
      'Publish and update apps on the Play Store',
    ],
    education: [
      'Bachelor’s in CS (helpful, not required)',
      'Self-taught path: Kotlin + Android Studio + published portfolio apps',
      'Google’s official Android developer courses',
    ],
    skills: ['Kotlin', 'Android SDK', 'UI Design', 'App Lifecycle'],
    tools: ['Android Studio', 'Kotlin', 'Jetpack Compose', 'Firebase'],
    roadmap: [
      { stage: 'Foundations', items: ['Kotlin (or Java) programming', 'Android app architecture basics', 'Android Studio fundamentals'] },
      { stage: 'Core Skills', items: ['Jetpack Compose UI', 'Local storage & networking', 'App lifecycle management'] },
      { stage: 'Specialize', items: ['Performance & battery optimization', 'Play Store publishing', 'Testing on real devices'] },
      { stage: 'Break In', items: ['Publish 2-3 apps to the Play Store', 'Build a portfolio with screenshots and demos', 'Apply to junior Android developer roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/android',
    topSchools: ['UC Berkeley', 'Carnegie Mellon University', 'University of Washington'],
    topCompanies: ['Google', 'Samsung', 'Amazon', 'Spotify'],
    topLocations: ['California', 'Washington', 'New York'],
    interests: ['code','create'],
  },
  {
    id: '12', title: 'iOS Developer', field: 'Technology', icon: 'logo-apple',
    salary: '$78k - $150k', salaryMax: 150, demand: 'High', trajectory: '+14% Growth',
    overview: 'Builds mobile apps for iPhones and iPads — designing smooth, native experiences using Apple’s tools and design guidelines.',
    dayToDay: [
      'Build app screens with Swift and SwiftUI',
      'Integrate device features like camera and push notifications',
      'Test across different iPhone/iPad models',
      'Submit and update apps through the App Store',
    ],
    education: [
      'Bachelor’s in CS (helpful, not required)',
      'Self-taught path: Swift + Apple’s free tutorials + shipped App Store apps',
      'Apple Developer Academy programs',
    ],
    skills: ['Swift', 'SwiftUI', 'UI Design', 'Xcode'],
    tools: ['Xcode', 'Swift', 'SwiftUI', 'TestFlight'],
    roadmap: [
      { stage: 'Foundations', items: ['Swift programming', 'Xcode fundamentals', 'Apple Human Interface Guidelines'] },
      { stage: 'Core Skills', items: ['SwiftUI', 'Networking & local storage', 'App lifecycle & state management'] },
      { stage: 'Specialize', items: ['Performance profiling', 'App Store submission process', 'Push notifications & background tasks'] },
      { stage: 'Break In', items: ['Ship 2-3 apps to the App Store', 'Use TestFlight to get real user feedback', 'Apply to junior iOS developer roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/ios',
    topSchools: ['Stanford University', 'UC Berkeley', 'Carnegie Mellon University'],
    topCompanies: ['Apple', 'Meta', 'Airbnb', 'Uber'],
    topLocations: ['California', 'New York', 'Washington'],
    interests: ['code','create'],
  },
  {
    id: '13', title: 'QA / Test Automation Engineer', field: 'Technology', icon: 'bug-outline',
    salary: '$60k - $120k', salaryMax: 120, demand: 'High', trajectory: '+11% Growth',
    overview: 'Makes sure software actually works before it reaches users — designing tests, hunting bugs, and building automated checks that catch problems early.',
    dayToDay: [
      'Write and run test plans for new features',
      'Report and track bugs until they’re fixed',
      'Build automated test scripts',
      'Work with developers to prevent repeat issues',
    ],
    education: [
      'Bachelor’s in CS or a related field (helpful, not required)',
      'Self-taught path: learn a scripting language + a testing framework + practice on real apps',
      'Many QA engineers start in manual testing and grow into automation',
    ],
    skills: ['Test Planning', 'Bug Tracking', 'Automation Scripting', 'Attention to Detail'],
    tools: ['Selenium', 'Cypress', 'Jira', 'Postman'],
    roadmap: [
      { stage: 'Foundations', items: ['How software gets built (SDLC)', 'Manual testing fundamentals', 'Basic scripting (Python/JavaScript)'] },
      { stage: 'Core Skills', items: ['Writing test cases & plans', 'Bug tracking tools (Jira)', 'API testing'] },
      { stage: 'Specialize', items: ['Test automation frameworks (Selenium/Cypress)', 'CI/CD integration for tests', 'Performance testing basics'] },
      { stage: 'Break In', items: ['Write a full test suite for a real app', 'Automate a repetitive manual test', 'Apply to junior QA/test engineer roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/qa',
    topSchools: ['Georgia Tech', 'University of Illinois Urbana-Champaign', 'General Assembly (bootcamp)'],
    topCompanies: ['Microsoft', 'Amazon', 'Salesforce', 'Atlassian'],
    topLocations: ['Washington', 'California', 'Texas'],
    interests: ['code','discover'],
  },
  {
    id: '14', title: 'Cyber Security Specialist', field: 'Technology', icon: 'shield-checkmark-outline',
    salary: '$80k - $160k', salaryMax: 160, demand: 'Very High', trajectory: '+25% Growth',
    overview: 'Protects systems and data from attackers — finding weaknesses before criminals do and responding fast when something goes wrong.',
    dayToDay: [
      'Scan systems for security vulnerabilities',
      'Monitor networks for suspicious activity',
      'Respond to and investigate security incidents',
      'Recommend and implement stronger defenses',
    ],
    education: [
      'Bachelor’s in Cybersecurity, CS, or IT',
      'Self-taught path: hands-on labs (TryHackMe, HackTheBox) + certifications',
      'Certifications like Security+ or CEH often matter more than a degree here',
    ],
    skills: ['Networking', 'Threat Analysis', 'Risk Assessment', 'Incident Response'],
    tools: ['Wireshark', 'Nmap', 'Metasploit', 'SIEM tools'],
    roadmap: [
      { stage: 'Foundations', items: ['Networking fundamentals', 'Operating systems (Linux especially)', 'Security basics (CIA triad)'] },
      { stage: 'Core Skills', items: ['Vulnerability scanning', 'Threat detection & monitoring', 'Security tools (Wireshark, Nmap)'] },
      { stage: 'Specialize', items: ['Penetration testing', 'Incident response', 'Security certifications (Security+, CEH)'] },
      { stage: 'Break In', items: ['Practice on legal hacking labs (TryHackMe/HackTheBox)', 'Earn a foundational certification', 'Apply to SOC analyst or junior security roles'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/cyber-security',
    topSchools: ['Carnegie Mellon University', 'University of Maryland', 'Georgia Tech', 'Purdue University'],
    topCompanies: ['CrowdStrike', 'Palo Alto Networks', 'NSA', 'Microsoft'],
    topLocations: ['Virginia', 'Maryland', 'California', 'Texas'],
    interests: ['code','discover'],
  },
  {
    id: '15', title: 'Game Developer', field: 'Technology', icon: 'game-controller-outline',
    salary: '$65k - $135k', salaryMax: 135, demand: 'Medium', trajectory: '+10% Growth',
    overview: 'Builds video games — programming gameplay mechanics, working with artists, and making sure the game runs smoothly and feels fun to play.',
    dayToDay: [
      'Write code for gameplay mechanics and systems',
      'Work with a game engine to build levels and interactions',
      'Debug performance issues and glitches',
      'Collaborate with artists, designers, and sound teams',
    ],
    education: [
      'Bachelor’s in Game Development or CS (helpful, not required)',
      'Self-taught path: pick an engine (Unity/Unreal) and ship small finished games',
      'Game jams (short game-making competitions) build real, visible experience fast',
    ],
    skills: ['C#/C++', 'Game Engines', 'Math & Physics', 'Problem Solving'],
    tools: ['Unity', 'Unreal Engine', 'Blender', 'Git'],
    roadmap: [
      { stage: 'Foundations', items: ['A programming language (C# or C++)', 'Basic math & physics for games', 'Pick a game engine (Unity or Unreal)'] },
      { stage: 'Core Skills', items: ['Gameplay programming', 'Level design basics', 'Working with 2D/3D assets'] },
      { stage: 'Specialize', items: ['Multiplayer networking', 'Performance optimization', 'Game monetization or publishing'] },
      { stage: 'Break In', items: ['Finish and ship 2-3 small games', 'Enter a game jam', 'Build a portfolio site with playable demos'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/game-developer',
    topSchools: ['DigiPen Institute of Technology', 'USC School of Cinematic Arts', 'Carnegie Mellon (ETC)', 'Full Sail University'],
    topCompanies: ['Riot Games', 'Epic Games', 'Nintendo', 'Blizzard Entertainment'],
    topLocations: ['California', 'Washington', 'Texas'],
    interests: ['code','create','perform'],
  },
  {
    id: '16', title: 'Blockchain Developer', field: 'Technology', icon: 'link-outline',
    salary: '$90k - $170k', salaryMax: 170, demand: 'Medium', trajectory: '+9% Growth',
    overview: 'Builds applications and smart contracts on blockchain networks — the systems behind cryptocurrencies, NFTs, and decentralized apps.',
    dayToDay: [
      'Write and test smart contracts',
      'Build the interface that connects users to a blockchain app',
      'Audit code for security vulnerabilities',
      'Stay current with a fast-moving, evolving technology',
    ],
    education: [
      'Bachelor’s in CS (helpful, not required)',
      'Self-taught path: learn Solidity + build and deploy real smart contracts on a testnet',
      'A strong general programming background is usually required first',
    ],
    skills: ['Solidity', 'Smart Contracts', 'Cryptography Basics', 'JavaScript'],
    tools: ['Solidity', 'Hardhat/Truffle', 'MetaMask', 'Ethereum testnets'],
    roadmap: [
      { stage: 'Foundations', items: ['JavaScript programming', 'How blockchains work', 'Cryptography basics'] },
      { stage: 'Core Skills', items: ['Solidity smart contracts', 'Testing contracts (Hardhat/Truffle)', 'Web3 libraries (ethers.js)'] },
      { stage: 'Specialize', items: ['Smart contract security & auditing', 'Gas optimization', 'DeFi or NFT protocols'] },
      { stage: 'Break In', items: ['Deploy a smart contract to a testnet', 'Build a simple decentralized app (dApp)', 'Contribute to an open-source Web3 project'] },
    ],
    buildType: '💻 Coding',
    roadmapUrl: 'https://roadmap.sh/blockchain',
    topSchools: ['UC Berkeley', 'MIT', 'Stanford University'],
    topCompanies: ['Coinbase', 'ConsenSys', 'Chainalysis', 'Ripple'],
    topLocations: ['California', 'New York', 'remote-friendly worldwide'],
    interests: ['code','lead'],
  },
  {
    id: '17', title: 'Technical Writer', field: 'Writing', icon: 'document-text-outline',
    salary: '$60k - $110k', salaryMax: 110, demand: 'Medium', trajectory: '+7% Growth',
    overview: 'Turns complex, technical information into documentation people can actually understand and use — API docs, user guides, and tutorials.',
    dayToDay: [
      'Interview engineers to understand how something works',
      'Write and organize documentation and guides',
      'Test instructions by following them exactly as written',
      'Keep docs updated as products change',
    ],
    education: [
      'Bachelor’s in English, Communications, or a technical field',
      'Self-taught path: build a public writing portfolio documenting real tools or open-source projects',
      'Some technical background (basic coding) makes this path much stronger',
    ],
    skills: ['Clear Writing', 'Technical Research', 'Information Structure', 'Basic Coding Literacy'],
    tools: ['Markdown', 'Git', 'Notion/Confluence', 'Screen recording tools'],
    roadmap: [
      { stage: 'Foundations', items: ['Strong writing fundamentals', 'Basic understanding of how software works', 'Markdown & documentation tools'] },
      { stage: 'Core Skills', items: ['API documentation basics', 'Information architecture', 'Editing for clarity & consistency'] },
      { stage: 'Specialize', items: ['Docs-as-code workflows (Git-based docs)', 'Video/tutorial creation', 'Writing for developers vs. end users'] },
      { stage: 'Break In', items: ['Document a real open-source project', 'Build a portfolio of sample docs', 'Apply to junior technical writer roles'] },
    ],
    buildType: '📝 Writing',
    roadmapUrl: 'https://roadmap.sh/technical-writer',
    topSchools: ['University of Washington', 'Carnegie Mellon University', 'Michigan Technological University'],
    topCompanies: ['Google', 'Microsoft', 'Amazon', 'GitLab'],
    topLocations: ['Washington', 'California', 'remote-friendly nationwide'],
    interests: ['teach','create'],
  },
  {
    id: '18', title: 'Product Manager', field: 'Business', icon: 'briefcase-outline',
    salary: '$85k - $165k', salaryMax: 165, demand: 'High', trajectory: '+13% Growth',
    overview: 'Decides what a product should build next — connecting what users need, what the business needs, and what engineering can actually ship.',
    dayToDay: [
      'Talk to users and analyze feedback and data',
      'Write specs describing what to build and why',
      'Prioritize a roadmap of features',
      'Work closely with design and engineering teams',
    ],
    education: [
      'Bachelor’s in Business, CS, or any field really — PM hires from everywhere',
      'Self-taught path: PM courses + a case-study portfolio analyzing real products',
      'Often a role people move into after engineering, design, or business roles',
    ],
    skills: ['Prioritization', 'User Research', 'Data Analysis', 'Communication'],
    tools: ['Jira/Linear', 'Figma (for reviewing designs)', 'Amplitude/Mixpanel', 'Spreadsheets'],
    roadmap: [
      { stage: 'Foundations', items: ['How software gets built (basic SDLC)', 'User research basics', 'Basic data analysis'] },
      { stage: 'Core Skills', items: ['Writing product specs', 'Roadmap prioritization', 'Working with design & engineering'] },
      { stage: 'Specialize', items: ['Product analytics & metrics', 'A/B testing', 'Go-to-market strategy'] },
      { stage: 'Break In', items: ['Write a case study redesigning a real product', 'Practice mock PM interviews (product sense questions)', 'Apply to associate PM programs'] },
    ],
    buildType: '💰 Business',
    roadmapUrl: 'https://roadmap.sh/product-manager',
    topSchools: ['Stanford University', 'University of Pennsylvania (Wharton)', 'Harvard Business School', 'UC Berkeley (Haas)'],
    topCompanies: ['Google', 'Meta', 'Amazon', 'Microsoft'],
    topLocations: ['California', 'Washington', 'New York'],
    interests: ['lead','teach'],
  },
  {
    id: '19', title: 'Registered Nurse', field: 'Healthcare', icon: 'medkit-outline',
    salary: '$65k - $120k', salaryMax: 120, demand: 'Very High', trajectory: '+9% Growth',
    overview: 'Provides direct patient care in hospitals, clinics, and community settings — monitoring health, administering treatment, and being the frontline of most people’s healthcare experience.',
    dayToDay: [
      'Monitor patient vital signs and conditions',
      'Administer medications and treatments',
      'Coordinate with doctors and other care staff',
      'Educate patients and families on care plans',
    ],
    education: [
      'Associate’s (ADN) or Bachelor’s (BSN) in Nursing, plus passing the NCLEX-RN licensing exam',
      'Many hospitals now prefer or require a BSN',
      'Specialization (ICU, pediatrics, ER) usually comes with experience + certification',
    ],
    skills: ['Patient Care', 'Clinical Judgment', 'Communication', 'Attention to Detail'],
    tools: ['Electronic Health Records (Epic/Cerner)', 'Vital sign monitors', 'IV & medication systems'],
    roadmap: [
      { stage: 'Foundations', items: ['Anatomy & physiology', 'Biology & chemistry basics', 'Basic patient care skills'] },
      { stage: 'Core Skills', items: ['Nursing school clinical rotations', 'Pharmacology', 'Pass the NCLEX-RN exam'] },
      { stage: 'Specialize', items: ['Choose a unit (ICU, ER, pediatrics, etc.)', 'Certification in your specialty', 'Advanced patient care techniques'] },
      { stage: 'Break In', items: ['Complete clinical hours during nursing school', 'Get licensed (NCLEX-RN)', 'Apply to hospital new-grad residency programs'] },
    ],
    buildType: '🔬 Science',
    roadmapUrl: null,
    topSchools: ['Johns Hopkins School of Nursing', 'University of Pennsylvania', 'Duke University', 'UCLA School of Nursing'],
    topCompanies: ['Mayo Clinic', 'Cleveland Clinic', 'Kaiser Permanente', 'HCA Healthcare'],
    topLocations: ['California', 'Texas', 'New York', 'Florida'],
    interests: ['care','discover'],
  },
  {
    id: '20', title: 'Film & TV Producer', field: 'Entertainment', icon: 'film-outline',
    salary: '$55k - $130k', salaryMax: 130, demand: 'Medium', trajectory: '+7% Growth',
    overview: 'Oversees a film or TV project from idea to screen — securing funding, hiring the team, managing the budget, and keeping production on schedule.',
    dayToDay: [
      'Develop and pitch project ideas',
      'Secure financing and manage budgets',
      'Hire directors, crew, and cast',
      'Oversee production schedules and problem-solve on set',
    ],
    education: [
      'Bachelor’s in Film, TV, or Communications (a common path, not required)',
      'Self-taught path: start as a production assistant and work up through real sets',
      'Film schools (USC, NYU, UCLA) offer strong industry connections',
    ],
    skills: ['Project Management', 'Budgeting', 'Negotiation', 'Storytelling'],
    tools: ['Final Draft (scripts)', 'Movie Magic Budgeting', 'StudioBinder', 'Adobe Premiere (for review)'],
    roadmap: [
      { stage: 'Foundations', items: ['How film/TV production works', 'Storytelling & script basics', 'Entry-level set experience (PA work)'] },
      { stage: 'Core Skills', items: ['Budgeting & scheduling', 'Working with unions & contracts', 'Pitching & development'] },
      { stage: 'Specialize', items: ['Financing & investor relations', 'A specific genre or format (film, streaming, doc)', 'Building an industry network'] },
      { stage: 'Break In', items: ['Produce a short film or student project', 'Work as a production assistant on a real set', 'Build relationships with writers and directors'] },
    ],
    buildType: '🎨 Art',
    roadmapUrl: null,
    topSchools: ['USC School of Cinematic Arts', 'NYU Tisch School of the Arts', 'UCLA School of Theater, Film and Television', 'AFI Conservatory'],
    topCompanies: ['Disney', 'Warner Bros. Discovery', 'Netflix', 'NBCUniversal'],
    topLocations: ['California', 'New York', 'Georgia', 'Louisiana'],
    interests: ['create','perform','lead'],
  },
  {
    id: '21', title: 'Environmental Scientist', field: 'Science', icon: 'leaf-outline',
    salary: '$50k - $105k', salaryMax: 105, demand: 'High', trajectory: '+8% Growth',
    overview: 'Studies the environment and human impact on it — collecting field data, running lab tests, and helping shape policy or cleanup efforts to protect ecosystems.',
    dayToDay: [
      'Collect soil, water, or air samples in the field',
      'Analyze environmental data and lab results',
      'Write reports on findings and compliance',
      'Advise organizations or governments on environmental impact',
    ],
    education: [
      'Bachelor’s in Environmental Science, Biology, or Earth Science',
      'Master’s often needed for research or policy-focused roles',
      'Field internships (parks, conservation groups) build real experience',
    ],
    skills: ['Data Collection', 'GIS Mapping', 'Statistical Analysis', 'Report Writing'],
    tools: ['GIS software (ArcGIS)', 'Lab testing equipment', 'R or Python for analysis', 'Environmental monitoring sensors'],
    roadmap: [
      { stage: 'Foundations', items: ['Biology, chemistry & earth science', 'Statistics', 'Environmental policy basics'] },
      { stage: 'Core Skills', items: ['Field sampling techniques', 'GIS mapping', 'Data analysis (R/Python)'] },
      { stage: 'Specialize', items: ['A focus area (water, air, conservation, climate)', 'Environmental regulations & compliance', 'Grant or report writing'] },
      { stage: 'Break In', items: ['Volunteer or intern with a conservation organization', 'Assist on a real field research project', 'Apply to environmental analyst or field tech roles'] },
    ],
    buildType: '🔬 Science',
    roadmapUrl: null,
    topSchools: ['UC Berkeley', 'Stanford University', 'Duke University (Nicholas School)', 'University of Michigan'],
    topCompanies: ['U.S. EPA', 'NOAA', 'The Nature Conservancy', 'AECOM'],
    topLocations: ['California', 'Colorado', 'Washington D.C.', 'North Carolina'],
    interests: ['discover','care'],
  },
  {
    id: '22', title: 'K-12 Teacher', field: 'Education', icon: 'school-outline',
    salary: '$45k - $85k', salaryMax: 85, demand: 'High', trajectory: '+6% Growth',
    overview: 'Plans and delivers lessons, manages a classroom, and helps students grow academically and personally — one of the most direct ways to shape the next generation.',
    dayToDay: [
      'Plan lessons aligned to learning standards',
      'Teach and manage a classroom of students',
      'Grade assignments and track student progress',
      'Communicate with parents and collaborate with other teachers',
    ],
    education: [
      'Bachelor’s in Education or a subject area, plus a teaching credential/license',
      'Alternative certification programs (Teach For America, state alt-cert) for career changers',
      'Master’s often required or preferred for salary advancement',
    ],
    skills: ['Lesson Planning', 'Classroom Management', 'Communication', 'Patience'],
    tools: ['Google Classroom', 'Learning management systems', 'Gradebook software', 'Interactive whiteboards'],
    roadmap: [
      { stage: 'Foundations', items: ['Subject matter expertise', 'Child development basics', 'Classroom observation experience'] },
      { stage: 'Core Skills', items: ['Lesson planning & curriculum design', 'Classroom management strategies', 'Student assessment methods'] },
      { stage: 'Specialize', items: ['A grade band or subject specialty', 'Special education or ESL certification (optional)', 'Educational technology tools'] },
      { stage: 'Break In', items: ['Complete a student teaching placement', 'Earn your teaching license/credential', 'Apply to open positions in a local school district'] },
    ],
    buildType: '📚 Research',
    roadmapUrl: null,
    topSchools: ['Teachers College, Columbia University', 'Vanderbilt University (Peabody)', 'University of Michigan School of Education', 'Stanford Graduate School of Education'],
    topCompanies: ['Large public school districts (NYC DOE, LAUSD)', 'Teach For America', 'Charter networks (KIPP, IDEA)'],
    topLocations: ['Texas', 'California', 'New York', 'Florida'],
    interests: ['teach','care'],
  },
  {
    id: '23', title: 'Human Resources Manager', field: 'HR', icon: 'people-outline',
    salary: '$65k - $130k', salaryMax: 130, demand: 'High', trajectory: '+8% Growth',
    overview: 'Manages the people side of a company — hiring, resolving workplace issues, shaping culture, and making sure employees are treated fairly and supported.',
    dayToDay: [
      'Recruit and interview job candidates',
      'Handle employee relations and workplace conflicts',
      'Manage benefits, policies, and compliance',
      'Support managers on team and performance issues',
    ],
    education: [
      'Bachelor’s in HR, Business, or Psychology',
      'HR certifications (SHRM-CP, PHR) strengthen a resume significantly',
      'Many HR managers start in recruiting or generalist roles and grow into management',
    ],
    skills: ['Recruiting', 'Conflict Resolution', 'Employment Law Basics', 'Communication'],
    tools: ['Applicant Tracking Systems (Greenhouse)', 'HRIS platforms (Workday)', 'Slack', 'Survey tools'],
    roadmap: [
      { stage: 'Foundations', items: ['Business & organizational basics', 'Communication & interpersonal skills', 'Intro to employment law'] },
      { stage: 'Core Skills', items: ['Recruiting & interviewing', 'Onboarding & employee relations', 'HR systems (HRIS)'] },
      { stage: 'Specialize', items: ['Compensation & benefits design', 'HR certification (SHRM-CP/PHR)', 'People analytics'] },
      { stage: 'Break In', items: ['Start in a recruiting coordinator or HR generalist role', 'Earn a foundational HR certification', 'Build experience across hiring, onboarding, and policy'] },
    ],
    buildType: '💰 Business',
    roadmapUrl: null,
    topSchools: ['Cornell University (ILR School)', 'Michigan State University', 'The Ohio State University', 'Rutgers School of Management and Labor Relations'],
    topCompanies: ['Google', 'Salesforce', 'Deloitte', 'LinkedIn'],
    topLocations: ['New York', 'California', 'Illinois', 'Texas'],
    interests: ['lead','teach','care'],
  },
  {
    id: '24', title: 'Marketing Manager', field: 'Business', icon: 'megaphone-outline',
    salary: '$60k - $135k', salaryMax: 135, demand: 'High', trajectory: '+10% Growth',
    overview: 'Plans and runs campaigns that get a product or brand in front of the right people — blending creativity with data to figure out what actually works.',
    dayToDay: [
      'Plan and launch marketing campaigns',
      'Analyze campaign performance data',
      'Manage budgets across channels (social, ads, email)',
      'Coordinate with design and sales teams',
    ],
    education: [
      'Bachelor’s in Marketing, Business, or Communications',
      'Self-taught path: run real campaigns (even small/personal ones) + certifications (Google Ads, HubSpot)',
      'Many marketers move up from specialist roles (social media, content, SEO)',
    ],
    skills: ['Campaign Strategy', 'Data Analysis', 'Copywriting', 'Budget Management'],
    tools: ['Google Analytics', 'HubSpot', 'Meta Ads Manager', 'Canva/Adobe'],
    roadmap: [
      { stage: 'Foundations', items: ['Marketing fundamentals', 'Basic data & analytics literacy', 'Writing & content basics'] },
      { stage: 'Core Skills', items: ['Digital advertising (Google/Meta Ads)', 'Email & content marketing', 'Analytics & reporting'] },
      { stage: 'Specialize', items: ['SEO or paid media specialization', 'Brand strategy', 'Marketing automation'] },
      { stage: 'Break In', items: ['Run a real campaign for a small business or personal project', 'Get certified in Google Ads or HubSpot', 'Apply to marketing coordinator or specialist roles'] },
    ],
    buildType: '💰 Business',
    roadmapUrl: null,
    topSchools: ['Northwestern University (Kellogg)', 'University of Michigan (Ross)', 'NYU Stern', 'University of Texas at Austin'],
    topCompanies: ['Procter & Gamble', 'Nike', 'Coca-Cola', 'HubSpot'],
    topLocations: ['New York', 'California', 'Illinois', 'Georgia'],
    interests: ['lead','create'],
  },
  {
    id: '25', title: 'Accountant / CPA', field: 'Finance', icon: 'calculator-outline',
    salary: '$55k - $110k', salaryMax: 110, demand: 'High', trajectory: '+6% Growth',
    overview: 'Tracks and reports on an organization’s finances — preparing statements, ensuring tax compliance, and making sure the numbers are accurate and trustworthy.',
    dayToDay: [
      'Prepare and review financial statements',
      'Ensure compliance with tax laws and regulations',
      'Reconcile accounts and manage records',
      'Advise on budgeting and financial planning',
    ],
    education: [
      'Bachelor’s in Accounting or Finance, often 150 credit hours to sit for the CPA exam',
      'Passing the CPA exam significantly increases pay and opportunities',
      'Many start at a public accounting firm before moving to private industry',
    ],
    skills: ['Financial Reporting', 'Tax Knowledge', 'Attention to Detail', 'Excel'],
    tools: ['QuickBooks', 'Excel', 'SAP', 'Tax software (ProSeries/TurboTax)'],
    roadmap: [
      { stage: 'Foundations', items: ['Financial & managerial accounting', 'Excel proficiency', 'Basic tax principles'] },
      { stage: 'Core Skills', items: ['Financial statement preparation', 'Auditing basics', 'Accounting software (QuickBooks/SAP)'] },
      { stage: 'Specialize', items: ['CPA licensure', 'Tax or audit specialization', 'Forensic or managerial accounting'] },
      { stage: 'Break In', items: ['Complete an internship at an accounting firm', 'Sit for and pass the CPA exam', 'Apply to staff accountant roles at a firm or company'] },
    ],
    buildType: '📊 Finance',
    roadmapUrl: null,
    topSchools: ['University of Texas at Austin', 'University of Illinois Urbana-Champaign', 'Brigham Young University', 'Villanova University'],
    topCompanies: ['Deloitte', 'PwC', 'EY', 'KPMG'],
    topLocations: ['New York', 'Illinois', 'Texas', 'California'],
    interests: ['lead','discover'],
  },
];

const FIELDS = ['All', 'Technology', 'Design', 'Engineering', 'Healthcare', 'Finance', 'Business', 'Writing', 'Entertainment', 'Science', 'Education', 'HR'];

export default function CareerExplorationScreen() {
  const { colors: c } = useTheme();
  const { showEmojis, showSubtext } = useUIPrefs();
  const styles = makeStyles(c);
  const navigation = useNavigation();
  const DEMAND_COLORS = { 'Very High': c.financial, 'High': c.teal, 'Medium': c.gold, 'Low': c.error };
  const fieldColor = (field) => c[FIELD_COLOR_KEY[field]] || c.teal;

  const [search, setSearch] = useState('');
  const [activeField, setActiveField] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [savedCareers, setSavedCareers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showInterestQuiz, setShowInterestQuiz] = useState(false);
  const [quizPicks, setQuizPicks] = useState([]);       // in-progress selection inside the quiz
  const [activeInterests, setActiveInterests] = useState([]); // applied to the list

  const toggleQuizPick = (id) => {
    setQuizPicks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const applyInterests = () => {
    setActiveInterests(quizPicks);
    setShowInterestQuiz(false);
  };

  const clearInterests = () => {
    setActiveInterests([]);
    setQuizPicks([]);
  };

  const quizMatchCount = quizPicks.length === 0
    ? CAREERS.length
    : CAREERS.filter(c => c.interests.some(i => quizPicks.includes(i))).length;

  const filtered = CAREERS.filter(career => {
    const matchField = activeField === 'All' || career.field === activeField;
    const matchSearch = !search ||
      career.title.toLowerCase().includes(search.toLowerCase()) ||
      career.field.toLowerCase().includes(search.toLowerCase()) ||
      career.skills.some(sk => sk.toLowerCase().includes(search.toLowerCase()));
    const matchInterest = activeInterests.length === 0 ||
      career.interests.some(i => activeInterests.includes(i));
    return matchField && matchSearch && matchInterest;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'salaryDesc') return b.salaryMax - a.salaryMax;
    if (sortBy === 'salaryAsc') return a.salaryMax - b.salaryMax;
    if (sortBy === 'demand') return (DEMAND_RANK[b.demand] || 0) - (DEMAND_RANK[a.demand] || 0);
    if (sortBy === 'skills') return a.skills.length - b.skills.length;
    return 0; // 'default' — keep curated order
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      const cached = await cacheRead(`career_targets_${user.id}`);
      if (cached) setSavedCareers(cached);
      if (!(await isOnline())) return;
      const { data } = await supabase.from('area_notes').select('content')
        .eq('user_id', user.id).eq('area_id', CAREER_AREA_ID)
        .ilike('content', `[${CAREER_TAG}]%`);
      if (data) {
        const ids = data.map(r => r.content.replace(`[${CAREER_TAG}]`, '').trim()).filter(Boolean);
        setSavedCareers(ids);
        cacheWrite(`career_targets_${user.id}`, ids);
      }
    });
  }, []);

  const toggleSave = async (id) => {
    const wasSaved = savedCareers.includes(id);
    const next = wasSaved ? savedCareers.filter(s => s !== id) : [...savedCareers, id];
    setSavedCareers(next); // optimistic — the bookmark should respond instantly
    if (!userId) return;
    cacheWrite(`career_targets_${userId}`, next);
    try {
      if (wasSaved) {
        await supabase.from('area_notes').delete()
          .eq('user_id', userId).eq('area_id', CAREER_AREA_ID)
          .eq('content', `[${CAREER_TAG}] ${id}`);
      } else {
        await offlineWrite(supabase, 'area_notes', {
          user_id: userId, area_id: CAREER_AREA_ID,
          content: `[${CAREER_TAG}] ${id}`, created_at: new Date().toISOString(),
        });
      }
    } catch (e) { console.warn('careerexplore toggleSave', e); }
  };

  const startBuild = (career) => {
    setSelectedCareer(null);
    navigation.navigate('ProjectsScreen', { presetType: career.buildType, autoOpen: true });
  };

  const openResources = () => {
    setSelectedCareer(null);
    navigation.navigate('ResourcesToolsScreen');
  };

  return (
    <View style={styles.container}>
      {/* Top Telemetry Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen'))}
            style={{ padding: 2 }}
          >
            <Ionicons name="chevron-back" size={22} color={c.financial} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSubtitle}>SECTOR INTELLIGENCE</Text>
            <Text style={styles.headerTitle}>Career Trajectories</Text>
          </View>
        </View>
        <View style={styles.savedBadge}>
          <Ionicons name="bookmark" size={14} color={c.gold} />
          <Text style={styles.savedCountText}>{savedCareers.length} Targets</Text>
        </View>
      </View>

      {/* Interest-first discovery entry point — Road Trip Nation style:
          start from what you're drawn to, not a job title you already know. */}
      <TouchableOpacity
        style={styles.discoverBanner}
        onPress={() => { setQuizPicks(activeInterests); setShowInterestQuiz(true); }}
        activeOpacity={0.85}
      >
        {showEmojis ? <Text style={styles.discoverEmoji}>🧭</Text> : <Ionicons name="compass-outline" size={24} color={c.gold} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.discoverTitle}>Not sure where to start?</Text>
          {showSubtext && <Text style={styles.discoverDesc}>Discover careers by what you're drawn to, not a job title you already know.</Text>}
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.gold} />
      </TouchableOpacity>

      {activeInterests.length > 0 && (
        <View style={styles.activeInterestRow}>
          <Text style={styles.activeInterestLabel}>Matching:</Text>
          {activeInterests.map(id => {
            const interest = INTERESTS.find(i => i.id === id);
            return (
              <View key={id} style={styles.activeInterestPill}>
                <Text style={styles.activeInterestPillText}>{showEmojis ? `${interest?.emoji} ` : ''}{interest?.label}</Text>
              </View>
            );
          })}
          <TouchableOpacity onPress={clearInterests}>
            <Text style={styles.clearInterestsText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={c.teal} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Scan career titles, skills, or fields..."
            placeholderTextColor={c.text4}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={c.text4} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Horizontal Field Selector */}
      <View style={styles.fieldScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fieldScroll}>
          {FIELDS.map(f => {
            const isActive = activeField === f;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.fieldChip, isActive && styles.activeFieldChip]}
                onPress={() => setActiveField(f)}
              >
                <Text style={[styles.fieldChipText, isActive && styles.activeFieldChipText]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Selector */}
      <View style={styles.fieldScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fieldScroll}>
          <View style={styles.sortLabelWrap}>
            <Ionicons name="swap-vertical-outline" size={13} color={c.text4} />
            <Text style={styles.sortLabel}>Sort</Text>
          </View>
          {SORT_OPTIONS.map(opt => {
            const isActive = sortBy === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortChip, isActive && styles.activeSortChip]}
                onPress={() => setSortBy(opt.key)}
              >
                <Text style={[styles.fieldChipText, isActive && styles.activeSortChipText]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Pointer to the deeper resource library — this screen is an intro
          map, not the whole territory. */}
      <TouchableOpacity style={styles.resourceBanner} onPress={openResources} activeOpacity={0.85}>
        <Ionicons name="library-outline" size={18} color={c.teal} />
        <Text style={styles.resourceBannerText}>
          Want courses, guides & reference tools for any of these? Browse the Resources & Instruments library.
        </Text>
        <Ionicons name="chevron-forward" size={16} color={c.teal} />
      </TouchableOpacity>

      {/* Career Fleet List */}
      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="radar" size={50} color={c.border} />
            <Text style={styles.emptyTitle}>No Career Trajectories Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or field filter.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSaved = savedCareers.includes(item.id);
          const demandColor = DEMAND_COLORS[item.demand] || c.teal;
          const itemColor = fieldColor(item.field);

          return (
            <TouchableOpacity
              style={[styles.careerCard, { borderLeftColor: itemColor }]}
              onPress={() => setSelectedCareer(item)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={22} color={itemColor} />
                </View>

                <View style={styles.titleArea}>
                  <Text style={styles.careerTitle}>{item.title}</Text>
                  <Text style={styles.careerField}>{item.field.toUpperCase()}</Text>
                </View>

                <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.bookmarkBtn}>
                  <Ionicons
                    name={isSaved ? "bookmark" : "bookmark-outline"}
                    size={18}
                    color={isSaved ? c.gold : c.text4}
                  />
                </TouchableOpacity>
              </View>

              {showSubtext && <Text style={styles.cardOverview} numberOfLines={2}>{item.overview}</Text>}

              {/* Metrics Pill Row */}
              <View style={styles.metricsRow}>
                <View style={styles.metricBadge}>
                  <Ionicons name="cash-outline" size={12} color={c.financial} />
                  <Text style={styles.metricText}>{item.salary}</Text>
                </View>

                <View style={[styles.metricBadge, { backgroundColor: demandColor + '18' }]}>
                  <Ionicons name="trending-up-outline" size={12} color={demandColor} />
                  <Text style={[styles.metricText, { color: demandColor }]}>{item.demand} Demand</Text>
                </View>

                <View style={styles.trajectoryBadge}>
                  <Text style={styles.trajectoryText}>{item.trajectory}</Text>
                </View>
              </View>

              {/* Skill Chips */}
              <View style={styles.skillsRow}>
                {item.skills.slice(0, 3).map(sk => (
                  <View key={sk} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{sk}</Text>
                  </View>
                ))}
                {item.skills.length > 3 && (
                  <Text style={styles.moreSkillsText}>+{item.skills.length - 3} more</Text>
                )}
              </View>

              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>Tap for full roadmap</Text>
                <Ionicons name="chevron-forward" size={12} color={c.text4} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Interest Discovery Quiz — pick what you're drawn to, not a title */}
      <Modal visible={showInterestQuiz} transparent animationType="slide" onRequestClose={() => setShowInterestQuiz(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.quizEyebrow}>DISCOVER BY INTEREST</Text>
            <Text style={styles.quizTitle}>What are you drawn to?</Text>
            {showSubtext && (
              <Text style={styles.quizSubtitle}>
                Pick as many as you like. One interest usually leads to several very different careers — that's the point.
              </Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.quizGrid}>
                {INTERESTS.map(interest => {
                  const isPicked = quizPicks.includes(interest.id);
                  return (
                    <TouchableOpacity
                      key={interest.id}
                      style={[styles.quizCard, isPicked && styles.quizCardActive]}
                      onPress={() => toggleQuizPick(interest.id)}
                      activeOpacity={0.8}
                    >
                      {showEmojis ? (
                        <Text style={styles.quizCardEmoji}>{interest.emoji}</Text>
                      ) : (
                        <Ionicons name={interest.icon} size={22} color={isPicked ? c.financial : c.text2} style={{ marginBottom: 4 }} />
                      )}
                      <Text style={[styles.quizCardLabel, isPicked && styles.quizCardLabelActive]}>{interest.label}</Text>
                      {isPicked && (
                        <View style={styles.quizCardCheck}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.quizSubmitBtn, quizPicks.length === 0 && styles.quizSubmitBtnDisabled]}
              onPress={applyInterests}
              disabled={quizPicks.length === 0}
            >
              <Text style={styles.quizSubmitText}>
                {quizPicks.length === 0 ? 'Pick at least one' : `See My ${quizMatchCount} Path${quizMatchCount === 1 ? '' : 's'}`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quizSkipBtn} onPress={() => setShowInterestQuiz(false)}>
              <Text style={styles.quizSkipText}>Never mind, I'll browse myself</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detailed Career Intel Modal */}
      <Modal visible={!!selectedCareer} transparent animationType="slide" onRequestClose={() => setSelectedCareer(null)}>
        <View style={styles.modalOverlay}>
          {selectedCareer && (
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={[styles.iconBox, { backgroundColor: fieldColor(selectedCareer.field) + '18' }]}>
                    <Ionicons name={selectedCareer.icon} size={28} color={fieldColor(selectedCareer.field)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>{selectedCareer.title}</Text>
                    <Text style={styles.modalSubtitle}>{selectedCareer.field} Sector</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedCareer(null)}>
                    <Ionicons name="close-circle" size={24} color={c.text4} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSectionTitle}>{showEmojis ? '📋 ' : ''}WHAT THEY ACTUALLY DO</Text>
                <Text style={styles.overviewText}>{selectedCareer.overview}</Text>
                <View style={{ marginBottom: 20 }}>
                  {selectedCareer.dayToDay.map((line) => (
                    <View key={line} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>{line}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>EST. SALARY</Text>
                    <Text style={styles.statBoxValue}>{selectedCareer.salary}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxLabel}>MARKET DEMAND</Text>
                    <Text style={[styles.statBoxValue, { color: DEMAND_COLORS[selectedCareer.demand] }]}>
                      {selectedCareer.demand}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>{showEmojis ? '🎯 ' : ''}CORE SKILLS</Text>
                <View style={styles.modalSkillsList}>
                  {selectedCareer.skills.map(sk => (
                    <View key={sk} style={styles.modalSkillTag}>
                      <Ionicons name="checkmark-circle" size={14} color={c.financial} />
                      <Text style={styles.modalSkillText}>{sk}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>{showEmojis ? '🧰 ' : ''}TOOLS OF THE TRADE</Text>
                <View style={styles.modalSkillsList}>
                  {selectedCareer.tools.map(tool => (
                    <View key={tool} style={[styles.modalSkillTag, { borderColor: c.teal + '55' }]}>
                      <Ionicons name="construct-outline" size={14} color={c.teal} />
                      <Text style={styles.modalSkillText}>{tool}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>{showEmojis ? '🎓 ' : ''}HOW PEOPLE GET THERE</Text>
                <View style={{ marginBottom: 20 }}>
                  {selectedCareer.education.map((line) => (
                    <View key={line} style={styles.bulletRow}>
                      <Ionicons name="school-outline" size={14} color={c.gold} style={{ marginTop: 1 }} />
                      <Text style={[styles.bulletText, { flex: 1, marginLeft: 8 }]}>{line}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>{showEmojis ? '🏫 ' : ''}WELL-REGARDED SCHOOLS & PROGRAMS</Text>
                <View style={styles.modalSkillsList}>
                  {selectedCareer.topSchools.map(school => (
                    <View key={school} style={[styles.modalSkillTag, { borderColor: c.gold + '55' }]}>
                      <Ionicons name="school-outline" size={14} color={c.gold} />
                      <Text style={styles.modalSkillText}>{school}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>{showEmojis ? '🏢 ' : ''}WHO'S HIRING</Text>
                <View style={styles.modalSkillsList}>
                  {selectedCareer.topCompanies.map(comp => (
                    <View key={comp} style={[styles.modalSkillTag, { borderColor: fieldColor(selectedCareer.field) + '55' }]}>
                      <Ionicons name="business-outline" size={14} color={fieldColor(selectedCareer.field)} />
                      <Text style={styles.modalSkillText}>{comp}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.modalSectionTitle}>{showEmojis ? '📍 ' : ''}WHERE THE JOBS ARE</Text>
                <View style={styles.modalSkillsList}>
                  {selectedCareer.topLocations.map(loc => (
                    <View key={loc} style={styles.modalSkillTag}>
                      <Ionicons name="location-outline" size={14} color={c.text3} />
                      <Text style={styles.modalSkillText}>{loc}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.disclaimerText}>
                  Schools, employers & locations are well-known reputational starting points for research — not a ranking, and not exhaustive.
                </Text>

                <Text style={styles.modalSectionTitle}>{showEmojis ? '🗺️ ' : ''}LEARNING ROADMAP</Text>
                <View style={styles.roadmapList}>
                  {selectedCareer.roadmap.map((stage, idx) => (
                    <View key={stage.stage} style={styles.roadmapStageRow}>
                      <View style={styles.roadmapRail}>
                        <View style={[styles.roadmapDot, { borderColor: fieldColor(selectedCareer.field) }]}>
                          <Text style={[styles.roadmapDotText, { color: fieldColor(selectedCareer.field) }]}>{idx + 1}</Text>
                        </View>
                        {idx < selectedCareer.roadmap.length - 1 && <View style={styles.roadmapLine} />}
                      </View>
                      <View style={styles.roadmapStageBody}>
                        <Text style={styles.roadmapStageTitle}>{stage.stage}</Text>
                        {stage.items.map(it => (
                          <Text key={it} style={styles.roadmapItem}>· {it}</Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
                {selectedCareer.roadmapUrl && (
                  <TouchableOpacity
                    style={styles.roadmapLinkBtn}
                    onPress={() => Linking.openURL(selectedCareer.roadmapUrl)}
                  >
                    <Ionicons name="map-outline" size={16} color={c.teal} />
                    <Text style={styles.roadmapLinkText}>See the full interactive roadmap on roadmap.sh</Text>
                    <Ionicons name="open-outline" size={14} color={c.teal} />
                  </TouchableOpacity>
                )}

                <Text style={styles.modalSectionTitle}>{showEmojis ? '🚀 ' : ''}TAKE ACTION</Text>
                <TouchableOpacity style={styles.actionCard} onPress={() => startBuild(selectedCareer)}>
                  <View style={[styles.actionIconBox, { backgroundColor: fieldColor(selectedCareer.field) + '18' }]}>
                    <Ionicons name="hammer-outline" size={18} color={fieldColor(selectedCareer.field)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionCardTitle}>Start a {selectedCareer.buildType} build</Text>
                    {showSubtext && <Text style={styles.actionCardDesc}>Opens The Workshop with a matching build type ready to go</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.text4} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={openResources}>
                  <View style={[styles.actionIconBox, { backgroundColor: c.teal + '18' }]}>
                    <Ionicons name="library-outline" size={18} color={c.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionCardTitle}>Browse Resources & Instruments</Text>
                    {showSubtext && <Text style={styles.actionCardDesc}>Curated courses, references & tools to start learning</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.text4} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => Linking.openURL('https://www.bls.gov/ooh/')}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: c.bg2 }]}>
                    <Ionicons name="compass-outline" size={18} color={c.text2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionCardTitle}>Bureau of Labor Statistics</Text>
                    {showSubtext && <Text style={styles.actionCardDesc}>Official U.S. outlook, pay & requirements data</Text>}
                  </View>
                  <Ionicons name="open-outline" size={14} color={c.text4} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveCareerBtn, savedCareers.includes(selectedCareer.id) && styles.savedBtnActive]}
                  onPress={() => toggleSave(selectedCareer.id)}
                >
                  <Ionicons name={savedCareers.includes(selectedCareer.id) ? "bookmark" : "bookmark-outline"} size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {savedCareers.includes(selectedCareer.id) ? "Targeted" : "Target This Career"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  headerSubtitle: { color: c.financial, fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  headerTitle: { color: c.text1, fontSize: 24, fontWeight: 'bold' },
  savedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.bg1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: c.gold + '4d' },
  savedCountText: { color: c.gold, fontSize: 11, fontWeight: 'bold' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.bg1, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: c.border, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10, color: c.text1, fontSize: 13 },
  fieldScrollContainer: { marginBottom: 10 },
  fieldScroll: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  fieldChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border },
  activeFieldChip: { borderColor: c.financial, backgroundColor: c.financial + '18' },
  fieldChipText: { color: c.text3, fontSize: 12 },
  activeFieldChipText: { color: c.financial, fontWeight: 'bold' },
  sortLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 2 },
  sortLabel: { color: c.text4, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: c.bg1, borderWidth: 1, borderColor: c.border },
  activeSortChip: { borderColor: c.teal, backgroundColor: c.teal + '18' },
  activeSortChipText: { color: c.teal, fontWeight: 'bold' },
  discoverBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginBottom: 12, padding: 14,
    backgroundColor: c.gold + '14', borderRadius: 14, borderWidth: 1, borderColor: c.gold + '40',
  },
  discoverEmoji: { fontSize: 22 },
  discoverTitle: { color: c.text1, fontSize: 13.5, fontWeight: 'bold', marginBottom: 2 },
  discoverDesc: { color: c.text3, fontSize: 11, lineHeight: 15 },
  activeInterestRow: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6,
    marginHorizontal: 20, marginBottom: 12,
  },
  activeInterestLabel: { color: c.text4, fontSize: 11, fontWeight: '700' },
  activeInterestPill: { backgroundColor: c.gold + '20', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  activeInterestPillText: { color: c.gold, fontSize: 11, fontWeight: '700' },
  clearInterestsText: { color: c.error, fontSize: 11, fontWeight: '700', marginLeft: 4 },
  resourceBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 16, marginTop: 6, padding: 12,
    backgroundColor: c.teal + '14', borderRadius: 12, borderWidth: 1, borderColor: c.teal + '40',
  },
  resourceBannerText: { flex: 1, color: c.text2, fontSize: 11.5, lineHeight: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  careerCard: { backgroundColor: c.bg1, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.bg2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: c.border },
  titleArea: { flex: 1 },
  careerTitle: { color: c.text1, fontSize: 15, fontWeight: 'bold' },
  careerField: { color: c.text3, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  bookmarkBtn: { padding: 4 },
  cardOverview: { color: c.text3, fontSize: 12, lineHeight: 17, marginBottom: 12 },
  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  metricBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.bg2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  metricText: { color: c.text2, fontSize: 11, fontWeight: '600' },
  trajectoryBadge: { marginLeft: 'auto', backgroundColor: c.financial + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  trajectoryText: { color: c.financial, fontSize: 10, fontWeight: 'bold' },
  skillsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  skillChip: { backgroundColor: c.bg2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  skillChipText: { color: c.text3, fontSize: 10 },
  moreSkillsText: { color: c.text4, fontSize: 10, fontStyle: 'italic' },
  tapHint: { flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'flex-end' },
  tapHintText: { color: c.text4, fontSize: 10, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { color: c.text1, fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { color: c.text4, fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: c.bg1, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingTop: 12, borderTopWidth: 2, borderTopColor: c.gold, maxHeight: '88%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalTitle: { color: c.text1, fontSize: 18, fontWeight: 'bold' },
  modalSubtitle: { color: c.text3, fontSize: 12 },
  overviewText: { color: c.text2, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.text4, marginTop: 7, marginRight: 8 },
  bulletText: { color: c.text3, fontSize: 12.5, lineHeight: 18, flex: 1 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: c.bg2, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: c.border },
  statBoxLabel: { color: c.text4, fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  statBoxValue: { color: c.financial, fontSize: 14, fontWeight: 'bold' },
  modalSectionTitle: { color: c.teal, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  modalSkillsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  modalSkillTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.bg2, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: c.border },
  modalSkillText: { color: c.text1, fontSize: 12 },
  disclaimerText: { color: c.text4, fontSize: 10, fontStyle: 'italic', lineHeight: 14, marginTop: -12, marginBottom: 20 },
  roadmapList: { marginBottom: 8 },
  roadmapStageRow: { flexDirection: 'row' },
  roadmapRail: { width: 28, alignItems: 'center' },
  roadmapDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, backgroundColor: c.bg1, alignItems: 'center', justifyContent: 'center' },
  roadmapDotText: { fontSize: 10, fontWeight: '800' },
  roadmapLine: { flex: 1, width: 2, backgroundColor: c.border, marginVertical: 2 },
  roadmapStageBody: { flex: 1, paddingBottom: 16, paddingLeft: 10 },
  roadmapStageTitle: { color: c.text1, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  roadmapItem: { color: c.text3, fontSize: 12, lineHeight: 18 },
  roadmapLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.teal + '14', borderWidth: 1, borderColor: c.teal + '40',
    borderRadius: 10, padding: 12, marginBottom: 20,
  },
  roadmapLinkText: { flex: 1, color: c.teal, fontSize: 12, fontWeight: '700' },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: c.bg2, borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: c.border,
  },
  actionIconBox: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  actionCardTitle: { color: c.text1, fontSize: 13, fontWeight: '700' },
  actionCardDesc: { color: c.text4, fontSize: 10.5, marginTop: 1 },
  saveCareerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: c.financial, paddingVertical: 14, borderRadius: 10, marginTop: 6, marginBottom: 12 },
  savedBtnActive: { backgroundColor: c.gold },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  quizEyebrow: { color: c.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  quizTitle: { color: c.text1, fontSize: 19, fontWeight: 'bold', marginBottom: 6 },
  quizSubtitle: { color: c.text3, fontSize: 12.5, lineHeight: 18, marginBottom: 16 },
  quizGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 4 },
  quizCard: {
    width: (width - 40 - 40 - 10) / 2, backgroundColor: c.bg2, borderRadius: 12,
    borderWidth: 1.5, borderColor: c.border, padding: 14, alignItems: 'center',
  },
  quizCardActive: { borderColor: c.gold, backgroundColor: c.gold + '18' },
  quizCardEmoji: { fontSize: 26, marginBottom: 6 },
  quizCardLabel: { color: c.text2, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  quizCardLabelActive: { color: c.text1, fontWeight: 'bold' },
  quizCardCheck: {
    position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9,
    backgroundColor: c.gold, alignItems: 'center', justifyContent: 'center',
  },
  quizSubmitBtn: { backgroundColor: c.gold, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  quizSubmitBtnDisabled: { opacity: 0.4 },
  quizSubmitText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  quizSkipBtn: { alignItems: 'center', paddingVertical: 14 },
  quizSkipText: { color: c.text4, fontSize: 12, fontWeight: '600' },
});
