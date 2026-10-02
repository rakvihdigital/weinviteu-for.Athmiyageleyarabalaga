import * as THREE from "three";
import gsap from "gsap";

/* Builds the temple on the page's canvas. ctl.dispose() tears it down. */
export async function initTemple(ctl){
const ac = new AbortController();
const on = (t,ev,fn,o) => t.addEventListener(ev,fn,Object.assign({},o,{signal:ac.signal}));
let raf = 0;

/* ───────── Invitation content: edit here ───────── */
const CONTENT = {
  titleKn:   "ಆತ್ಮೀಯ ಗೆಳೆಯರ ಬಳಗ",
  subKn:     "11ನೇ ವರ್ಷದ ಅದ್ದೂರಿ ವಾರ್ಷಿಕೋತ್ಸವ",
  host:      "ATHMIYA GELEYARA BALAGA",
  date:      "02 \u2013 04 OCT 2026",
  location:  "BANGALORE",
  ceremony:  ["GANESHA", "FESTIVAL", "", "02 \u2013 04 OCT", "2026", "BANGALORE"],
  message:   ["WITH HIS", "BLESSINGS", "", "WE WELCOME", "YOU AND YOUR", "FAMILY"],
  emblemRing:"ATHMIYA GELEYARA BALAGA",
  emblemFoot:"SINCE 2015",
  thanks:    "THANK YOU",
  venue:     "BANGALORE",
  contact:   "[CONTACT / RSVP]",
  rsvpBack:  ["RSVP", "[CONTACT NAME]", "[PHONE NUMBER]", "[REPLY BY DATE]"]
};
const IMG_ALTAR = "/altar.jpg";
const IMG_GANESHA = "/ganesha.jpg";

const $ = id => document.getElementById(id);
const canvas = $('c');

let renderer;
try{ renderer = new THREE.WebGLRenderer({canvas, antialias:false, powerPreference:'high-performance'}); }
catch(e){ $('fail').style.display='flex'; return; }
const PR = Math.min(window.devicePixelRatio||1, 1.75);
renderer.setPixelRatio(PR);
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* fonts must be ready before inscriptions are drawn to canvas */
try{
  await Promise.race([
    Promise.all([
      document.fonts.load('600 60px Cinzel','A'),
      document.fonts.load('400 60px Cinzel','A'),
      document.fonts.load('700 120px "Noto Serif Kannada"', CONTENT.titleKn),
      document.fonts.load('500 60px "Noto Serif Kannada"', CONTENT.subKn)
    ]),
    new Promise(r=>setTimeout(r,3500))
  ]);
}catch(e){}
if(ctl.dead) return;

/* ───────── helpers ───────── */
let seed = 20150911;
const rnd = () => { seed|=0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed>>>15, 1|seed);
  t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; };
const rr = (a,b) => a + (b-a)*rnd();
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const sstep = (a,b,v) => { const t = clamp((v-a)/(b-a),0,1); return t*t*(3-2*t); };
const lerp = (a,b,t) => a+(b-a)*t;
const flick = (t,p) => .5*Math.sin(t*11+p) + .3*Math.sin(t*17.3+p*1.7) + .2*Math.sin(t*29.1+p*.6);
function cv(w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; return [c, c.getContext('2d')]; }
function tex(c, srgb){ const t=new THREE.CanvasTexture(c); if(srgb!==false) t.encoding=THREE.sRGBEncoding;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return t; }
function goldGrad(x, y0, y1){ const g=x.createLinearGradient(0,y0,0,y1);
  g.addColorStop(0,'#f8dd92'); g.addColorStop(.35,'#d09a37'); g.addColorStop(.6,'#f3d27e'); g.addColorStop(1,'#a8741f'); return g; }
function spaced(x, str, cx, y, sp){
  let w=0; const ws=[]; for(const ch of str){ const m=x.measureText(ch).width; ws.push(m); w+=m+sp; } w-=sp;
  let px=cx-w/2; const ta=x.textAlign; x.textAlign='left'; let i=0;
  for(const ch of str){ x.fillText(ch,px,y); px+=ws[i++]+sp; } x.textAlign=ta; }
function engrave(x, str, cx, y, font, sp){
  x.font=font; x.textAlign='center'; x.textBaseline='middle';
  const size = parseInt(font.match(/(\d+)px/)[1],10);
  x.fillStyle='rgba(18,7,0,.85)'; sp?spaced(x,str,cx,y+3,sp):x.fillText(str,cx,y+3);
  x.fillStyle='rgba(255,236,190,.35)'; sp?spaced(x,str,cx,y-1.5,sp):x.fillText(str,cx,y-1.5);
  x.fillStyle=goldGrad(x,y-size*.6,y+size*.6); sp?spaced(x,str,cx,y,sp):x.fillText(str,cx,y); }

/* ───────── scene ───────── */
const scene = new THREE.Scene();
const fogOut = new THREE.Color(0xa59a8c), fogIn = new THREE.Color(0x231107);
scene.fog = new THREE.FogExp2(fogOut.getHex(), 0.045);
scene.background = scene.fog.color;
const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.1, 160);

/* environment for metal reflections: dark hall with warm lamp points */
{ const [c,x]=cv(512,256); const g=x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#4a2e16'); g.addColorStop(.5,'#22130a'); g.addColorStop(1,'#0c0603'); x.fillStyle=g; x.fillRect(0,0,512,256);
  for(let i=0;i<18;i++){ const px=rnd()*512, py=rr(70,170), r=rr(10,34); const rg=x.createRadialGradient(px,py,0,px,py,r);
    rg.addColorStop(0,'rgba(255,214,140,1)'); rg.addColorStop(.3,'rgba(255,160,60,.6)'); rg.addColorStop(1,'rgba(255,120,20,0)');
    x.fillStyle=rg; x.fillRect(px-r,py-r,r*2,r*2); }
  const rg=x.createRadialGradient(256,20,0,256,20,160); rg.addColorStop(0,'rgba(255,220,160,.6)'); rg.addColorStop(1,'rgba(255,200,120,0)');
  x.fillStyle=rg; x.fillRect(0,0,512,200);
  const et=tex(c); et.mapping=THREE.EquirectangularReflectionMapping;
  const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromEquirectangular(et).texture; pm.dispose(); }

/* ───────── procedural textures ───────── */
function rosette(x,cx,cy,R,n,fill){ x.fillStyle=fill;
  for(let i=0;i<n;i++){ x.save(); x.translate(cx,cy); x.rotate(i*Math.PI*2/n); x.beginPath();
    x.ellipse(0,-R*.62,R*.17,R*.38,0,0,Math.PI*2); x.fill(); x.restore(); }
  x.beginPath(); x.arc(cx,cy,R*.2,0,Math.PI*2); x.fill(); }

const carveC = (()=>{ const [c,x]=cv(512,512); x.fillStyle='#86643f'; x.fillRect(0,0,512,512);
  for(let i=0;i<7000;i++){ x.fillStyle = rnd()<.5 ? 'rgba(30,16,6,.07)' : 'rgba(255,225,170,.06)'; x.fillRect(rnd()*512,rnd()*512,rr(1,4),rr(1,4)); }
  for(let gy=0;gy<2;gy++) for(let gx=0;gx<2;gx++){ const cx=gx*256+128, cy=gy*256+128;
    x.strokeStyle='rgba(35,18,6,.6)'; x.lineWidth=6; x.strokeRect(cx-116+2,cy-116+3,232,232);
    x.strokeStyle='#b58c5a'; x.lineWidth=4; x.strokeRect(cx-116,cy-116,232,232);
    rosette(x,cx+3,cy+4,92,12,'rgba(35,18,6,.55)'); rosette(x,cx,cy,92,12,'#b9905e');
    rosette(x,cx+2,cy+2,44,8,'rgba(35,18,6,.5)');   rosette(x,cx,cy,44,8,'#d0a772');
    for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ x.fillStyle='rgba(35,18,6,.5)'; x.beginPath(); x.arc(cx+dx*96+2,cy+dy*96+2,10,0,7); x.fill();
      x.fillStyle='#c39a66'; x.beginPath(); x.arc(cx+dx*96,cy+dy*96,10,0,7); x.fill(); } }
  return c; })();
function carveTex(rx,ry){ const t=tex(carveC); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); return t; }
function carveBump(rx,ry){ const t=tex(carveC,false); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx,ry); return t; }
function stoneMat(rx,ry,color){ return new THREE.MeshStandardMaterial({ map:carveTex(rx,ry), bumpMap:carveBump(rx,ry), bumpScale:.035,
  color:color||0xb89a78, roughness:.82, metalness:.05, envMapIntensity:.5 }); }

