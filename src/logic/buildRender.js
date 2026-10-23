// src/logic/buildRender.js
// Turns a Studio Build (src/logic/builds.js) into the real thing: one
// self-contained HTML file. The same string shows in the preview and is
// what they export, so what they see is exactly what they take home.
//
// No network, no external fonts or scripts: the file works offline, on any
// device, years from now. Everything they typed goes through esc().
//
// `me` personalises it: { pet: petLook() result, dream: their Dream,
// adult: whether outside AI services can be named (their age rules) }.
// Both optional; without them it falls back to the option's own look.
// The file carries a copy, so it still reads right if they change pets.
//
// Pure, so scripts/check-builds.mjs renders every kind × option in Node.
import { kindOf, optionOf, partOf, partLevel, buildTitle, LEVEL_MASTERED } from './builds';

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// A value going into a <script> as JSON: no way to close the tag early.
const js = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function pickOf(build, partId) {
  const part = partOf(kindOf(build), partId);
  return optionOf(part, build.picks[partId]) || optionOf(part, part?.start) || {};
}

function shell(title, style, body, script = '') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<title>${esc(title)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
${style}
</style>
</head>
<body>
${body}
${script ? `<script>\n${script}\n</script>` : ''}
</body>
</html>
`;
}

/* ── Portfolio page ───────────────────────────────────────────────────── */
// The founder's Descartes builder, offline: a hero (name, headline, bio,
// call to action), a skills matrix, featured project cards, the current
// phase of life, a Descartes quote, where they're headed (their Dream) and
// a contact footer. Each section can be switched off (content.sections);
// empty ones never show, so nothing on it is made up.

export const DESCARTES_QUOTE = 'It is not enough to have a good mind; the main thing is to use it well.';

const isLight = (hex) => {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return false;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
};

function renderPage(build, kind, me) {
  const name = build.answers.name || 'Your name';
  const line = build.answers.line || 'One line about you.';
  const content = build.content || {};
  const on = (k) => content.sections?.[k] !== false;
  const c = pickOf(build, 'colors');
  const f = pickOf(build, 'type');
  const rad = pickOf(build, 'corners').radius ?? 18;
  const layout = build.picks.layout;
  const onAccent = isLight(c.accent) ? '#111111' : '#ffffff';

  const pet = me?.pet ? `<p class="pet">${esc(me.pet.emoji)} with ${esc(me.pet.name)}</p>` : '';
  const hero = on('hero') ? `<header class="hero">
<span class="pill">Personal Portfolio</span>
<h1>${esc(name)}</h1>
<p class="line">${esc(line)}</p>
${content.bio ? `<p class="bio">${esc(content.bio)}</p>` : ''}
${(content.projects || []).length && on('projects') ? `<a class="cta" href="#projects">${esc(content.cta || 'View my projects')} →</a>` : ''}
${pet}
</header>` : `<header class="hero slim"><h1>${esc(name)}</h1>${pet}</header>`;

  const blocks = [];
  if (on('skills') && content.skills?.length) {
    blocks.push(['skills', `<section class="block skills"><h2>Core expertise &amp; focus</h2><div class="badges">${content.skills.map(s => `<span>${esc(s)}</span>`).join('')}</div></section>`]);
  }
  if (on('projects') && content.projects?.length) {
    blocks.push(['projects', `<section class="block" id="projects"><h2>Featured projects</h2><div class="cards">${content.projects.map(p => `<article class="card">
${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}
<h3>${esc(p.title || 'Untitled')}</h3>
${p.desc ? `<p>${esc(p.desc)}</p>` : ''}
</article>`).join('')}</div></section>`]);
  }
  if (on('timeline') && content.stage?.title) {
    blocks.push(['timeline', `<section class="block"><h2>Current phase</h2><div class="card phase"><div class="dot" aria-hidden="true"></div><div>
<h3>${esc(content.stage.title)}</h3>
${content.stage.sub ? `<p class="sub">${esc(content.stage.sub)}</p>` : ''}
${content.stage.desc ? `<p>${esc(content.stage.desc)}</p>` : ''}
</div></div></section>`]);
  }
  // Their own words from the Dream layer, only when they've written one.
  const d = me?.dream || {};
  const dreamParts = (d.parts || []).map(p => p?.label || p).filter(Boolean).slice(0, 3);
  if (on('dream') && (dreamParts.length || d.becoming)) {
    blocks.push(['dream', `<section class="block dream"><h2>Where I’m headed</h2>
${dreamParts.length ? `<ul>${dreamParts.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
${d.becoming ? `<p class="becoming">Becoming ${esc(d.becoming)}.</p>` : ''}
</section>`]);
  }
  if (on('quote')) {
    blocks.push(['quote', `<section class="card quote"><blockquote>“${esc(content.quote || DESCARTES_QUOTE)}”</blockquote><cite>René Descartes</cite></section>`]);
  }
  const links = [
    content.email ? `<a href="mailto:${esc(content.email)}">${esc(content.email)}</a>` : '',
    content.github ? `<a href="https://${esc(content.github.replace(/^https?:\/\//, ''))}">${esc(content.github)}</a>` : '',
  ].filter(Boolean).join('');
  const footer = on('contact')
    ? `<footer class="contact"><div>© ${esc(name)}. Made with Deskartes.</div>${links ? `<div class="links">${links}</div>` : ''}</footer>`
    : '';

  let main;
  if (layout === 'split') {
    main = `<main class="split"><div class="left">${hero}</div><div class="right">${blocks.map(b => b[1]).join('')}${footer}</div></main>`;
  } else if (layout === 'bento') {
    main = `<main class="bento"><div class="tile big">${hero}</div>${blocks.map(([k, html]) => `<div class="tile t-${k}">${html}</div>`).join('')}${footer ? `<div class="tile wide">${footer}</div>` : ''}</main>`;
  } else {
    main = `<main class="column">${hero}${blocks.map(b => b[1]).join('')}${footer}</main>`;
  }

  const line1 = `${c.soft}33`;
  const style = `
body{background:${c.bg};color:${c.ink};font-family:${f.body};line-height:1.55;-webkit-font-smoothing:antialiased;min-height:100%}
h1,h2,h3{font-family:${f.head};letter-spacing:${f.track};line-height:1.1${f.upper ? ';text-transform:uppercase' : ''}}
h1{font-size:clamp(34px,8vw,56px);font-weight:${f.weight};margin:14px 0 8px}
h2{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${c.soft};margin-bottom:12px}
h3{font-size:17px;font-weight:700;margin:4px 0}
a{color:${c.accent}}
.pill{display:inline-block;font-size:12px;font-weight:600;padding:5px 12px;border-radius:999px;color:${c.accent};background:${c.accent}1f;border:1px solid ${c.accent}40}
.hero{padding:8px 0 30px;border-bottom:1px solid ${line1}}
.hero.slim{padding-bottom:16px}
.line{font-size:18px;color:${c.soft};font-weight:500}
.bio{margin-top:12px;max-width:56ch;font-size:15px}
.cta{display:inline-block;margin-top:20px;padding:12px 20px;border-radius:${rad}px;background:${c.accent};color:${onAccent};font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 8px 24px ${c.accent}40}
.pet{margin-top:12px;font-size:14px;color:${c.soft}}
.block{margin-top:34px}
.badges{display:flex;flex-wrap:wrap;gap:8px}
.badges span{padding:7px 13px;border-radius:${rad}px;background:${c.card};border:1px solid ${line1};font-size:13px;font-weight:600;box-shadow:0 2px 8px #00000014}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.card{background:${c.card};border:1px solid ${line1};border-radius:${rad}px;padding:18px 20px;box-shadow:0 10px 30px #0000001f}
.card p{font-size:14px;color:${c.soft};margin-top:4px}
.tag{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${c.accent}}
.phase{display:flex;gap:14px;align-items:flex-start}
.phase .dot{width:14px;height:14px;border-radius:50%;margin-top:6px;flex:none;background:${c.accent};box-shadow:0 0 0 6px ${c.accent}26}
.phase .sub{color:${c.accent};font-weight:600;font-size:13px}
.dream ul{list-style:none}
.dream li{padding:8px 0 8px 22px;position:relative;font-weight:600}
.dream li:before{content:'';position:absolute;left:0;top:15px;width:10px;height:10px;border-radius:50%;background:${c.accent}}
.becoming{margin-top:6px;color:${c.soft};font-style:italic}
.quote{margin-top:34px;text-align:center;font-style:italic}
.quote blockquote{font-family:Georgia,Times New Roman,serif;font-size:19px}
.quote cite{display:block;margin-top:8px;font-size:12px;font-style:normal;color:${c.soft}}
.contact{margin-top:34px;padding-top:20px;border-top:1px solid ${line1};display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;font-size:13px;color:${c.soft}}
.contact .links{display:flex;gap:16px;flex-wrap:wrap}
.column{max-width:760px;margin:0 auto;padding:40px 22px 48px}
.split{max-width:1040px;margin:0 auto;padding:40px 22px;display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:44px;align-items:start}
.split .left{position:sticky;top:24px}
.split .hero{border-bottom:0}
.split .right .block:first-child{margin-top:0}
.bento{max-width:1040px;margin:0 auto;padding:16px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.tile{background:${c.card};border:1px solid ${line1};border-radius:${rad}px;padding:20px;box-shadow:0 10px 30px #0000001f;min-width:0}
.tile .block,.tile .quote,.tile .contact{margin-top:0;border-top:0;padding-top:0}
.tile .hero{border-bottom:0;padding-bottom:0}
.tile .card{box-shadow:none}
.big{grid-column:span 2;grid-row:span 2}
.t-projects,.wide{grid-column:1/-1}
.t-quote{background:${c.accent};color:${onAccent}}
.t-quote cite{color:${onAccent};opacity:.75}
@media (max-width:720px){.split{grid-template-columns:1fr;gap:8px}.split .left{position:static}.bento{grid-template-columns:1fr 1fr}.big{grid-column:1/-1;grid-row:auto}}
`;
  return shell(`${name}: portfolio`, style, main);
}

/* ── Game ─────────────────────────────────────────────────────────────── */

