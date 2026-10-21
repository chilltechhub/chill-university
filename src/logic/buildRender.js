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

/* ── Page ─────────────────────────────────────────────────────────────── */

function pageBlock(build, kind, block, me) {
  if (block === 'dream') {
    // Their own words from the Dream layer; a plain line until they write one.
    const d = me?.dream || {};
    const parts = (d.parts || []).map(p => p?.label || p).filter(Boolean).slice(0, 3);
    const rows = parts.length ? parts.map(p => `<li>${esc(p)}</li>`).join('') : '<li>Something of my own</li>';
    const becoming = d.becoming ? `<p class="becoming">Becoming ${esc(d.becoming)}.</p>` : '';
    return `<section class="block dream"><h2>Where I’m headed</h2><ul>${rows}</ul>${becoming}</section>`;
  }
  if (block === 'quote') {
    return `<section class="block quote"><p>“Most people never start. I did.”</p></section>`;
  }
  if (block === 'skills') {
    // Their real progress in this Build, not made-up skill bars.
    const rows = kind.parts.map((p) => {
      const lv = partLevel(build, p.id);
      return `<li><span>${esc(p.label)}</span><span class="bar"><i style="width:${Math.round((lv / LEVEL_MASTERED) * 100)}%"></i></span></li>`;
    }).join('');
    return `<section class="block skills"><h2>What I’m learning</h2><ul>${rows}</ul></section>`;
  }
  return `<section class="block links"><h2>Find me</h2>
<a href="#">What I’m building →</a>
<a href="#">Say hello →</a>
</section>`;
}

function renderPage(build, kind, me) {
  const name = build.answers.name || 'Your name';
  const line = build.answers.line || 'One line about you.';
  const c = pickOf(build, 'colors');
  const f = pickOf(build, 'type');
  const layout = build.picks.layout;
  const block = pageBlock(build, kind, build.picks.block, me);
  const pet = me?.pet ? `<p class="pet">${esc(me.pet.emoji)} with ${esc(me.pet.name)}</p>` : '';
  const intro = `<section class="intro">
<div class="avatar" aria-hidden="true">${esc(name.charAt(0).toUpperCase())}</div>
<h1>${esc(name)}</h1>
<p class="line">${esc(line)}</p>
${pet}
</section>`;

  let main;
  if (layout === 'split') main = `<main class="split">${intro}${block}</main>`;
  else if (layout === 'bento') {
    main = `<main class="bento">
<div class="tile big">${intro}</div>
<div class="tile">${block}</div>
<div class="tile mark" aria-hidden="true">${esc(name.charAt(0).toUpperCase())}</div>
<div class="tile accent"><p>Currently building.</p></div>
</main>`;
  } else main = `<main class="center"><div class="card">${intro}${block}</div></main>`;

  const style = `
body{background:${c.bg};color:${c.ink};font-family:${f.body};line-height:1.5;-webkit-font-smoothing:antialiased}
h1,h2{font-family:${f.head};letter-spacing:${f.track};font-weight:${f.weight};line-height:1.1${f.upper ? ';text-transform:uppercase' : ''}}
h1{font-size:clamp(32px,8vw,52px);margin:12px 0 8px}
h2{font-size:15px;color:${c.soft};margin-bottom:10px}
.line{font-size:18px;color:${c.soft};max-width:34ch}
.avatar{width:64px;height:64px;border-radius:50%;background:${c.accent};color:${c.bg};display:grid;place-items:center;font:700 28px ${f.head}}
.block{margin-top:28px}
.links a{display:block;color:${c.accent};text-decoration:none;font-weight:600;padding:10px 0;border-top:1px solid ${c.soft}33}
.quote p{font-family:${f.head};font-size:22px;border-left:4px solid ${c.accent};padding-left:14px}
.pet{margin-top:10px;font-size:14px;color:${c.soft}}
.dream ul{list-style:none}
.dream li{padding:8px 0 8px 22px;position:relative;font-weight:600}
.dream li:before{content:'';position:absolute;left:0;top:15px;width:10px;height:10px;border-radius:50%;background:${c.accent}}
.becoming{margin-top:8px;color:${c.soft};font-style:italic}
.skills ul{list-style:none}
.skills li{display:flex;align-items:center;gap:12px;padding:6px 0;font-size:14px}
.skills li span:first-child{width:90px}
.bar{flex:1;height:8px;border-radius:4px;background:${c.soft}33;overflow:hidden}
.bar i{display:block;height:100%;background:${c.accent}}
.center{min-height:100%;display:grid;place-items:center;padding:24px}
.card{background:${c.card};border-radius:20px;padding:32px;max-width:520px;width:100%;box-shadow:0 10px 40px #0000001a}
.split{min-height:100%;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:40px;max-width:960px;margin:0 auto}
.split .block{margin-top:0;background:${c.card};padding:24px;border-radius:16px}
.bento{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:minmax(120px,auto);gap:12px;padding:16px;max-width:960px;margin:0 auto}
.tile{background:${c.card};border-radius:18px;padding:20px}
.tile .block{margin-top:0}
.big{grid-column:span 2;grid-row:span 2;display:flex;align-items:flex-end}
.mark{display:grid;place-items:center;font:${f.weight} 72px ${f.head};color:${c.accent}}
.accent{background:${c.accent};color:${c.bg};display:flex;align-items:flex-end;font-weight:700;font-family:${f.head}}
@media (max-width:620px){.split{grid-template-columns:1fr;padding:24px}.bento{grid-template-columns:1fr 1fr}.big,.bento .tile:nth-child(2){grid-column:span 2;grid-row:auto}}
`;
  return shell(buildTitle(build), style, main);
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

const RENDERERS = { page: renderPage, game: renderGame, beat: renderBeat, business: renderBusiness, ai: renderAi };

export function renderBuild(build, me = null) {
  const kind = kindOf(build);
  const render = kind && RENDERERS[kind.id];
  return render ? render(build, kind, me) : shell('Build', '', '<p>Nothing to show yet.</p>');
}

export const RENDERED_KINDS = Object.keys(RENDERERS);