/* door: colour, bump and metal/roughness maps drawn from the same ornament routine */
function doorCanvas(mode){ const W=512,H=1380; const [c,x]=cv(W,H);
  const G = mode===0 ? goldGrad(x,0,H) : mode===1 ? '#ffffff' : 'rgb(0,70,255)';
  if(mode===0){ x.fillStyle='#6a3915'; x.fillRect(0,0,W,H);
    for(let i=0;i<340;i++){ x.fillStyle = rnd()<.55 ? 'rgba(30,12,2,.10)' : 'rgba(255,190,110,.06)'; x.fillRect(rnd()*W,0,rr(1,4),H); }
    const sh=x.createLinearGradient(0,0,0,H); sh.addColorStop(0,'rgba(0,0,0,.25)'); sh.addColorStop(.3,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,.3)'); x.fillStyle=sh; x.fillRect(0,0,W,H); }
  else if(mode===1){ x.fillStyle='#808080'; x.fillRect(0,0,W,H); }
  else { x.fillStyle='rgb(0,150,20)'; x.fillRect(0,0,W,H); }
  const panels=[[58,66,396,596],[58,716,396,596]];
  for(const [px,py,pw,ph] of panels){
    if(mode===0){ x.fillStyle='rgba(20,8,0,.28)'; x.fillRect(px,py,pw,ph);
      x.strokeStyle='rgba(15,5,0,.7)'; x.lineWidth=7; x.strokeRect(px,py,pw,ph);
      x.strokeStyle='rgba(255,200,130,.18)'; x.lineWidth=3; x.strokeRect(px+6,py+6,pw-12,ph-12); }
    if(mode===1){ x.fillStyle='#5a5a5a'; x.fillRect(px,py,pw,ph); x.strokeStyle='#9a9a9a'; x.lineWidth=8; x.strokeRect(px,py,pw,ph); }
    x.strokeStyle=G; x.lineWidth=5; x.strokeRect(px+20,py+20,pw-40,ph-40);
    x.fillStyle=G; for(const [ax,ay] of [[0,0],[1,0],[0,1],[1,1]]){ const qx=px+34+ax*(pw-68), qy=py+34+ay*(ph-68);
      rosette(x,qx,qy,26,8,G); } }
  /* upper spire */
  { const cx=256, cy=364, s=1.25; x.fillStyle=G; x.beginPath(); x.moveTo(cx,cy-160*s);
    x.bezierCurveTo(cx+62*s,cy-80*s,cx+92*s,cy,cx+38*s,cy+58*s); x.bezierCurveTo(cx+96*s,cy+92*s,cx+52*s,cy+156*s,cx,cy+166*s);
    x.bezierCurveTo(cx-52*s,cy+156*s,cx-96*s,cy+92*s,cx-38*s,cy+58*s); x.bezierCurveTo(cx-92*s,cy,cx-62*s,cy-80*s,cx,cy-160*s); x.fill();
    x.fillStyle = mode===0 ? '#5a2f10' : mode===1 ? '#707070' : 'rgb(0,150,20)';
    x.beginPath(); x.ellipse(cx,cy-30*s,22*s,58*s,0,0,7); x.fill(); x.beginPath(); x.ellipse(cx,cy+100*s,20*s,34*s,0,0,7); x.fill();
    x.fillStyle=G; x.beginPath(); x.ellipse(cx,cy-30*s,9*s,36*s,0,0,7); x.fill(); x.beginPath(); x.arc(cx,cy+100*s,10*s,0,7); x.fill();
    x.strokeStyle=G; x.lineWidth=6; for(const d of [-1,1]){ x.beginPath(); x.arc(cx+d*118,cy+40,44,d>0?Math.PI*.6:Math.PI*1.9,d>0?Math.PI*2.1:Math.PI*3.4); x.stroke();
      x.beginPath(); x.arc(cx+d*118,cy-90,26,0,7); x.stroke(); } }
  /* lower medallion */
  { const cx=256, cy=1014; rosette(x,cx,cy,128,16,G); x.strokeStyle=G; x.lineWidth=7; x.beginPath(); x.arc(cx,cy,140,0,7); x.stroke();
    x.fillStyle = mode===0 ? '#5a2f10' : mode===1 ? '#707070' : 'rgb(0,150,20)'; x.beginPath(); x.arc(cx,cy,52,0,7); x.fill();
    rosette(x,cx,cy,50,8,G); }
  /* studs on stiles */
  x.fillStyle=G; for(let i=0;i<9;i++){ const y=90+i*150; for(const sx of [28,484]){ x.beginPath(); x.arc(sx,y,9,0,7); x.fill(); } }
  return c; }
const doorMat = new THREE.MeshStandardMaterial({ map:tex(doorCanvas(0)), bumpMap:tex(doorCanvas(1),false), bumpScale:.03,
  metalnessMap:tex(doorCanvas(2),false), metalness:1, roughness:1, envMapIntensity:1.3 });
doorMat.roughnessMap = doorMat.metalnessMap;

const puffTex = (()=>{ const [c,x]=cv(256,256);
  for(let i=0;i<26;i++){ const a=rnd()*7, d=rnd()*58, px=128+Math.cos(a)*d, py=128+Math.sin(a)*d, r=rr(38,64);
    const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,'rgba(255,255,255,.16)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g; x.fillRect(0,0,256,256); } return tex(c); })();
const flameTex = (()=>{ const [c,x]=cv(64,128); x.translate(32,88); x.scale(1,2.3);
  const g=x.createRadialGradient(0,0,0,0,-4,26); g.addColorStop(0,'rgba(255,252,228,1)'); g.addColorStop(.22,'rgba(255,208,100,.95)');
  g.addColorStop(.6,'rgba(255,128,24,.4)'); g.addColorStop(1,'rgba(255,80,0,0)'); x.fillStyle=g; x.fillRect(-32,-40,64,60); return tex(c); })();
const glowTex = (()=>{ const [c,x]=cv(128,128); const g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,236,190,1)'); g.addColorStop(.25,'rgba(255,190,100,.55)'); g.addColorStop(1,'rgba(255,150,50,0)'); x.fillStyle=g; x.fillRect(0,0,128,128); return tex(c); })();
const streakTex = (()=>{ const [c,x]=cv(64,256); const g=x.createLinearGradient(0,256,0,0);
  g.addColorStop(0,'rgba(255,230,170,1)'); g.addColorStop(.5,'rgba(255,215,150,.35)'); g.addColorStop(1,'rgba(255,200,130,0)'); x.fillStyle=g; x.fillRect(0,0,64,256);
  x.globalCompositeOperation='destination-in'; const h=x.createLinearGradient(0,0,64,0); h.addColorStop(0,'rgba(0,0,0,0)'); h.addColorStop(.5,'rgba(0,0,0,1)'); h.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=h; x.fillRect(0,0,64,256); return tex(c); })();

const floorTex = (()=>{ const [c,x]=cv(512,512); x.fillStyle='#8f7252'; x.fillRect(0,0,512,512);
  for(let ty=0;ty<4;ty++) for(let tx=0;tx<4;tx++){ const v=rr(-10,10); x.fillStyle=`rgb(${150+v|0},${120+v|0},${88+v|0})`; x.fillRect(tx*128+2,ty*128+2,124,124); }
  for(let i=0;i<5000;i++){ x.fillStyle = rnd()<.5 ? 'rgba(40,20,8,.06)':'rgba(255,235,200,.05)'; x.fillRect(rnd()*512,rnd()*512,rr(1,5),rr(1,3)); }
  const t=tex(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(10,30); return t; })();

function rangoliTex(){ const [c,x]=cv(512,512); const cols=['#f4ecd9','#f2c230','#f08a12','#b3161d','#f6a81c','#f4ecd9'];
  for(let ring=6;ring>=1;ring--){ const R=ring*38, n=ring*10; x.fillStyle=cols[(ring-1)%cols.length];
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2 + ring*.3; x.save(); x.translate(256+Math.cos(a)*R,256+Math.sin(a)*R); x.rotate(a+Math.PI/2);
      x.beginPath(); x.ellipse(0,0,13,22,0,0,7); x.fill(); x.restore(); } }
  x.fillStyle='#f2c230'; x.beginPath(); x.arc(256,256,20,0,7); x.fill(); return tex(c); }

/* ───────── materials ───────── */
const gold  = new THREE.MeshStandardMaterial({ color:0xd8a544, metalness:1, roughness:.27, envMapIntensity:1.4 });
const brass = new THREE.MeshStandardMaterial({ color:0xb98a34, metalness:1, roughness:.36, envMapIntensity:1.3 });
const wallMat = stoneMat(24,2.4,0x9a7c5c);
const pillarMat = stoneMat(2,6,0xc09a6c);
const blockMat = stoneMat(1,1,0xb08c62);
const frameMat = new THREE.MeshStandardMaterial({ map:carveTex(1,7), bumpMap:carveBump(1,7), bumpScale:.05, color:0xc98d3e, metalness:.45, roughness:.5, envMapIntensity:1.1 });

function box(w,h,d,mat,x,y,z,parent){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z);
  m.receiveShadow=true; (parent||scene).add(m); return m; }

/* ───────── architecture ───────── */
{ const f=new THREE.Mesh(new THREE.PlaneGeometry(40,124), new THREE.MeshStandardMaterial({ map:floorTex, roughness:.32, metalness:.0, envMapIntensity:.9 }));
  f.rotation.x=-Math.PI/2; f.position.set(0,0,-46); f.receiveShadow=true; scene.add(f);
  for(const s of [-1,1]){ const w=new THREE.Mesh(new THREE.PlaneGeometry(96,9), wallMat); w.rotation.y=-s*Math.PI/2; w.position.set(s*9.5,4.5,-48.5); w.receiveShadow=true; scene.add(w);
    box(.34,.14,82,blockMat,s*9.32,2.0,-42); }
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(19,96), stoneMat(4,20,0x5e4630)); ceil.rotation.x=Math.PI/2; ceil.position.set(0,9,-48.5); scene.add(ceil);
  const end=new THREE.Mesh(new THREE.PlaneGeometry(19,9), stoneMat(4,2,0xa5835c)); end.position.set(0,4.5,-82); scene.add(end);
  for(let z=-5.5;z>-82;z-=5){ box(19,.5,.6,blockMat,0,8.75,z); } }

/* facade */
box(12.6,12,.6,stoneMat(3,3,0x8a6a48),-9.7,6,-.3); box(12.6,12,.6,stoneMat(3,3,0x8a6a48),9.7,6,-.3);
box(6.8,4.6,.6,stoneMat(2,1.2,0x8a6a48),0,9.7,-.3);
for(const s of [-1,1]){ const p=box(1.1,7.4,.55,frameMat,s*2.86,3.7,.05); p.castShadow=true; }
{ const m=frameMat.clone(); m.map=carveTex(6,1); m.bumpMap=carveBump(6,1); box(6.84,1.2,.6,m,0,6.8,.08); }

/* doors on real hinges */
const hingeL=new THREE.Group(), hingeR=new THREE.Group(); hingeL.position.set(-2.3,0,0); hingeR.position.set(2.3,0,0); scene.add(hingeL,hingeR);
for(const [h,s] of [[hingeL,1],[hingeR,-1]]){
  const leaf=new THREE.Mesh(new THREE.BoxGeometry(2.3,6.2,.16), doorMat); leaf.position.set(s*1.15,3.1,0); leaf.castShadow=leaf.receiveShadow=true; h.add(leaf);
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.15,12), gold); bar.position.set(s*2.06,3.05,.17); bar.castShadow=true; h.add(bar);
  for(const dy of [-.575,0,.575]){ const k=new THREE.Mesh(new THREE.SphereGeometry(.065,14,10), gold); k.position.set(s*2.06,3.05+dy,.17); h.add(k);
    const st=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.1,8), gold); st.rotation.x=Math.PI/2; st.position.set(s*2.06,3.05+dy,.12); h.add(st); } }