function renderGame(build, kind, me) {
  const pick = pickOf(build, 'hero');
  // "Your pet": their companion stars, catching its own favourite thing.
  const hero = pick.fromPet && me?.pet ? { emoji: me.pet.emoji, catches: me.pet.treat } : pick;
  const speed = pickOf(build, 'speed');
  const ch = pickOf(build, 'challenge');
  const goal = pickOf(build, 'goal');
  const cfg = {
    title: build.answers.name || 'My game',
    hero: hero.emoji, item: hero.catches,
    speed: speed.px, every: ch.every, fall: ch.fall, ramp: ch.ramp,
    // catch: reach `target` to win. lives: `target` misses and you're out.
    // endless: 3 misses ends it, and the file keeps a best score.
    rule: goal.rule, target: goal.target,
  };
  const style = `
body{background:#10131c;color:#f2f4f8;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
canvas{display:block;width:100vw;height:100vh}
#hud{position:fixed;top:10px;left:12px;right:12px;display:flex;justify-content:space-between;font-weight:700;font-size:16px;pointer-events:none}
#over{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#10131ccc;text-align:center;padding:24px}
#over h1{font-size:30px}#over p{color:#aab3c5}
#over button{margin-top:8px;font:700 17px system-ui,sans-serif;padding:12px 26px;border-radius:999px;border:0;background:#ffcc4d;color:#1b1b1b}
`;
  const body = `<canvas id="c"></canvas>
<div id="hud"><span id="score"></span><span id="rule"></span></div>
<div id="over"><h1 id="t"></h1><p id="m"></p><button id="go">Play</button></div>`;
  const script = `
const C=${js(cfg)};
const LIVES=C.rule==='lives'?C.target:3;
const cv=document.getElementById('c'),x=cv.getContext('2d');
const $=(id)=>document.getElementById(id);
let W,H;const R=window.devicePixelRatio||1;
function size(){W=innerWidth;H=innerHeight;cv.width=W*R;cv.height=H*R;x.setTransform(R,0,0,R,0,0);}
addEventListener('resize',size);size();
function best(){try{return +(localStorage.getItem('best')||0);}catch(e){return 0;}}
let p,items,score,missed,frame,running=false,keys={},target=null,start;
function hud(){$('score').textContent='Score '+score;
 const hearts='❤'.repeat(Math.max(0,LIVES-missed));
 $('rule').textContent=C.rule==='catch'?'Goal '+score+' / '+C.target:C.rule==='lives'?hearts:'Best '+best()+' '+hearts;}
function reset(){p={x:W/2,y:H-60};items=[];score=0;missed=0;frame=0;start=Date.now();hud();}
function end(win){running=false;$('t').textContent=win?'You win!':'Game over';
 let m='Score '+score;
 if(C.rule==='endless'){const b=Math.max(score,best());try{localStorage.setItem('best',b);}catch(e){}m+=' · Best '+b;}
 $('m').textContent=m;$('go').textContent='Again';$('over').style.display='flex';}
function step(){if(!running)return;frame++;
 const level=C.ramp?Math.min(3,1+(Date.now()-start)/20000):1;
 if(keys.ArrowLeft)p.x-=C.speed;if(keys.ArrowRight)p.x+=C.speed;
 if(target!==null){const d=target-p.x;p.x+=Math.sign(d)*Math.min(Math.abs(d),C.speed);}
 p.x=Math.max(24,Math.min(W-24,p.x));
 if(frame%Math.max(12,Math.round(C.every/level))===0)items.push({x:20+Math.random()*(W-40),y:-30,v:C.fall*level*(0.8+Math.random()*0.4)});
 for(const it of items){it.y+=it.v;
  if(!it.done&&Math.abs(it.x-p.x)<34&&Math.abs(it.y-p.y)<30){it.done=true;score++;hud();if(C.rule==='catch'&&score>=C.target)return end(true);}
  if(!it.done&&it.y>H+20){it.done=true;missed++;hud();if(C.rule!=='catch'&&missed>=LIVES)return end(false);}}
 items=items.filter(i=>!i.done);
 x.clearRect(0,0,W,H);x.textAlign='center';x.textBaseline='middle';
 x.font='30px serif';for(const it of items)x.fillText(C.item,it.x,it.y);
 x.font='44px serif';x.fillText(C.hero,p.x,p.y);
 requestAnimationFrame(step);}
addEventListener('keydown',e=>{keys[e.key]=true;});addEventListener('keyup',e=>{keys[e.key]=false;});
cv.addEventListener('pointerdown',e=>{target=e.clientX;});
cv.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')target=e.clientX;});
cv.addEventListener('touchmove',e=>{target=e.touches[0].clientX;e.preventDefault();},{passive:false});
$('t').textContent=C.title;
$('m').textContent=C.rule==='catch'?'Catch '+C.target+' '+C.item+' to win.'
 :C.rule==='lives'?'Catch the '+C.item+'. Miss '+LIVES+' and you are out.'
 :'Catch as many '+C.item+' as you can. Miss '+LIVES+' and it ends.';
$('go').onclick=()=>{$('over').style.display='none';reset();running=true;target=null;requestAnimationFrame(step);};
`;
  return shell(cfg.title, style, body, script);
}

/* ── Beat ─────────────────────────────────────────────────────────────── */

// The melody: positions in the scale (null = rest), one bar of 16 steps.
const MELODY = [0, null, 2, null, 4, null, 2, 3, 5, null, 4, null, 2, null, 1, null];

function renderBeat(build) {
  const tempo = pickOf(build, 'tempo');
  const drums = pickOf(build, 'drums');
  const scale = pickOf(build, 'scale');
  const sound = pickOf(build, 'sound');
  const cfg = {
    title: build.answers.name || 'My track',
    bpm: tempo.bpm, kick: drums.kick, snare: drums.snare, hat: drums.hat,
    steps: scale.steps, wave: sound.wave, melody: MELODY,
  };
  const style = `
body{background:#14101f;color:#f3eefc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:20px;min-height:100%}
h1{font-size:28px;text-align:center}
.meta{color:#a99cc7;font-size:14px;text-align:center}
.grid{display:grid;grid-template-columns:40px repeat(16,minmax(0,1fr));gap:3px;width:min(560px,100%)}
.grid b{font-size:12px;color:#a99cc7;font-weight:600;align-self:center}
.grid i{aspect-ratio:1;border-radius:4px;background:#2a2340}
.grid i.on{background:#7b61ff}.grid i.mel.on{background:#ff8fb1}
.grid i.now{outline:2px solid #fff}
button{font:700 18px system-ui,sans-serif;padding:14px 34px;border-radius:999px;border:0;background:#ff8fb1;color:#1d1029}
@media (max-height:300px){body{gap:10px;padding:10px}h1{font-size:20px}.meta{display:none}button{padding:10px 26px;font-size:16px}}
`;
  const body = `<h1>${esc(cfg.title)}</h1>
<p class="meta">${esc(String(cfg.bpm))} BPM · ${esc(scale.label || '')} · ${esc(sound.label || '')}</p>
<div class="grid" id="g"></div>
<button id="play">▶ Play</button>`;
  const script = `
const C=${js(cfg)};
const rows=[['Kick',C.kick,''],['Snare',C.snare,''],['Hat',C.hat,''],['Notes',C.melody.map((n,i)=>n===null?-1:i).filter(i=>i>=0),'mel']];
const g=document.getElementById('g');const cells=[];
rows.forEach(([name,hits,cls],r)=>{const b=document.createElement('b');b.textContent=name;g.appendChild(b);cells[r]=[];
 for(let i=0;i<16;i++){const c=document.createElement('i');if(hits.includes(i))c.className='on '+cls;else if(cls)c.className=cls;g.appendChild(c);cells[r].push(c);}});
let ac,timer,step=0,next=0,playing=false;
function noise(t,len,freq,vol){const n=ac.createBufferSource(),buf=ac.createBuffer(1,ac.sampleRate*len,ac.sampleRate),d=buf.getChannelData(0);
 for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=buf;const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=freq;
 const v=ac.createGain();v.gain.setValueAtTime(vol,t);v.gain.exponentialRampToValueAtTime(0.001,t+len);n.connect(f).connect(v).connect(ac.destination);n.start(t);n.stop(t+len);}
function kick(t){const o=ac.createOscillator(),v=ac.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+0.15);
 v.gain.setValueAtTime(0.9,t);v.gain.exponentialRampToValueAtTime(0.001,t+0.3);o.connect(v).connect(ac.destination);o.start(t);o.stop(t+0.3);}
function note(t,n,len){const o=ac.createOscillator(),v=ac.createGain();o.type=C.wave;o.frequency.value=220*Math.pow(2,C.steps[n]/12);
 v.gain.setValueAtTime(0.0001,t);v.gain.exponentialRampToValueAtTime(C.wave==='sine'?0.35:0.14,t+0.01);v.gain.exponentialRampToValueAtTime(0.0001,t+len);
 o.connect(v).connect(ac.destination);o.start(t);o.stop(t+len+0.02);}
function tick(){const per=60/C.bpm/4;
 while(next<ac.currentTime+0.12){const s=step%16,t=next;
  if(C.kick.includes(s))kick(t);if(C.snare.includes(s))noise(t,0.18,1500,0.5);if(C.hat.includes(s))noise(t,0.05,7000,0.18);
  if(C.melody[s]!==null)note(t,C.melody[s],per*1.8);
  const d=(t-ac.currentTime)*1000;setTimeout(()=>{cells.forEach(r=>r.forEach((c,i)=>c.classList.toggle('now',i===s)));},Math.max(0,d));
  next+=per;step++;}
 timer=setTimeout(tick,25);}
document.getElementById('play').onclick=async()=>{
 if(!ac)ac=new (window.AudioContext||window.webkitAudioContext)();
 if(ac.state==='suspended')await ac.resume();
 playing=!playing;const b=document.getElementById('play');
 if(playing){step=0;next=ac.currentTime+0.05;tick();b.textContent='■ Stop';}
 else{clearTimeout(timer);b.textContent='▶ Play';cells.forEach(r=>r.forEach(c=>c.classList.remove('now')));}};
`;
  return shell(cfg.title, style, body, script);
}

/* ── Business ─────────────────────────────────────────────────────────── */

function renderBusiness(build) {
  const idea = build.answers.idea || 'Your offer';
  const who = build.answers.who || 'the people you serve';
  const head = {
    outcome: [`${cap(idea)}, sorted.`, `For ${who}. Done right, done on time.`],
    problem: [`No time to deal with it?`, `${cap(idea)} for ${who}. You hand it over, I handle it.`],
    beforeafter: [`Before: stressed. After: sorted.`, `${cap(idea)} for ${who}.`],
  }[build.picks.headline] || [cap(idea), `For ${who}.`];
  const price = {
    perjob: ['Pay per job', 'You know the price before I start. No surprises.'],
    monthly: ['One monthly plan', 'Steady help every month. Cancel any time.'],
    firstfree: ['First one free', 'Try it first. Only pay if you want more.'],
  }[build.picks.price];
  const proof = {
    story: 'I started doing this for friends. Now I’m making it official.',
    promise: 'If you’re not happy, you don’t pay.',
    // Never invented: a real result goes here, or it stays a prompt.
    result: '[Add one real result here, like “Fixed 12 bikes last month.”]',
  }[build.picks.proof];
  const action = { message: 'Message me', book: 'Book a time', waitlist: 'Join the list' }[build.picks.action];

  const style = `
body{background:#f7f6f2;color:#1d2125;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5}
main{max-width:620px;margin:0 auto;padding:48px 22px}
.tag{display:inline-block;font-size:13px;font-weight:700;color:#2f6f5e;background:#2f6f5e1a;padding:4px 10px;border-radius:999px}
h1{font-size:clamp(32px,8vw,48px);line-height:1.05;margin:16px 0 12px;letter-spacing:-0.02em}
.sub{font-size:19px;color:#4b535c}
.cards{display:grid;gap:12px;margin:32px 0}
.cards div{background:#fff;border-radius:16px;padding:18px 20px;box-shadow:0 4px 18px #0000000d}
.cards h2{font-size:16px;margin-bottom:4px}
.cards p{color:#4b535c}
.proof{font-style:italic}
a.cta{display:block;text-align:center;background:#2f6f5e;color:#fff;text-decoration:none;font-weight:700;font-size:18px;padding:16px;border-radius:14px}
`;
  const body = `<main>
<span class="tag">${esc(cap(idea))}</span>
<h1>${esc(head[0])}</h1>
<p class="sub">${esc(head[1])}</p>
<div class="cards">
<div><h2>${esc(price[0])}</h2><p>${esc(price[1])}</p></div>
<div><h2>Why trust me</h2><p class="proof">${esc(proof)}</p></div>
</div>
<a class="cta" href="#">${esc(action)} →</a>
</main>`;
  return shell(cap(idea), style, body);
}

/* ── AI helper ────────────────────────────────────────────────────────── */

// The instructions they'll paste into a chatbot, part by part.
export function aiPrompt(build) {
  const task = build.answers.task || 'something I am working on';
  return [
    pickOf(build, 'role').say,
    `I want help with: ${task.replace(/[.\s]+$/, '')}.`,
    [pickOf(build, 'tone').say, pickOf(build, 'format').say, pickOf(build, 'honesty').say].join(' '),
  ].join('\n\n');
}

// Free tiers, named only for adults: each service sets its own age rules.
const FREE_CHATS = [
  ['ChatGPT', 'https://chatgpt.com'],
  ['Claude', 'https://claude.ai'],
  ['Gemini', 'https://gemini.google.com'],
];

