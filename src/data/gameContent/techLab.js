// src/data/gameContent/techLab.js
// Tech Lab content (technology, engineering & digital literacy), tiered by
// grade band.

export const TECH_BANK = {
  'K-2': [
    { prompt: 'What part of the computer do you type on?', correct: 'Keyboard', options: ['Keyboard', 'Monitor', 'Mouse', 'Speaker'], explanation: 'A keyboard has keys you press to type letters and numbers.' },
    { prompt: 'What do you use to click and point on a computer screen?', correct: 'A mouse', options: ['A mouse', 'A keyboard', 'A printer', 'A speaker'], explanation: 'A mouse lets you point, click, and move things around on the screen.' },
    { prompt: 'If a stranger online asks for your home address, what should you do?', correct: "Don't share it and tell a trusted adult", options: ["Don't share it and tell a trusted adult", 'Share it right away', 'Ask them why they want it', 'Ignore it and keep chatting'], explanation: 'Never share personal information like your address with strangers online — always tell a trusted adult.' },
    { prompt: 'What is the screen that shows pictures and words on a computer called?', correct: 'Monitor', options: ['Monitor', 'Keyboard', 'Router', 'Cable'], explanation: 'The monitor is the screen that displays everything the computer is showing you.' },
    { prompt: "What should you do before clicking a link from someone you don't know?", correct: 'Ask an adult first', options: ['Ask an adult first', 'Click it immediately', 'Share it with friends', 'Type in your password'], explanation: 'Unknown links can be unsafe — always check with a trusted adult first.' },
    { prompt: 'What device lets you print your work on paper?', correct: 'A printer', options: ['A printer', 'A scanner', 'A router', 'A webcam'], explanation: 'A printer turns your digital work into a paper copy.' },
  ],

  '3-5': [
    { prompt: 'What is a strong password more likely to include?', correct: 'A mix of letters, numbers, and symbols', options: ['A mix of letters, numbers, and symbols', "Your pet's name only", "The word 'password'", 'Your birthday only'], explanation: "Strong passwords mix letters, numbers, and symbols so they're harder to guess." },
    { prompt: 'What do we call step-by-step instructions a computer follows to complete a task?', correct: 'An algorithm', options: ['An algorithm', 'A browser', 'A firewall', 'A username'], explanation: 'An algorithm is a set of ordered steps used to solve a problem or complete a task.' },
    { prompt: "What's the difference between hardware and software?", correct: 'Hardware is physical parts; software is the programs that run on them', options: ['Hardware is physical parts; software is the programs that run on them', 'Hardware is free; software costs money', 'They mean the same thing', 'Software is physical parts; hardware is programs'], explanation: 'Hardware is the physical computer parts (like a keyboard); software is the programs and instructions it runs.' },
    { prompt: "What is it called when you copy someone else's online work and claim it as your own?", correct: 'Plagiarism', options: ['Plagiarism', 'Streaming', 'Downloading', 'Coding'], explanation: "Plagiarism means using someone else's work without giving them credit." },
    { prompt: 'Why is it important to log out of shared or public computers?', correct: 'To protect your personal accounts and information', options: ['To protect your personal accounts and information', 'To make the computer run faster', "It isn't important", 'To save electricity'], explanation: 'Staying logged in on a shared computer could let someone else access your accounts.' },
    { prompt: 'What do we call a program that can find and remove harmful software from your device?', correct: 'Antivirus software', options: ['Antivirus software', 'A web browser', 'A search engine', 'A spreadsheet'], explanation: 'Antivirus software scans for and removes malicious programs that could harm your device.' },
  ],

  '6-8': [
    { prompt: "In coding, what do we call a set of instructions that repeats until a condition is met?", correct: 'A loop', options: ['A loop', 'A variable', 'A function', 'A comment'], explanation: 'A loop repeats a block of code multiple times, often until a certain condition is true.' },
    { prompt: "In coding, what is a 'variable'?", correct: 'A named container that stores a value', options: ['A named container that stores a value', 'A type of computer virus', 'A picture on the screen', 'The speed of the internet'], explanation: 'A variable stores information (like a number or word) that a program can use and change.' },
    { prompt: 'Computers store information using only two digits. What are they?', correct: '0 and 1', options: ['0 and 1', '1 and 2', 'A and B', '2 and 4'], explanation: 'Binary code represents all computer data using combinations of 0s and 1s.' },
    { prompt: 'What is the first step of the engineering design process?', correct: 'Identify the problem', options: ['Identify the problem', 'Build the final product', 'Sell the product', 'Skip straight to testing'], explanation: 'Engineers start by clearly defining the problem before brainstorming or building solutions.' },
    { prompt: "What term describes a program's mistake that causes it to behave incorrectly?", correct: 'A bug', options: ['A bug', 'A cookie', 'A firewall', 'A server'], explanation: "A 'bug' is an error in code that causes unexpected or incorrect behavior." },
    { prompt: "What does 'debugging' mean?", correct: 'Finding and fixing errors in code', options: ['Finding and fixing errors in code', 'Deleting all your code', 'Making a program run slower', 'Adding more bugs on purpose'], explanation: 'Debugging is the process of locating and correcting mistakes in a program.' },
  ],

  '9-12': [
    { prompt: "What is 'encryption'?", correct: 'Converting data into a coded form to prevent unauthorized access', options: ['Converting data into a coded form to prevent unauthorized access', 'Deleting old files automatically', 'Making a website load faster', 'Copying files to a backup drive'], explanation: 'Encryption scrambles data so only someone with the correct key can read it.' },
    { prompt: "What is a 'phishing' attack?", correct: 'A scam that tricks people into giving up personal information', options: ['A scam that tricks people into giving up personal information', 'A type of computer virus that deletes files', 'A method for speeding up downloads', 'A way to organize computer files'], explanation: 'Phishing scams impersonate trusted sources to trick victims into revealing passwords or personal data.' },
    { prompt: "In programming, what is an 'API'?", correct: 'A set of rules that lets different software talk to each other', options: ['A set of rules that lets different software talk to each other', 'A type of computer virus', 'A physical computer part', 'A brand of laptop'], explanation: 'An API (Application Programming Interface) allows different programs to communicate and share data.' },
    { prompt: "What does 'iterative design' mean in engineering?", correct: 'Repeatedly testing and improving a design based on feedback', options: ['Repeatedly testing and improving a design based on feedback', 'Designing something once and never changing it', 'Skipping the testing phase entirely', 'Copying an existing design exactly'], explanation: 'Iterative design means building, testing, and refining a solution again and again.' },
    { prompt: "What is 'machine learning'?", correct: 'A way for computers to improve at a task by learning from data', options: ['A way for computers to improve at a task by learning from data', 'A type of computer hardware', 'A method for printing documents', 'A way to charge a laptop battery'], explanation: 'Machine learning lets computer systems improve their performance by finding patterns in data, rather than being explicitly programmed for every case.' },
    { prompt: "What does 'open source' mean for software?", correct: 'Its source code is publicly available for anyone to view or modify', options: ['Its source code is publicly available for anyone to view or modify', 'It only works without an internet connection', 'It is always free of bugs', 'It can only be used by its original creator'], explanation: 'Open-source software makes its underlying code public so anyone can inspect, use, or improve it.' },
  ],
};

export default TECH_BANK;