/* pillars */
{ const zs=[]; for(let z=-3;z>-80;z-=5) zs.push(z); const n=zs.length*2;
  const shaft=new THREE.InstancedMesh(new THREE.CylinderGeometry(.42,.46,7.4,20), pillarMat, n);
  const base=new THREE.InstancedMesh(new THREE.BoxGeometry(1.15,.7,1.15), blockMat, n);
  const cap=new THREE.InstancedMesh(new THREE.BoxGeometry(1.3,.9,1.3), blockMat, n);
  const m=new THREE.Matrix4(); let i=0;
  for(const z of zs) for(const s of [-1,1]){ m.makeTranslation(s*7.6,4.4,z); shaft.setMatrixAt(i,m); m.makeTranslation(s*7.6,.35,z); base.setMatrixAt(i,m);
    m.makeTranslation(s*7.6,8.3,z); cap.setMatrixAt(i,m); i++; }
  for(const im of [shaft,base,cap]){ im.castShadow=true; im.receiveShadow=true; scene.add(im); } }

/* cross walls with arched openings */
function archWall(z, ow, spring){ const s=new THREE.Shape(); s.moveTo(-9.5,0); s.lineTo(-ow,0); s.lineTo(-ow,spring); s.absarc(0,spring,ow,Math.PI,0,true);
  s.lineTo(ow,0); s.lineTo(9.5,0); s.lineTo(9.5,9); s.lineTo(-9.5,9); s.lineTo(-9.5,0);
  const g=new THREE.ExtrudeGeometry(s,{depth:.6,bevelEnabled:false}); const mat=stoneMat(.25,.25,0xa8855e);
  const m=new THREE.Mesh(g,mat); m.position.z=z-.3; m.receiveShadow=true; scene.add(m); }
archWall(-21,2.7,2.9); archWall(-57,3.4,2.6);

/* ───────── marigolds (one instanced mesh) ───────── */
const F=[]; const PAL=[0xf08a12,0xf6a81c,0xf2c230,0xe2620c,0xf4ecd9,0xa9141c,0x3f7a2a];
const fl=(x,y,z,s,c)=>F.push(x,y,z,s,c);
const SEQ_A=[2,2,0,0,5,0,2,4], SEQ_B=[0,0,2,4,4,2,0,5], SEQ_C=[4,2,0,3,0,2];
function hang(x,z,y0,len,seq,size){ size=size||.115; let y=y0,i=0; while(y>y0-len){ fl(x+rr(-.02,.02),y,z+rr(-.02,.02),size*rr(.9,1.1),seq[(i>>2)%seq.length]); y-=size*1.3; i++; }
  fl(x,y-.02,z,size*1.25,4); fl(x,y-.2,z,size*.8,4); }
function swag(x1,y1,z1,x2,y2,z2,sag,seq,size){ size=size||.11; const L=Math.hypot(x2-x1,y2-y1,z2-z1)+sag; const n=Math.ceil(L/(size*1.3));
  for(let i=0;i<=n;i++){ const t=i/n; fl(lerp(x1,x2,t)+rr(-.015,.015), lerp(y1,y2,t)-sag*4*t*(1-t), lerp(z1,z2,t)+rr(-.015,.015), size*rr(.9,1.1), seq[(i>>2)%seq.length]); } }
function toran(z,y,x0,x1,w,sag){ const n=Math.round((x1-x0)/w); for(let i=0;i<n;i++){ const a=x0+i*w, b=a+w; swag(a,y,z,b,y,z,sag,i%2?SEQ_A:SEQ_B); swag(a,y,z+.04,b,y,z+.04,sag*1.9,SEQ_C,.085); if(i>0) hang(a,z,y,.75,SEQ_A,.1); } }
function flowerArch(z,cy,r,thick,n){ for(let i=0;i<n;i++){ const a=rnd()*Math.PI, R=r+rnd()*thick; const band=Math.floor(a/Math.PI*14)%4;
    fl(Math.cos(a)*R, cy+Math.sin(a)*R, z+rr(0,.12), rr(.1,.15), [2,0,5,4][band]); }
  for(const s of [-1,1]) for(let y=0;y<cy;y+=.16) for(let k=0;k<3;k++) fl(s*(r+rnd()*thick), y+rr(-.05,.05), z+rr(0,.12), rr(.1,.14), [0,2,0,4][Math.floor(y*1.6)%4]); }
function heap(x,y,z,rad,n,parentRot){ for(let i=0;i<n;i++){ const a=rnd()*7, d=Math.sqrt(rnd())*rad; let px=Math.cos(a)*d, pz=Math.sin(a)*d*.6;
    if(parentRot){ const c=Math.cos(parentRot), s=Math.sin(parentRot); const tx=px*c+pz*s, tz=-px*s+pz*c; px=tx; pz=tz; }
    fl(x+px, y+rr(0,.08)+(1-d/rad)*.1, z+pz, rr(.07,.11), [0,2,1,5,4,0,3][i%7]); } }

