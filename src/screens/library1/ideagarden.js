// library/ideagarden.js
// Idea Garden — living ecosystem where ideas grow into projects
// Uses WebView for canvas rendering — no extra native dependencies needed

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../api/supabaseClient';
import {
  getCores, upsertCore, updateCorePosition, updateCoreProgress, deleteCore,
  addPetal, updatePetal, deletePetal, togglePetal,
  getVines, addVine, updateVine, deleteVine,
  addUpdate,
} from '../../api/gardenService';
import LinkedText from '../../components/LinkedText';
import LinkSuggest from '../../components/LinkSuggest';

// SW/SH/CANVAS_H are now dynamic via useWindowDimensions inside the component

const PLANT_TYPES = [
  { id: 'tree',   label: 'Tree',   emoji: '🌳', desc: 'Big project / major initiative', color: '#2e7d32', light: '#a5d6a7' },
  { id: 'flower', label: 'Flower', emoji: '🌸', desc: 'Research / creative idea',       color: '#6a1b9a', light: '#ce93d8' },
  { id: 'plant',  label: 'Plant',  emoji: '🌿', desc: 'Active developing idea',          color: '#00695c', light: '#80cbc4' },
  { id: 'sprout', label: 'Sprout', emoji: '🌱', desc: 'Early stage / raw seed',          color: '#558b2f', light: '#dcedc8' },
];

const PETAL_TYPES = [
  { id: 'idea',     label: 'Idea',     emoji: '💡' },
  { id: 'task',     label: 'Task',     emoji: '✅' },
  { id: 'note',     label: 'Note',     emoji: '📝' },
  { id: 'question', label: 'Question', emoji: '❓' },
  { id: 'resource', label: 'Resource', emoji: '🔗' },
];

// ─── WebView HTML builder ─────────────────────────────────────────────────────
function buildGardenHTML(cores, vines, openId, connectMode, connectFrom, canvasW, canvasH) {
  const coresJSON = JSON.stringify(cores.map(c => ({
    id: c.id, title: c.title, plant_type: c.plant_type,
    color: c.color, color_light: c.color_light || '#a5d6a7',
    pos_x: c.pos_x, pos_y: c.pos_y,
    is_project: c.is_project, project_progress: c.project_progress || 0,
    petals: (c.garden_petals || []).map(p => ({
      id: p.id, title: p.title, petal_type: p.petal_type, completed: p.completed,
    })),
  })));
  const vinesJSON = JSON.stringify(vines.map(v => ({
    id: v.id, core_a: v.core_a, core_b: v.core_b,
    label: v.label || null, notes: v.notes || null,
  })));

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:#0d1f0d;overflow:hidden;}
canvas{display:block;touch-action:none;width:100%;height:100%;}
#cb{display:none;position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#8fbc8f;font-family:-apple-system,sans-serif;font-size:12px;padding:6px 16px;border-radius:20px;white-space:nowrap;}
#hint{position:fixed;bottom:8px;left:0;right:0;text-align:center;font-family:-apple-system,sans-serif;font-size:11px;color:#2a5a2a;pointer-events:none;transition:opacity 0.3s;}
</style></head><body>
<canvas id="c" style="width:100%;height:100%;"></canvas>
<div id="cb"></div>
<div id="hint">tap to view · hold to edit · tap vine to read</div>
<script>
const CORES=${coresJSON};
const VINES=${vinesJSON};
const IW=${canvasW};
const IH=${canvasH};
let openId=${openId ? '"' + openId + '"' : 'null'};
let connectMode=${connectMode};
let connectFrom=${connectFrom ? '"' + connectFrom + '"' : 'null'};
let t=0,dragging=null,pendingDrag=null,dragOff={x:0,y:0},W,H,ctx;
let holdTimer=null,touchStartPos=null,touchMoved=false;

// Creatures: butterflies on named vines, bugs on unnamed
const creatures=[];

function initCreatures(){
  creatures.length=0;
  VINES.forEach(function(vine,vi){
    const count=vine.label?2:1;
    for(let i=0;i<count;i++){
      creatures.push({
        vine:vine, t:Math.random(), speed:(vine.label?0.0018:0.003)+Math.random()*0.001,
        type:vine.label?'butterfly':'bug', phase:Math.random()*Math.PI*2, idx:i
      });
    }
  });
}

function init(){
  const canvas=document.getElementById('c');
  W=IW||window.innerWidth; H=IH||window.innerHeight;
  canvas.width=W*devicePixelRatio; canvas.height=H*devicePixelRatio;
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  ctx=canvas.getContext('2d'); ctx.scale(devicePixelRatio,devicePixelRatio);
  canvas.addEventListener('touchstart',onTS,{passive:false});
  canvas.addEventListener('touchmove',onTM,{passive:false});
  canvas.addEventListener('touchend',onTE,{passive:false});
  initCreatures();
  updateBanner();
  requestAnimationFrame(loop);
}

function loop(){ requestAnimationFrame(loop); t+=0.016; draw(); }

function quadPt(ax,ay,mx,my,bx,by,tt){
  return {
    x:(1-tt)*(1-tt)*ax+2*(1-tt)*tt*mx+tt*tt*bx,
    y:(1-tt)*(1-tt)*ay+2*(1-tt)*tt*my+tt*tt*by
  };
}

function vineMidpoint(a,b){
  const ax=a.pos_x*W,ay=a.pos_y*H,bx=b.pos_x*W,by=b.pos_y*H;
  const mx=(ax+bx)/2+Math.sin(t*0.3)*18,my=(ay+by)/2-25+Math.cos(t*0.25)*10;
  return {ax,ay,bx,by,mx,my};
}

function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0d1f0d'; ctx.fillRect(0,0,W,H);

  // Fireflies
  for(let i=0;i<10;i++){
    const fx=(Math.sin(t*0.15+i*2.1)*0.45+0.5)*W;
    const fy=(Math.cos(t*0.12+i*1.7)*0.3+0.25)*H;
    const a=0.1+0.08*Math.sin(t*1.5+i);
    ctx.beginPath(); ctx.arc(fx,fy,1.5,0,Math.PI*2);
    ctx.fillStyle='rgba(180,230,150,'+a+')'; ctx.fill();
  }

  // Ground
  ctx.fillStyle='#0a160a'; ctx.fillRect(0,H*0.9,W,H*0.1);
  for(let i=0;i<W;i+=14){
    ctx.strokeStyle='rgba(40,90,30,0.5)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(i,H*0.9); ctx.lineTo(i+1,H*0.9-(3+Math.sin(i*0.5)*2)); ctx.stroke();
  }

  // Vines
  VINES.forEach(function(vine){
    const a=CORES.find(function(c){return c.id===vine.core_a;});
    const b=CORES.find(function(c){return c.id===vine.core_b;});
    if(!a||!b) return;
    const {ax,ay,bx,by,mx,my}=vineMidpoint(a,b);
    const isOpen=openId===vine.id;

    ctx.beginPath(); ctx.moveTo(ax,ay); ctx.quadraticCurveTo(mx,my,bx,by);
    ctx.strokeStyle=isOpen?'rgba(200,230,100,0.55)':'rgba(56,142,60,0.28)';
    ctx.lineWidth=isOpen?2.5:2;
    ctx.setLineDash(vine.label?[]:[5,8]); ctx.stroke(); ctx.setLineDash([]);

    // Leaf on vine
    const lp=quadPt(ax,ay,mx,my,bx,by,0.5);
    ctx.fillStyle=vine.label?'rgba(120,200,80,0.45)':'rgba(76,175,80,0.35)';
    ctx.beginPath(); ctx.ellipse(lp.x,lp.y,6,3,Math.atan2(by-ay,bx-ax),0,Math.PI*2); ctx.fill();

    // Vine label
    if(vine.label){
      const lbp=quadPt(ax,ay,mx,my,bx,by,0.48);
      ctx.font='500 9px -apple-system,sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='bottom';
      ctx.fillStyle='rgba(180,230,120,0.75)';
      ctx.fillText(vine.label,lbp.x,lbp.y-8);
    }
  });

  // Creatures (butterflies + bugs)
  creatures.forEach(function(cr){
    cr.t=(cr.t+cr.speed)%1;
    const a=CORES.find(function(c){return c.id===cr.vine.core_a;});
    const b=CORES.find(function(c){return c.id===cr.vine.core_b;});
    if(!a||!b) return;
    const {ax,ay,bx,by,mx,my}=vineMidpoint(a,b);
    const pos=quadPt(ax,ay,mx,my,bx,by,cr.t);
    const wobX=Math.sin(t*6+cr.phase)*4, wobY=Math.cos(t*5+cr.phase)*3;
    const cx2=pos.x+wobX, cy2=pos.y+wobY;
    if(cr.type==='butterfly'){
      drawButterfly(cx2,cy2,cr.t,cr.phase);
    } else {
      drawBug(cx2,cy2,cr.phase);
    }
  });

  // Cores + petals
  CORES.forEach(function(core){
    const cx=core.pos_x*W,cy=core.pos_y*H+Math.sin(t*0.4+core.pos_x*10)*2;
    const isOpen=openId===core.id;
    const r=core.plant_type==='tree'?36:core.plant_type==='flower'?30:26;
    const petals=core.petals||[],petalR=r*0.42,orbitR=r+petalR+14;

    if(isOpen){ctx.beginPath();ctx.arc(cx,cy,r+16,0,Math.PI*2);ctx.fillStyle='rgba(100,200,100,0.08)';ctx.fill();}
    if(connectFrom===core.id){ctx.beginPath();ctx.arc(cx,cy,r+10,0,Math.PI*2);ctx.strokeStyle='rgba(255,200,0,0.7)';ctx.lineWidth=2;ctx.stroke();}

    petals.forEach(function(p,i){
      const pos=pPos(cx,cy,i,petals.length,orbitR);
      const sway=Math.sin(t*0.6+i)*3;
      ctx.beginPath(); ctx.moveTo(cx,cy);
      ctx.quadraticCurveTo((cx+pos.x)/2+sway,(cy+pos.y)/2-10,pos.x,pos.y);
      ctx.strokeStyle='rgba('+hRgb(core.color)+',0.35)'; ctx.lineWidth=1.5;
      ctx.setLineDash([3,5]); ctx.stroke(); ctx.setLineDash([]);
      drawPetal(pos.x,pos.y+sway*0.5,petalR,p,core.plant_type,openId===p.id);
    });

    drawCore(cx,cy,r,core,isOpen);

    if(core.is_project&&core.project_progress>0){
      ctx.beginPath(); ctx.arc(cx,cy,r+6,-Math.PI/2,-Math.PI/2+(core.project_progress/100)*Math.PI*2);
      ctx.strokeStyle=core.color; ctx.lineWidth=3; ctx.stroke();
    }

    ctx.font='500 10px -apple-system,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillStyle=isOpen?'#e8f5e9':(core.color_light||'#a5d6a7');
    const words=core.title.split(' '),mid=Math.ceil(words.length/2);
    ctx.fillText(words.slice(0,mid).join(' '),cx,cy+r+7);
    if(words.length>mid) ctx.fillText(words.slice(mid).join(' '),cx,cy+r+19);
  });
}