function renderAi(build, kind, me) {
  const name = build.answers.name || 'My AI helper';
  const prompt = aiPrompt(build);
  const where = me?.adult
    ? `<p class="where">Paste it into a free AI chat:</p><div class="chats">${FREE_CHATS.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join('')}</div>`
    : '<p class="where">Paste it into an AI chat you’re allowed to use. Most have age rules, so check first.</p>';
  const style = `
body{background:#f4f2fb;color:#1e1b2e;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.5}
main{max-width:620px;margin:0 auto;padding:36px 20px}
.tag{display:inline-block;font-size:13px;font-weight:700;color:#5b45c9;background:#5b45c91a;padding:4px 10px;border-radius:999px}
h1{font-size:clamp(28px,7vw,40px);line-height:1.1;margin:14px 0 6px;letter-spacing:-0.01em}
.sub{color:#5a5670}
pre{white-space:pre-wrap;word-wrap:break-word;background:#fff;border-radius:16px;padding:18px;margin:22px 0 12px;font:15px/1.55 ui-monospace,Menlo,Consolas,monospace;box-shadow:0 4px 18px #0000000d}
button{font:700 16px system-ui,sans-serif;padding:12px 22px;border-radius:999px;border:0;background:#5b45c9;color:#fff}
.where{margin-top:22px;font-weight:600}
.chats{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.chats a{color:#5b45c9;background:#fff;border-radius:999px;padding:8px 14px;text-decoration:none;font-weight:600}
.note{margin-top:26px;font-size:13px;color:#5a5670}
`;
  const body = `<main>
<span class="tag">AI helper</span>
<h1>${esc(name)}</h1>
<p class="sub">Your own instructions. Paste them in once, then just talk.</p>
<pre id="p">${esc(prompt)}</pre>
<button id="copy">Copy instructions</button>
${where}
<p class="note">No subscription needed. The free versions are enough for this. Double-check anything that matters: AI can sound sure and still be wrong.</p>
</main>`;
  const script = `
document.getElementById('copy').onclick=function(){var t=document.getElementById('p').textContent,b=this;
 function done(){b.textContent='Copied ✓';setTimeout(function(){b.textContent='Copy instructions';},1600);}
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,sel);}else sel();
 function sel(){var r=document.createRange();r.selectNodeContents(document.getElementById('p'));var s=window.getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');done();}catch(e){b.textContent='Selected: copy it';}}};
`;
  return shell(name, style, body, script);
}

/* ── The labs: money, story, logic, math, body, launch ───────────────── */
// Rebuilt from the founder's onboarding labs (2026-10-21): the Wealth
// Engine, the Narrative Engine, the Socratic Canvas & Logic Gate Lab, the
// Geometry Proof Engine, the Bio-Performance Lab and the Developer
// Launchpad. A few answers in, a working thing out, with the sites' own
// controls inside it to play with. What they move inside the file stays in
// the file (its own browser storage at most); the app stores only their
// answers and picks.