/* hall 1 */
toran(-2.7,6.3,-2.2,2.2,1.1,.3);
for(const z of [-3,-8,-13,-18]){ toran(z,7.3,-7,7,1.75,.45); for(const s of [-1,1]){ hang(s*7.08,z+.1,7.0,4.6,SEQ_A,.125); hang(s*7.14,z-.3,7.0,3.6,SEQ_B,.11); } }
flowerArch(-20.6,2.9,2.75,.6,620);
/* middle hall */
for(const z of [-28,-33,-38,-43]){ toran(z,7.4,-7,7,1.75,.45); for(const s of [-1,1]) hang(s*7.1,z+.1,7.0,4.2,SEQ_B,.12); }
/* inner hall */
flowerArch(-56.6,2.6,3.45,.55,640);
for(const s of [-1,1]){ swag(s*7.4,7.6,-63,s*1.6,8.6,-68,1.3,SEQ_A,.14); swag(s*7.4,7.4,-68,s*2,8.6,-73,1.5,SEQ_B,.13);
  hang(s*7.1,-62.9,7.2,4.4,SEQ_A,.125); hang(s*7.1,-67.9,7.2,4.0,SEQ_B,.125); }
flowerArch(-81.8,3.2,3.0,.6,420);

/* ───────── plants, lamps, bells ───────── */
const leafGeo = (()=>{ const g=new THREE.PlaneGeometry(1,1,6,18); const p=g.attributes.position; const L=3.3; const col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){ const u=p.getX(i), v=p.getY(i)+.5; const w=.5*Math.sin(Math.PI*Math.pow(v,.75))*(1-.2*v)+.015;
    const X=u*2*w, Y=L*v*(.8-.95*v*v)-Math.abs(u)*w*.9, Z=L*.8*v; p.setXYZ(i,X,Y,Z);
    const rib=Math.exp(-Math.abs(u)*26), sh=.75+.25*Math.sin(u*40); col[i*3]=lerp(.2*sh,.56,rib); col[i*3+1]=lerp(.46*sh,.72,rib); col[i*3+2]=lerp(.12*sh,.3,rib); }
  g.setAttribute('color', new THREE.BufferAttribute(col,3)); g.computeVertexNormals(); return g; })();
const leafMat = new THREE.MeshStandardMaterial({ vertexColors:true, side:THREE.DoubleSide, roughness:.55, metalness:0, envMapIntensity:.5 });
const stemMat = new THREE.MeshStandardMaterial({ color:0x8a9a44, roughness:.7 });
const leaves=[];
function banana(x,z,h,n,face){ const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(.11,.19,h,10), stemMat); st.position.y=h/2; st.castShadow=true; g.add(st);
  for(let i=0;i<n;i++){ const piv=new THREE.Group(); piv.position.y=h-rr(0,.5); piv.rotation.y = face + (i-(n-1)/2)*(Math.PI*1.5/n) + rr(-.2,.2);
    const lf=new THREE.Mesh(leafGeo,leafMat); const sc=rr(.8,1.15); lf.scale.set(sc,sc,sc); lf.rotation.x=rr(-.5,-.05); lf.castShadow=true; piv.add(lf); g.add(piv);
    leaves.push({m:lf, r:lf.rotation.x, p:rnd()*7}); } }
banana(-4.2,-11,4.6,6,Math.PI*.5); banana(4.2,-11,4.6,6,-Math.PI*.5); banana(-4.9,-16,4.0,5,Math.PI*.5); banana(4.9,-16,4.0,5,-Math.PI*.5);
banana(-7.0,-43.6,4.4,5,Math.PI*.5); banana(7.2,-41.6,4.6,5,-Math.PI*.45);
banana(-5.6,-62.6,5.2,6,Math.PI*.45); banana(5.6,-62.6,5.2,6,-Math.PI*.45);

const lampGeo = new THREE.LatheGeometry([[0,0],[.34,0],[.36,.04],[.2,.1],[.07,.16],[.05,.5],[.095,.55],[.05,.6],[.05,1.0],[.1,1.05],[.05,1.1],[.05,1.42],[.3,1.5],[.33,1.55],[.3,1.57],[.06,1.56],[.04,1.75],[.08,1.8],[0,1.92]].map(a=>new THREE.Vector2(a[0],a[1])), 28);
const flames=[];
function flame(parent,x,y,z,s){ const m=new THREE.SpriteMaterial({ map:flameTex, blending:THREE.AdditiveBlending, depthWrite:false, fog:false, transparent:true });
  const sp=new THREE.Sprite(m); sp.center.set(.5,.22); sp.position.set(x,y,z); sp.scale.set(.11*s,.26*s,1); parent.add(sp); flames.push({sp, s, p:rnd()*20}); }
function lamp(parent,x,z,s,y){ const g=new THREE.Group(); g.position.set(x,y||0,z); g.scale.setScalar(s); parent.add(g);
  const m=new THREE.Mesh(lampGeo,brass); m.castShadow=true; g.add(m);
  for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+.3; flame(g,Math.cos(a)*.29,1.6,Math.sin(a)*.29,1); }
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, blending:THREE.AdditiveBlending, depthWrite:false, fog:false, transparent:true, opacity:.22 }));
  gl.position.set(0,1.7,0); gl.scale.set(1.9,1.9,1); g.add(gl); return g; }
lamp(scene,-3.3,-11.5,1.3); lamp(scene,3.3,-11.5,1.3); lamp(scene,-3.6,-15,1.0); lamp(scene,3.6,-15,1.0); lamp(scene,-4.4,-19.6,1.1); lamp(scene,4.4,-19.6,1.1);
lamp(scene,-5.5,-46.9,1.3);
lamp(scene,-3.6,-66.4,1.55); lamp(scene,3.6,-66.4,1.55);

const bellGeo = new THREE.LatheGeometry([[0,.36],[.05,.36],[.07,.3],[.11,.2],[.17,.06],[.2,0],[.18,0],[.1,.18],[0,.26]].map(a=>new THREE.Vector2(a[0],a[1])), 20);
for(const [x,y,z] of [[-2.3,5.3,-6.9],[2.3,5.3,-6.9],[-1.5,5.9,-18.4],[1.5,5.9,-18.4]]){ const b=new THREE.Mesh(bellGeo,brass); b.position.set(x,y,z); b.castShadow=true; scene.add(b);
  const ch=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,9-y-.36,6),brass); ch.position.set(x,(9+y+.36)/2,z); scene.add(ch); }

/* candle rows along the wall ledges */
{ const pts=[]; for(let z=-2;z>-81;z-=1.15) for(const s of [-1,1]) pts.push(s*9.25,2.2,z+rr(-.1,.1));
  for(let x=-8;x<=8;x+=.9){ if(Math.abs(x)>3.8) pts.push(x,2.2,-81.7); pts.push(x,6.6,-81.7); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts,3));
  var candleMat=new THREE.PointsMaterial({ map:glowTex, size:.34, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, fog:false, opacity:.9 });
  scene.add(new THREE.Points(g,candleMat)); }

/* rangoli */
function rangoli(x,z,size){ const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size), new THREE.MeshStandardMaterial({ map:rangoliTex(), transparent:true, roughness:.9, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2 }));
  m.rotation.x=-Math.PI/2; m.position.set(x,.012,z); m.receiveShadow=true; scene.add(m); }
rangoli(0,-9.6,5.2); rangoli(0,-44.2,3.8); rangoli(0,-65.4,3.0);
{ const d=new THREE.Mesh(new THREE.CylinderGeometry(.16,.1,.08,16),brass); d.position.set(0,.05,-65.4); scene.add(d); flame(scene,0,.12,-65.4,.9); heap(0,.02,-65.4,.5,60); }

/* ───────── scene 3: hanging plaque ───────── */
function cartouche(x,l,t,r,b){ const m=(t+b)/2, d=(b-t)*.6; x.beginPath(); x.moveTo(l,t); x.lineTo(r,t); x.quadraticCurveTo(r+d*.1,m-d*.25,r+d*.55,m);
  x.quadraticCurveTo(r+d*.1,m+d*.25,r,b); x.lineTo(l,b); x.quadraticCurveTo(l-d*.1,m+d*.25,l-d*.55,m); x.quadraticCurveTo(l-d*.1,m-d*.25,l,t); x.closePath(); }