function drawButterfly(x,y,progress,phase){
  const flap=Math.abs(Math.sin(t*8+phase));
  const angle=Math.atan2(Math.sin(phase),Math.cos(phase*0.5));
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  // Upper wings
  ctx.fillStyle='rgba(255,200,100,0.7)';
  ctx.beginPath(); ctx.ellipse(-5,-3,7*flap,4,-.4,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5,-3,7*flap,4,.4,0,Math.PI*2); ctx.fill();
  // Lower wings
  ctx.fillStyle='rgba(255,160,60,0.55)';
  ctx.beginPath(); ctx.ellipse(-4,3,5*flap,3,-.6,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4,3,5*flap,3,.6,0,Math.PI*2); ctx.fill();
  // Body
  ctx.fillStyle='rgba(80,40,10,0.9)';
  ctx.beginPath(); ctx.ellipse(0,0,1.5,5,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawBug(x,y,phase){
  const angle=phase*0.5;
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  ctx.fillStyle='rgba(100,180,80,0.8)';
  ctx.beginPath(); ctx.ellipse(0,0,4,3,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(40,100,30,0.9)';
  ctx.beginPath(); ctx.ellipse(0,-3,2.5,2,0,0,Math.PI*2); ctx.fill();
  // legs
  ctx.strokeStyle='rgba(60,120,40,0.7)'; ctx.lineWidth=0.8;
  [[-3,-1],[-3,0],[-3,1],[3,-1],[3,0],[3,1]].forEach(function(l){
    ctx.beginPath(); ctx.moveTo(l[0]>0?2:-2,l[1]); ctx.lineTo(l[0],l[1]*2); ctx.stroke();
  });
  ctx.restore();
}

function pPos(cx,cy,idx,total,orbitR){
  const base=-Math.PI/2,spread=Math.PI*(total<=2?0.8:total<=4?1.2:1.6);
  const angle=total===1?base:(base-spread/2)+(spread/(total-1))*idx;
  return {x:cx+Math.cos(angle)*orbitR,y:cy+Math.sin(angle)*orbitR};
}

function drawCore(x,y,r,core,isOpen){
  const c=core.color;
  if(core.plant_type==='tree'){
    ctx.fillStyle='#4e342e'; ctx.beginPath(); ctx.rect(x-5,y+r*0.2,10,r*0.8); ctx.fill();
    ctx.fillStyle=isOpen?lh(c,40):lh(c,10); ctx.beginPath(); ctx.ellipse(x,y-r*0.15,r*0.9,r*0.78,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=isOpen?lh(c,20):c; ctx.beginPath(); ctx.ellipse(x-r*0.28,y-r*0.38,r*0.6,r*0.54,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=isOpen?lh(c,20):c; ctx.beginPath(); ctx.ellipse(x+r*0.28,y-r*0.3,r*0.58,r*0.52,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=isOpen?c:dh(c,20); ctx.beginPath(); ctx.ellipse(x,y-r*0.62,r*0.54,r*0.48,0,0,Math.PI*2); ctx.fill();
  } else if(core.plant_type==='flower'){
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2+t*0.12;
      ctx.fillStyle=isOpen?lh(c,30):c;
      ctx.beginPath(); ctx.ellipse(x+Math.cos(a)*r*0.52,y+Math.sin(a)*r*0.52,r*0.42,r*0.33,a,0,Math.PI*2); ctx.fill();
    }
    ctx.fillStyle=isOpen?'#fff9c4':'#fdd835'; ctx.beginPath(); ctx.arc(x,y,r*0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f57f17'; ctx.font='11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('\u273F',x,y);
  } else {
    ctx.strokeStyle=isOpen?lh(c,30):lh(c,10); ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(x,y+r); ctx.bezierCurveTo(x+Math.sin(t*0.5)*5,y+r*0.3,x-3,y-r*0.3,x,y-r); ctx.stroke();
    [[0.48,-0.08,1],[-0.5,0.18,-1],[0.38,-0.55,1],[-0.32,-0.4,-1]].forEach(function(l){
      ctx.fillStyle=isOpen?lh(c,25):c;
      ctx.beginPath(); ctx.ellipse(x+l[0]*r,y+l[1]*r,r*0.42,r*0.2,l[2]*0.65,0,Math.PI*2); ctx.fill();
    });
  }
}

function drawPetal(x,y,r,petal,coreType,isOpen){
  const cols={idea:'#f9a825',task:'#1565c0',note:'#558b2f',question:'#6a1b9a',resource:'#00695c'};
  const col=cols[petal.petal_type]||'#888';
  if(isOpen){ctx.beginPath();ctx.arc(x,y,r+8,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fill();}
  if(petal.completed){ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,r*0.7,0,Math.PI*2);ctx.stroke();}
  else if(coreType==='flower'){ctx.fillStyle=isOpen?lh(col,30):col;ctx.beginPath();ctx.ellipse(x,y,r,r*0.7,t*0.2,0,Math.PI*2);ctx.fill();}
  else if(coreType==='tree'){ctx.fillStyle=isOpen?lh(col,25):col;ctx.beginPath();ctx.ellipse(x,y,r*0.9,r,0,0,Math.PI*2);ctx.fill();}
  else{ctx.fillStyle=isOpen?lh(col,25):col;ctx.beginPath();ctx.ellipse(x,y,r,r*0.65,0.4,0,Math.PI*2);ctx.fill();}
  ctx.font='500 9px -apple-system,sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.fillText(petal.title.length>10?petal.title.slice(0,9)+'\u2026':petal.title,x,y);
}

function hRgb(h){return parseInt(h.slice(1,3),16)+','+parseInt(h.slice(3,5),16)+','+parseInt(h.slice(5,7),16);}
function lh(h,a){let r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return '#'+Math.min(255,r+a*2).toString(16).padStart(2,'0')+Math.min(255,g+a*2).toString(16).padStart(2,'0')+Math.min(255,b+a*2).toString(16).padStart(2,'0');}
function dh(h,a){let r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return '#'+Math.max(0,r-a*2).toString(16).padStart(2,'0')+Math.max(0,g-a*2).toString(16).padStart(2,'0')+Math.max(0,b-a*2).toString(16).padStart(2,'0');}

// Hit test: core, petal, OR vine midpoint
function hitTest(tx,ty){
  // Check cores + petals first
  for(const core of CORES){
    const cx=core.pos_x*W,cy=core.pos_y*H;
    const r=core.plant_type==='tree'?36:core.plant_type==='flower'?30:26;
    const petals=core.petals||[],orbitR=r+r*0.42+14;
    for(let i=0;i<petals.length;i++){
      const pos=pPos(cx,cy,i,petals.length,orbitR);
      if(Math.hypot(pos.x-tx,pos.y-ty)<r*0.42+14) return {type:'petal',petal:petals[i],coreId:core.id};
    }
    if(Math.hypot(cx-tx,cy-ty)<r+14) return {type:'core',coreId:core.id};
  }
  // Check vine midpoints
  for(const vine of VINES){
    const a=CORES.find(function(c){return c.id===vine.core_a;});
    const b=CORES.find(function(c){return c.id===vine.core_b;});
    if(!a||!b) continue;
    const {ax,ay,bx,by,mx,my}=vineMidpoint(a,b);
    const mp=quadPt(ax,ay,mx,my,bx,by,0.5);
    if(Math.hypot(mp.x-tx,mp.y-ty)<22) return {type:'vine',vine:vine};
  }
  return null;
}

function tp(e){const r=e.target.getBoundingClientRect();return {x:e.changedTouches[0].clientX-r.left,y:e.changedTouches[0].clientY-r.top};}
function tp2(e){const r=e.target.getBoundingClientRect();return {x:e.touches[0].clientX-r.left,y:e.touches[0].clientY-r.top};}

function onTS(e){
  e.preventDefault();
  touchMoved=false;
  const {x,y}=tp2(e);
  touchStartPos={x,y};
  const hit=hitTest(x,y);

  // Hold timer
  holdTimer=setTimeout(function(){
    if(!touchMoved&&hit){
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'hold',hit:hit}));
      holdTimer=null;
    }
  },450);

  // Store drag candidate separately — dragging stays null until real movement
  pendingDrag=null;
  if(hit&&hit.type==='core'&&!connectMode){
    const core=CORES.find(function(c){return c.id===hit.coreId;});
    pendingDrag={core:core,offX:x-core.pos_x*W,offY:y-core.pos_y*H};
  }
}

function onTM(e){
  e.preventDefault();
  const {x,y}=tp2(e);
  const moved=Math.hypot(x-touchStartPos.x,y-touchStartPos.y);
  if(moved>10&&pendingDrag&&!dragging){
    touchMoved=true;
    dragging=pendingDrag.core;
    dragOff={x:pendingDrag.offX,y:pendingDrag.offY};
    pendingDrag=null;
    if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}
  }
  if(dragging){
    dragging.pos_x=Math.max(0.05,Math.min(0.95,(x-dragOff.x)/W));
    dragging.pos_y=Math.max(0.05,Math.min(0.85,(y-dragOff.y)/H));
  }
}

function onTE(e){
  e.preventDefault();
  if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}
  const {x,y}=tp(e);

  pendingDrag=null;
  if(dragging){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'moved',coreId:dragging.id,pos_x:dragging.pos_x,pos_y:dragging.pos_y}));
    dragging=null; return;
  }

  if(touchMoved) return;

  const hit=hitTest(x,y);
  if(connectMode){
    if(hit&&hit.type==='core'){
      if(!connectFrom){connectFrom=hit.coreId;updateBanner();}
      else if(hit.coreId!==connectFrom){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'vine',from:connectFrom,to:hit.coreId}));
        connectMode=false; connectFrom=null; updateBanner();
      }
    }
    return;
  }
  if(hit){
    openId=hit.type==='core'?hit.coreId:hit.type==='petal'?hit.petal.id:hit.vine.id;
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'tap',hit:hit}));
  } else {
    openId=null;
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'tapEmpty'}));
  }
}