// A number they typed ("$50", "50 a month"), or the fallback.
function num(v, fallback, min, max) {
  const n = Number(String(v ?? '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.max(min, Math.min(max, n));
}

const lowerFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const MONO = 'ui-monospace, Menlo, Consolas, monospace';
const SANS = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

// The file's own memory: localStorage when the browser allows it (a sandbox
// preview doesn't), so an exported lab keeps what they did in it.
const STORE_JS = "const store={get(k,d){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v===null?d:v;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};";

// Every lab's frame: one palette, glassy cards with real depth, sliders,
// selects and buttons.
function labStyle(c, font = SANS) {
  return `
body{background:${c.bg};color:${c.ink};font-family:${font};line-height:1.5;-webkit-font-smoothing:antialiased;background-image:radial-gradient(circle at 15% -10%,${c.accent}22,transparent 45%),radial-gradient(circle at 110% 30%,${c.alt}55,transparent 40%);background-attachment:fixed;min-height:100%}
main{max-width:720px;margin:0 auto;padding:22px 16px 40px}
.eyebrow{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${c.accent};padding:4px 10px;border-radius:999px;background:${c.accent}1f;border:1px solid ${c.accent}40}
h1{font-size:clamp(26px,7vw,40px);line-height:1.1;margin:10px 0 6px;letter-spacing:-0.01em}
.sub{color:${c.soft};font-size:16px;max-width:52ch}
.sub b{color:${c.ink}}
.card{background:${c.card};border-radius:16px;padding:16px;margin-top:14px;box-shadow:0 1px 2px #0000000f,0 10px 30px #0000001c;border:1px solid ${c.alt}66}
.card h2{font-size:12px;color:${c.soft};font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px}
.big{font-size:clamp(30px,9vw,46px);font-weight:800;color:${c.accent};line-height:1.05}
.row{display:flex;gap:12px;flex-wrap:wrap}
.stat{flex:1;min-width:110px;padding:10px 12px;border-radius:12px;background:${c.bg}}
.stat b{display:block;font-size:19px}
.stat span{font-size:12px;color:${c.soft}}
.sl{display:block;font-size:13px;color:${c.soft};margin-top:12px}
.sl b{color:${c.ink}}
input[type=range]{width:100%;accent-color:${c.accent}}
input[type=text],input[type=time],select,textarea{width:100%;font:inherit;color:${c.ink};background:${c.bg};border:1px solid ${c.alt};border-radius:10px;padding:9px 11px;margin-top:6px}
button{font:inherit;font-weight:700;border:0;border-radius:10px;padding:9px 14px;background:${c.accent};color:${c.bg};cursor:pointer;box-shadow:0 6px 16px ${c.accent}40}
button.ghost{background:transparent;color:${c.ink};border:1.5px solid ${c.alt};box-shadow:none}
button.on{background:${c.accent};color:${c.bg};border-color:${c.accent}}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.note{font-size:12px;color:${c.soft};margin-top:16px}
.tip{margin-top:10px;padding:10px 12px;border-radius:10px;background:${c.alt}44;font-size:14px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.chip{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:${c.alt}66;color:${c.ink}}
.chip.a{background:${c.accent};color:${c.bg}}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:right;padding:6px 4px;border-bottom:1px solid ${c.alt}66}
th:first-child,td:first-child{text-align:left}
svg{display:block;max-width:100%}
pre{white-space:pre-wrap;font:12px/1.5 ${MONO};background:${c.bg};border-radius:10px;padding:12px;max-height:220px;overflow:auto}
@media (max-width:480px){.grid2{grid-template-columns:1fr}}
`;
}
const boldMd = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

/* ── Money plan: the Wealth Engine ────────────────────────────────────── */

const ALLOCATION = {
  cash: ['Capital preservation', [['Cash & savings', 100]]],
  steady: ['Balanced', [['Stocks', 40], ['Bonds', 50], ['Cash', 10]]],
  index: ['Growth', [['Stocks', 90], ['Bonds', 10]]],
};

function renderMoney(build) {
  const goal = build.answers.goal || 'My goal';
  const c = pickOf(build, 'colors');
  const model = build.picks.model || 'fire';
  const cfg = {
    monthly: num(build.answers.monthly, 50, 1, 2000),
    rate: pickOf(build, 'growth').rate,
    years: pickOf(build, 'time').years,
    view: build.picks.view,
    model,
    alloc: ALLOCATION[build.picks.growth] || ALLOCATION.steady,
    col: { accent: c.accent, alt: c.alt, soft: c.soft, ink: c.ink, bg: c.bg },
  };
  const real = cfg.view === 'real';
  const modelCard = {
    fire: `<div class="card"><h2>Freedom number (FIRE)</h2>
<p>Financial independence: when growth alone could cover your year. The usual rule of thumb is <b>25 × what you spend a year</b> (the 4% rule).</p>
<label class="sl" for="sp">You spend a year: <b id="spv"></b></label><input id="sp" type="range" min="10000" max="120000" step="1000" value="30000">
<label class="sl" for="ag">Your age now (stays on this page): <b id="agv"></b></label><input id="ag" type="range" min="13" max="70" value="25">
<div class="row" style="margin-top:12px"><div class="stat"><b id="fire"></b><span>freedom number</span></div><div class="stat"><b id="four"></b><span>a year at 4%</span></div><div class="stat"><b id="when"></b><span>at this pace</span></div></div></div>`,
    allocation: `<div class="card"><h2>Where it sits: ${esc(cfg.alloc[0])}</h2><div id="alloc"></div><p class="note">Stocks grow more and swing more. Bonds and cash swing less and grow less. The mix is a choice about sleep as much as money.</p></div>`,
    market: `<div class="card"><h2>Supply &amp; demand lab</h2>
<div id="mk"></div>
<label class="sl" for="dd">Demand shift: <b id="ddv"></b></label><input id="dd" type="range" min="-30" max="30" value="0">
<label class="sl" for="ss">Supply shift: <b id="ssv"></b></label><input id="ss" type="range" min="-30" max="30" value="0">
<label class="sl" for="ctl">Market controls</label><select id="ctl"><option value="none">Free market (no control)</option><option value="ceiling">Price ceiling (maximum price)</option><option value="floor">Price floor (minimum price)</option></select>
<label class="sl" for="pc">Control price: <b id="pcv"></b></label><input id="pc" type="range" min="10" max="100" value="40">
<div class="row" style="margin-top:12px"><div class="stat"><b id="eq"></b><span>equilibrium</span></div><div class="stat"><b id="gap"></b><span id="gapl">shortage or surplus</span></div><div class="stat"><b id="dwl"></b><span>value lost (deadweight)</span></div></div></div>`,
  }[model];
  const style = labStyle(c) + `
.legend{font-size:12px;color:${c.soft};margin-top:8px;display:flex;gap:14px;flex-wrap:wrap}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.scroll{max-height:220px;overflow:auto}
.bar{display:flex;height:22px;border-radius:999px;overflow:hidden}
`;
  const body = `<main>
<span class="eyebrow">Wealth engine</span>
<h1>${esc(goal)}</h1>
<p class="sub">Put away <b id="mo"></b> a month at <b>${cfg.rate}%</b> for <b>${cfg.years} years</b>.</p>
<div class="card">
<h2>In ${cfg.years} years</h2>
<div class="big" id="end"></div>
<div class="row" style="margin-top:12px">
<div class="stat"><b id="put"></b><span>you put in</span></div>
<div class="stat"><b id="grew" style="color:${c.accent}"></b><span>it grew by itself</span></div>
${real ? '<div class="stat"><b id="real"></b><span>in today’s prices</span></div>' : ''}
</div>
<label class="sl" for="m">Each month: <b id="mo2"></b></label>
<input id="m" type="range" min="0" max="2000" step="5" value="${cfg.monthly}">
<label class="sl" for="s">Starting with: <b id="st"></b></label>
<input id="s" type="range" min="0" max="20000" step="100" value="0">
</div>
<div class="card"><h2>${cfg.view === 'table' ? 'Year by year' : 'How it grows'}</h2><div id="viz"></div></div>
${modelCard}
<div class="card"><h2>Rule of 72</h2><p>At ${cfg.rate}%, money doubles about every <b>${Math.round(72 / cfg.rate)} years</b>. Divide 72 by any rate to check a plan in your head.</p></div>
<p class="note">Rates here are examples, not promises. Real returns go up and down${real ? ', and prices rise about 2.5% a year here' : ''}. This isn’t financial advice.</p>
</main>`;
  const script = `
const C=${js(cfg)};
const $=(id)=>document.getElementById(id);
const fmt=(n)=>'$'+Math.round(n).toLocaleString('en-US');
function grow(st,m,years){const r=C.rate/100/12,rows=[];let b=st;for(let y=1;y<=years;y++){for(let k=0;k<12;k++)b=b*(1+r)+m;rows.push({y:y,b:b,put:st+m*12*y});}return rows;}
function draw(rows){
  const v=$('viz');
  if(C.view==='table'){v.innerHTML='<div class="scroll"><table><tr><th>Year</th><th>Put in</th><th>Total</th></tr>'+rows.map(r=>'<tr><td>'+r.y+'</td><td>'+fmt(r.put)+'</td><td>'+fmt(r.b)+'</td></tr>').join('')+'</table></div>';return;}
  const max=Math.max(1,...rows.map(r=>r.b)),W=300,H=150,bw=W/rows.length;
  let s='<svg viewBox="0 0 '+W+' '+(H+16)+'" width="100%" role="img" aria-label="Growth by year">';
  rows.forEach((r,i)=>{const h1=r.put/max*H,h2=Math.max(0,(r.b-r.put)/max*H),x=i*bw+1,w=Math.max(1,bw-2);
    s+='<rect x="'+x+'" y="'+(H-h1)+'" width="'+w+'" height="'+h1+'" rx="1" fill="'+C.col.alt+'"/>';
    s+='<rect x="'+x+'" y="'+(H-h1-h2)+'" width="'+w+'" height="'+h2+'" rx="1" fill="'+C.col.accent+'"/>';});
  s+='<text x="0" y="'+(H+13)+'" font-size="10" fill="'+C.col.soft+'">Year 1</text><text x="'+W+'" y="'+(H+13)+'" font-size="10" text-anchor="end" fill="'+C.col.soft+'">Year '+rows.length+'</text></svg>';
  v.innerHTML=s+'<p class="legend"><span><i style="background:'+C.col.alt+'"></i>you put in</span><span><i style="background:'+C.col.accent+'"></i>growth</span></p>';
}
function fire(m,st){
  const sp=+$('sp').value,age=+$('ag').value,target=sp*25;$('spv').textContent=fmt(sp);$('agv').textContent=age;
  $('fire').textContent=fmt(target);$('four').textContent=fmt(target*0.04);
  const r=C.rate/100/12;let b=st,mo=0;while(b<target&&mo<720){b=b*(1+r)+m;mo++;}
  $('when').textContent=b>=target?(Math.ceil(mo/12)+' years · age '+(age+Math.ceil(mo/12))):'60+ years';
}
function alloc(){
  const cols=[C.col.accent,C.col.alt,C.col.soft];
  $('alloc').innerHTML='<div class="bar">'+C.alloc[1].map((a,i)=>'<span style="width:'+a[1]+'%;background:'+cols[i%3]+'"></span>').join('')+'</div><p class="legend">'+C.alloc[1].map((a,i)=>'<span><i style="background:'+cols[i%3]+'"></i>'+a[0]+' '+a[1]+'%</span>').join('')+'</p>';
}
function market(){
  const dd=+$('dd').value,ss=+$('ss').value,ctl=$('ctl').value,pc=+$('pc').value;
  $('ddv').textContent=(dd>0?'+':'')+dd;$('ssv').textContent=(ss>0?'+':'')+ss;$('pcv').textContent='$'+pc;
  const a=100+dd,c=10-ss;const q=(a-c)/2,p=a-q;
  let gap=0,label='no gap',dwl=0;
  if(ctl==='ceiling'&&pc<p){const qs=Math.max(0,pc-c),qd=a-pc;gap=qd-qs;label='shortage';dwl=0.5*(q-qs)*((a-qs)-(c+qs));}
  if(ctl==='floor'&&pc>p){const qs=pc-c,qd=Math.max(0,a-pc);gap=qs-qd;label='surplus';dwl=0.5*(q-qd)*((a-qd)-(c+qd));}
  $('eq').textContent='$'+Math.round(p)+' · '+Math.round(q)+' sold';$('gap').textContent=Math.round(gap);$('gapl').textContent=label;$('dwl').textContent='$'+Math.round(Math.max(0,dwl));
  const W=300,H=180,X=(v)=>v/120*W,Y=(v)=>H-v/140*H;
  let s='<svg viewBox="0 0 '+W+' '+(H+14)+'" width="100%" role="img" aria-label="Supply and demand">';
  s+='<line x1="'+X(0)+'" y1="'+Y(a)+'" x2="'+X(a)+'" y2="'+Y(0)+'" stroke="'+C.col.accent+'" stroke-width="2.5"/>';
  s+='<line x1="'+X(0)+'" y1="'+Y(c)+'" x2="'+X(120)+'" y2="'+Y(c+120)+'" stroke="'+C.col.ink+'" stroke-width="2.5"/>';
  if(ctl!=='none')s+='<line x1="0" y1="'+Y(pc)+'" x2="'+W+'" y2="'+Y(pc)+'" stroke="'+C.col.soft+'" stroke-dasharray="5 4"/>';
  s+='<circle cx="'+X(q)+'" cy="'+Y(p)+'" r="5" fill="'+C.col.accent+'"/>';
  s+='<text x="4" y="'+(H+12)+'" font-size="10" fill="'+C.col.soft+'">quantity →</text><text x="'+(W-4)+'" y="12" font-size="10" text-anchor="end" fill="'+C.col.soft+'">demand (colour) · supply (dark)</text></svg>';
  $('mk').innerHTML=s;
}
function run(){
  const m=+$('m').value,st=+$('s').value,rows=grow(st,m,C.years),last=rows[rows.length-1];
  $('mo').textContent=fmt(m);$('mo2').textContent=fmt(m);$('st').textContent=fmt(st);
  $('end').textContent=fmt(last.b);$('put').textContent=fmt(last.put);$('grew').textContent=fmt(last.b-last.put);
  if($('real'))$('real').textContent=fmt(last.b/Math.pow(1.025,C.years));
  draw(rows);
  if(C.model==='fire')fire(m,st);
  if(C.model==='allocation')alloc();
  if(C.model==='market')market();
}
document.querySelectorAll('input,select').forEach(el=>{el.oninput=run;el.onchange=run;});run();
`;
  return shell(`${goal}: money plan`, style, body, script);
}

/* ── Story map: the Narrative Engine ──────────────────────────────────── */

const STORY_SHAPES = {
  mountain: [
    ['Set-up', 'Meet the world before it changes. What does a normal day look like?', 0.8],
    ['Rising action', 'Things get harder. Each step costs a little more.', 0.55],
    ['Climax', 'The moment it all turns. No going back.', 0.12],
    ['Falling action', 'The fallout. What did it cost?', 0.5],
    ['Ending', 'A new normal. What changed for good?', 0.72],
  ],
  three: [
    ['Act 1: Set-up', 'Who, where, and what they want.', 0.8],
    ['Turning point', 'Something pushes them out the door.', 0.6],
    ['Act 2: Trouble', 'Every fix makes a new problem.', 0.42],
    ['Darkest moment', 'It looks lost.', 0.7],
    ['Act 3: Showdown', 'They face it, changed.', 0.12],
    ['Resolution', 'The world after.', 0.62],
  ],
  journey: [
    ['Ordinary world', 'Life before the story.', 0.8],
    ['The call', 'Something asks them to go.', 0.68],
    ['Crossing over', 'They step into the unknown.', 0.55],
    ['Tests and allies', 'Friends, enemies, lessons.', 0.45],
    ['The ordeal', 'The biggest fear, faced.', 0.12],
    ['The reward', 'What they won.', 0.35],
    ['The road back', 'Getting home is hard too.', 0.5],
    ['Home, changed', 'Same place, different person.', 0.75],
  ],
};
const STORY_PULL = {
  pathos: [[60, 20, 20], 'Make them **feel** it: one vivid, specific moment beats a list of sad facts.'],
  logos: [[20, 60, 20], 'Make it **add up**: causes, effects and clues the reader can follow.'],
  ethos: [[20, 20, 60], 'Make them **trust** the voice: a narrator who clearly knows this world.'],
};
// The Narrative Engine's settings: what it's for, who for, in what voice.
const STORY_MEDIUMS = [
  ['story', 'Short story or script', 'Show, don’t tell: one scene per beat.'],
  ['talk', 'Keynote speech or talk', 'One idea, three stories, one ask. Pause after the hook.'],
  ['pitch', 'Pitch deck', 'One beat per slide: problem, stakes, turn, proof, ask.'],
  ['sales', 'Sales copy or landing page', 'Lead with their problem, not your product.'],
  ['video', 'Video essay', 'Hook in the first 8 seconds. Cut every beat that drags.'],
  ['manifesto', 'Brand manifesto', 'Short lines. Present tense. Say what you refuse.'],
];
const STORY_TONES = [
  ['visionary', 'Visionary & inspiring'], ['empathic', 'Empathic & human'],
  ['analytical', 'Analytical & data-driven'], ['urgent', 'Urgent & provocative'],
];

function renderStory(build) {
  const title = build.answers.title || 'Untitled';
  const premise = (build.answers.premise || 'Something happens that changes everything.').replace(/[.!?]+$/, '');
  const c = pickOf(build, 'colors');
  const beats = STORY_SHAPES[build.picks.shape] || STORY_SHAPES.mountain;
  const hook = {
    question: `What if ${lowerFirst(premise)}?`,
    action: `No time to think. ${premise}.`,
    voice: `“You weren’t supposed to see that,” someone said. ${premise}.`,
  }[build.picks.hook];
  const [mix, pullTip] = STORY_PULL[build.picks.appeal] || STORY_PULL.pathos;
  const cfg = {
    title, premise, hook, mix,
    beats: beats.map(([name, say, y]) => ({ name, say, y })),
    mediums: STORY_MEDIUMS, col: { accent: c.accent, alt: c.alt, soft: c.soft, ink: c.ink },
  };
  const style = labStyle(c, 'Georgia, Times New Roman, serif') + `
.hook{font-size:20px;font-style:italic;border-left:4px solid ${c.accent};padding-left:12px}
#beat b{display:block;font-size:17px}
#beat{min-height:56px}
.hooks li{margin:8px 0 0 18px}
.cta{font-weight:700;color:${c.accent}}
`;
  const body = `<main>
<span class="eyebrow">Narrative engine</span>
<h1>${esc(title)}</h1>
<p class="sub">${esc(premise)}.</p>
<div class="card"><h2>First line</h2><p class="hook">${esc(hook)}</p></div>
<div class="card"><h2>Engine settings</h2>
<div class="grid2">
<label class="sl">Primary medium<select id="md">${STORY_MEDIUMS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select></label>
<label class="sl">Desired tone<select id="tn">${STORY_TONES.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select></label>
</div>
<label class="sl">Target audience<input id="au" type="text" placeholder="e.g. first-time founders"></label>
<label class="sl">Main objective<input id="ob" type="text" placeholder="e.g. get them to try it this week"></label>
</div>
<div class="card"><h2>Engine output</h2><p><b>Hooks to try</b></p><ol class="hooks" id="hooks"></ol><p style="margin-top:10px"><b>Call to action</b></p><p class="cta" id="cta"></p><p class="tip" id="mtip"></p></div>
<div class="card"><h2>The shape · tap a point</h2><div id="arc"></div><div id="beat" class="tip"></div><label class="sl">Your note for this beat<textarea id="bn" rows="2" placeholder="What happens here in your story?"></textarea></label></div>
<div class="card"><h2>The pull</h2>
<div id="radar"></div>
<label class="sl" for="pa">Feeling (pathos)</label><input id="pa" type="range" min="0" max="100" value="${mix[0]}">
<label class="sl" for="lo">Reason (logos)</label><input id="lo" type="range" min="0" max="100" value="${mix[1]}">
<label class="sl" for="et">Trust (ethos)</label><input id="et" type="range" min="0" max="100" value="${mix[2]}">
<p class="tip">${boldMd(pullTip)}</p>
</div>
<div class="card"><h2>Your outline (markdown)</h2><pre id="out"></pre></div>
</main>`;
  const script = `
const C=${js(cfg)};
${STORE_JS}
const $=(id)=>document.getElementById(id);
let at=0;const notes=store.get('notes',{});
const lf=(s)=>s.charAt(0).toLowerCase()+s.slice(1);
const HOOKS={
  visionary:(p)=>['Imagine a world where '+lf(p)+'.','What if '+lf(p)+'?','This is how the future starts.'],
  empathic:(p)=>['You know the feeling. '+p+'.','This is a story about someone like you.','Nobody tells you how it feels at first.'],
  analytical:(p)=>['Most people get this wrong. Here is what actually happens: '+lf(p)+'.','Three facts explain '+C.title+'.','What if the numbers tell a different story?'],
  urgent:(p)=>['There is no time left. '+p+'.','If you stop reading now, you miss it.','Everything changes tonight.']};
const ASK={story:'Leave them with one question:',talk:'Your one thing to try this week:',pitch:'The ask:',sales:'Get started:',video:'Before you go:',manifesto:'Join us:'};
function engine(){
  const md=$('md').value,tn=$('tn').value,au=$('au').value.trim(),ob=$('ob').value.trim();
  store.set('engine',{md:md,tn:tn,au:au,ob:ob});
  const ol=$('hooks');ol.textContent='';HOOKS[tn](C.premise).forEach(h=>{const li=document.createElement('li');li.textContent=h;ol.appendChild(li);});
  $('cta').textContent=ASK[md]+' '+(ob||'one small step today')+(au?' (for '+au+')':'')+'.';
  const m=C.mediums.find(x=>x[0]===md);$('mtip').textContent=m?m[2]:'';
  outline(md,tn,au,ob);
}
function outline(md,tn,au,ob){
  const m=C.mediums.find(x=>x[0]===md);
  const lines=['# '+C.title,'','**Premise:** '+C.premise+'.','**First line:** '+C.hook,'**Medium:** '+(m?m[1]:md)+(au?' · **For:** '+au:''),''];
  C.beats.forEach((b,i)=>{lines.push((i+1)+'. **'+b.name+'**: '+(notes[i]||b.say));});
  if(ob)lines.push('','**Call to action:** '+ob);
  $('out').textContent=lines.join('\\n');
}
function arc(){
  const W=300,H=130,n=C.beats.length,step=(W-30)/(n-1);
  const pts=C.beats.map((b,i)=>[15+i*step,10+b.y*(H-20)]);
  let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Story shape">';
  s+='<polyline fill="none" stroke="'+C.col.accent+'" stroke-width="3" stroke-linejoin="round" points="'+pts.map(p=>p.join(',')).join(' ')+'"/>';
  pts.forEach((p,i)=>{s+='<circle data-i="'+i+'" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(i===at?9:6)+'" fill="'+(i===at?C.col.accent:(notes[i]?C.col.soft:C.col.alt))+'" stroke="'+C.col.ink+'" stroke-width="1" style="cursor:pointer"/>';});
  $('arc').innerHTML=s+'</svg>';
  $('arc').querySelectorAll('circle').forEach(el=>{el.onclick=()=>{at=+el.getAttribute('data-i');arc();};});
  const b=C.beats[at],box=$('beat');box.textContent='';
  const t=document.createElement('b');t.textContent=(at+1)+'. '+b.name;box.appendChild(t);box.appendChild(document.createTextNode(b.say));
  $('bn').value=notes[at]||'';
}
function radar(){
  const v=[+$('pa').value,+$('lo').value,+$('et').value],cx=150,cy=82,R=70,ang=[-90,30,150].map(a=>a*Math.PI/180);
  const pt=(k,r)=>[cx+Math.cos(ang[k])*r,cy+Math.sin(ang[k])*r];
  let s='<svg viewBox="0 0 300 170" width="100%" role="img" aria-label="Pathos, logos and ethos mix">';
  s+='<polygon points="'+[0,1,2].map(k=>pt(k,R).join(',')).join(' ')+'" fill="none" stroke="'+C.col.alt+'" stroke-width="1.5"/>';
  s+='<polygon points="'+[0,1,2].map(k=>pt(k,R*v[k]/100).join(',')).join(' ')+'" fill="'+C.col.accent+'55" stroke="'+C.col.accent+'" stroke-width="2"/>';
  ['Feeling','Reason','Trust'].forEach((l,k)=>{const p=pt(k,R+14);s+='<text x="'+p[0]+'" y="'+(p[1]+4)+'" font-size="11" text-anchor="middle" fill="'+C.col.soft+'">'+l+'</text>';});
  $('radar').innerHTML=s+'</svg>';
}
const saved=store.get('engine',null);if(saved){$('md').value=saved.md;$('tn').value=saved.tn;$('au').value=saved.au;$('ob').value=saved.ob;}
['md','tn','au','ob'].forEach(id=>{$(id).oninput=engine;$(id).onchange=engine;});
$('bn').oninput=()=>{const v=$('bn').value;if(v.trim())notes[at]=v;else delete notes[at];store.set('notes',notes);engine();};
['pa','lo','et'].forEach(id=>{$(id).oninput=radar;});
arc();radar();engine();
`;
  return shell(`${title}: story map`, style, body, script);
}

/* ── Argument map: the Socratic Canvas + Logic Gate Lab ───────────────── */

const GATES = {
  and: ['AND', 'The claim holds only when **both** reasons are true.'],
  or: ['OR', 'The claim holds when **at least one** reason is true.'],
  xor: ['XOR', 'True when **exactly one** is true. Both, or neither, and it fails.'],
  nand: ['NAND', 'True unless **both** are true. Computers are built from this one gate alone.'],
  nor: ['NOR', 'True only when **neither** is true.'],
  implies: ['IF … THEN', 'The rule “**if A, then B**” only breaks when A is true and B is false.'],
};
const TRAPS = {
  strawman: ['Straw man', 'Arguing against a weaker version of what someone said.', '“You want school to start later? So you think school doesn’t matter.”'],
  slope: ['Slippery slope', 'Claiming one step must lead to disaster, without showing how.', '“If school starts later, soon nobody will go at all.”'],
  authority: ['Because they said so', 'Trusting a claim only because of who said it, not the reasons.', '“Someone famous said it, so it must be true.”'],
};
const SOCRATIC = [
  'What exactly do you mean by the key words?',
  'How do you know your reason is true?',
  'What would someone who disagrees say first?',
  'If this is true, what else has to be true?',
  'What would change your mind?',
];

function renderLogic(build) {
  const claim = build.answers.claim || 'Something I believe.';
  const reason = build.answers.reason || 'My best reason.';
  const c = pickOf(build, 'colors');
  const map = build.picks.map;
  const [gateName, gateSay] = GATES[build.picks.gate] || GATES.and;
  const [trapName, trapSay, trapEx] = TRAPS[build.picks.trap] || TRAPS.strawman;
  let mapHtml;
  if (map === 'versus') {
    mapHtml = `<div class="cols"><div class="col"><h3>For</h3><p class="node">${esc(reason)}</p><input type="text" placeholder="Another reason for it" aria-label="Another reason for it"></div>
<div class="col"><h3>Against</h3><input type="text" placeholder="The strongest point against it" aria-label="The strongest point against it"><input type="text" placeholder="Your answer to that point" aria-label="Your answer to that point"></div></div>`;
  } else if (map === 'socratic') {
    mapHtml = `<p class="node">${esc(reason)}</p><ol class="qs">${SOCRATIC.map(q => `<li>${esc(q)}<input type="text" aria-label="${esc(q)}" placeholder="Your answer"></li>`).join('')}</ol>`;
  } else {
    mapHtml = `<div class="tree"><div class="node claim">${esc(claim)}</div><div class="kids"><div class="node">A. ${esc(reason)}</div><div class="node"><input type="text" placeholder="B. Add a second reason" aria-label="Add a second reason"></div></div></div>`;
  }
  const font = c.id === 'circuit' ? MONO : SANS;
  const style = labStyle(c, font) + `
.claimline{font-size:20px;font-weight:700}
.node{background:${c.bg};border:1.5px solid ${c.alt};border-radius:12px;padding:10px 12px;margin-top:8px}
.node input{margin-top:0;border:0;padding:0;background:transparent}
.claim{border-color:${c.accent};font-weight:700}
.kids{display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative;padding-top:14px}
.kids:before{content:'';position:absolute;top:2px;left:25%;right:25%;height:12px;border:2px solid ${c.accent};border-bottom:0;border-radius:8px 8px 0 0}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.col h3{font-size:14px;color:${c.accent}}
.qs{padding-left:20px}
.qs li{margin-top:10px}
.toggles{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.out{font-size:22px;font-weight:800;margin-top:6px}
td.hit,th.hit{color:${c.accent};font-weight:800}
.nd{border-left:4px solid ${c.alt};padding:8px 10px;margin-top:8px;border-radius:8px;background:${c.bg};position:relative}
.nd.premise{border-left-color:${c.accent}}.nd.counter{border-left-color:${c.soft}}.nd.synthesis{border-left-color:${c.ink}}
.nd .x{position:absolute;right:6px;top:4px;padding:2px 8px;box-shadow:none}
@media (max-width:520px){.cols,.kids{grid-template-columns:1fr}.kids:before{display:none}}
`;
  const body = `<main>
<span class="eyebrow">Socratic canvas</span>
<h1 class="claimline">${esc(claim)}</h1>
<div class="card"><h2>The map</h2>${mapHtml}</div>
<div class="card"><h2>Dialectic tree · add a node</h2>
<div class="grid2">
<label class="sl">Node type<select id="nt"><option value="premise">Supporting premise</option><option value="counter">Counter-argument / objection</option><option value="synthesis">Synthesized resolution</option></select></label>
<label class="sl">Rhetorical appeal<select id="na"><option>Logos (logical reason)</option><option>Ethos (authority / ethics)</option><option>Pathos (human experience)</option></select></label>
</div>
<label class="sl">Title<input id="nti" type="text" placeholder="e.g. Sleep research"></label>
<label class="sl">Detailed explanation<input id="nde" type="text" placeholder="One or two sentences"></label>
<label class="sl">Potential fallacy (optional)<select id="nf"><option value="">None</option><option>Straw man</option><option>Slippery slope</option><option>Appeal to authority</option><option>Attacking the person</option><option>False choice</option></select></label>
<p style="margin-top:10px"><button id="add">Add node to tree</button></p>
<div id="nodes"></div>
<label class="sl">Copy your canvas<textarea id="exp" rows="4" readonly></textarea></label>
</div>
<div class="card"><h2>Logic gate: ${esc(gateName)}</h2>
<p>${boldMd(gateSay)}</p>
<div class="toggles"><button id="a" class="ghost">A is true</button><button id="b" class="ghost">B is true</button></div>
<div class="out" id="out"></div>
<table id="tt" style="margin-top:10px"></table>
</div>
<div class="card"><h2>Thinking trap: ${esc(trapName)}</h2><p>${esc(trapSay)}</p><p class="tip">${esc(trapEx)}</p><p class="note">Does your reason lean on this? If so, find a stronger one.</p></div>
</main>`;
  const script = `
const G=${js(build.picks.gate)},CLAIM=${js(claim)};
${STORE_JS}
const $=(id)=>document.getElementById(id);
const f={and:(a,b)=>a&&b,or:(a,b)=>a||b,xor:(a,b)=>a!==b,nand:(a,b)=>!(a&&b),nor:(a,b)=>!(a||b),implies:(a,b)=>!a||b}[G]||((a,b)=>a&&b);
let A=true,B=false;
const yes=(v)=>v?'true':'false';
function run(){
  $('a').className=A?'on':'ghost';$('a').textContent='A is '+yes(A);
  $('b').className=B?'on':'ghost';$('b').textContent='B is '+yes(B);
  $('out').textContent=G==='implies'?(f(A,B)?'The rule holds.':'The rule breaks.'):(f(A,B)?'The claim holds.':'Not yet: the claim doesn’t hold.');
  let t='<tr><th>A</th><th>B</th><th>Result</th></tr>';
  [[true,true],[true,false],[false,true],[false,false]].forEach(r=>{const hit=r[0]===A&&r[1]===B?' class="hit"':'';t+='<tr><td'+hit+'>'+yes(r[0])+'</td><td'+hit+'>'+yes(r[1])+'</td><td'+hit+'>'+yes(f(r[0],r[1]))+'</td></tr>';});
  $('tt').innerHTML=t;
}
let nodes=store.get('nodes',[]);
const TYPES={premise:'Supporting premise',counter:'Counter-argument',synthesis:'Synthesized resolution'};
function tree(){
  const box=$('nodes');box.textContent='';
  ['premise','counter','synthesis'].forEach(k=>nodes.filter(n=>n.type===k).forEach(n=>{
    const d=document.createElement('div');d.className='nd '+n.type;
    const h=document.createElement('b');h.textContent=n.title||TYPES[n.type];d.appendChild(h);
    if(n.desc){const p=document.createElement('div');p.textContent=n.desc;d.appendChild(p);}
    const ch=document.createElement('div');ch.className='chips';
    [TYPES[n.type],n.appeal.split(' ')[0]].concat(n.fallacy?['Check: '+n.fallacy]:[]).forEach((t,i)=>{const s=document.createElement('span');s.className='chip'+(i===0?' a':'');s.textContent=t;ch.appendChild(s);});
    d.appendChild(ch);
    const x=document.createElement('button');x.className='ghost x';x.textContent='×';x.setAttribute('aria-label','Remove');x.onclick=()=>{nodes=nodes.filter(m=>m!==n);store.set('nodes',nodes);tree();};d.appendChild(x);
    box.appendChild(d);}));
  $('exp').value=['THESIS: '+CLAIM].concat(nodes.map(n=>'- '+TYPES[n.type]+' ['+n.appeal.split(' ')[0]+']: '+(n.title||'')+(n.desc?' — '+n.desc:'')+(n.fallacy?' (check: '+n.fallacy+')':''))).join('\\n');
}
$('add').onclick=()=>{const title=$('nti').value.trim(),desc=$('nde').value.trim();if(!title&&!desc)return;
  nodes.push({type:$('nt').value,appeal:$('na').value,title:title,desc:desc,fallacy:$('nf').value});store.set('nodes',nodes);$('nti').value='';$('nde').value='';tree();};
$('a').onclick=()=>{A=!A;run();};$('b').onclick=()=>{B=!B;run();};run();tree();
`;
  return shell(`${claim}: argument map`, style, body, script);
}

/* ── Graph lab: the Vector Geometry Proof Engine ──────────────────────── */

const CURVES = {
  line: { rule: 'y = a·x + b', a: [-3, 3, 1, 0.1], b: [-5, 5, 1, 0.5] },
  parabola: { rule: 'y = a·x² + b', a: [-2, 2, 0.5, 0.1], b: [-5, 5, -2, 0.5] },
  wave: { rule: 'y = a·sin(b·x)', a: [0, 6, 3, 0.5], b: [0.2, 3, 1, 0.1] },
  growth: { rule: 'y = a·bˣ', a: [0.2, 3, 1, 0.1], b: [1.05, 2, 1.3, 0.05] },
  cubic: { rule: 'y = a·(0.25x³ − 0.5x² − x) + b', a: [-2, 2, 1, 0.1], b: [-5, 5, 1, 0.5] },
  gaussian: { rule: 'y = a·e^(−x² / 2b²)', a: [0.5, 7, 3, 0.5], b: [0.3, 3, 1, 0.1] },
};
const PYTHAGORAS_STEPS = [
  'Draw a right triangle with legs a and b and long side c.',
  'Put four copies inside a square with side (a + b). The space left in the middle is a square with side c.',
  'The big square’s area two ways: (a + b)² = 4 · (½ab) + c².',
  'Expand: a² + 2ab + b² = 2ab + c². Take 2ab from both sides: a² + b² = c². ∎',
];

function renderMath(build) {
  const name = build.answers.name || 'My Graph Lab';
  const about = build.answers.about || 'Something that changes';
  const c = pickOf(build, 'colors');
  const curve = CURVES[build.picks.curve] || CURVES.line;
  const cfg = { curve: build.picks.curve, slope: build.picks.slope, proof: build.picks.proof, steps: PYTHAGORAS_STEPS, col: { accent: c.accent, alt: c.alt, soft: c.soft, ink: c.ink } };
  const slider = (id, label, [min, max, val, step]) => `<label class="sl" for="${id}">${label}: <b id="${id}v"></b></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}">`;
  const proofBody = {
    pythagoras: `${slider('pa', 'a', [1, 8, 3, 1])}${slider('pb', 'b', [1, 8, 4, 1])}<p class="tip" id="stepTxt"></p><p style="margin-top:8px"><button class="ghost" id="prev">Previous</button> <button id="next">Next step</button></p>`,
    circle: slider('pt', 'Angle (degrees)', [0, 360, 45, 5]),
    vectors: `<div class="grid2">${slider('ux', 'A.x', [-4, 4, 3, 1])}${slider('uy', 'A.y', [-4, 4, 1, 1])}${slider('vx', 'B.x', [-4, 4, -1, 1])}${slider('vy', 'B.y', [-4, 4, 3, 1])}</div>`,
    thales: slider('th', 'Point on the circle (degrees)', [10, 170, 60, 5]),
  }[cfg.proof];
  const proofTitle = {
    pythagoras: 'Pythagoras: a² + b² = c²',
    circle: 'Unit circle: sin²θ + cos²θ = 1',
    vectors: 'Vectors: add, measure, compare',
    thales: 'Thales: an angle in a semicircle is 90°',
  }[cfg.proof];
  const style = labStyle(c, c.id === 'neon' ? MONO : SANS) + `
.rule{font:700 18px ${MONO};color:${c.accent}}
.eq{font:700 15px ${MONO};margin-top:8px}
`;
  const body = `<main>
<span class="eyebrow">Proof engine</span>
<h1>${esc(name)}</h1>
<p class="sub">x is time. y is <b>${esc(lowerFirst(about))}</b>.</p>
<div class="card"><h2>Plotter</h2><p class="rule" id="rule">${esc(curve.rule)}</p>
<div id="plot"></div>
${slider('a', 'a', curve.a)}${slider('b', 'b', curve.b)}
${cfg.slope !== 'off' ? slider('x0', cfg.slope === 'area' ? 'Area from 0 to x' : 'Point x', [-5, 5, 2, 0.1]) : ''}
<p class="eq" id="slopeOut"></p>
</div>
<div class="card"><h2>${esc(proofTitle)}</h2><div id="proof"></div>${proofBody}<p class="eq" id="proofOut"></p></div>
</main>`;
  const script = `
const C=${js(cfg)};
const $=(id)=>document.getElementById(id);
const r2=(n)=>Math.round(n*100)/100;
const F={line:(x,a,b)=>a*x+b,parabola:(x,a,b)=>a*x*x+b,wave:(x,a,b)=>a*Math.sin(b*x),growth:(x,a,b)=>a*Math.pow(b,x),
  cubic:(x,a,b)=>a*(0.25*x*x*x-0.5*x*x-x)+b,gaussian:(x,a,b)=>a*Math.exp(-x*x/(2*b*b))}[C.curve];
const W=300,H=200,X=6,Y=8,sx=(x)=>(x+X)/(2*X)*W,sy=(y)=>H-(y+Y)/(2*Y)*H;
let step=0;
function plot(){
  const a=+$('a').value,b=+$('b').value;$('av').textContent=a;$('bv').textContent=b;
  const f=(x)=>F(x,a,b);
  let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Graph of the rule">';
  for(let g=-X;g<=X;g++)s+='<line x1="'+sx(g)+'" y1="0" x2="'+sx(g)+'" y2="'+H+'" stroke="'+C.col.alt+'" stroke-width="'+(g===0?1.6:0.5)+'"/>';
  for(let g=-Y;g<=Y;g+=2)s+='<line x1="0" y1="'+sy(g)+'" x2="'+W+'" y2="'+sy(g)+'" stroke="'+C.col.alt+'" stroke-width="'+(g===0?1.6:0.5)+'"/>';
  const pts=[];for(let x=-X;x<=X;x+=0.05){const y=f(x);if(Math.abs(y)<Y*3)pts.push(sx(x).toFixed(1)+','+sy(Math.max(-Y*2,Math.min(Y*2,y))).toFixed(1));}
  if(C.slope==='area'&&$('x0')){
    const x0=+$('x0').value,lo=Math.min(0,x0),hi=Math.max(0,x0);let area=0,poly=sx(lo)+','+sy(0);
    for(let x=lo;x<=hi;x+=0.05){const y=Math.max(-Y,Math.min(Y,f(x)));poly+=' '+sx(x)+','+sy(y);area+=f(x)*0.05*(x0<0?-1:1);}
    poly+=' '+sx(hi)+','+sy(0);s+='<polygon points="'+poly+'" fill="'+C.col.accent+'33"/>';
    $('x0v').textContent=x0;$('slopeOut').textContent='Area ≈ '+r2(area);
  }
  s+='<polyline fill="none" stroke="'+C.col.accent+'" stroke-width="2.5" points="'+pts.join(' ')+'"/>';
  if(C.slope==='tangent'&&$('x0')){
    const x0=+$('x0').value,y0=f(x0),m=(f(x0+0.001)-f(x0-0.001))/0.002;
    s+='<line x1="'+sx(x0-3)+'" y1="'+sy(y0-3*m)+'" x2="'+sx(x0+3)+'" y2="'+sy(y0+3*m)+'" stroke="'+C.col.ink+'" stroke-width="1.5" stroke-dasharray="4 3"/>';
    s+='<circle cx="'+sx(x0)+'" cy="'+sy(y0)+'" r="5" fill="'+C.col.ink+'"/>';
    $('x0v').textContent=x0;$('slopeOut').textContent='Slope at x = '+x0+' is '+r2(m);
  }
  $('plot').innerHTML=s+'</svg>';
}
function proof(){
  let s='<svg viewBox="0 0 300 180" width="100%" role="img" aria-label="Proof picture">',out='';
  if(C.proof==='pythagoras'){
    const a=+$('pa').value,b=+$('pb').value,c=Math.sqrt(a*a+b*b),k=18,ox=40,oy=160;
    $('pav').textContent=a;$('pbv').textContent=b;
    s+='<polygon points="'+ox+','+oy+' '+(ox+b*k)+','+oy+' '+ox+','+(oy-a*k)+'" fill="'+C.col.accent+'33" stroke="'+C.col.accent+'" stroke-width="2"/>';
    s+='<rect x="'+ox+'" y="'+(oy-12)+'" width="12" height="12" fill="none" stroke="'+C.col.ink+'"/>';
    s+='<text x="'+(ox-14)+'" y="'+(oy-a*k/2)+'" font-size="13" fill="'+C.col.ink+'">a</text><text x="'+(ox+b*k/2)+'" y="'+(oy+15)+'" font-size="13" fill="'+C.col.ink+'">b</text>';
    s+='<text x="'+(ox+b*k/2+8)+'" y="'+(oy-a*k/2-6)+'" font-size="13" fill="'+C.col.ink+'">c</text>';
    out=a+'² + '+b+'² = '+(a*a)+' + '+(b*b)+' = '+(a*a+b*b)+', and c = '+r2(c)+'. c² = '+r2(c*c)+' ✓';
    $('stepTxt').textContent='Step '+(step+1)+' of '+C.steps.length+': '+C.steps[step];
  }else if(C.proof==='circle'){
    const t=+$('pt').value,rad=t*Math.PI/180,R=70,cx=150,cy=90,x=Math.cos(rad),y=Math.sin(rad);
    $('ptv').textContent=t;
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="none" stroke="'+C.col.alt+'" stroke-width="2"/>';
    s+='<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+x*R)+'" y2="'+(cy-y*R)+'" stroke="'+C.col.accent+'" stroke-width="2.5"/>';
    s+='<line x1="'+(cx+x*R)+'" y1="'+cy+'" x2="'+(cx+x*R)+'" y2="'+(cy-y*R)+'" stroke="'+C.col.ink+'" stroke-dasharray="4 3"/>';
    s+='<circle cx="'+(cx+x*R)+'" cy="'+(cy-y*R)+'" r="5" fill="'+C.col.accent+'"/>';
    out='cos = '+r2(x)+', sin = '+r2(y)+'. '+r2(x)+'² + '+r2(y)+'² = '+r2(x*x+y*y)+' ✓';
  }else if(C.proof==='vectors'){
    const u=[+$('ux').value,+$('uy').value],v=[+$('vx').value,+$('vy').value],k=16,cx=150,cy=100;
    ['ux','uy','vx','vy'].forEach(id=>{$(id+'v').textContent=$(id).value;});
    const line=(x1,y1,x2,y2,col,w)=>'<line x1="'+(cx+x1*k)+'" y1="'+(cy-y1*k)+'" x2="'+(cx+x2*k)+'" y2="'+(cy-y2*k)+'" stroke="'+col+'" stroke-width="'+w+'"/>';
    s+=line(0,0,u[0],u[1],C.col.ink,2.5)+line(u[0],u[1],u[0]+v[0],u[1]+v[1],C.col.soft,2.5)+line(0,0,u[0]+v[0],u[1]+v[1],C.col.accent,3);
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="3" fill="'+C.col.ink+'"/><circle cx="'+(cx+(u[0]+v[0])*k)+'" cy="'+(cy-(u[1]+v[1])*k)+'" r="5" fill="'+C.col.accent+'"/>';
    const dot=u[0]*v[0]+u[1]*v[1],mu=Math.hypot(u[0],u[1]),mv=Math.hypot(v[0],v[1]);
    const ang=mu&&mv?Math.round(Math.acos(Math.max(-1,Math.min(1,dot/(mu*mv))))*180/Math.PI)+'°':'n/a';
    out='A + B = ('+(u[0]+v[0])+', '+(u[1]+v[1])+') · A·B = '+dot+' · |A| = '+r2(mu)+' · |B| = '+r2(mv)+' · angle = '+ang;
  }else{
    const t=+$('th').value,rad=t*Math.PI/180,R=75,cx=150,cy=130,P=[cx+R*Math.cos(rad),cy-R*Math.sin(rad)],A=[cx-R,cy],B=[cx+R,cy];
    $('thv').textContent=t;
    s+='<path d="M '+A[0]+' '+cy+' A '+R+' '+R+' 0 0 1 '+B[0]+' '+cy+'" fill="none" stroke="'+C.col.alt+'" stroke-width="2"/><line x1="'+A[0]+'" y1="'+cy+'" x2="'+B[0]+'" y2="'+cy+'" stroke="'+C.col.soft+'" stroke-width="2"/>';
    s+='<polyline fill="'+C.col.accent+'22" stroke="'+C.col.accent+'" stroke-width="2.5" points="'+A.join(',')+' '+P.join(',')+' '+B.join(',')+'"/><circle cx="'+P[0]+'" cy="'+P[1]+'" r="5" fill="'+C.col.accent+'"/>';
    const v1=[A[0]-P[0],A[1]-P[1]],v2=[B[0]-P[0],B[1]-P[1]];
    const ang=Math.acos((v1[0]*v2[0]+v1[1]*v2[1])/(Math.hypot(v1[0],v1[1])*Math.hypot(v2[0],v2[1])))*180/Math.PI;
    out='The angle at the point = '+r2(ang)+'°. Move it anywhere on the arc: still 90° ✓';
  }
  $('proof').innerHTML=s+'</svg>';$('proofOut').textContent=out;
}
document.querySelectorAll('input[type=range]').forEach(el=>{el.oninput=()=>{plot();proof();};});
if($('next')){$('next').onclick=()=>{step=Math.min(C.steps.length-1,step+1);proof();};$('prev').onclick=()=>{step=Math.max(0,step-1);proof();};}
plot();proof();
`;
  return shell(`${name}: graph lab`, style, body, script);
}

/* ── Body dashboard: the Bio-Performance Lab ──────────────────────────── */
// General know-how only: no weight, no calories, no age stored. Under-18s
// use the Studio too, and a guest's age is unknown.

const TALK = [
  ['Zone 1', 'You could sing. Warm-up pace.'],
  ['Zone 2', 'Full sentences. Your base-building zone: most movement lives here.'],
  ['Zone 3', 'Short phrases. Steady and strong.'],
  ['Zone 4', 'A few words at a time. Hard, short efforts.'],
  ['Zone 5', 'Can’t talk. All-out, a minute at most.'],
];
// The Anatomical System Map's inspector: tap a system, read what it does.
const BODY_SYSTEMS = {
  brain: ['Nervous system', 'Your brain sends the signal that fires every muscle. Practice makes that signal faster and smoother, which is why skills feel easier over time.'],
  lungs: ['Lungs', 'They pull oxygen in and push carbon dioxide out. Steady breathing during easy effort is a sign you’re in the right zone.'],
  heart: ['Heart', 'A muscle that pumps oxygen-rich blood. Regular easy cardio makes each beat move more blood, so your resting heart rate can drop.'],
  muscles: ['Muscles', 'They pull on bones to move you. Hard work makes tiny tears; rest, food and sleep rebuild them a little stronger.'],
};
const PROTOCOLS = {
  endurance: ['Build your engine', [['Mon', 'Easy 30–40 min (talk-test pace)'], ['Wed', 'Intervals: 4 × 3 min hard, 2 min easy'], ['Fri', 'Easy 30 min'], ['Sat', 'Long and easy, 45–60 min'], ['Other days', 'Rest or a walk']]],
  strength: ['Build strength', [['Mon', 'Full body: squat, push, pull · 3 sets'], ['Wed', 'Full body again, a little harder'], ['Fri', 'Full body + core'], ['Daily', 'A 20-minute walk'], ['Rule', 'Stop each set with 2 reps left in the tank']]],
  recovery: ['Recover and reset', [['Daily', '20–30 min easy walk'], ['Daily', '10 min stretching or mobility'], ['Twice', 'Something easy and fun: swim, bike, dance'], ['Nightly', 'Same bedtime, screens away'], ['Rule', 'Feel better each day? Then build back up']]],
};

function renderBody(build) {
  const name = build.answers.name || '';
  const move = build.answers.move || 'Moving';
  const c = pickOf(build, 'colors');
  const heart = build.picks.heart;
  const water = build.picks.water;
  const sleep = build.picks.sleep;
  const goal = build.picks.goal || 'endurance';
  const [planName, plan] = PROTOCOLS[goal] || PROTOCOLS.endurance;
  const cups = { cups: 8, active: 10, heat: 12 }[water] || 8;
  const waterSay = {
    cups: 'About 8 cups is a common starting point. Thirst is your guide.',
    active: 'Add a cup or two for every half hour you move.',
    heat: 'Hot day? Drink before you’re thirsty, take shade breaks, and stop if you feel dizzy.',
  }[water];
  const heartBody = {
    talk: `<label class="sl" for="eff">How hard does it feel?</label><input id="eff" type="range" min="1" max="5" value="2"><div class="big" id="zone"></div><p id="zsay"></p>`,
    zones: `<label class="sl" for="age">Age (stays on this page): <b id="agev"></b></label><input id="age" type="range" min="13" max="80" value="25"><p>Estimated max heart rate: <b id="max"></b> beats a minute</p><table id="zt" style="margin-top:8px"></table>`,
    recovery: `<p>Right after moving, count your pulse for 15 seconds and times it by 4. Then again one minute later.</p><label class="sl" for="r1">Right after: <b id="r1v"></b></label><input id="r1" type="range" min="80" max="200" value="150"><label class="sl" for="r2">One minute later: <b id="r2v"></b></label><input id="r2" type="range" min="50" max="190" value="125"><div class="big" id="drop"></div><p class="note">A bigger drop usually means a fitter heart. Watch it grow over weeks.</p>`,
  }[heart];
  const sleepBody = {
    window: '<p id="sl"></p>',
    cycles: '<p id="sl"></p><p class="note">Sleep runs in about 90-minute cycles. Waking between them feels easier. Allow about 15 minutes to fall asleep.</p>',
    winddown: '<p id="sl"></p><ol id="wd" style="padding-left:20px;margin-top:8px"></ol>',
  }[sleep];
  const cfg = { heart, sleep, cups, talk: TALK, systems: BODY_SYSTEMS, col: { accent: c.accent, alt: c.alt, soft: c.soft, ink: c.ink, card: c.card } };
  const style = labStyle(c) + `
.cups{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.cup{width:34px;height:42px;border-radius:6px 6px 10px 10px;border:2px solid ${c.accent};background:transparent;padding:0;box-shadow:none}
.cup.full{background:${c.accent}}
.map{display:grid;grid-template-columns:150px 1fr;gap:14px;align-items:center}
.map svg [data-s]{cursor:pointer}
.plan td{text-align:left}
@media (max-width:480px){.map{grid-template-columns:1fr}}
`;
  const bodySvg = `<svg viewBox="0 0 120 220" width="150" role="img" aria-label="Body map: tap a system">
<circle data-s="brain" cx="60" cy="24" r="17" fill="${c.alt}" stroke="${c.ink}" stroke-width="1.5"/>
<rect x="38" y="44" width="44" height="74" rx="16" fill="${c.alt}" stroke="${c.ink}" stroke-width="1.5"/>
<ellipse data-s="lungs" cx="52" cy="66" rx="9" ry="14" fill="${c.soft}aa"/><ellipse data-s="lungs" cx="68" cy="66" rx="9" ry="14" fill="${c.soft}aa"/>
<circle data-s="heart" cx="64" cy="80" r="7" fill="${c.accent}"/>
<rect data-s="muscles" x="24" y="48" width="12" height="62" rx="6" fill="${c.alt}" stroke="${c.ink}" stroke-width="1.5"/><rect data-s="muscles" x="84" y="48" width="12" height="62" rx="6" fill="${c.alt}" stroke="${c.ink}" stroke-width="1.5"/>
<rect data-s="muscles" x="42" y="120" width="15" height="88" rx="7" fill="${c.alt}" stroke="${c.ink}" stroke-width="1.5"/><rect data-s="muscles" x="63" y="120" width="15" height="88" rx="7" fill="${c.alt}" stroke="${c.ink}" stroke-width="1.5"/>
</svg>`;
  const body = `<main>
<span class="eyebrow">Bio-performance lab</span>
<h1>${name ? `${esc(name)}’s body` : 'My body'}</h1>
<p class="sub">Moves by: <b>${esc(move)}</b></p>
<div class="card"><h2>Anatomical system map</h2><div class="map">${bodySvg}<div class="tip" id="insp"></div></div></div>
<div class="card"><h2>Performance simulator</h2>
<label class="sl" for="int">Training intensity: <b id="intv"></b></label><input id="int" type="range" min="30" max="100" value="60">
<label class="sl" for="dur">Duration: <b id="durv"></b></label><input id="dur" type="range" min="10" max="120" step="5" value="40">
<div class="row" style="margin-top:12px"><div class="stat"><b id="sz"></b><span>zone</span></div><div class="stat"><b id="fuel"></b><span>main fuel</span></div><div class="stat"><b id="rec"></b><span>to feel fresh again</span></div></div>
<p class="tip" id="adapt"></p></div>
<div class="card"><h2>Bio-protocol: ${esc(planName)}</h2><table class="plan">${plan.map(([d, w]) => `<tr><td><b>${esc(d)}</b></td><td>${esc(w)}</td></tr>`).join('')}</table></div>
<div class="card"><h2>Heart</h2>${heartBody}</div>
<div class="card"><h2>Water</h2><div class="big"><span id="drunk">0</span> / ${cups} cups</div><div class="cups" id="cups"></div><p class="tip">${esc(waterSay)}</p></div>
<div class="card"><h2>Sleep</h2><label class="sl" for="wake">I wake up at</label><input id="wake" type="time" value="07:00">${sleepBody}</div>
<p class="note">General know-how, not medical advice. Check with a doctor before big changes.</p>
</main>`;
  const script = `
const C=${js(cfg)};
const $=(id)=>document.getElementById(id);
function heart(){
  if(C.heart==='talk'){const z=C.talk[+$('eff').value-1];$('zone').textContent=z[0];$('zsay').textContent=z[1];}
  else if(C.heart==='zones'){const age=+$('age').value,max=Math.round(208-0.7*age);$('agev').textContent=age;$('max').textContent=max;
    let t='<tr><th>Zone</th><th>Beats a minute</th></tr>';[[1,50,60],[2,60,70],[3,70,80],[4,80,90],[5,90,100]].forEach(z=>{t+='<tr><td>Zone '+z[0]+'</td><td>'+Math.round(max*z[1]/100)+' to '+Math.round(max*z[2]/100)+'</td></tr>';});$('zt').innerHTML=t;}
  else{const a=+$('r1').value,b=+$('r2').value;$('r1v').textContent=a;$('r2v').textContent=b;$('drop').textContent='Dropped '+Math.max(0,a-b)+' beats';}
}
function sim(){
  const i=+$('int').value,d=+$('dur').value;$('intv').textContent=i+'%';$('durv').textContent=d+' min';
  const z=i<60?1:i<70?2:i<80?3:i<90?4:5;$('sz').textContent='Zone '+z;
  const fat=Math.max(10,Math.round(85-i*0.8));$('fuel').textContent=fat>50?'Mostly fat':'Mostly carbs';
  const hrs=Math.round((i/100)*(d/60)*24);$('rec').textContent=hrs<12?'Same day':hrs<36?'About a day':'Two days or more';
  $('adapt').textContent=z<=2?'Builds your aerobic base: more tiny blood vessels, a stronger heart, better fat burning.':z===3?'Builds steady speed: you can hold a faster pace for longer.':z===4?'Raises the ceiling: your body clears waste faster at hard paces.':'Top speed and power. Short, rare, and only when you feel fresh.';
}
function inspect(k){const s=C.systems[k];const box=$('insp');box.textContent='';const b=document.createElement('b');b.textContent=s[0];box.appendChild(b);box.appendChild(document.createElement('br'));box.appendChild(document.createTextNode(s[1]));}
document.querySelectorAll('[data-s]').forEach(el=>{el.onclick=()=>inspect(el.getAttribute('data-s'));});
let drunk=0;
function cups(){
  const box=$('cups');box.innerHTML='';
  for(let i=0;i<C.cups;i++){const b=document.createElement('button');b.className='cup'+(i<drunk?' full':'');b.setAttribute('aria-label','Cup '+(i+1));b.onclick=()=>{drunk=i<drunk?i:i+1;cups();};box.appendChild(b);}
  $('drunk').textContent=drunk;
}
function at(mins){const d=((mins%1440)+1440)%1440,h=Math.floor(d/60),m=d%60;return ((h+11)%12+1)+':'+String(m).padStart(2,'0')+(h<12?' am':' pm');}
function sleep(){
  const p=($('wake').value||'07:00').split(':'),w=(+p[0])*60+(+p[1]);
  if(C.sleep==='cycles'){$('sl').textContent='Lights out at '+at(w-6*90-15)+' (6 cycles) or '+at(w-5*90-15)+' (5 cycles).';}
  else{$('sl').textContent='For 8 hours, sleep by '+at(w-480)+'. For 9 hours, by '+at(w-540)+'. (Teens need about 8 to 10, adults 7 to 9.)';}
  if(C.sleep==='winddown'){const b=w-510;$('wd').innerHTML=[['Screens away',-60],['Lights low',-30],['Same calm thing every night: read, stretch, breathe',-15],['Lights out',0]].map(s=>'<li><b>'+at(b+s[1])+'</b> '+s[0]+'</li>').join('');}
}
document.querySelectorAll('input[type=range]').forEach(el=>{el.oninput=()=>{heart();sim();};});
$('wake').oninput=sleep;
inspect('heart');heart();sim();cups();sleep();
`;
  return shell(name ? `${name}’s body dashboard` : 'My body dashboard', style, body, script);
}

/* ── Launchpad: the Developer Launchpad + Consistency Habit Matrix ────── */
// Momentum, never streaks (docs/north-star.md): it counts what you did,
// never the days you missed.

const LAUNCH_LINKS = {
  learn: [['Khan Academy', 'https://www.khanacademy.org'], ['Wikipedia', 'https://www.wikipedia.org'], ['MIT OpenCourseWare', 'https://ocw.mit.edu'], ['Project Gutenberg', 'https://www.gutenberg.org']],
  make: [['Photopea', 'https://www.photopea.com'], ['Excalidraw', 'https://excalidraw.com'], ['Audacity', 'https://www.audacityteam.org'], ['LibreOffice', 'https://www.libreoffice.org']],
  code: [['freeCodeCamp', 'https://www.freecodecamp.org'], ['MDN Web Docs', 'https://developer.mozilla.org'], ['GitHub', 'https://github.com'], ['VS Code', 'https://code.visualstudio.com']],
};
const HABIT_NAMES = ['Deep work block', 'Learn one thing', 'Ship something small', 'Move for 20 minutes', 'Read 10 pages'];

function renderLaunch(build) {
  const name = build.answers.name || '';
  const focus = build.answers.focus || 'One thing at a time';
  const c = pickOf(build, 'colors');
  const mins = pickOf(build, 'timer').mins;
  const habitCount = pickOf(build, 'habits').count || 3;
  const board = build.picks.board;
  const links = LAUNCH_LINKS[build.picks.links] || LAUNCH_LINKS.learn;
  const cfg = { mins, board, name, focus, habits: HABIT_NAMES.slice(0, habitCount), links: links.map(l => l[0]), col: { accent: c.accent, alt: c.alt, soft: c.soft } };
  const style = labStyle(c, c.mono ? MONO : SANS) + `
.timer{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.ring{position:relative;width:132px;height:132px}
.ring b{position:absolute;inset:0;display:grid;place-items:center;font:800 28px ${MONO}}
.days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:8px}
.day{aspect-ratio:1;border-radius:8px;border:1.5px solid ${c.alt};background:transparent;color:${c.soft};font-size:11px;padding:0;box-shadow:none}
.day.done{background:${c.accent};border-color:${c.accent};color:${c.bg}}
.day.today{outline:2px solid ${c.ink};outline-offset:1px}
.mx{display:grid;grid-template-columns:minmax(90px,1.4fr) repeat(7,1fr);gap:5px;align-items:center;margin-top:6px}
.mx input{margin:0;padding:6px 8px;font-size:12px}
.mx .h{font-size:10px;color:${c.soft};text-align:center}
.links{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.links a{display:block;padding:12px;border-radius:12px;background:${c.bg};border:1px solid ${c.alt};color:${c.ink};text-decoration:none;font-weight:700}
.links a span{display:block;font-weight:400;font-size:12px;color:${c.soft}}
.badge{display:inline-block;margin-top:8px;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;background:${c.accent};color:${c.bg}}
`;
  const body = `<main>
<span class="eyebrow">Developer launchpad</span>
<h1>${name ? `${esc(name)}’s launchpad` : 'My launchpad'}</h1>
<p class="sub">Working on: <b>${esc(focus)}</b></p>
<span class="badge" id="badge">Building</span>
<div class="card"><h2>Profile</h2><div class="grid2"><label class="sl">Title / role<input id="role" type="text" placeholder="e.g. Learning developer"></label><label class="sl">Status badge<input id="stat" type="text" placeholder="e.g. Building"></label></div><label class="sl">Bio / mission<input id="bio" type="text" placeholder="One line about what you’re building"></label></div>
<div class="card"><h2>Deep work timer · ${mins} minutes</h2>
<div class="timer"><div class="ring"><svg viewBox="0 0 132 132" width="132" height="132" aria-hidden="true"><circle cx="66" cy="66" r="58" fill="none" stroke="${c.alt}" stroke-width="9"/><circle id="arc" cx="66" cy="66" r="58" fill="none" stroke="${c.accent}" stroke-width="9" stroke-linecap="round" transform="rotate(-90 66 66)" stroke-dasharray="364.4" stroke-dashoffset="0"/></svg><b id="left"></b></div>
<div><p style="margin-bottom:10px">One task: <b>${esc(focus)}</b></p><button id="go">Start</button> <button id="reset" class="ghost">Reset</button><p class="note" id="msg"></p></div></div>
</div>
<div class="card"><h2>Consistency habit matrix · this week</h2><div id="mx"></div><p class="note">Tick what you did. Blank days are just blank.</p></div>
<div class="card"><h2>Consistency velocity</h2><div id="vel"></div></div>
<div class="card"><h2>Momentum · ${board === 'month' ? 'this month' : 'this week'}</h2>
<p><b id="count">0</b> <span id="countLabel">days with something done</span></p>
<div class="days" id="days"></div>
${board === 'notes' ? '<label class="sl" for="nt">What I did today</label><textarea id="nt" rows="2" placeholder="One line is plenty"></textarea>' : ''}
<p class="note">It counts what you did. Missed days don’t count against you.</p>
</div>
<div class="card"><h2>Resource launchpad</h2><div class="links">${links.map(([label, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}<span>${esc(url.replace(/^https:\/\/(www\.)?/, ''))}</span></a>`).join('')}</div></div>
<div class="card"><h2>Export · your launchpad as data</h2><textarea id="json" rows="6" readonly></textarea></div>
</main>`;
  const script = `
const C=${js(cfg)};
${STORE_JS}
const $=(id)=>document.getElementById(id);
let left=C.mins*60,timer=null;
function show(){const m=Math.floor(left/60),s=left%60;$('left').textContent=m+':'+String(s).padStart(2,'0');$('arc').setAttribute('stroke-dashoffset',String(364.4*(1-left/(C.mins*60))));}
$('go').onclick=()=>{if(timer){clearInterval(timer);timer=null;$('go').textContent='Start';return;}
  $('go').textContent='Pause';$('msg').textContent='';timer=setInterval(()=>{left-=1;if(left<=0){left=0;clearInterval(timer);timer=null;$('go').textContent='Start';$('msg').textContent='Done. Take a real break.';tick(true);}show();},1000);};
$('reset').onclick=()=>{clearInterval(timer);timer=null;left=C.mins*60;$('go').textContent='Start';$('msg').textContent='';show();};
const today=new Date();today.setHours(0,0,0,0);
const key=(d)=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
const DAY=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const mon=new Date(today);mon.setDate(today.getDate()-((today.getDay()+6)%7));
const week=Array.from({length:7},(_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return d;});
let done=store.get('done',{}),mx=store.get('matrix',{}),names=store.get('names',C.habits);
const prof=store.get('profile',{role:'',stat:'',bio:''});
function matrix(){
  const box=$('mx');box.innerHTML='';const g=document.createElement('div');g.className='mx';
  g.appendChild(document.createElement('span'));week.forEach((d,i)=>{const h=document.createElement('span');h.className='h';h.textContent=DAY[i];g.appendChild(h);});
  C.habits.forEach((_,r)=>{
    const inp=document.createElement('input');inp.type='text';inp.value=names[r]||C.habits[r];inp.setAttribute('aria-label','Habit '+(r+1));inp.oninput=()=>{names[r]=inp.value;store.set('names',names);exp();};g.appendChild(inp);
    week.forEach(d=>{const k=r+'|'+key(d),b=document.createElement('button');b.className='day'+(mx[k]?' done':'')+(d.getTime()===today.getTime()?' today':'');b.textContent=mx[k]?'✓':'';b.setAttribute('aria-label',(names[r]||'Habit')+', '+d.toDateString()+(mx[k]?', done':''));
      b.onclick=()=>{if(mx[k])delete mx[k];else mx[k]=true;store.set('matrix',mx);matrix();velocity();exp();};g.appendChild(b);});
  });
  box.appendChild(g);
}
function velocity(){
  const counts=week.map(d=>C.habits.filter((_,r)=>mx[r+'|'+key(d)]).length+(done[key(d)]?1:0)),max=Math.max(1,C.habits.length+1),W=280,H=90,bw=W/7;
  let s='<svg viewBox="0 0 '+W+' '+(H+16)+'" width="100%" role="img" aria-label="Things done each day this week">';
  counts.forEach((n,i)=>{const h=n/max*H;s+='<rect x="'+(i*bw+6)+'" y="'+(H-h)+'" width="'+(bw-12)+'" height="'+Math.max(2,h)+'" rx="4" fill="'+(n?C.col.accent:C.col.alt)+'"/><text x="'+(i*bw+bw/2)+'" y="'+(H+13)+'" font-size="10" text-anchor="middle" fill="'+C.col.soft+'">'+DAY[i]+'</text>';});
  $('vel').innerHTML=s+'</svg>';
}
function days(){
  const box=$('days');box.innerHTML='';const list=[];
  if(C.board==='month'){const first=new Date(today.getFullYear(),today.getMonth(),1),n=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();for(let i=0;i<(first.getDay()+6)%7;i++)list.push(null);for(let d=1;d<=n;d++)list.push(new Date(today.getFullYear(),today.getMonth(),d));}
  else week.forEach(d=>list.push(d));
  let count=0;
  list.forEach(d=>{const b=document.createElement('button');if(!d){b.className='day';b.style.visibility='hidden';box.appendChild(b);return;}
    const k=key(d),on=!!done[k];if(on)count++;
    b.className='day'+(on?' done':'')+(d.getTime()===today.getTime()?' today':'');b.textContent=C.board==='month'?d.getDate():DAY[(d.getDay()+6)%7];
    b.setAttribute('aria-label',d.toDateString()+(on?', done':''));b.onclick=()=>{if(done[k])delete done[k];else done[k]=true;store.set('done',done);days();velocity();exp();};box.appendChild(b);});
  $('count').textContent=count;$('countLabel').textContent=count===1?'day with something done':'days with something done';
}
function tick(on){done[key(today)]=on;store.set('done',done);days();velocity();exp();}
function profile(){prof.role=$('role').value;prof.stat=$('stat').value;prof.bio=$('bio').value;store.set('profile',prof);$('badge').textContent=prof.stat.trim()||'Building';exp();}
function exp(){
  const week_=week.map((d,i)=>({day:DAY[i],did:C.habits.map((h,r)=>mx[r+'|'+key(d)]?(names[r]||h):'').filter(Boolean)}));
  $('json').value=JSON.stringify({name:C.name,focus:C.focus,role:prof.role,status:prof.stat,bio:prof.bio,timerMinutes:C.mins,habits:C.habits.map((h,r)=>names[r]||h),thisWeek:week_,links:C.links},null,2);
}
$('role').value=prof.role;$('stat').value=prof.stat;$('bio').value=prof.bio;['role','stat','bio'].forEach(id=>{$(id).oninput=profile;});
if($('nt')){$('nt').value=store.get('note-'+key(today),'');$('nt').oninput=()=>store.set('note-'+key(today),$('nt').value);}
profile();show();matrix();velocity();days();exp();
`;
  return shell(name ? `${name}’s launchpad` : 'My launchpad', style, body, script);
}

const RENDERERS = {
  page: renderPage, game: renderGame, beat: renderBeat, business: renderBusiness, ai: renderAi,
  money: renderMoney, story: renderStory, logic: renderLogic, math: renderMath, body: renderBody, launch: renderLaunch,
};

export function renderBuild(build, me = null) {
  const kind = kindOf(build);
  const render = kind && RENDERERS[kind.id];
  return render ? render(build, kind, me) : shell('Build', '', '<p>Nothing to show yet.</p>');
}

export const RENDERED_KINDS = Object.keys(RENDERERS);