const plaque = new THREE.Group(); plaque.position.set(0,3.2,-12); scene.add(plaque);
{ const W=2048,H=860; const [c,x]=cv(W,H);
  function panel(l,t,r,b){ cartouche(x,l,t,r,b); const g=x.createLinearGradient(0,t,0,b); g.addColorStop(0,'#6a1118'); g.addColorStop(.5,'#4a0a10'); g.addColorStop(1,'#33060a');
    x.fillStyle=g; x.fill(); x.lineWidth=14; x.strokeStyle=goldGrad(x,t,b); x.stroke();
    cartouche(x,l+16,t+22,r-16,b-22); x.lineWidth=3; x.stroke(); }
  panel(250,70,1798,520);
  engrave(x, CONTENT.titleKn, 1024, 232, '700 152px "Noto Serif Kannada", serif');
  x.strokeStyle=goldGrad(x,350,356); x.lineWidth=3; x.beginPath(); x.moveTo(560,356); x.lineTo(980,356); x.moveTo(1068,356); x.lineTo(1488,356); x.stroke();
  x.save(); x.translate(1024,356); x.rotate(Math.PI/4); x.fillStyle='#e8c575'; x.fillRect(-13,-13,26,26); x.restore();
  engrave(x, CONTENT.host, 1024, 436, '600 46px Cinzel, Georgia, serif', 9);
  panel(560,560,1488,800);
  engrave(x, CONTENT.subKn, 1024, 636, '500 58px "Noto Serif Kannada", serif');
  engrave(x, CONTENT.date+'  \u25C6  '+CONTENT.location, 1024, 730, '600 36px Cinzel, Georgia, serif', 5);
  const t=tex(c); const b=tex(c,false);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(6.2,6.2*H/W), new THREE.MeshStandardMaterial({ map:t, bumpMap:b, bumpScale:.02, alphaTest:.5, side:THREE.DoubleSide,
    metalness:.45, roughness:.42, emissive:0xffffff, emissiveMap:t, emissiveIntensity:.28, envMapIntensity:1.1 }));
  plaque.add(m);
  for(const s of [-1,1]){ const ch=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,7,6),brass); ch.position.set(s*2.1,4.55,0); plaque.add(ch);
    const k=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),gold); k.position.set(s*2.1,1.08,0); plaque.add(k); } }

/* ───────── image-backed shrine panels (scenes 4 and 5) ───────── */
const panelMats=[];
function shrinePanel(src,w,h,bulge){ const t=new THREE.TextureLoader().load(src); t.minFilter=THREE.LinearFilter; t.generateMipmaps=false;
  const mat=new THREE.ShaderMaterial({ uniforms:{ map:{value:t}, gain:{value:1}, bulge:{value:bulge}, fogC:{value:scene.fog.color}, fogD:{value:.02} },
    vertexShader:`uniform float bulge; varying vec2 vUv; varying float vD;
      void main(){ vUv=uv; vec3 p=position; vec2 c=uv-vec2(.5,.48); p.z+=bulge*exp(-dot(c,c)*9.); vec4 mv=modelViewMatrix*vec4(p,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform sampler2D map; uniform float gain; uniform vec3 fogC; uniform float fogD; varying vec2 vUv; varying float vD;
      void main(){ vec3 c=texture2D(map,vUv).rgb*gain;
        float a=smoothstep(0.,.14,vUv.x)*smoothstep(0.,.14,1.-vUv.x)*smoothstep(0.,.12,vUv.y)*smoothstep(0.,.1,1.-vUv.y);
        c=mix(vec3(.045,.022,.01),c,a); float f=1.-exp(-fogD*fogD*vD*vD); gl_FragColor=vec4(mix(c,fogC,f),1.); }` });
  panelMats.push(mat); return new THREE.Mesh(new THREE.PlaneGeometry(w,h,40,24),mat); }

const smokes=[];
function puff(parent,x,y,z,scale,op,kind,color){ const m=new THREE.SpriteMaterial({ map:puffTex, color:color||0xf3ece2, transparent:true, opacity:op, depthWrite:false, rotation:rnd()*7 });
  const sp=new THREE.Sprite(m); sp.position.set(x,y,z); sp.scale.set(scale,scale,1); parent.add(sp); const o={sp,x,y,z,scale,op,kind,p:rnd()*20,sgn:x<0?-1:1}; smokes.push(o); return o; }

/* altar alcove, set at an angle on the left of the middle hall */
const ALT = { c:new THREE.Vector3(-7.2,0,-31), a:.95 };
const altar = new THREE.Group(); altar.position.copy(ALT.c); altar.rotation.y=ALT.a; scene.add(altar);
const drapes=[];
{ const p=shrinePanel(IMG_ALTAR,4.7,2.65,.0); p.position.set(0,2.25,0); altar.add(p); var altarPanel=p;
  box(5.6,4.6,.3,blockMat,0,2.3,-.2,altar);
  const tb=box(5.3,.92,1.25,stoneMat(3,.6,0xb58a55),0,.46,.72,altar); tb.castShadow=true;
  for(const s of [-1,1]){ const pl=box(.5,4.3,.5,frameMat,s*2.62,2.15,.15,altar); pl.castShadow=true; }
  { const m=frameMat.clone(); m.map=carveTex(5,1); m.bumpMap=carveBump(5,1); box(5.74,.55,.6,m,0,4.4,.15,altar); }
  lamp(altar,-2.05,.9,.42,.92); lamp(altar,2.05,.9,.42,.92); lamp(altar,-3.0,1.5,1.05); lamp(altar,3.0,1.5,1.05);
  for(const s of [-1,1]){ const g=new THREE.PlaneGeometry(.8,3.2,6,14); const d=new THREE.Mesh(g,new THREE.MeshStandardMaterial({ color:0x8f1319, roughness:.5, metalness:.15, side:THREE.DoubleSide }));
    d.position.set(s*2.22,2.6,.18); altar.add(d); drapes.push({g, base:g.attributes.position.array.slice(), p:s}); }
  for(const s of [-1,1]) for(let i=0;i<6;i++){ const o=puff(altar,s*1.25,1.0,1.1,.3,.12,'incense',0xd9d2c8); o.k=i/6; }
  /* garlands and flower heaps placed in world space to match the rotated alcove */
  const c=Math.cos(ALT.a), sn=Math.sin(ALT.a); const W=(lx,lz)=>[ALT.c.x+lx*c+lz*sn, ALT.c.z-lx*sn+lz*c];
  for(const s of [-1,1]){ const [wx,wz]=W(s*2.62,.46); hang(wx,wz,4.1,2.6,SEQ_A,.1); }
  { const [ax,az]=W(-2.4,.45), [bx,bz]=W(2.4,.45); swag(ax,4.05,az,bx,4.05,bz,.5,SEQ_B,.1); }
  for(const lx of [-1.5,-.5,.5,1.5]){ const [wx,wz]=W(lx,.95); heap(wx,.93,wz,.42,46,ALT.a); }
  { const [wx,wz]=W(0,1.9); heap(wx,.02,wz,.9,90,ALT.a); } }

/* Ganesha sanctum on the main axis */
const sanctum = new THREE.Group(); sanctum.position.set(0,0,-51); scene.add(sanctum);
{ const p=shrinePanel(IMG_GANESHA,9.0,5.07,.5); p.position.set(0,3.13,0); sanctum.add(p); var ganeshaPanel=p;
  box(9.9,7.4,.5,blockMat,0,3.7,-.5,sanctum);
  for(const s of [-1,1]){ const w=box(.3,7.4,3.6,stoneMat(1.2,2.4,0xa07c55),s*4.8,3.7,1.1,sanctum); w.castShadow=true;
    const pl=box(.55,6.4,.55,frameMat,s*4.78,3.2,3.0,sanctum); pl.castShadow=true; }
  box(10.2,.8,3.9,blockMat,0,7.0,1.15,sanctum);
  box(9.3,.6,2.6,stoneMat(4,.4,0xb08c62),0,.3,1.0,sanctum);
  { const m=frameMat.clone(); m.map=carveTex(8,1); m.bumpMap=carveBump(8,1); box(10.1,.7,.6,m,0,6.3,3.0,sanctum); }
  lamp(sanctum,-3.2,2.9,1.25); lamp(sanctum,3.2,2.9,1.25); lamp(sanctum,-1.6,2.0,.5,.6); lamp(sanctum,1.6,2.0,.5,.6);
  for(const s of [-1,1]){ hang(s*4.78,-47.68,5.9,3.4,SEQ_A,.115); }
  swag(-4.5,5.95,-47.7,4.5,5.95,-47.7,.7,SEQ_B,.115); swag(-4.5,5.95,-47.66,0,5.95,-47.66,.9,SEQ_C,.09); swag(0,5.95,-47.66,4.5,5.95,-47.66,.9,SEQ_C,.09);
  heap(-1.2,.62,-49.2,.7,70); heap(1.2,.62,-49.2,.7,70); heap(0,.62,-49.0,.6,50);
  for(let i=0;i<5;i++){ const o=puff(sanctum,rr(-2.5,2.5),rr(.8,2.2),rr(1.6,2.6),rr(2,3.4),.07,'mist',0xe8d6ba); } }