function updateBanner(){
  const b=document.getElementById('cb');
  if(connectMode){b.style.display='block';b.textContent=connectFrom?'Now tap the second plant':'Tap first plant to connect';}
  else{b.style.display='none';}
}

window.addEventListener('message',function(e){
  try{const m=JSON.parse(e.data);
    if(m.type==='setConnect'){connectMode=m.value;connectFrom=null;updateBanner();}
    if(m.type==='setOpen'){openId=m.id;}
    if(m.type==='refreshVines'){
      m.vines.forEach(function(v){
        const existing=VINES.find(function(x){return x.id===v.id;});
        if(existing){existing.label=v.label;existing.notes=v.notes;}
        else VINES.push(v);
      });
      initCreatures();
    }
  }catch(err){}
});

init();
</script></body></html>`;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const PLANT_TYPES_MAP = { tree: '🌳', flower: '🌸', plant: '🌿', sprout: '🌱' };

// ─── NotePanel ─────────────────────────────────────────────────────────────────
// Unified note-style view/edit panel for cores and petals.
// Tap = read. Hold = edit. Autosaves on blur.
function NotePanel({ item, editing, cores, plantTypes, petalTypes, onClose, onSave, onAddPetal, onProgress, onToggle, onDelete, onLinkPress }) {
  const [isEditing, setIsEditing] = useState(editing);
  const [titleVal, setTitleVal] = useState(item.title || '');
  const [bodyVal, setBodyVal] = useState(item.isPetal ? (item.body || '') : (item.description || ''));
  const saveTimer = useRef(null);
  const isPetal = !!item.isPetal;

  useEffect(() => { setIsEditing(editing); }, [editing]);
  useEffect(() => {
    setTitleVal(item.title || '');
    setBodyVal(isPetal ? (item.body || '') : (item.description || ''));
  }, [item.id]);

  const debounce = (field, val) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => onSave(field, val), 700);
  };

  const emoji = isPetal
    ? (petalTypes?.find(p => p.id === item.petal_type)?.emoji || '🌿')
    : (plantTypes?.find(p => p.id === item.plant_type)?.emoji || '🌿');

  const meta = isPetal
    ? `${item.petal_type} · ${item.parentTitle}`
    : `${item.is_project ? 'Project · ' + (item.project_progress || 0) + '%' : 'Idea'} · ${(item.garden_petals || []).length} petals`;

  // Linked plants — find vines where this core appears
  const linkedCores = !isPetal ? (item._linkedCores || []) : [];

  return (
    <View style={styles.panel}>
      <TouchableOpacity style={styles.panelClose} onPress={onClose}>
        <Ionicons name="close" size={18} color="#4a7a4a" />
      </TouchableOpacity>

      <View style={styles.panelHeader}>
        <Text style={styles.panelEmoji}>{emoji}</Text>
        <View style={{ flex: 1, paddingRight: 28 }}>
          {isEditing ? (
            <TextInput
              style={styles.noteTitleInput}
              value={titleVal}
              onChangeText={v => { setTitleVal(v); debounce('title', v); }}
              onBlur={() => onSave('title', titleVal)}
              placeholder="Title..."
              placeholderTextColor="#3a5a3a"
            />
          ) : (
            <TouchableOpacity onLongPress={() => setIsEditing(true)}>
              <Text style={styles.panelTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.panelMeta}>{meta}</Text>
        </View>
      </View>

      <View style={styles.noteBody}>
        {isEditing ? (
          <LinkSuggest
            cores={cores}
            value={bodyVal}
            onChangeText={v => { setBodyVal(v); debounce(isPetal ? 'body' : 'description', v); }}
            placeholder={isPetal ? "Write your note here... type [[ to link" : "Describe this idea... type [[ to link"}
            placeholderTextColor="#3a5a3a"
            multiline
            inputStyle={styles.noteBodyInput}
            style={{ flex: 1 }}
          />
        ) : (
          <TouchableOpacity onLongPress={() => setIsEditing(true)} style={{ flex: 1 }}>
            {bodyVal ? (
              <LinkedText text={bodyVal} cores={cores} style={styles.panelDesc} onLinkPress={onLinkPress} />
            ) : (
              <Text style={styles.noteBodyPlaceholder}>Hold to add notes...</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Linked plants */}
      {linkedCores.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.linkedRow}>
          {linkedCores.map(lc => (
            <TouchableOpacity key={lc.id} style={[styles.linkedChip, { borderColor: lc.color }]} onPress={() => onLinkPress && onLinkPress(lc)}>
              <Text style={styles.linkedChipEmoji}>{PLANT_TYPES_MAP[lc.plant_type] || '🌿'}</Text>
              <Text style={[styles.linkedChipText, { color: lc.color }]}>{lc.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.panelActions}>
        {!isPetal && onAddPetal && (
          <TouchableOpacity style={styles.panelBtn} onPress={onAddPetal}>
            <Ionicons name="add-circle-outline" size={16} color="#8fbc8f" />
            <Text style={styles.panelBtnText}>Petal</Text>
          </TouchableOpacity>
        )}
        {!isPetal && item.is_project && onProgress && (
          <TouchableOpacity style={styles.panelBtn} onPress={onProgress}>
            <Ionicons name="stats-chart" size={16} color="#8fbc8f" />
            <Text style={styles.panelBtnText}>Progress</Text>
          </TouchableOpacity>
        )}
        {isPetal && onToggle && (
          <TouchableOpacity style={styles.panelBtn} onPress={onToggle}>
            <Ionicons name={item.completed ? 'refresh' : 'checkmark-circle-outline'} size={16} color="#8fbc8f" />
            <Text style={styles.panelBtnText}>{item.completed ? 'Reopen' : 'Done'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.panelBtn} onPress={() => setIsEditing(e => !e)}>
          <Ionicons name={isEditing ? 'eye-outline' : 'pencil'} size={16} color="#8fbc8f" />
          <Text style={styles.panelBtnText}>{isEditing ? 'View' : 'Edit'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.panelBtn, styles.panelBtnDanger]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color="#e57373" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function IdeaGardenScreen() {
  const { width: SW, height: SH } = useWindowDimensions();
  const CANVAS_H = Math.max(SH * 0.75, 500);
  const webviewRef = useRef(null);
  const connectFromRef = useRef(null);

  const [userId, setUserId] = useState(null);
  const [cores, setCores] = useState([]);
  const [vines, setVines] = useState([]);
  const [openVine, setOpenVine] = useState(null);
  const [vineNote, setVineNote] = useState('');
  const [vineNoteEditing, setVineNoteEditing] = useState(false);
  const vineNoteTimer = useRef(null);
  const [loading, setLoading] = useState(true);
  const [openItem, setOpenItem] = useState(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState(null);
  const [view, setView] = useState('map');

  const [coreModal, setCoreModal] = useState(false);
  const [editingCore, setEditingCore] = useState(null);
  const [coreDraft, setCoreDraft] = useState({ title: '', description: '', plant_type: 'plant', is_project: false, project_status: 'idea', color: '#2e7d32', color_light: '#a5d6a7' });

  const [petalModal, setPetalModal] = useState(false);
  const [petalParent, setPetalParent] = useState(null);
  const [editingPetal, setEditingPetal] = useState(null);
  const [petalDraft, setPetalDraft] = useState({ title: '', body: '', petal_type: 'idea' });

  const [updateModal, setUpdateModal] = useState(false);
  const [updateParent, setUpdateParent] = useState(null);
  const [updateText, setUpdateText] = useState('');

  const [progressModal, setProgressModal] = useState(false);
  const [progressCore, setProgressCore] = useState(null);
  const [progressVal, setProgressVal] = useState(0);

  // ─── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUserId(user.id); await reload(user.id); }
      setLoading(false);
    };
    load();
  }, []);

  useFocusEffect(useCallback(() => { if (userId) reload(userId); }, [userId]));

  const reload = async (uid) => {
    const [c, v] = await Promise.all([getCores(uid), getVines(uid)]);
    setCores(c); setVines(v);
  };

  // Debounced vine note save
  const saveVineNote = useCallback((vine, label, notes) => {
    if (vineNoteTimer.current) clearTimeout(vineNoteTimer.current);
    vineNoteTimer.current = setTimeout(async () => {
      try {
        await updateVine(vine.id, { label, notes });
        setVines(prev => prev.map(v => v.id === vine.id ? { ...v, label, notes } : v));
        sendToWebview({ type: 'refreshVines', vines: [{ id: vine.id, label, notes }] });
      } catch (e) { console.warn('vine save error', e); }
    }, 800);
  }, []);

  // ─── WebView message handler ───────────────────────────────────────────────
  const onWebMessage = async (event) => {
    const msg = JSON.parse(event.nativeEvent.data);

    if (msg.type === 'moved') {
      setCores(prev => prev.map(c => c.id === msg.coreId ? { ...c, pos_x: msg.pos_x, pos_y: msg.pos_y } : c));
      await updateCorePosition(msg.coreId, msg.pos_x, msg.pos_y);
    }

    if (msg.type === 'vine') {
      try {
        const vine = await addVine(userId, msg.from, msg.to);
        setVines(prev => [...prev, vine]);
        setConnectMode(false);
        setConnectFrom(null);
        connectFromRef.current = null;
        webviewRef.current?.postMessage(JSON.stringify({ type: 'setConnect', value: false }));
      } catch (e) { Alert.alert('Already connected or error adding vine'); }
    }

    if (msg.type === 'tap') {
      const hit = msg.hit;
      setOpenVine(null);
      if (hit.type === 'core') {
        const core = cores.find(c => c.id === hit.coreId);
        if (core) {
          const linkedCores = vines
            .filter(v => v.core_a === core.id || v.core_b === core.id)
            .map(v => cores.find(c => c.id === (v.core_a === core.id ? v.core_b : v.core_a)))
            .filter(Boolean);
          setOpenItem({ type: 'core', data: { ...core, _linkedCores: linkedCores }, editing: false });
        }
      } else if (hit.type === 'petal') {
        const core = cores.find(c => c.id === hit.coreId);
        const petal = (core?.garden_petals || []).find(p => p.id === hit.petal.id);
        if (petal && core) setOpenItem({ type: 'petal', data: petal, parent: core, editing: false });
      } else if (hit.type === 'vine') {
        const vine = vines.find(v => v.id === hit.vine.id);
        if (vine) { setOpenVine(vine); setVineNote(vine.notes || ''); setVineNoteEditing(false); }
      }
    }

    if (msg.type === 'hold') {
      const hit = msg.hit;
      setOpenVine(null);
      if (hit.type === 'core') {
        const core = cores.find(c => c.id === hit.coreId);
        if (core) {
          const linkedCores = vines
            .filter(v => v.core_a === core.id || v.core_b === core.id)
            .map(v => cores.find(c => c.id === (v.core_a === core.id ? v.core_b : v.core_a)))
            .filter(Boolean);
          setOpenItem({ type: 'core', data: { ...core, _linkedCores: linkedCores }, editing: true });
        }
      } else if (hit.type === 'petal') {
        const core = cores.find(c => c.id === hit.coreId);
        const petal = (core?.garden_petals || []).find(p => p.id === hit.petal.id);
        if (petal && core) setOpenItem({ type: 'petal', data: petal, parent: core, editing: true });
      } else if (hit.type === 'vine') {
        const vine = vines.find(v => v.id === hit.vine.id);
        if (vine) { setOpenVine(vine); setVineNote(vine.notes || ''); setVineNoteEditing(true); }
      }
    }

    if (msg.type === 'tapEmpty') { setOpenItem(null); setOpenVine(null); }
  };

  const sendToWebview = (msg) => webviewRef.current?.postMessage(JSON.stringify(msg));

  const toggleConnectMode = () => {
    const next = !connectMode;
    setConnectMode(next);
    setConnectFrom(null);
    connectFromRef.current = null;
    sendToWebview({ type: 'setConnect', value: next });
  };

  // ─── Core CRUD ────────────────────────────────────────────────────────────
  const openNewCore = () => {
    setEditingCore(null);
    setCoreDraft({ title: '', description: '', plant_type: 'plant', is_project: false, project_status: 'idea', color: '#2e7d32', color_light: '#a5d6a7' });
    setCoreModal(true);
  };

  const openEditCore = (core) => { setEditingCore(core); setCoreDraft({ ...core }); setCoreModal(true); setOpenItem(null); };

  const saveCore = async () => {
    if (!coreDraft.title.trim()) return Alert.alert('Add a title');
    const pt = PLANT_TYPES.find(p => p.id === coreDraft.plant_type);
    try {
      const { _linkedCores: _lc, garden_petals: _gp, garden_updates: _gu, ...cleanDraft } = coreDraft;
      const saved = await upsertCore(userId, {
        id: editingCore?.id,
        ...cleanDraft,
        color: coreDraft.color || pt.color,
        color_light: coreDraft.color_light || pt.light,
        pos_x: editingCore?.pos_x ?? 0.15 + Math.random() * 0.7,
        pos_y: editingCore?.pos_y ?? 0.15 + Math.random() * 0.55,
      });
      setCores(prev => editingCore
        ? prev.map(c => c.id === editingCore.id ? { ...saved, garden_petals: c.garden_petals, garden_updates: c.garden_updates } : c)
        : [...prev, { ...saved, garden_petals: [], garden_updates: [] }]
      );
      setCoreModal(false);
    } catch { Alert.alert('Error saving'); }
  };

  const confirmDeleteCore = (core) => {
    Alert.alert('Remove plant?', `"${core.title}" and all its petals will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await deleteCore(core.id);
        setCores(prev => prev.filter(c => c.id !== core.id));
        setVines(prev => prev.filter(v => v.core_a !== core.id && v.core_b !== core.id));
        setOpenItem(null);
      }},
    ]);
  };

  // ─── Petal CRUD ───────────────────────────────────────────────────────────
  const openNewPetal = (core) => { setPetalParent(core); setEditingPetal(null); setPetalDraft({ title: '', body: '', petal_type: 'idea' }); setPetalModal(true); setOpenItem(null); };
  const openEditPetal = (petal, core) => { setPetalParent(core); setEditingPetal(petal); setPetalDraft({ ...petal }); setPetalModal(true); setOpenItem(null); };

  const savePetal = async () => {
    if (!petalDraft.title.trim()) return Alert.alert('Add a title');
    try {
      if (editingPetal) {
        const updated = await updatePetal(editingPetal.id, petalDraft);
        setCores(prev => prev.map(c => c.id === petalParent.id ? { ...c, garden_petals: c.garden_petals.map(p => p.id === editingPetal.id ? updated : p) } : c));
      } else {
        const saved = await addPetal(userId, petalParent.id, { ...petalDraft, sort_order: (petalParent.garden_petals || []).length });
        setCores(prev => prev.map(c => c.id === petalParent.id ? { ...c, garden_petals: [...(c.garden_petals || []), saved] } : c));
      }
      setPetalModal(false);
    } catch { Alert.alert('Error saving petal'); }
  };

  const handleTogglePetal = async (petal, core) => {
    await togglePetal(petal.id, !petal.completed);
    setCores(prev => prev.map(c => c.id === core.id ? { ...c, garden_petals: c.garden_petals.map(p => p.id === petal.id ? { ...p, completed: !p.completed } : p) } : c));
    setOpenItem(null);
  };

  const handleDeletePetal = async (petal, core) => {
    await deletePetal(petal.id);
    setCores(prev => prev.map(c => c.id === core.id ? { ...c, garden_petals: c.garden_petals.filter(p => p.id !== petal.id) } : c));
    setOpenItem(null);
  };

  // ─── Update log ───────────────────────────────────────────────────────────
  const openUpdateLog = (core) => { setUpdateParent(core); setUpdateText(''); setUpdateModal(true); setOpenItem(null); };

  const saveUpdate = async () => {
    if (!updateText.trim()) return;
    const saved = await addUpdate(userId, updateParent.id, updateText.trim());
    setCores(prev => prev.map(c => c.id === updateParent.id ? { ...c, garden_updates: [...(c.garden_updates || []), saved] } : c));
    setUpdateText(''); setUpdateModal(false);
  };

  // ─── Progress ─────────────────────────────────────────────────────────────
  const openProgress = (core) => { setProgressCore(core); setProgressVal(core.project_progress || 0); setProgressModal(true); setOpenItem(null); };

  const saveProgress = async () => {
    await updateCoreProgress(progressCore.id, progressVal);
    setCores(prev => prev.map(c => c.id === progressCore.id ? { ...c, project_progress: progressVal } : c));
    setProgressModal(false);
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color="#2e7d32" size="large" /></View>;

  const openCore = openItem?.type === 'core' ? openItem.data : null;
  const openPetal = openItem?.type === 'petal' ? openItem.data : null;
  const openPetalParent = openItem?.type === 'petal' ? openItem.parent : null;

  const GARDEN_SCROLL_H = Math.max(SH * 1.4, 900);
  const gardenHTML = buildGardenHTML(cores, vines, openItem?.data?.id || null, connectMode, connectFrom, SW, GARDEN_SCROLL_H);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >

      {/* Top bar */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topbarSub}>idea garden</Text>
          <Text style={styles.topbarTitle}>🌿 Your Ecosystem</Text>
        </View>
        <View style={styles.topbarRight}>
          <TouchableOpacity style={[styles.connectBtn, connectMode && styles.connectBtnActive]} onPress={toggleConnectMode}>
            <Ionicons name="git-network" size={16} color={connectMode ? '#fff' : '#8fbc8f'} />
            <Text style={[styles.connectBtnText, connectMode && { color: '#fff' }]}>Vine</Text>
          </TouchableOpacity>
          <View style={styles.viewToggle}>
            {['map', 'list'].map(v => (
              <TouchableOpacity key={v} style={[styles.viewBtn, view === v && styles.viewBtnActive]} onPress={() => setView(v)}>
                <Ionicons name={v === 'map' ? 'leaf' : 'list'} size={14} color={view === v ? '#0d1f0d' : '#8fbc8f'} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openNewCore}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map view — WebView canvas */}
      {view === 'map' && (
        <View style={styles.canvasWrap}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ height: GARDEN_SCROLL_H }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
          >
            <WebView
              ref={webviewRef}
              source={{ html: gardenHTML }}
              style={{ width: SW, height: GARDEN_SCROLL_H, backgroundColor: '#0d1f0d' }}
              onMessage={onWebMessage}
              scrollEnabled={false}
              bounces={false}
              overScrollMode="never"
              javaScriptEnabled
              originWhitelist={['*']}
            />
          </ScrollView>
          {cores.length === 0 && (
            <View style={styles.emptyGarden}>
              <Text style={styles.emptyGardenText}>Your garden is empty</Text>
              <Text style={styles.emptyGardenSub}>Tap + to plant your first idea</Text>
            </View>
          )}
        </View>
      )}

      {/* List view */}
      {view === 'list' && (
        <ScrollView style={styles.listView} contentContainerStyle={{ padding: 12, gap: 10 }}>
          {cores.map(core => {
            const pt = PLANT_TYPES.find(p => p.id === core.plant_type);
            const petals = core.garden_petals || [];
            return (
              <View key={core.id} style={[styles.listCard, { borderLeftColor: core.color }]}>
                <View style={styles.listCardHeader}>
                  <View style={styles.listCardLeft}>
                    <Text style={styles.listCardEmoji}>{pt?.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listCardTitle}>{core.title}</Text>
                      <Text style={styles.listCardMeta}>{pt?.label} · {petals.length} petals{core.is_project ? ` · ${core.project_progress || 0}%` : ''}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => openEditCore(core)} style={{ padding: 4 }}>
                    <Ionicons name="pencil" size={14} color="#4a7a4a" />
                  </TouchableOpacity>
                </View>
                {core.description ? (
                  <LinkedText
                    text={core.description}
                    cores={cores}
                    style={styles.listCardDesc}
                    onLinkPress={(linked) => setOpenItem({ type: 'core', data: linked })}
                  />
                ) : null}
                {petals.length > 0 && (
                  <View style={styles.petalList}>
                    {petals.map(p => {
                      const pt2 = PETAL_TYPES.find(x => x.id === p.petal_type);
                      return (
                        <TouchableOpacity key={p.id} style={styles.petalRow} onPress={() => handleTogglePetal(p, core)}>
                          <Ionicons name={p.completed ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={p.completed ? '#2e7d32' : '#4a7a4a'} />
                          <Text style={[styles.petalRowText, p.completed && styles.petalDone]}>{pt2?.emoji} {p.title}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                <View style={styles.listCardActions}>
                  <TouchableOpacity style={styles.listAction} onPress={() => openNewPetal(core)}>
                    <Ionicons name="add-circle-outline" size={14} color="#4a7a4a" />
                    <Text style={styles.listActionText}>Add petal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.listAction} onPress={() => openUpdateLog(core)}>
                    <Ionicons name="journal-outline" size={14} color="#4a7a4a" />
                    <Text style={styles.listActionText}>Log update</Text>
                  </TouchableOpacity>
                  {core.is_project && (
                    <TouchableOpacity style={styles.listAction} onPress={() => openProgress(core)}>
                      <Ionicons name="stats-chart" size={14} color="#4a7a4a" />
                      <Text style={styles.listActionText}>Progress</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
          {cores.length === 0 && <View style={styles.emptyList}><Text style={styles.emptyListText}>No plants yet — tap + to start</Text></View>}
        </ScrollView>
      )}

      {/* Core detail / edit panel */}
      {openCore && (
        <NotePanel
          item={openCore}
          editing={openItem?.editing || false}
          cores={cores}
          plantTypes={PLANT_TYPES}
          onClose={() => setOpenItem(null)}
          onSave={async (field, val) => {
            try {
              // Strip UI-only fields before saving to Supabase
              const { _linkedCores, garden_petals, garden_updates, ...coreData } = openCore;
              const updated = await upsertCore(userId, { ...coreData, [field]: val });
              setCores(prev => prev.map(c => c.id === openCore.id
                ? { ...updated, garden_petals: c.garden_petals, garden_updates: c.garden_updates }
                : c));
              setOpenItem(prev => prev ? { ...prev, data: { ...prev.data, [field]: val } } : null);
            } catch (e) { console.warn('save error', e); }
          }}
          onAddPetal={() => openNewPetal(openCore)}
          onProgress={() => openProgress(openCore)}
          onDelete={() => confirmDeleteCore(openCore)}
          onLinkPress={(linked) => setOpenItem({ type: 'core', data: linked, editing: false })}
        />
      )}

      {/* Petal detail / edit panel */}
      {openPetal && (
        <NotePanel
          item={{ ...openPetal, isPetal: true, parentTitle: openPetalParent?.title }}
          editing={openItem?.editing || false}
          cores={cores}
          petalTypes={PETAL_TYPES}
          onClose={() => setOpenItem(null)}
          onSave={async (field, val) => {
            try {
              const updated = await updatePetal(openPetal.id, { [field]: val });
              setCores(prev => prev.map(c => c.id === openPetalParent.id
                ? { ...c, garden_petals: c.garden_petals.map(p => p.id === openPetal.id ? { ...p, [field]: val } : p) }
                : c));
              setOpenItem(prev => prev ? { ...prev, data: { ...prev.data, [field]: val } } : null);
            } catch (e) { console.warn('petal save error', e); }
          }}
          onToggle={() => handleTogglePetal(openPetal, openPetalParent)}
          onDelete={() => handleDeletePetal(openPetal, openPetalParent)}
          onLinkPress={(linked) => setOpenItem({ type: 'core', data: linked, editing: false })}
        />
      )}

      {/* Vine panel */}
      {openVine && (
        <View style={styles.vinePanel}>
          <TouchableOpacity style={styles.panelClose} onPress={() => setOpenVine(null)}>
            <Ionicons name="close" size={18} color="#4a7a4a" />
          </TouchableOpacity>
          <View style={styles.vinePanelHeader}>
            <Text style={styles.vinePanelEmoji}>🌿</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.vinePanelTitle}>
                {vines.find(v => v.id === openVine.id)?.label || 'Vine connection'}
              </Text>
              <Text style={styles.vinePanelMeta}>
                {cores.find(c => c.id === openVine.core_a)?.title} → {cores.find(c => c.id === openVine.core_b)?.title}
              </Text>
            </View>
          </View>
          {vineNoteEditing ? (
            <TextInput
              style={styles.vineNoteInput}
              value={vineNote}
              onChangeText={v => {
                setVineNote(v);
                saveVineNote(openVine, openVine.label || '', v);
              }}
              placeholder="Write notes about this connection..."
              placeholderTextColor="#3a5a3a"
              multiline
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setVineNoteEditing(true)} style={{ flex: 1 }}>
              {vineNote
                ? <LinkedText text={vineNote} cores={cores} style={styles.vineNoteText}
                    onLinkPress={(linked) => { setOpenVine(null); setOpenItem({ type: 'core', data: linked, editing: false }); }} />
                : <Text style={styles.vineNotePlaceholder}>Hold to add notes about this connection...</Text>
              }
            </TouchableOpacity>
          )}
          <View style={styles.vineLabelRow}>
            <TextInput
              style={styles.vineLabelInput}
              value={vines.find(v => v.id === openVine.id)?.label || ''}
              onChangeText={v => {
                setVines(prev => prev.map(vi => vi.id === openVine.id ? { ...vi, label: v } : vi));
                saveVineNote(openVine, v, vineNote);
              }}
              placeholder="Label this vine (e.g. 'inspires', 'blocks')"
              placeholderTextColor="#3a5a3a"
            />
            <TouchableOpacity
              style={styles.vineDeleteBtn}
              onPress={() => {
                Alert.alert('Remove vine?', 'This connection will be deleted.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: async () => {
                    await deleteVine(openVine.id);
                    setVines(prev => prev.filter(v => v.id !== openVine.id));
                    setOpenVine(null);
                  }},
                ]);
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#e57373" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Core modal */}
      <Modal visible={coreModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingCore ? 'Edit Plant' : 'Plant New Idea'}</Text>
            <TextInput style={styles.modalInput} value={coreDraft.title} onChangeText={v => setCoreDraft(p => ({ ...p, title: v }))} placeholder="Title" placeholderTextColor="#3a5a3a" autoFocus />
            <LinkSuggest
              cores={cores.filter(c => c.id !== editingCore?.id)}
              value={coreDraft.description || ''}
              onChangeText={v => setCoreDraft(p => ({ ...p, description: v }))}
              placeholder="Description — type [[ to link to another plant"
              placeholderTextColor="#3a5a3a"
              multiline
              inputStyle={[styles.modalInput, { height: 70 }]}
              style={{ marginBottom: 0 }}
            />
            <Text style={styles.modalLabel}>Plant type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {PLANT_TYPES.map(pt => (
                <TouchableOpacity key={pt.id} style={[styles.typeChip, coreDraft.plant_type === pt.id && { backgroundColor: pt.light, borderColor: pt.color }]} onPress={() => setCoreDraft(p => ({ ...p, plant_type: pt.id, color: pt.color, color_light: pt.light }))}>
                  <Text style={styles.typeChipEmoji}>{pt.emoji}</Text>
                  <Text style={[styles.typeChipLabel, coreDraft.plant_type === pt.id && { color: pt.color }]}>{pt.label}</Text>
                  <Text style={styles.typeChipDesc}>{pt.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.projectToggle} onPress={() => setCoreDraft(p => ({ ...p, is_project: !p.is_project }))}>
              <Ionicons name={coreDraft.is_project ? 'checkbox' : 'square-outline'} size={20} color="#2e7d32" />
              <Text style={styles.projectToggleText}>This is also a project (track progress)</Text>
            </TouchableOpacity>
            {coreDraft.is_project && (
              <>
                <Text style={styles.modalLabel}>Project status</Text>
                <View style={styles.statusRow}>
                  {['idea', 'prototype', 'in_progress', 'complete'].map(s => (
                    <TouchableOpacity key={s} style={[styles.statusChip, coreDraft.project_status === s && styles.statusChipActive]} onPress={() => setCoreDraft(p => ({ ...p, project_status: s }))}>
                      <Text style={[styles.statusChipText, coreDraft.project_status === s && styles.statusChipTextActive]}>{s.replace('_', ' ')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setCoreModal(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveCore} style={styles.modalSave}><Text style={styles.modalSaveText}>{editingCore ? 'Update' : 'Plant it'}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Petal modal */}
      <Modal visible={petalModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingPetal ? 'Edit Petal' : `Add to "${petalParent?.title}"`}</Text>
            <TextInput style={styles.modalInput} value={petalDraft.title} onChangeText={v => setPetalDraft(p => ({ ...p, title: v }))} placeholder="Title" placeholderTextColor="#3a5a3a" autoFocus />
            <LinkSuggest
              cores={cores}
              value={petalDraft.body || ''}
              onChangeText={v => setPetalDraft(p => ({ ...p, body: v }))}
              placeholder="Notes — type [[ to link to another plant"
              placeholderTextColor="#3a5a3a"
              multiline
              inputStyle={[styles.modalInput, { height: 70 }]}
              style={{ marginBottom: 0 }}
            />
            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.petalTypeRow}>
              {PETAL_TYPES.map(pt => (
                <TouchableOpacity key={pt.id} style={[styles.petalTypeChip, petalDraft.petal_type === pt.id && styles.petalTypeChipActive]} onPress={() => setPetalDraft(p => ({ ...p, petal_type: pt.id }))}>
                  <Text style={styles.petalTypeEmoji}>{pt.emoji}</Text>
                  <Text style={[styles.petalTypeLabel, petalDraft.petal_type === pt.id && styles.petalTypeLabelActive]}>{pt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setPetalModal(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={savePetal} style={styles.modalSave}><Text style={styles.modalSaveText}>{editingPetal ? 'Update' : 'Add petal'}</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Update log modal */}
      <Modal visible={updateModal} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Update — {updateParent?.title}</Text>
            <LinkSuggest
              cores={cores}
              value={updateText}
              onChangeText={setUpdateText}
              placeholder="What's the latest? Type [[ to link to a plant"
              placeholderTextColor="#3a5a3a"
              multiline
              autoFocus
              inputStyle={[styles.modalInput, { height: 100 }]}
              style={{ marginBottom: 0 }}
            />
            {(updateParent?.garden_updates || []).slice(-3).reverse().map(u => (
              <View key={u.id} style={styles.updateEntry}>
                <Text style={styles.updateDate}>{new Date(u.created_at).toLocaleDateString()}</Text>
                <LinkedText
                  text={u.entry}
                  cores={cores}
                  style={styles.updateText}
                  onLinkPress={(linked) => { setUpdateModal(false); setOpenItem({ type: 'core', data: linked }); }}
                />
              </View>
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setUpdateModal(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveUpdate} style={styles.modalSave}><Text style={styles.modalSaveText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Progress modal */}
      <Modal visible={progressModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{progressCore?.title} — Progress</Text>
            <Text style={styles.progressBig}>{progressVal}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressVal}%`, backgroundColor: progressCore?.color }]} />
            </View>
            <View style={styles.quickBtns}>
              {[0, 25, 50, 75, 100].map(v => (
                <TouchableOpacity key={v} style={[styles.quickBtn, progressVal === v && { backgroundColor: progressCore?.color }]} onPress={() => setProgressVal(v)}>
                  <Text style={[styles.quickBtnText, progressVal === v && { color: '#fff' }]}>{v}%</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.modalInput} value={String(progressVal)} onChangeText={v => { const n = parseInt(v); if (!isNaN(n)) setProgressVal(Math.min(100, Math.max(0, n))); }} keyboardType="numeric" placeholder="0–100" placeholderTextColor="#3a5a3a" />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setProgressModal(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveProgress} style={styles.modalSave}><Text style={styles.modalSaveText}>Update</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1f0d' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1f0d' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingTop: 16, backgroundColor: '#0a180a', borderBottomWidth: 0.5, borderBottomColor: '#1a3a1a' },
  topbarSub: { fontSize: 10, color: '#2a5a2a', letterSpacing: 1, textTransform: 'uppercase' },
  topbarTitle: { fontSize: 17, fontWeight: '600', color: '#8fbc8f' },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  connectBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#1a3a1a' },
  connectBtnActive: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  connectBtnText: { fontSize: 12, color: '#8fbc8f' },
  viewToggle: { flexDirection: 'row', backgroundColor: '#1a3a1a', borderRadius: 8, padding: 2 },
  viewBtn: { padding: 6, borderRadius: 6 },
  viewBtnActive: { backgroundColor: '#8fbc8f' },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2e7d32', alignItems: 'center', justifyContent: 'center' },
  canvasWrap: { flex: 1, position: 'relative', overflow: 'hidden' },
  emptyGarden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  emptyGardenText: { fontSize: 16, color: '#4a7a4a', fontWeight: '500' },
  emptyGardenSub: { fontSize: 13, color: '#2a5a2a', marginTop: 4 },
  listView: { flex: 1, backgroundColor: '#0d1f0d' },
  listCard: { backgroundColor: '#0a180a', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderWidth: 0.5, borderColor: '#1a3a1a', marginBottom: 8 },
  listCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  listCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  listCardEmoji: { fontSize: 22 },
  listCardTitle: { fontSize: 15, fontWeight: '600', color: '#c8e6c8' },
  listCardMeta: { fontSize: 11, color: '#4a7a4a', marginTop: 1 },
  listCardDesc: { fontSize: 13, color: '#6a9a6a', lineHeight: 18, marginBottom: 8 },
  petalList: { gap: 4, marginBottom: 10 },
  petalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  petalRowText: { fontSize: 13, color: '#8fbc8f' },
  petalDone: { textDecorationLine: 'line-through', color: '#3a6a3a' },
  listCardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  listAction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#1a3a1a', borderRadius: 8 },
  listActionText: { fontSize: 12, color: '#4a7a4a' },
  emptyList: { alignItems: 'center', paddingTop: 60 },
  emptyListText: { fontSize: 14, color: '#3a5a3a' },
  panel: { backgroundColor: '#0a180a', borderTopWidth: 0.5, borderTopColor: '#1a3a1a', padding: 16, paddingBottom: 24 },
  panelClose: { position: 'absolute', top: 12, right: 12, padding: 4 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, paddingRight: 30 },
  panelEmoji: { fontSize: 24 },
  panelTitle: { fontSize: 16, fontWeight: '600', color: '#c8e6c8' },
  panelMeta: { fontSize: 11, color: '#4a7a4a', marginTop: 2 },
  panelDesc: { fontSize: 13, color: '#6a9a6a', lineHeight: 18, marginBottom: 10 },
  panelActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  panelBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1a3a1a', borderRadius: 8 },
  panelBtnText: { fontSize: 12, color: '#8fbc8f' },
  panelBtnDanger: { backgroundColor: '#2a1a1a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0d1f0d', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 0.5, borderColor: '#1a3a1a' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#c8e6c8', marginBottom: 14 },
  modalLabel: { fontSize: 11, fontWeight: '600', color: '#4a7a4a', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  modalInput: { borderWidth: 1, borderColor: '#1a3a1a', borderRadius: 10, padding: 12, fontSize: 15, color: '#c8e6c8', backgroundColor: '#0a180a', marginBottom: 12 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  modalCancel: { paddingVertical: 12, paddingHorizontal: 18 },
  modalCancelText: { fontSize: 14, color: '#4a7a4a' },
  modalSave: { backgroundColor: '#2e7d32', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 22 },
  modalSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  typeChip: { width: 120, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#1a3a1a', marginRight: 8, backgroundColor: '#0a180a' },
  typeChipEmoji: { fontSize: 20, marginBottom: 4 },
  typeChipLabel: { fontSize: 13, fontWeight: '600', color: '#8fbc8f', marginBottom: 2 },
  typeChipDesc: { fontSize: 10, color: '#3a6a3a', lineHeight: 13 },
  projectToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginBottom: 8 },
  projectToggleText: { fontSize: 14, color: '#8fbc8f' },
  statusRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#1a3a1a', backgroundColor: '#0a180a' },
  statusChipActive: { backgroundColor: '#1a3a1a', borderColor: '#2e7d32' },
  statusChipText: { fontSize: 12, color: '#4a7a4a' },
  statusChipTextActive: { color: '#8fbc8f' },
  petalTypeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  petalTypeChip: { alignItems: 'center', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#1a3a1a', backgroundColor: '#0a180a', minWidth: 58 },
  petalTypeChipActive: { backgroundColor: '#1a3a1a', borderColor: '#2e7d32' },
  petalTypeEmoji: { fontSize: 18, marginBottom: 2 },
  petalTypeLabel: { fontSize: 11, color: '#4a7a4a' },
  petalTypeLabelActive: { color: '#8fbc8f' },
  updateEntry: { backgroundColor: '#0a180a', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 2, borderLeftColor: '#2e7d32' },
  updateDate: { fontSize: 10, color: '#3a6a3a', marginBottom: 2 },
  updateText: { fontSize: 13, color: '#6a9a6a' },
  progressBig: { fontSize: 48, fontWeight: '700', color: '#c8e6c8', textAlign: 'center', marginBottom: 8 },
  progressTrack: { height: 8, backgroundColor: '#1a3a1a', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: 8, borderRadius: 4 },
  quickBtns: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: '#1a3a1a', borderRadius: 8 },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: '#4a7a4a' },
  // Note panel
  noteBody: { flex: 1, minHeight: 60, maxHeight: 120, marginBottom: 10 },
  noteTitleInput: { fontSize: 16, fontWeight: '600', color: '#c8e6c8', paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: '#2e7d32', marginBottom: 4 },
  noteBodyInput: { fontSize: 14, color: '#8fbc8f', lineHeight: 20, minHeight: 60, textAlignVertical: 'top' },
  noteBodyPlaceholder: { fontSize: 14, color: '#2a5a2a', fontStyle: 'italic' },
  // Vine panel
  vinePanel: { backgroundColor: '#0a180a', borderTopWidth: 0.5, borderTopColor: '#1a3a1a', padding: 16, paddingBottom: 20 },
  vinePanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, paddingRight: 28 },
  vinePanelEmoji: { fontSize: 20 },
  vinePanelTitle: { fontSize: 15, fontWeight: '600', color: '#c8e6c8' },
  vinePanelMeta: { fontSize: 11, color: '#4a7a4a', marginTop: 2 },
  vineNoteInput: { fontSize: 14, color: '#8fbc8f', borderWidth: 0.5, borderColor: '#1a3a1a', borderRadius: 8, padding: 10, minHeight: 60, textAlignVertical: 'top', marginBottom: 10, backgroundColor: '#0d1f0d' },
  linkedRow: { flexDirection: 'row', marginBottom: 10 },
  linkedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, backgroundColor: '#0a180a' },
  linkedChipEmoji: { fontSize: 13 },
  linkedChipText: { fontSize: 12, fontWeight: '500' },
  vineNoteText: { fontSize: 14, color: '#6a9a6a', lineHeight: 20, marginBottom: 10 },
  vineNotePlaceholder: { fontSize: 13, color: '#2a5a2a', fontStyle: 'italic', marginBottom: 10 },
  vineLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vineLabelInput: { flex: 1, fontSize: 13, color: '#8fbc8f', borderWidth: 0.5, borderColor: '#1a3a1a', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#0d1f0d' },
  vineDeleteBtn: { padding: 8 },
});