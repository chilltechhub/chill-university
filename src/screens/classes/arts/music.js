// src/screens/classes/arts/music.js
import React from 'react';
import ClassTopicScreen from '../../../components/ClassTopicScreen';

const topics = [
    // 1. Performance (Purple)
    {
      key: 'vocalChoral',
      title: 'Vocal & Choral',
      grade: '3-5',
      color: '#8E24AA',
      description:
        'Sight‑singing, ensemble singing, solo repertoire, vocal technique.',
      help: {
        videos: [
          { title: 'Learn how to SIGHT SING', url: 'https://youtu.be/CorjNdGT2Z4?si=44vW0yyklLhRKuZl' },
          { title: 'How to Sing in Harmony', url: 'https://youtu.be/vYqje5uLftE?si=CUTAExFql4p2BihM' },
          { title: 'Solo & Ensemble Prep Made Easy', url: 'https://youtu.be/rbgkCgw4NnA?si=L67aVMDj3U-LquwS' },
        ],
        readings: [
          { title: '8 Vocal Techniques Every Singer Must Know', url: 'https://www.mi.edu/in-the-know/8-vocal-techniques-every-singer-must-know/' },
        ],
      },
    },
    {
      key: 'instrumental',
      title: 'Instrumental',
      grade: '3-5',
      color: '#8E24AA',
      description:
        'Band (woodwinds, brass, percussion), orchestra (strings, winds), jazz ensembles.',
      help: {
        videos: [
          { title: '53 - Tips for Improving Your Jazz Ensemble', url: 'https://youtu.be/Zulq0RDSwwk?si=-zbnZTaKtpHCBeM6' },
        ],
        readings: [
          { title: 'Instruments of the Orchestra', url: 'https://www.symphonyrockies.org/instruments-of-the-orchestra' },
        ],
      },
    },
    {
      key: 'ensembleChamber',
      title: 'Ensemble & Chamber',
      grade: '6-8',
      color: '#8E24AA',
      description:
        'Small‑group collaboration, repertoire, and rehearsal techniques.',
      help: {
        videos: [
          { title: '10 Tips for Playing in a Chamber Group', url: 'https://youtu.be/wfYwzYdYHZE?si=ylK_UZPQUwYsUsWp' },
        ],
        readings: [],
      },
    },
    {
      key: 'soloPerformance',
      title: 'Solo Performance',
      grade: '6-8',
      color: '#8E24AA',
      description:
        'Stage presence, interpretation, and recital preparation.',
      help: {
        videos: [
          { title: 'Solo Performance Tips', url: 'https://www.kawai.co.uk/wp-en/solo-performance-tips' },
        ],
        readings: [],
      },
    },
    // 2. Music Theory & Composition (Blue)
    {
      key: 'notationSightReading',
      title: 'Notation & Sight‑Reading',
      grade: '3-5',
      color: '#039BE5',
      description:
        'Reading staff notation, rhythms, and musical symbols.',
      help: {
        videos: [
          { title: 'Complete Guide to Sight Reading Music', url: 'https://youtu.be/-94VoI66ZkQ?si=UGOs9lCQlrJmAF5T' },
          { title: 'Reading rhythms in sheet music', url: 'https://pureocarinas.com/reading-rhythms-sheet-music' },
        ],
        readings: [
          { title: '60 Music Symbols and Their Meanings', url: 'https://blog.landr.com/music-symbols/' },
        ],
      },
    },
    {
      key: 'harmonyMelody',
      title: 'Harmony & Melody',
      grade: '6-8',
      color: '#039BE5',
      description:
        'Scales, chord structure, harmonic progression, melodic development.',
      help: {
        videos: [
          { title: 'Melody and harmony', url: 'https://www.bbc.co.uk/bitesize/articles/zkwtvj6#zngg9ty' },
          { title: 'How Chords Work in Music', url: 'https://youtu.be/2RCOcEu-xLQ?si=-rS1PGmp1dQYtFFv' },
          { title: 'AP Music Theory: Harmonic Progression', url: 'https://youtu.be/W-AGzBiF3ec?si=019YyTLPxzR5hBLH' },
        ],
        readings: [
          { title: 'Composition and Melodic Development', url: 'https://www.thejazzpianosite.com/jazz-piano-lessons/jazz-reharmonization/composition-and-melodic-development/' },
        ],
      },
    },
    {
      key: 'rhythmMeter',
      title: 'Rhythm & Meter',
      grade: 'K-2',
      color: '#039BE5',
      description:
        'Beat, tempo, time signatures, syncopation, polyrhythms.',
      help: {
        videos: [
          { title: 'Rhythm, Meter, Tempo, and Syncopation', url: 'http://www.musicappreciation.com/rhythmclass.htm' },
        ],
        readings: [
          { title: 'What is Rhythm in Music', url: 'https://www.tonegym.co/blog/item?id=what-is-rhythm' },
          { title: 'Understanding Time Signatures', url: 'https://www.libertyparkmusic.com/musical-time-signatures/' },
        ],
      },
    },
    {
      key: 'compositionTechniques',
      title: 'Composition Techniques',
      grade: '9-12',
      color: '#039BE5',
      description:
        'Songwriting, arranging, electronic composition, sketching ideas.',
      help: {
        videos: [
          { title: 'How to Compose Music: Electronic Music Guide', url: 'https://www.supremetracks.com/how-to-compose-electronic-music/' },
        ],
        readings: [
          { title: 'Music Composition Techniques and Resources', url: 'https://online.berklee.edu/takenote/music-composition-techniques-and-resources/' },
          { title: 'Arranging Techniques', url: 'https://composingthescore.wordpress.com/2016/10/03/arranging-techniques/' },
        ],
      },
    },
    // 3. Music History & Culture (Green)
    {
      key: 'westernArtMusic',
      title: 'Western Art Music',
      grade: '9-12',
      color: '#43A047',
      description:
        'Baroque, Classical, Romantic, 20th‑Century, and Contemporary periods.',
      help: {
        videos: [],
        readings: [
          { title: 'What is Baroque Music?', url: 'https://www.baroque.org/baroque/whatis' },
          { title: 'An Overview Of The 20th Century Music Era', url: 'https://vidaartmanagement.com/blog/-an-overview-of-the-20th-century-music-era' },
          { title: 'Western Music History PDF', url: 'https://www.nhme.org/_media/music-history2.pdf' },
        ],
      },
    },
    {
      key: 'worldFolk',
      title: 'World & Folk Traditions',
      grade: '6-8',
      color: '#43A047',
      description:
        'Non‑Western scales, instruments, and cultural contexts.',
      help: {
        videos: [
          { title: 'What Instruments Are Used In Folk Music?', url: 'https://youtu.be/GhHvDJDxJeY?si=S6ZNONPcqr_I2iQz' },
        ],
        readings: [
          { title: 'Non-Western forms', url: 'https://www.britannica.com/art/musical-form/Non-Western-forms' },
        ],
      },
    },
    {
      key: 'popularGenres',
      title: 'Popular Music & Modern Genres',
      grade: '3-5',
      color: '#43A047',
      description:
        'Jazz, rock, hip‑hop, electronic, and pop studies.',
      help: {
        videos: [],
        readings: [
          { title: 'Jazz', url: 'https://www.britannica.com/art/jazz' },
          { title: 'Rock', url: 'https://www.britannica.com/art/rock-music' },
          { title: 'Hip Hop History', url: 'https://www.iconcollective.edu/hip-hop-history' },
          { title: 'Electronic Music', url: 'https://www.britannica.com/art/electronic-music' },
        ],
      },
    },
    // 4. Listening & Aural Skills (Orange)
    {
      key: 'earTraining',
      title: 'Ear Training',
      grade: '6-8',
      color: '#FB8C00',
      description:
        'Interval, chord, and rhythm recognition.',
      help: {
        videos: [
          { title: 'Ear Training for Chords, Intervals, and Scales', url: 'https://www.youtube.com/live/E3GLdBJX9wg?si=TuCJvum9sr6Sr6rA' },
          { title: 'Rhythm Listening Quiz', url: 'https://youtu.be/kDg2XBNKbBs?si=O4cgx8N7A6CVwWFQ' },
        ],
        readings: [],
      },
    },
    {
      key: 'criticalListening',
      title: 'Critical Listening',
      grade: '9-12',
      color: '#FB8C00',
      description:
        'Analyzing form, texture, timbre, and expressive elements.',
      help: {
        videos: [
          { title: 'Musical Texture Definition', url: 'https://youtu.be/teh22szdnRQ?si=gl55k75m7Gd6TneR' },
          { title: 'What is Timbre?', url: 'https://youtu.be/AjJLAcDb_MU?si=AHYg_XtqM1bY1T7B' },
        ],
        readings: [],
      },
    },
    // 5. Music Technology & Production (Teal)
    {
      key: 'recordingTechniques',
      title: 'Recording Techniques',
      grade: '9-12',
      color: '#00897B',
      description:
        'Microphone use, signal flow, and basic acoustics.',
      help: {
        videos: [
          { title: 'How do microphones work?', url: 'https://youtu.be/d_crXXbuEKE?si=42-kykbOknEONW6K' },
          { title: 'Understanding Signal Flow in a Recording Studio', url: 'https://youtu.be/_55VqPSSwV0?si=2CAnP-Ye5QbL8Mx0' },
        ],
        readings: [],
      },
    },
    {
      key: 'daws',
      title: 'Digital Audio Workstations (DAWs)',
      grade: '9-12',
      color: '#00897B',
      description:
        'MIDI, editing, mixing, and mastering fundamentals.',
      help: {
        videos: [],
        readings: [
          { title: 'What is a DAW?', url: 'https://www.avid.com/resource-center/what-is-a-daw' },
        ],
      },
    },
    {
      key: 'synthesisSampling',
      title: 'Sound Synthesis & Sampling',
      grade: '9-12',
      color: '#00897B',
      description:
        'Basics of synthesis engines, samplers, and sound design.',
      help: {
        videos: [
          { title: 'Synthesis for beginners', url: 'https://youtu.be/eu0zpa7OiYA?si=WVnU67cI3YIrmjh1' },
        ],
        readings: [
          { title: 'Synthesis Methods Explained', url: 'https://www.perfectcircuit.com/signal/what-is-sampling?srsltid=AfmBOop1DTPAW9vsNsDBK_82drVJH2VH9LSc3x-Ar7njd9CSO1tJe8WE' },
        ],
      },
    },
  ];

export default function MusicScreen() {
  return <ClassTopicScreen title={"Music"} classKey="Music" fallbackTopics={topics} />;
}