/* inscribed steles flanking the sanctum */
function stele(lines){ const [c,x]=cv(512,840); const g=x.createLinearGradient(0,0,0,840); g.addColorStop(0,'#5a4028'); g.addColorStop(1,'#3b2917'); x.fillStyle=g; x.fillRect(0,0,512,840);
  for(let i=0;i<4000;i++){ x.fillStyle = rnd()<.5 ? 'rgba(10,5,0,.10)':'rgba(255,220,170,.05)'; x.fillRect(rnd()*512,rnd()*840,rr(1,4),rr(1,3)); }
  x.strokeStyle='rgba(15,6,0,.8)'; x.lineWidth=6; x.strokeRect(28,29,456,784); x.strokeStyle=goldGrad(x,0,840); x.lineWidth=4; x.strokeRect(26,26,456,784); x.lineWidth=1.5; x.strokeRect(40,40,428,756);
  rosette(x,256,100,34,8,goldGrad(x,60,140));
  let y=196; lines.forEach((ln,i)=>{ if(!ln){ x.fillStyle='#d9ae5a'; x.fillRect(196,y-8,120,2); y+=38; return; }
    const head = i<2 && lines[2]===''; engrave(x, ln, 256, y, (head?'700 46px':'600 34px')+' Cinzel, Georgia, serif', head?7:4); y += head?62:74; });
  rosette(x,256,752,24,8,goldGrad(x,720,780)); return c; }
for(const [s,lines] of [[-1,CONTENT.ceremony],[1,CONTENT.message]]){ const g=new THREE.Group(); g.position.set(s*3.75,0,-45.9); g.rotation.y=-s*.34; scene.add(g);
  const b=box(1.75,.4,.6,blockMat,0,.2,0,g); b.castShadow=true; const sl=box(1.5,2.5,.24,stoneMat(1,1.6,0x6b4d31),0,1.65,0,g); sl.castShadow=true;
  const c=stele(lines); const t=tex(c);
  const f=new THREE.Mesh(new THREE.PlaneGeometry(1.4,2.3), new THREE.MeshStandardMaterial({ map:t, bumpMap:tex(c,false), bumpScale:.018, roughness:.5, metalness:.4, emissive:0xffffff, emissiveMap:t, emissiveIntensity:.22 }));
  f.position.set(0,1.65,.125); g.add(f); }

/* ───────── scene 6: the emblem ───────── */
function arcText(x,str,cx,cy,r,font,spread){ x.font=font; x.textAlign='center'; x.textBaseline='middle'; const n=[...str].length; const a0=-spread/2;
  [...str].forEach((ch,i)=>{ const a=a0+spread*i/(n-1); x.save(); x.translate(cx+Math.sin(a)*r, cy-Math.cos(a)*r); x.rotate(a);
    x.fillStyle='rgba(20,8,0,.8)'; x.fillText(ch,0,3); x.fillStyle='#f0cd7c'; x.fillText(ch,0,0); x.restore(); }); }
function coinFace(back){ const S=1024; const [c,x]=cv(S,S); const g=x.createRadialGradient(512,470,40,512,512,512); g.addColorStop(0,'#96541c'); g.addColorStop(.7,'#683411'); g.addColorStop(1,'#3d1d08');
  x.fillStyle=g; x.beginPath(); x.arc(512,512,512,0,7); x.fill();
  x.fillStyle='#2c1406'; x.beginPath(); x.arc(512,512,500,0,7); x.arc(512,512,408,0,7,true); x.fill();
  x.strokeStyle=goldGrad(x,0,S); x.lineWidth=9; x.beginPath(); x.arc(512,512,498,0,7); x.stroke(); x.lineWidth=6; x.beginPath(); x.arc(512,512,408,0,7); x.stroke();
  /* vine band */
  x.lineWidth=5; for(let i=0;i<28;i++){ const a=i/28*Math.PI*2; x.save(); x.translate(512+Math.cos(a)*454,512+Math.sin(a)*454); x.rotate(a+Math.PI/2);
    x.beginPath(); x.arc(-14,0,17,Math.PI*.1,Math.PI*1.25); x.stroke(); x.beginPath(); x.arc(16,0,17,Math.PI*1.1,Math.PI*2.25); x.stroke();
    x.fillStyle='#e9c26e'; x.beginPath(); x.ellipse(0,-17,6,12,.5,0,7); x.fill(); x.beginPath(); x.arc(0,18,5,0,7); x.fill(); x.restore(); }
  if(!back){
    arcText(x, CONTENT.emblemRing, 512, 512, 330, '600 62px Cinzel, Georgia, serif', Math.PI*1.32);
    engrave(x, CONTENT.emblemFoot, 512, 800, '600 40px Cinzel, Georgia, serif', 10);
    /* placeholder mark: flame over lotus, in line */
    x.strokeStyle='#f3d27e'; x.lineWidth=7; x.lineCap='round'; x.lineJoin='round';
    x.beginPath(); x.moveTo(512,318); x.bezierCurveTo(572,404,566,470,512,500); x.bezierCurveTo(458,470,452,404,512,318); x.stroke();
    x.beginPath(); x.moveTo(512,392); x.bezierCurveTo(536,430,532,462,512,476); x.bezierCurveTo(492,462,488,430,512,392); x.stroke();
    for(const d of [-1,1]){ x.beginPath(); x.moveTo(512,640); x.bezierCurveTo(512+d*70,620,512+d*96,560,512+d*84,520); x.bezierCurveTo(512+d*50,548,512+d*20,590,512,640); x.stroke();
      x.beginPath(); x.moveTo(512,640); x.bezierCurveTo(512+d*110,640,512+d*170,596,512+d*176,548); x.bezierCurveTo(512+d*130,560,512+d*80,596,512,640); x.stroke(); }
    x.beginPath(); x.moveTo(512,640); x.bezierCurveTo(548,596,548,548,512,512); x.bezierCurveTo(476,548,476,596,512,640); x.stroke();
    x.beginPath(); x.moveTo(372,668); x.quadraticCurveTo(512,712,652,668); x.stroke();
  } else {
    const L=CONTENT.rsvpBack; engrave(x, L[0], 512, 330, '700 110px Cinzel, Georgia, serif', 22);
    x.fillStyle='#d9ae5a'; x.fillRect(372,410,280,3);
    engrave(x, L[1], 512, 490, '600 44px Cinzel, Georgia, serif', 6); engrave(x, L[2], 512, 580, '600 44px Cinzel, Georgia, serif', 6); engrave(x, L[3], 512, 670, '400 34px Cinzel, Georgia, serif', 6);
  }
  return c; }
const coin = new THREE.Group(); coin.position.set(0,3.3,-70); scene.add(coin);
{ const body=new THREE.Mesh(new THREE.CylinderGeometry(2,2,.22,120,1,true), gold); body.rotation.x=Math.PI/2; body.castShadow=true; coin.add(body);
  for(const z of [-.11,.11]){ const rim=new THREE.Mesh(new THREE.TorusGeometry(1.98,.085,16,140), gold); rim.position.z=z; coin.add(rim); }
  for(const b of [0,1]){ const c=coinFace(b); const t=tex(c);
    const f=new THREE.Mesh(new THREE.CircleGeometry(1.95,120), new THREE.MeshStandardMaterial({ map:t, bumpMap:tex(c,false), bumpScale:.025, metalness:.9, roughness:.36, envMapIntensity:1.3,
      emissive:0xffffff, emissiveMap:t, emissiveIntensity:.16 }));
    f.position.z = b? -.112 : .112; if(b) f.rotation.y=Math.PI; f.castShadow=true; coin.add(f); } }
{ const pl=box(5.0,1.0,1.3,stoneMat(3,.6,0x7c5a3a),0,.5,-69.4); pl.castShadow=true; box(5.4,.16,1.6,blockMat,0,.08,-69.4); box(5.3,.14,1.5,blockMat,0,1.05,-69.4);
  const [c,x]=cv(1536,280); const g=x.createLinearGradient(0,0,0,280); g.addColorStop(0,'#57391f'); g.addColorStop(1,'#3a2614'); x.fillStyle=g; x.fillRect(0,0,1536,280);
  for(let i=0;i<3000;i++){ x.fillStyle = rnd()<.5 ? 'rgba(10,5,0,.10)':'rgba(255,220,170,.05)'; x.fillRect(rnd()*1536,rnd()*280,rr(1,4),rr(1,3)); }
  x.strokeStyle=goldGrad(x,0,280); x.lineWidth=4; x.strokeRect(14,14,1508,252);
  engrave(x, CONTENT.thanks, 768, 70, '700 58px Cinzel, Georgia, serif', 14);
  engrave(x, CONTENT.host, 768, 150, '600 40px Cinzel, Georgia, serif', 8);
  engrave(x, CONTENT.venue+'   \u25C6   '+CONTENT.contact, 768, 218, '600 32px Cinzel, Georgia, serif', 6);
  const t=tex(c); const f=new THREE.Mesh(new THREE.PlaneGeometry(4.7,4.7*280/1536), new THREE.MeshStandardMaterial({ map:t, bumpMap:tex(c,false), bumpScale:.018, roughness:.5, metalness:.4, emissive:0xffffff, emissiveMap:t, emissiveIntensity:.24 }));
  f.position.set(0,.52,-68.745); scene.add(f); }
