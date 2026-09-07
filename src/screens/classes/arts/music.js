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
      learn: [
        { heading: 'What Is Sight-Singing?', body: "Sight-singing means reading and singing written music accurately the very first time you see it, without ever having heard it before. It relies on recognizing pitch relationships, like do-re-mi steps, and rhythm patterns at a glance." },
        { heading: 'Singing Together vs. Singing Alone', body: "In a choir, singers blend their voice with everyone else's — matching pitch, dynamics, and breathing together, and listening as much as singing. As a soloist, a singer instead has full freedom to shape their own interpretation." },
      ],
      practice: [
        { question: 'What does "sight-singing" mean?', options: ['Singing with your eyes closed', 'Singing written music accurately without having heard it before', 'Singing only songs you memorized', 'Singing a duet'], answerIndex: 1, explanation: 'Sight-singing is reading notated music and singing it correctly on the first try.' },
        { question: 'In a choir, why is "blending" your voice with others important?', options: ['So one voice can be heard over everyone else', 'So the group sounds unified rather than like separate individual voices', "Blending isn't important in choir", 'To sing louder than the accompaniment'], answerIndex: 1, explanation: 'Blending means matching pitch, tone, and dynamics with the group so the ensemble sounds like one unified voice.' },
      ],
      apply: {
        prompt: 'Learn a simple 4-8 measure melody (from a method book or app) using solfège (do-re-mi), then record yourself singing it and check your pitch accuracy against a piano or tuner app.',
        checklist: ['Practiced the melody using solfège syllables', 'Recorded or performed the full phrase from memory or notation', 'Identified at least one spot where pitch needed correcting'],
      },
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
      learn: [
        { heading: 'Families of Instruments', body: 'Band instruments group into woodwinds (like flute and clarinet, which use a reed or blown air across an opening), brass (like trumpet and trombone, played by buzzing the lips into a mouthpiece), and percussion (drums and mallets, played by striking or shaking).' },
        { heading: 'Band vs. Orchestra vs. Jazz Ensemble', body: 'A concert band combines woodwinds, brass, and percussion with no strings. An orchestra adds a full string section — violin, viola, cello, and bass — as its core. A jazz ensemble usually pairs a rhythm section (piano, bass, drums) with horns, often featuring improvisation.' },
      ],
      practice: [
        { question: 'Which family does the trumpet belong to?', options: ['Woodwinds', 'Brass', 'Percussion', 'Strings'], answerIndex: 1, explanation: 'The trumpet is a brass instrument, played by buzzing the lips into a metal mouthpiece.' },
        { question: 'What is the main instrument family found in an orchestra that is usually NOT in a concert band?', options: ['Percussion', 'Woodwinds', 'Strings', 'Brass'], answerIndex: 2, explanation: "Orchestras are built around a string section (violins, violas, cellos, basses), which concert bands typically don't include." },
      ],
      apply: {
        prompt: 'Research one instrument from each family (woodwind, brass, percussion, and string) and create a short chart or poster showing how each one produces sound.',
        checklist: ['Included one instrument from each of the 4 families', 'Explained how each instrument makes sound', 'Noted which family is missing from a standard concert band'],
      },
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
      learn: [
        { heading: 'What Makes Chamber Music Different', body: 'Chamber music is written for a small group, usually one performer per part, with 2-9 musicians and no conductor. That means the musicians rely on eye contact, listening, and nonverbal cues to stay together instead of following a conductor.' },
        { heading: 'Rehearsing as a Team', body: 'Efficient chamber rehearsal means isolating tricky passages, agreeing on tempo and dynamics as a group, and deciding together who is "leading" a phrase at any given moment — all through communication rather than one designated leader.' },
      ],
      practice: [
        { question: 'What is a key feature of chamber music ensembles?', options: ['They always have more than 50 performers', 'They have no conductor and usually one performer per part', 'They only play electronic music', 'They never rehearse together'], answerIndex: 1, explanation: 'Chamber ensembles are small groups, typically with one player per part, and perform without a conductor.' },
        { question: 'Without a conductor, how do chamber musicians stay together during a performance?', options: ['They ignore each other and play independently', 'They listen closely and use eye contact and cues to coordinate', 'They use a metronome the whole time instead of listening', 'They take turns stopping to check in'], answerIndex: 1, explanation: "Chamber musicians rely on active listening and visual cues to stay synchronized since there's no conductor." },
      ],
      apply: {
        prompt: "With 2-4 classmates or friends, rehearse a short piece or rhythm pattern together without a conductor, deciding as a group who cues the start and how you'll stay in sync.",
        checklist: ['Practiced without anyone conducting the group', 'Agreed together on tempo and who gives the starting cue', 'Performed the piece staying together through at least one tricky section'],
      },
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
      learn: [
        { heading: 'Interpretation Is a Choice', body: 'Sheet music gives you the notes and rhythms, but the performer decides how to shape a phrase — dynamics, tempo flexibility (rubato), and tone color. Two performers playing the exact same piece can sound very different because of their interpretive choices.' },
        { heading: 'Stage Presence Beyond the Notes', body: 'A confident walk-on and walk-off, good posture, eye contact with the audience, and handling mistakes smoothly instead of stopping or panicking all shape how a performance is received, separate from technical accuracy.' },
      ],
      practice: [
        { question: 'Why might two performers playing the exact same written piece sound noticeably different?', options: ['One of them is using different notes', 'Performers make different interpretive choices about dynamics, tempo, and tone', 'Sheet music sounds different depending on who reads it', 'It is impossible for this to happen'], answerIndex: 1, explanation: 'The notes may be identical, but performers make personal choices about expression, dynamics, and pacing that shape interpretation.' },
        { question: 'If you make a small mistake during a solo recital, what is generally the best response?', options: ['Stop and restart the piece from the beginning', 'Keep going smoothly as if nothing happened', 'Apologize out loud to the audience', 'Leave the stage immediately'], answerIndex: 1, explanation: 'Skilled performers keep going and recover smoothly; stopping or drawing attention to a small error disrupts the performance more than the mistake itself.' },
      ],
      apply: {
        prompt: 'Prepare a short piece (30-90 seconds) and perform it for at least one other person, making 2 deliberate interpretive choices — like a dynamic swell or a tempo change — beyond just playing the correct notes.',
        checklist: ['Identified 2 specific interpretive choices before performing', 'Performed with confident posture and stage presence', 'Got feedback from your listener on how the interpretation came across'],
      },
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
      learn: [
        { heading: 'The Staff and the Notes', body: 'Music is written on a 5-line staff, where each line and space represents a different pitch. A clef, like the treble or bass clef, tells you exactly which pitches those lines and spaces represent.' },
        { heading: 'Reading Rhythm', body: 'Note shapes tell you how long to hold a sound, not just which pitch to play. In common (4/4) time, a whole note lasts 4 beats, a half note lasts 2 beats, and a quarter note lasts 1 beat — the time signature tells you how many beats fit in each measure.' },
      ],
      practice: [
        { question: 'What does the treble clef tell a musician?', options: ['How loud to play', 'Which pitches the lines and spaces of the staff represent', 'How fast to play', 'Which instrument to use'], answerIndex: 1, explanation: 'A clef establishes which pitch each line and space on the staff corresponds to.' },
        { question: 'In 4/4 time, how many beats does a quarter note get?', options: ['4 beats', '2 beats', '1 beat', 'Half a beat'], answerIndex: 2, explanation: 'A quarter note equals one beat in 4/4 time, where the bottom "4" means the quarter note is the beat unit.' },
      ],
      apply: {
        prompt: 'Write out (or find) a simple 4-measure rhythm in 4/4 time using quarter, half, and whole notes, then clap or tap it while counting the beats out loud.',
        checklist: ['Rhythm fits exactly 4 beats in each of the 4 measures', 'Used at least 2 different note values (e.g., quarter and half notes)', 'Clapped the rhythm accurately while counting beats aloud'],
      },
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
      learn: [
        { heading: 'Chords Are Built From Scales', body: 'A basic triad chord is built by stacking three notes from a scale: the root, third, and fifth. Whether that chord sounds major or minor depends on the distance, or interval, between the root and the third.' },
        { heading: 'Melody vs. Harmony', body: 'Melody is a single line of notes played one after another — the "tune" you hum. Harmony is notes played together, usually as chords, that support and add depth or color underneath that melody.' },
      ],
      practice: [
        { question: 'A basic triad chord is built by stacking which scale degrees?', options: ['Every other white key on a piano', 'The root, third, and fifth', 'Every note in the scale', 'Only the root note repeated'], answerIndex: 1, explanation: 'A triad stacks the root (1st), third, and fifth notes of a scale.' },
        { question: 'What is the main difference between melody and harmony?', options: ['Melody is a single line of notes; harmony is notes played together', 'They are the same thing', 'Harmony only exists in singing', 'Melody is always faster than harmony'], answerIndex: 0, explanation: 'Melody is a sequence of single notes (the tune); harmony is the combination of notes sounding together, like chords.' },
      ],
      apply: {
        prompt: 'Pick a simple major scale on an instrument or keyboard app, build the triad chord on the 1st, 4th, and 5th scale degrees, and play a short 4-chord progression using them under a simple melody.',
        checklist: ['Correctly built 3 triads from the same scale', 'Played the chords in a sequence (progression)', 'Played or hummed a simple melody that fits over the chords'],
      },
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
      learn: [
        { heading: 'Finding the Beat', body: 'The beat is the steady pulse in music, like a heartbeat, that you can clap or tap along to. Tempo is how fast or slow that beat goes.' },
        { heading: 'Music in Groups', body: 'Beats are grouped into small repeating patterns, like counting 4 beats and then starting again — this grouping is called the meter, so a song feels like it has a countable pattern, such as "1-2-3-4, 1-2-3-4."' },
      ],
      practice: [
        { question: 'What do we call the steady pulse you can clap along to in a song?', options: ['The melody', 'The beat', 'The lyrics', 'The title'], answerIndex: 1, explanation: 'The beat is the steady, repeating pulse underneath the music, like a heartbeat.' },
        { question: 'If a song is played very fast, we say it has a fast what?', options: ['Tempo', 'Color', 'Shape', 'Smell'], answerIndex: 0, explanation: 'Tempo describes how fast or slow the beat of a song moves.' },
      ],
      apply: {
        prompt: 'Pick your favorite song and clap along to the steady beat for the whole chorus, then try clapping it faster (fast tempo) and slower (slow tempo).',
        checklist: ['Clapped the steady beat without losing it for a full chorus', 'Tried clapping the beat faster than normal', 'Tried clapping the beat slower than normal'],
      },
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
      learn: [
        { heading: 'Sketching Musical Ideas', body: 'Composers rarely write a finished piece start to finish in one pass. They typically sketch small motifs, chord progressions, or melodic fragments, then develop, expand, and connect them — much like a writer drafting and revising.' },
        { heading: 'Arranging vs. Composing', body: 'Composing means creating original musical material — melody, harmony, and structure. Arranging means taking existing music and reshaping it for a different setting, like turning a solo piano piece into a full band arrangement.' },
      ],
      practice: [
        { question: 'What is the difference between composing and arranging?', options: ['They are the same thing', 'Composing creates original music; arranging reshapes existing music for a different setting', 'Arranging always comes before composing', 'Only classical musicians arrange music'], answerIndex: 1, explanation: 'Composing generates new musical material, while arranging takes existing music and adapts it for different instruments or styles.' },
        { question: 'How do most composers typically begin writing a piece?', options: ['By writing the entire piece perfectly in one sitting from start to finish', 'By sketching small ideas like motifs or chord progressions, then developing them', 'By only using a computer to generate the music', 'Composers never start with small ideas'], answerIndex: 1, explanation: 'Composers commonly begin with small sketched ideas — a motif, a chord progression, a rhythm — that they then develop and connect.' },
      ],
      apply: {
        prompt: 'Compose a short 8-measure original melody or beat (using an instrument, voice, or a free DAW/app like GarageBand), starting from one small musical idea (a motif) that you repeat and develop.',
        checklist: ['Started from a single short motif or idea', 'Developed or varied that idea at least once (repeated it with a change)', 'Piece is a complete 8-measure phrase with a clear ending'],
      },
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
      learn: [
        { heading: 'Four Big Periods', body: 'Western art music history broadly moves through Baroque (roughly 1600-1750, ornate and structured, like Bach), Classical (roughly 1750-1820, balanced and clear, like Mozart), Romantic (roughly 1820-1900, emotional and expressive, like Tchaikovsky), and 20th-Century/Contemporary music, which often experiments with new tonal systems.' },
        { heading: 'What Changes Between Periods', body: 'Each period shifted in instrumentation, harmony rules, and the purpose of music. Baroque music often served the church or court, Romantic music emphasized personal emotion and individual expression, and 20th-century composers frequently broke traditional harmony rules on purpose.' },
      ],
      practice: [
        { question: 'Which period is generally known for highly emotional, expressive music that emphasized individual feeling?', options: ['Baroque', 'Classical', 'Romantic', 'Medieval'], answerIndex: 2, explanation: 'The Romantic period (roughly 1820-1900) emphasized personal emotion and dramatic expression.' },
        { question: 'Composers like Bach, known for ornate, structured counterpoint, belong to which period?', options: ['Baroque', 'Romantic', 'Contemporary', 'Classical'], answerIndex: 0, explanation: 'Bach is a defining composer of the Baroque period, known for intricate, structured counterpoint.' },
      ],
      apply: {
        prompt: 'Listen to one short piece each from two different periods (for example, a Bach Baroque piece and a Tchaikovsky Romantic piece) and write a short comparison of how they differ in mood, instrumentation, and structure.',
        checklist: ['Listened to a full excerpt from each of 2 different periods', 'Named the period and approximate era for each piece', 'Described at least 2 specific differences between them'],
      },
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
      learn: [
        { heading: 'Beyond the Major/Minor Scale', body: 'Much of world and folk music uses scales or tuning systems different from the Western major/minor system — for example, pentatonic scales (5 notes, common in East Asian and folk music worldwide) or microtonal systems (notes "between" piano keys, common in Middle Eastern and Indian music).' },
        { heading: 'Instruments Reflect Culture', body: 'Traditional instruments often reflect the materials, history, and values of the culture that created them — like the sitar (India), the djembe (West Africa), or the didgeridoo (Aboriginal Australia). Each has a role connected to its cultural context, not just its sound.' },
      ],
      practice: [
        { question: 'What is a pentatonic scale?', options: ['A scale with 12 notes', 'A scale with 5 notes', 'A scale used only in Western classical music', 'A rhythm pattern, not a scale'], answerIndex: 1, explanation: 'A pentatonic scale uses 5 notes and is found widely in folk and traditional music around the world.' },
        { question: 'Why might a traditional instrument be tied closely to its culture of origin?', options: ['Instruments have no connection to culture', "Its materials, construction, and playing role often reflect that culture's history and values", 'All traditional instruments sound identical', "Cultural context doesn't affect music"], answerIndex: 1, explanation: 'Traditional instruments are often shaped by locally available materials and carry specific cultural or ceremonial roles.' },
      ],
      apply: {
        prompt: 'Choose one non-Western instrument or musical tradition (for example, sitar, djembe, gamelan, or mariachi) to research, then try to recreate a simple pattern from it using household objects or an instrument you have.',
        checklist: ['Identified the instrument or tradition and its cultural origin', "Described one thing that makes its scale or rhythm distinct from Western pop/classical music", 'Attempted to play or clap a simple pattern inspired by it'],
      },
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
      learn: [
        { heading: 'Where Genres Come From', body: 'Jazz grew out of blues and ragtime in early-1900s New Orleans and features improvisation. Rock grew from blues and R&B in the 1950s with electric guitars and drums. Hip-hop began in the 1970s in the Bronx, New York, with DJs, MCs, and rhythmic spoken lyrics over beats.' },
        { heading: 'What Makes Each Genre Sound Different', body: 'Genres are shaped by their instruments and rhythms. Jazz often features improvised horn or piano solos over swung rhythms; rock centers electric guitar and drum kit with a strong backbeat; hip-hop centers rhythm and rhyme over sampled or programmed beats; electronic music is built from synthesizers and computer-made sounds.' },
      ],
      practice: [
        { question: 'Which genre is especially known for musicians improvising, or making up solos on the spot?', options: ['Jazz', 'Classical', 'Hip-hop', 'Electronic'], answerIndex: 0, explanation: 'Improvisation, especially solos over chord changes, is a defining feature of jazz.' },
        { question: 'Hip-hop originated in which city in the 1970s?', options: ['New Orleans', 'The Bronx, New York City', 'Nashville', 'Los Angeles'], answerIndex: 1, explanation: 'Hip-hop began in the Bronx in New York City in the 1970s, with DJs and MCs performing over beats.' },
      ],
      apply: {
        prompt: 'Listen to one short song from 2 different genres (for example, jazz and hip-hop), and make a chart comparing the instruments, rhythm feel, and vocal style (or lack of vocals) in each.',
        checklist: ['Listened to a full song from each of 2 genres', 'Identified at least 2 instruments used in each song', 'Described how the rhythm or beat feels different between the two'],
      },
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
      learn: [
        { heading: 'Training Your Ear for Intervals', body: "An interval is the distance between two pitches. Ear training means learning to recognize and name intervals — like a perfect fifth or a major third — by sound alone, often by associating each interval with the opening notes of a familiar song." },
        { heading: 'Major vs. Minor Chords by Ear', body: 'Major chords generally sound bright or happy while minor chords sound darker or sadder, because of a lowered third note. A trained ear can often tell major from minor apart within a couple of seconds, without ever seeing the notation.' },
      ],
      practice: [
        { question: 'What is a musical "interval"?', options: ['A pause between songs', 'The distance between 2 pitches', 'A type of chord only', 'A tempo marking'], answerIndex: 1, explanation: 'An interval is the distance in pitch between two notes.' },
        { question: 'Which best describes the typical emotional character difference between major and minor chords?', options: ['Major sounds sad, minor sounds happy', 'Major typically sounds bright/happy, minor typically sounds darker/sadder', 'They always sound identical', 'Only minor chords exist in music'], answerIndex: 1, explanation: 'Because of the lowered third in a minor chord, major chords tend to sound brighter and minor chords tend to sound darker or more melancholy.' },
      ],
      apply: {
        prompt: 'Using a piano app or real piano, have a friend play a major chord and a minor chord back to back 5 times without you looking, and try to identify each one by ear only.',
        checklist: ['Practiced telling major from minor by ear at least 5 times', 'Recorded your accuracy (how many you got right)', 'Could explain in your own words how each one sounds different'],
      },
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
      learn: [
        { heading: 'Listening for Form', body: 'Musical form is the overall structure or organization of a piece — like verse-chorus form in pop music, or ABA form in classical music. Identifying form means noticing when sections repeat, change, or return.' },
        { heading: 'Texture and Timbre', body: 'Texture describes how many "layers" are happening at once — monophonic is a single line, homophonic is a melody with accompaniment, and polyphonic is multiple independent melodic lines at once. Timbre is the unique tone color that lets you tell instruments or voices apart even at the same pitch and volume.' },
      ],
      practice: [
        { question: 'What does "musical form" refer to?', options: ['How loud a piece is', 'The overall structural organization of a piece, such as verse-chorus', 'The tempo marking', 'The instrument used'], answerIndex: 1, explanation: 'Form describes the large-scale structure of a piece — how its sections are organized and relate to each other.' },
        { question: 'What is "timbre"?', options: ['The speed of a piece', 'The tone color or quality that distinguishes instruments or voices from each other', 'The loudness of a note', 'The key signature'], answerIndex: 1, explanation: 'Timbre is the distinct tone quality that lets you tell a violin from a flute even when playing the same pitch and volume.' },
      ],
      apply: {
        prompt: 'Listen closely to one song and map out its form (for example, Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus), noting the timestamp where each section starts.',
        checklist: ['Labeled at least 4 distinct sections with approximate timestamps', 'Identified which sections repeat', 'Described the texture (thin/thick, few/many layers) in at least one section'],
      },
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
      learn: [
        { heading: 'How Signal Flow Works', body: 'Recording signal flow is the path sound travels: from the source (voice or instrument), into a microphone that converts sound into an electrical signal, through a preamp that boosts that signal, into an interface or mixer, and finally into recording software. Understanding this path helps troubleshoot problems.' },
        { heading: 'Mic Placement Matters', body: "Where you place a microphone relative to the sound source changes the recording dramatically. Too close can cause distortion or overly boomy bass (called the proximity effect); too far picks up more room echo and noise. Different mic types, like condenser versus dynamic, suit different situations." },
      ],
      practice: [
        { question: 'What is "signal flow" in recording?', options: ['The tempo of the song being recorded', 'The path sound travels from source through mic and equipment into the recording', 'The volume of the mix', 'A type of microphone'], answerIndex: 1, explanation: 'Signal flow describes the path an audio signal takes from its source through the microphone, preamp, and interface into the recording software.' },
        { question: 'What can happen if a microphone is placed too close to a sound source?', options: ['Nothing changes', 'It can cause distortion or an overly boomy bass sound (proximity effect)', 'The recording becomes silent', 'It automatically improves audio quality'], answerIndex: 1, explanation: 'Placing a mic too close can trigger the proximity effect, causing excess bass buildup or distortion.' },
      ],
      apply: {
        prompt: 'Using a phone or any microphone, record the same short phrase (spoken or sung) at 3 different distances from the mic, then listen back and describe how the sound changed.',
        checklist: ['Recorded the same phrase at 3 distinct distances', 'Listened back and compared the recordings', 'Described how proximity affected the tone or clarity'],
      },
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
      learn: [
        { heading: 'What a DAW Does', body: 'A Digital Audio Workstation — like GarageBand, Logic, Ableton, or FL Studio — is software for recording, editing, arranging, and mixing audio and MIDI on a computer or tablet. It is essentially the digital equivalent of a whole recording studio.' },
        { heading: 'MIDI vs. Audio', body: 'Audio tracks are actual recorded sound waves. MIDI tracks are instructions — which note, how long, how hard — that trigger a virtual instrument to generate sound. That means MIDI can be edited and replayed with a completely different instrument sound after recording.' },
      ],
      practice: [
        { question: 'What does DAW stand for?', options: ['Digital Audio Workstation', 'Direct Audio Wire', 'Digital Amplifier Wave', 'Data Audio Web'], answerIndex: 0, explanation: 'DAW stands for Digital Audio Workstation, the software used to record, edit, and mix music.' },
        { question: 'What is a key difference between a MIDI track and an audio track?', options: ['They are identical', 'MIDI stores playing instructions (note, length, velocity) rather than recorded sound', 'Audio tracks cannot be edited', 'MIDI only works with drums'], answerIndex: 1, explanation: 'MIDI records performance data like which notes were played and how, so it can later be changed or reassigned to a different instrument sound, unlike a recorded audio waveform.' },
      ],
      apply: {
        prompt: 'Using a free DAW (GarageBand, BandLab, or similar), create a short 8-16 bar track combining at least one recorded audio track and one MIDI/virtual instrument track.',
        checklist: ['Included at least one recorded audio track', 'Included at least one MIDI/virtual instrument track', 'Balanced the volume levels so no track overpowers the others'],
      },
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
      learn: [
        { heading: 'Building Sound From Scratch', body: 'Synthesis creates sound electronically, usually starting with a basic waveform (sine, square, or sawtooth), then shaping it with filters that cut or boost certain frequencies and envelopes that control how volume changes over time — attack, decay, sustain, and release.' },
        { heading: 'Sampling Uses Existing Sound', body: 'Sampling means taking a recorded snippet of real sound — a drum hit, a vocal phrase, an orchestral note — and reusing or manipulating it, like pitching it up or down, looping it, or chopping it, inside new music, rather than generating sound from scratch like synthesis does.' },
      ],
      practice: [
        { question: 'What are the four stages of a typical synthesizer envelope, known as ADSR?', options: ['Attack, Decay, Sustain, Release', 'Start, Middle, End, Fade', 'Loud, Soft, Fast, Slow', 'Bass, Mid, Treble, Volume'], answerIndex: 0, explanation: "ADSR stands for Attack, Decay, Sustain, and Release — the four stages describing how a sound's volume changes over time." },
        { question: 'What is the main difference between synthesis and sampling?', options: ['They are the same technique', 'Synthesis generates sound electronically from scratch; sampling reuses recorded sound', 'Sampling can only be used for drums', 'Synthesis always uses real instrument recordings'], answerIndex: 1, explanation: 'Synthesis builds sound from basic waveforms, while sampling takes and manipulates pre-recorded audio.' },
      ],
      apply: {
        prompt: "Using a free synth app or a DAW's built-in synthesizer, create one original sound by adjusting the waveform, filter, and ADSR envelope, then separately import or record a short sample and manipulate it (pitch, loop, or chop) in the same project.",
        checklist: ['Created a synthesized sound and adjusted at least 2 parameters (e.g., filter and envelope)', 'Used a sampled sound and manipulated it in some way', 'Can explain the difference between the synth sound and the sampled sound in your project'],
      },
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