for(let i=0;i<7;i++) puff(scene,rr(-6,6),rr(.3,1.6),rr(-74,-63),rr(4,7),.06,'mist',0xe8d6ba);
for(let i=0;i<6;i++) puff(scene,rr(-5,5),rr(.4,2.5),rr(-18,-6),rr(4,7),.05,'mist',0xe8d6ba);

/* build the marigold instances */
{ const n=F.length/5; const g=new THREE.IcosahedronGeometry(1,1); g.scale(1,.72,1);
  const im=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({ roughness:.85, metalness:0, envMapIntensity:.35 }),n);
  const m=new THREE.Matrix4(), q=new THREE.Quaternion(), e=new THREE.Euler(), v=new THREE.Vector3(), s=new THREE.Vector3(), col=new THREE.Color();
  for(let i=0;i<n;i++){ e.set(rnd()*3,rnd()*3,rnd()*3); q.setFromEuler(e); v.set(F[i*5],F[i*5+1],F[i*5+2]); s.setScalar(F[i*5+3]); m.compose(v,q,s); im.setMatrixAt(i,m);
    col.setHex(PAL[F[i*5+4]]); col.offsetHSL(rr(-.012,.012),0,rr(-.05,.05)); im.setColorAt(i,col); }
  im.receiveShadow=true; scene.add(im); }

/* ───────── entrance smoke and light ───────── */
for(let i=0;i<54;i++){ const x=rr(-8,8), y=rr(-.2,7), z=rr(1.2,6.2); if(Math.abs(x)<1.1 && y>1.6 && y<5.4) continue;
  puff(scene,x,y,z,rr(4,8),rr(.45,.8),'gate'); }
const rays=[];
function ray(x,y,z,rot,len,wid,kind){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({ map:streakTex, blending:THREE.AdditiveBlending, depthWrite:false, fog:false, transparent:true, opacity:0, rotation:rot }));
  sp.center.set(.5,0); sp.position.set(x,y,z); sp.scale.set(wid,len,1); scene.add(sp); rays.push({sp,kind,p:rnd()*9}); }
for(let i=0;i<11;i++){ ray(0,3.5,-.4, (i/11)*Math.PI*2+rr(-.15,.15), rr(7,12), rr(1.2,2.6), 'door'); }
for(let i=0;i<4;i++){ ray(6.5-i*1.3,9.4,-72-i*.6, Math.PI*.83+i*.03, 12, 2.4, 'hall'); }
const doorGlow=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex, blending:THREE.AdditiveBlending, depthWrite:false, fog:false, transparent:true, opacity:0 }));
doorGlow.position.set(0,3.4,-1.6); doorGlow.scale.set(9,9,1); scene.add(doorGlow);

/* dust */
{ const pts=[]; for(let i=0;i<1700;i++) pts.push(rr(-7,7),rr(.2,7.5),rr(6,-78));
  const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts,3));
  var dust=new THREE.Points(g,new THREE.PointsMaterial({ map:glowTex, size:.045, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity:.5, fog:false })); scene.add(dust); }

/* ───────── lights ───────── */
scene.add(new THREE.HemisphereLight(0xffe0b0,0x2c1608,.5));
const sun=new THREE.DirectionalLight(0xffd6a0,.55); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.bias=-.0006; sun.shadow.normalBias=.03;
Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:1,far:44}); sun.shadow.camera.updateProjectionMatrix(); scene.add(sun, sun.target);
const pls=[];
function pl(x,y,z,i,d){ const l=new THREE.PointLight(0xffa244,i,d||15,1.6); l.position.set(x,y,z); scene.add(l); pls.push({l,i,p:rnd()*20}); return l; }
const doorLight=pl(0,3.6,-3.5,0,18); pls.pop();
pl(-3.3,2.7,-11.2,1.5); pl(3.3,2.7,-11.2,1.5); pl(0,4.6,-18,1.1,14);
{ const n=new THREE.Vector3(Math.sin(ALT.a),0,Math.cos(ALT.a)); pl(ALT.c.x+n.x*1.9,2.1,ALT.c.z+n.z*1.9,1.7,10); }
pl(-3.2,2.6,-47.6,1.6); pl(3.2,2.6,-47.6,1.6);
pl(-3.6,2.9,-66.2,1.6); pl(3.6,2.9,-66.2,1.6); pl(0,4.4,-66.4,1.5,12);

/* ───────── camera rail: one path, sixteen points ───────── */
const P=[[0,2.6,8, 0,3.0,0],[0,2.4,4.2, 0,3.0,-6],[0,2.1,-1.4, 0,3.0,-12],[0,2.4,-6.2, 0,3.1,-12],
  [0,2.0,-13, -.5,2.3,-22],[-.6,1.9,-22, -4.5,2.1,-29.5],[-3.78,1.95,-28.55, -7.2,2.2,-31],
  [-1.0,2.0,-34, 0,2.8,-48],[0,2.3,-37.5, 0,3.0,-51],[0,2.6,-40.2, 0,3.1,-51],
  [3.2,2.3,-42.5, 6,2.3,-50],[6.0,2.1,-46.5, 5.6,2.3,-56],[6.1,2.1,-52.5, 2,2.5,-60],[3.4,2.2,-55.6, 0,2.9,-68],[.8,2.4,-58.6, 0,3.0,-70],[0,2.6,-62.5, 0,2.85,-70]];
const posCurve=new THREE.CatmullRomCurve3(P.map(p=>new THREE.Vector3(p[0],p[1],p[2])),false,'centripetal');
const lookCurve=new THREE.CatmullRomCurve3(P.map(p=>new THREE.Vector3(p[3],p[4],p[5])),false,'centripetal');
const FOCUS=[8,6.5,9,5.8,8,7,4.2,10,12,10.8,6,6,8,11,10,7.5];
const LAST=P.length-1;
const st={ idx:0, door:0, part:0, flip:0, s:0, sT:0, entered:false, started:false };
const STOPS=[3,6,9,LAST];
function mapS(s){ const seg=Math.min(2,Math.floor(s)); const f=clamp(s-seg,0,1); const e=lerp(f,f*f*(3-2*f),.75); return lerp(STOPS[seg],STOPS[seg+1],e); }

/* ───────── post: depth of field, grade, grain ───────── */
let rt;
function makeRT(){ if(rt) rt.dispose(); const w=Math.floor(innerWidth*PR), h=Math.floor(innerHeight*PR);
  rt=new THREE.WebGLRenderTarget(w,h,{ minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, format:THREE.RGBAFormat });
  rt.texture.encoding=THREE.sRGBEncoding; rt.depthTexture=new THREE.DepthTexture(w,h); rt.depthTexture.type=THREE.UnsignedIntType; }
makeRT();
const postMat=new THREE.ShaderMaterial({ depthTest:false, depthWrite:false,
  uniforms:{ tColor:{value:rt.texture}, tDepth:{value:rt.depthTexture}, uRes:{value:new THREE.Vector2(innerWidth*PR,innerHeight*PR)},
    uNear:{value:camera.near}, uFar:{value:camera.far}, uFocus:{value:8}, uMaxR:{value:9*PR}, uTime:{value:0}, uGain:{value:1} },
  vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader:`precision highp float; uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 uRes; uniform float uNear,uFar,uFocus,uMaxR,uTime,uGain; varying vec2 vUv;
    float dist(vec2 uv){ float d=texture2D(tDepth,uv).x; return (uNear*uFar)/(uFar-(uFar-uNear)*d); }
    float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
    void main(){ float dc=dist(vUv); float coc=clamp(abs(1./uFocus-1./dc)*2.4-.05,0.,1.); vec2 px=uMaxR*coc/uRes;
      vec3 acc=texture2D(tColor,vUv).rgb; float w=1.;
      for(int i=0;i<18;i++){ float fi=float(i)+.5; float r=sqrt(fi/18.); float a=fi*2.39996; acc+=texture2D(tColor,vUv+vec2(cos(a),sin(a))*r*px).rgb; w+=1.; }
      vec3 c=acc/w*uGain; c=mix(c,c*c*(3.-2.*c),.3); c*=vec3(1.04,1.,.93);
      float v=length((vUv-.5)*vec2(1.,.86)); c*=1.-smoothstep(.36,.9,v)*.6;
      c+=(hash(vUv*uRes+fract(uTime)*91.7)-.5)*.03; gl_FragColor=vec4(c,1.); }` });
const postScene=new THREE.Scene(); postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat)); const postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
postScene.children[0].frustumCulled=false;

function fit(){ const a=innerWidth/innerHeight; camera.aspect=a; camera.fov = a>=1.3 ? 45 : clamp(2*Math.atan(Math.tan(45*Math.PI/360)*1.3/a)*180/Math.PI,45,78);
  camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); makeRT();
  postMat.uniforms.tColor.value=rt.texture; postMat.uniforms.tDepth.value=rt.depthTexture; postMat.uniforms.uRes.value.set(innerWidth*PR,innerHeight*PR); }
on(window,'resize',fit); fit();

/* ───────── interaction ───────── */
const hintEl=$('hint'), rsvpEl=$('rsvp');
function hint(t){ if(!t){ hintEl.classList.remove('on'); return; } hintEl.textContent=t; hintEl.classList.add('on'); }
function openDoors(){ if(st.started) return; st.started=true; hint(''); $('welcome').style.transitionDuration='1.4s'; $('welcome').classList.remove('on'); canvas.classList.add('walking');
  gsap.to(st,{ door:1, duration:5.4, ease:'power2.inOut' });
  gsap.to(st,{ part:1, duration:6.5, ease:'power1.inOut' });
  gsap.to(st,{ idx:3, duration:10.5, delay:1.5, ease:'power2.inOut', onComplete(){ st.entered=true; hint('Scroll to walk deeper'); } }); }
on(canvas,'click',openDoors);
function advance(d){ if(!st.entered) return; st.sT=clamp(st.sT+d,0,3); if(st.sT>.05) hint(''); }
on(window,'wheel',e=>{ e.preventDefault(); const k=e.deltaMode===1?32:e.deltaMode===2?600:1; advance(clamp(e.deltaY*k,-160,160)*.0011); },{passive:false});
let ty=null;
on(canvas,'touchstart',e=>{ ty=e.touches[0].clientY; },{passive:true});
on(canvas,'touchmove',e=>{ if(ty===null) return; const y=e.touches[0].clientY; advance((ty-y)*.0048); ty=y; e.preventDefault(); },{passive:false});
on(canvas,'touchend',()=>{ ty=null; });
on(window,'keydown',e=>{ if(e.target===rsvpEl) return;
  if(!st.started && (e.key==='Enter'||e.key===' ')){ e.preventDefault(); openDoors(); return; }
  if(['ArrowDown','PageDown',' ','ArrowRight'].includes(e.key)){ e.preventDefault(); advance(.2); }
  if(['ArrowUp','PageUp','ArrowLeft'].includes(e.key)){ e.preventDefault(); advance(-.2); } });
const mouse={x:0,y:0,sx:0,sy:0};
on(window,'pointermove',e=>{ mouse.x=e.clientX/innerWidth*2-1; mouse.y=e.clientY/innerHeight*2-1; });
let flipped=false;
on(rsvpEl,'click',()=>{ flipped=!flipped; gsap.to(st,{ flip:flipped?1:0, duration:2.6, ease:'power2.inOut' }); rsvpEl.textContent = flipped ? 'TURN BACK' : 'RSVP'; });

/* ───────── frame loop ───────── */
const clock=new THREE.Clock(); const cp=new THREE.Vector3(), cl=new THREE.Vector3(), right=new THREE.Vector3(), fwd=new THREE.Vector3();
let fade=0;
function frame(){ if(ctl.dead) return; raf=requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;
  if(st.entered){ st.s += (st.sT-st.s)*(1-Math.exp(-dt*2.6)); st.idx=mapS(st.s); }
  const idx=st.idx, u=clamp(idx/LAST,0,1);
  posCurve.getPoint(u,cp); lookCurve.getPoint(u,cl);
  const mk = reduceMotion?0:1; mouse.sx+=(mouse.x-mouse.sx)*.04; mouse.sy+=(mouse.y-mouse.sy)*.04;
  fwd.copy(cl).sub(cp).normalize(); right.set(-fwd.z,0,fwd.x).normalize();
  camera.position.copy(cp).addScaledVector(right,mouse.sx*.28*mk); camera.position.y += -mouse.sy*.14*mk + Math.sin(t*.55)*.018*mk;
  camera.lookAt(cl);

  /* atmosphere follows the walk */
  const inside=sstep(.6,3,idx); scene.fog.color.copy(fogOut).lerp(fogIn,inside); scene.fog.density=lerp(.045,.021,inside);
  hingeL.rotation.y=st.door*1.74; hingeR.rotation.y=-st.door*1.74;
  const spill=st.door*(1-sstep(1.6,3.2,idx));
  doorGlow.material.opacity=spill*.85; doorLight.intensity=st.door*(2.6-1.6*sstep(2,4,idx));
  for(const r of rays){ const m=r.sp.material;
    if(r.kind==='door') m.opacity=spill*(.09+.03*Math.sin(t*.4+r.p)); else m.opacity=(.07+.02*Math.sin(t*.3+r.p))*sstep(11,14,idx); }
  for(const o of smokes){ const m=o.sp.material;
    if(o.kind==='gate'){ o.sp.position.x=o.x+o.sgn*st.part*(3.5+o.scale*.5)+Math.sin(t*.11+o.p)*.45; o.sp.position.y=o.y+Math.sin(t*.13+o.p*1.3)*.25; m.opacity=o.op*Math.pow(1-st.part,1.3); o.sp.visible=m.opacity>.004; m.rotation+=dt*.015*o.sgn; }
    else if(o.kind==='incense'){ const k=(o.k+t*.07)%1; o.sp.position.y=o.y+k*2.3; o.sp.position.x=o.x+Math.sin(k*5+o.p)*.12*k; const s=.18+k*.75; o.sp.scale.set(s,s*1.4,1); m.opacity=o.op*Math.sin(k*Math.PI); }
    else { o.sp.position.x=o.x+Math.sin(t*.07+o.p)*.8; m.rotation+=dt*.01; } }
  for(const f of flames){ const n=flick(t,f.p); f.sp.scale.set(.11*f.s*(1+n*.06),.26*f.s*(1+n*.13),1); f.sp.material.opacity=.9+n*.1; }
  for(const p of pls){ p.l.intensity=p.i*(1+flick(t*.6,p.p)*.09); }
  candleMat.opacity=.82+flick(t*.5,3)*.08;
  for(const lf of leaves){ lf.m.rotation.x=lf.r+Math.sin(t*.6+lf.p)*.018; lf.m.rotation.z=Math.sin(t*.43+lf.p*2)*.012; }
  for(const d of drapes){ const a=d.g.attributes.position; for(let i=0;i<a.count;i++){ const y=d.base[i*3+1], k=(1.6-y)/3.2; a.setZ(i, Math.sin(y*2.4+t*.9+d.p)*.035*k + Math.sin(d.base[i*3]*7)*.03); } a.needsUpdate=true; }
  dust.position.set(Math.sin(t*.05)*.5, Math.sin(t*.08)*.3, Math.cos(t*.04)*.5);
  plaque.position.y=3.2+sstep(3.15,4.4,idx)*5.2; plaque.rotation.z=Math.sin(t*.5)*.003;
  coin.rotation.y=st.flip*Math.PI+Math.sin(t*.4)*.045; coin.position.y=3.3+Math.sin(t*.7)*.035;
  altarPanel.material.uniforms.gain.value=1.02+flick(t*.5,1.7)*.04; ganeshaPanel.material.uniforms.gain.value=1.04+flick(t*.45,5.1)*.035;
  for(const m of panelMats) m.uniforms.fogD.value=scene.fog.density;

  sun.target.position.set(camera.position.x*.5,0,camera.position.z-8); sun.position.set(sun.target.position.x+5,15,sun.target.position.z+7);

  const fi=Math.min(Math.floor(idx),LAST-1); const focus=lerp(FOCUS[fi],FOCUS[fi+1],idx-fi);
  postMat.uniforms.uFocus.value += (focus-postMat.uniforms.uFocus.value)*.06;
  postMat.uniforms.uTime.value=t; fade=Math.min(1,fade+dt*.45);
  postMat.uniforms.uGain.value=fade*(1+spill*.12);

  rsvpEl.classList.toggle('on', st.entered && st.s>2.93);

  renderer.setRenderTarget(rt); renderer.render(scene,camera);
  renderer.setRenderTarget(null); renderer.render(postScene,postCam);
}
$('veil').classList.add('gone'); setTimeout(()=>{ if(!st.started) $('welcome').classList.add('on'); }, 900);
setTimeout(()=>{ if(!st.started) hint('Touch the doors to enter'); }, 2600);
frame();
ctl.dispose = () => { ac.abort(); cancelAnimationFrame(raf); gsap.killTweensOf(st); if(rt) rt.dispose(); renderer.dispose(); };
}
