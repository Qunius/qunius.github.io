/* Regn mot rutan. A still photograph, outside rain, and independently wiped inside condensation. */
(() => {
  'use strict';
  const {RainState, FogField, DropField, coverCrop, clamp} = window.RainCore;
  const stage = document.getElementById('rain-stage');
  if (!stage) return;
  const canvas = document.getElementById('rain-glass');
  const photo = document.getElementById('rain-photo');
  const controls = document.getElementById('rain-controls');
  const pause = document.getElementById('rain-pause');
  const sound = document.getElementById('rain-sound');
  const reset = document.getElementById('rain-reset');
  const note = document.getElementById('rain-motion-note');
  const status = document.getElementById('rain-status');
  const cursor = document.getElementById('rain-cursor');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const state = new RainState();
  state.offscreen = true;
  state.hidden = document.hidden;
  state.reduced = media.matches;
  const pointers = new Map();
  const keyPoint = {x:.5,y:.5};
  let holdingSpace = false, pageActive = true, raf = 0, lastPaint = -100;
  let renderer, fog, field, ready = false, soundWanted = false, audio;
  let width = 0, height = 0;

  const surface = (w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  };
  function cropPhoto(w,h) {
    const c=surface(w,h), ctx=c.getContext('2d');
    const [sx,sy]=coverCrop(photo.naturalWidth/photo.naturalHeight,w/h);
    const sw=photo.naturalWidth*sx, sh=photo.naturalHeight*sy;
    ctx.drawImage(photo,(photo.naturalWidth-sw)/2,(photo.naturalHeight-sh)/2,sw,sh,0,0,w,h);
    return c;
  }

  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`;
  const blurFragment = `precision mediump float; varying vec2 uv;
    uniform sampler2D source; uniform vec2 stepSize;
    void main(){
      vec4 c=vec4(0.); float total=0.;
      for(int i=-12;i<=12;i++){
        float x=float(i), weight=exp(-x*x/56.);
        c+=texture2D(source,uv+stepSize*x)*weight;total+=weight;
      }
      gl_FragColor=c/total;
    }`;
  const glassFragment = `precision highp float; varying vec2 uv;
    uniform sampler2D sharpImage, softImage, wipeMap, dropMap;
    uniform vec2 resolution;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec4 drop=texture2D(dropMap,uv);
      vec2 normal=(drop.rg-.5)*2.;
      float bead=smoothstep(.035,.22,drop.b);
      vec2 lens=normal*vec2(.010,.014)*bead;
      vec2 p=clamp(uv+lens,vec2(.002),vec2(.998));
      float clear=texture2D(wipeMap,uv).r;
      float fog=1.-clear;
      vec3 sharp=texture2D(sharpImage,p).rgb;
      vec3 soft=texture2D(softImage,p).rgb;
      // Vapour scatters light; wiping removes both scatter and optical blur.
      vec3 colour=mix(sharp,soft,fog*.97);
      colour=mix(colour,vec3(.87,.89,.85),fog*.24);
      float grain=hash(floor(uv*resolution*1.35));
      float fine=hash(floor(uv*resolution*.63));
      colour+=(grain-.5)*.044*fog+(fine-.5)*.017*fog;
      float edge=length(normal);
      vec3 n=normalize(vec3(normal,sqrt(max(.02,1.-edge*edge))));
      float shine=pow(max(0.,dot(n,normalize(vec3(-.42,.62,.68)))),36.);
      float rim=pow(1.-drop.b,1.5)*bead;
      colour*=1.-rim*.34;
      colour+=vec3(.90,.94,.92)*shine*bead*.48;
      colour+=vec3(.04,.05,.04)*max(0.,-normal.y)*rim;
      gl_FragColor=vec4(colour,1.);
    }`;

  class GlassRenderer {
    constructor(target) {
      const gl=target.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
      if (!gl) throw new Error('WebGL unavailable');
      this.gl=gl; this.canvas=target; this.textures=[]; this.frames=[];
      this.programs=[]; this.shaders=[];
      try {
        this.blur=this.program(blurFragment); this.glass=this.program(glassFragment);
        this.buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
        this.base=this.texture(); this.soft=this.texture(); this.temp=this.texture();
        this.mask=this.texture(); this.drops=this.texture();
      } catch(error) { this.destroy(); throw error; }
    }
    program(fragment) {
      const gl=this.gl;
      const shaders=[ [gl.VERTEX_SHADER,vertex], [gl.FRAGMENT_SHADER,fragment] ].map(([kind,code])=>{
        const shader=gl.createShader(kind); this.shaders.push(shader);
        gl.shaderSource(shader,code); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      });
      const p=gl.createProgram(); this.programs.push(p);
      shaders.forEach(s=>gl.attachShader(p,s)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    texture() {
      const gl=this.gl,t=gl.createTexture(); this.textures.push(t);
      gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      return t;
    }
    upload(texture,source) {
      const gl=this.gl; gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    }
    use(program) {
      const gl=this.gl; gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
      const a=gl.getAttribLocation(program,'position'); gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    }
    bind(program,name,texture,unit) {
      const gl=this.gl; gl.activeTexture(gl.TEXTURE0+unit); gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform1i(gl.getUniformLocation(program,name),unit);
    }
    resize(w,h) {
      const gl=this.gl;
      this.canvas.width=w; this.canvas.height=h;
      this.frames.forEach(f=>gl.deleteFramebuffer(f)); this.frames=[];
      gl.activeTexture(gl.TEXTURE0);
      this.upload(this.base,cropPhoto(w,h));
      const bw=Math.min(w,900), bh=Math.round(bw*h/w);
      [this.temp,this.soft].forEach(t=>{
        gl.bindTexture(gl.TEXTURE_2D,t);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,bw,bh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        const f=gl.createFramebuffer(); this.frames.push(f); gl.bindFramebuffer(gl.FRAMEBUFFER,f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error('Incomplete framebuffer');
      });
      this.use(this.blur); gl.viewport(0,0,bw,bh);
      // Two separable optical blur passes; cached until the viewport changes.
      gl.bindFramebuffer(gl.FRAMEBUFFER,this.frames[0]); this.bind(this.blur,'source',this.base,0);
      gl.uniform2f(gl.getUniformLocation(this.blur,'stepSize'),1.2/bw,0); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      gl.bindFramebuffer(gl.FRAMEBUFFER,this.frames[1]); this.bind(this.blur,'source',this.temp,0);
      gl.uniform2f(gl.getUniformLocation(this.blur,'stepSize'),0,1.2/bh); gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    }
    draw(mask,drops) {
      const gl=this.gl;
      gl.activeTexture(gl.TEXTURE0); this.upload(this.mask,mask); this.upload(this.drops,drops);
      this.use(this.glass); gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      gl.viewport(0,0,this.canvas.width,this.canvas.height);
      this.bind(this.glass,'sharpImage',this.base,0); this.bind(this.glass,'softImage',this.soft,1);
      this.bind(this.glass,'wipeMap',this.mask,2); this.bind(this.glass,'dropMap',this.drops,3);
      gl.uniform2f(gl.getUniformLocation(this.glass,'resolution'),this.canvas.width,this.canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    }
    destroy() {
      const gl=this.gl;
      this.frames.forEach(f=>gl.deleteFramebuffer(f)); this.textures.forEach(t=>gl.deleteTexture(t));
      this.programs.forEach(p=>gl.deleteProgram(p)); this.shaders.forEach(s=>gl.deleteShader(s));
      if(this.buffer)gl.deleteBuffer(this.buffer);
    }
  }

  class CanvasRenderer {
    constructor(target) { this.canvas=target; this.ctx=target.getContext('2d',{alpha:false}); if(!this.ctx)throw new Error('Canvas unavailable'); }
    resize(w,h) {
      this.canvas.width=w; this.canvas.height=h;
      this.base=cropPhoto(w,h); this.soft=surface(w,h); this.layer=surface(w,h); this.cutout=surface(1,1);
      const ctx=this.soft.getContext('2d');
      // Downsampling also softens the image in browsers without Canvas filters.
      const small=surface(Math.max(1,Math.round(w/14)),Math.max(1,Math.round(h/14)));
      small.getContext('2d').drawImage(this.base,0,0,small.width,small.height);
      ctx.filter='blur(8px)'; ctx.drawImage(small,-16,-16,w+32,h+32); ctx.filter='none';
      ctx.fillStyle='rgba(222,227,217,.24)'; ctx.fillRect(0,0,w,h);
    }
    draw(mask) {
      const w=this.canvas.width,h=this.canvas.height,ctx=this.ctx;
      const cut=this.cutout, c=cut.getContext('2d');
      cut.width=mask.width; cut.height=mask.height;
      const pixels=mask.getContext('2d').getImageData(0,0,mask.width,mask.height);
      for(let i=0;i<pixels.data.length;i+=4)pixels.data[i+3]=pixels.data[i];
      c.putImageData(pixels,0,0);
      const l=this.layer.getContext('2d'); l.globalCompositeOperation='source-over'; l.clearRect(0,0,w,h);
      l.drawImage(this.soft,0,0); l.globalCompositeOperation='destination-out'; l.drawImage(cut,0,0,w,h);
      ctx.drawImage(this.base,0,0); ctx.drawImage(this.layer,0,0);
      // A modest 2D alternative keeps the same pause/wipe contract without pretending to refract.
      ctx.lineWidth=1;
      const sx=w/field.width,sy=h/field.height;
      for(const d of field.drops) {
        ctx.beginPath();ctx.ellipse(d.x*sx,d.y*sy,d.r*sx,d.r*sy*(1+Math.min(.5,d.vy/180)),0,0,Math.PI*2);
        ctx.strokeStyle='rgba(40,60,44,.18)';ctx.stroke();
        ctx.beginPath();ctx.arc((d.x-d.r*.27)*sx,(d.y-d.r*.38)*sy,Math.max(.45,d.r*.17*sx),0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,.5)';ctx.fill();
      }
    }
    destroy() {}
  }

  function dropletSprite() {
    const c=surface(64,64),ctx=c.getContext('2d'),im=ctx.createImageData(64,64);
    for(let y=0;y<64;y++)for(let x=0;x<64;x++){
      let nx=(x-31.5)/30,ny=(y-31.5)/30;
      // Slightly asymmetric shoulders prevent the beads reading as perfect chrome balls.
      nx*=1+.06*Math.sin(ny*4); const r=Math.hypot(nx,ny),i=(y*64+x)*4;
      if(r>=1)continue;
      im.data[i]=128+nx*116; im.data[i+1]=128-ny*116;
      im.data[i+2]=Math.sqrt(1-r*r)*255; im.data[i+3]=clamp((1-r)*16)*255;
    }
    ctx.putImageData(im,0,0);return c;
  }
  const sprite=dropletSprite();
  let maskCanvas,maskContext,maskImage,dropCanvas,dropContext,staticDrops;
  function buildSurfaces(w,h) {
    const mw=Math.min(480,Math.round(w)),mh=Math.round(mw*h/w);
    const previous=fog;
    fog=new FogField(mw,mh);
    if(previous)for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){
      const i=y*mw+x;const oldX=Math.round(x/(mw-1)*(previous.width-1)),oldY=Math.round(y/(mh-1)*(previous.height-1));
      const oldI=oldY*previous.width+oldX;fog.strength[i]=previous.strength[oldI];fog.stamp[i]=previous.stamp[oldI];
    }
    maskCanvas=surface(mw,mh);maskContext=maskCanvas.getContext('2d');maskImage=maskContext.createImageData(mw,mh);
    const dh=800,dw=Math.round(dh*w/h);
    if(field)field.resize(dw,dh);else field=new DropField(dw,dh);
    dropCanvas=surface(dw,dh);dropContext=dropCanvas.getContext('2d');
    staticDrops=surface(dw,dh);const c=staticDrops.getContext('2d');
    c.fillStyle='rgb(128,128,0)';c.fillRect(0,0,dw,dh);
    let seed=43817;
    const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
    for(let i=0;i<dw*dh/490;i++){
      const r=.36+Math.pow(rand(),3)*1.25,x=rand()*dw,y=rand()*dh;
      c.globalAlpha=.40+rand()*.5;c.drawImage(sprite,x-r,y-r,r*2,r*2.2);
    }
  }
  function paintDrops() {
    const c=dropContext;c.globalAlpha=1;c.drawImage(staticDrops,0,0);
    for(const t of field.trails){
      c.globalAlpha=.24*(1-(field.time-t.born)/8);
      c.drawImage(sprite,t.x-t.r,t.y-t.r,t.r*2,Math.max(t.r*2,t.y2-t.y+t.r*2));
    }
    c.globalAlpha=1;
    for(const d of field.drops){
      const stretch=1+Math.min(.65,d.vy/150);
      c.drawImage(sprite,d.x-d.r,d.y-d.r*stretch,d.r*2,d.r*2*stretch);
    }
  }
  function render() {
    if(!ready||state.hidden||state.offscreen)return;
    fog.pixels(state.time,maskImage.data);maskContext.putImageData(maskImage,0,0);
    if(renderer instanceof GlassRenderer)paintDrops();
    renderer.draw(maskCanvas,dropCanvas);
  }
  function frame(ms) {
    raf=0;
    if(!ready||!state.running)return;
    if(ms-lastPaint>=1000/30){
      field.step(state.tick(ms));lastPaint=ms;render();
    }
    raf=requestAnimationFrame(frame);
  }
  function wake() { if(ready&&state.running&&!raf)raf=requestAnimationFrame(frame); }
  function resize() {
    if(!ready)return;
    const box=stage.getBoundingClientRect();
    const ratio=Math.min(window.devicePixelRatio||1,1.5,1600/box.width);
    const w=Math.round(box.width*ratio),h=Math.round(box.height*ratio);
    if(!w||!h||(w===width&&h===height))return;
    width=w;height=h;buildSurfaces(w,h);
    try{renderer.resize(w,h);}catch(error){useFallback();renderer.resize(w,h);}
    render();
  }

  // Noise is synthesized only after an explicit click. No audio file or network request.
  class RainAudio {
    constructor(){
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)throw new Error('Audio unavailable');
      this.context=new Audio();const c=this.context;
      const buffer=c.createBuffer(2,c.sampleRate*4,c.sampleRate);
      for(let ch=0;ch<2;ch++){
        const data=buffer.getChannelData(ch);let brown=0;
        for(let i=0;i<data.length;i++){brown=(brown+.025*(Math.random()*2-1))/1.025;data[i]=brown*3.5+(Math.random()*2-1)*.11;}
      }
      this.source=c.createBufferSource();this.source.buffer=buffer;this.source.loop=true;
      const low=c.createBiquadFilter();low.type='lowpass';low.frequency.value=2400;low.Q.value=.3;
      const high=c.createBiquadFilter();high.type='highpass';high.frequency.value=130;
      this.gain=c.createGain();this.gain.gain.value=0;
      this.source.connect(low);low.connect(high);high.connect(this.gain);this.gain.connect(c.destination);this.source.start();
      this.request=0;
    }
    async set(on){
      const token=++this.request,c=this.context;
      if(on){await c.resume();if(token!==this.request)return;this.gain.gain.setTargetAtTime(.27,c.currentTime,.18);}
      else {this.gain.gain.cancelScheduledValues(c.currentTime);this.gain.gain.setValueAtTime(0,c.currentTime);await c.suspend();}
    }
  }
  function syncAudio(){if(audio)audio.set(soundWanted&&!state.paused&&!state.hidden&&!state.offscreen).catch(()=>{
    soundWanted=false;sound.textContent='Ljud på';sound.setAttribute('aria-pressed','false');status.textContent='Ljudet kunde inte starta. Tryck på Ljud på för att försöka igen.';
  });}
  function sync(){
    state.hidden=document.hidden||!pageActive;state.reduced=media.matches;state.last=null;
    cancelAnimationFrame(raf);raf=0;
    pause.textContent=state.paused?'Fortsätt':'Pausa';pause.setAttribute('aria-pressed',String(state.paused));
    pause.disabled=state.reduced;note.hidden=!state.reduced;
    syncAudio();render();wake();
  }
  function wipe(a,b){
    if(!ready)return;
    const radius=clamp(30/stage.clientHeight,.025,.085);
    fog.wipe(a.x,a.y,b.x,b.y,radius,state.time);render();
  }
  function point(event){const b=stage.getBoundingClientRect();return{x:clamp((event.clientX-b.left)/b.width),y:clamp((event.clientY-b.top)/b.height)};}
  function showPoint(){cursor.style.left=`${keyPoint.x*100}%`;cursor.style.top=`${keyPoint.y*100}%`;}
  stage.addEventListener('pointerdown',e=>{
    if(!ready||e.button!==0)return;e.preventDefault();stage.focus({preventScroll:true});stage.setPointerCapture(e.pointerId);
    const p=point(e);pointers.set(e.pointerId,p);stage.classList.remove('rain-keyboard');wipe(p,p);
  });
  stage.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    const p=point(e);wipe(pointers.get(e.pointerId),p);pointers.set(e.pointerId,p);
  });
  const release=e=>pointers.delete(e.pointerId);
  stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
  stage.addEventListener('keydown',e=>{
    const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(e.code==='Space'){
      e.preventDefault();holdingSpace=true;stage.classList.add('rain-keyboard');showPoint();wipe(keyPoint,keyPoint);
    }else if(arrows[e.key]){
      e.preventDefault();const old={...keyPoint},d=arrows[e.key];
      keyPoint.x=clamp(keyPoint.x+d[0]*16/stage.clientWidth,.02,.98);
      keyPoint.y=clamp(keyPoint.y+d[1]*16/stage.clientHeight,.02,.98);
      stage.classList.add('rain-keyboard');showPoint();if(holdingSpace)wipe(old,keyPoint);
    }
  });
  stage.addEventListener('keyup',e=>{if(e.code==='Space'){e.preventDefault();holdingSpace=false;}});
  function cancelInput(){holdingSpace=false;stage.classList.remove('rain-keyboard');pointers.clear();}
  stage.addEventListener('blur',cancelInput);
  // Key/pointer releases may happen in another app without a document visibility change.
  window.addEventListener('blur',cancelInput);
  pause.addEventListener('click',()=>{if(media.matches)return;state.paused=!state.paused;sync();});
  reset.addEventListener('click',()=>{fog.reset();render();status.textContent='Rutan är immig igen.';});
  sound.addEventListener('click',()=>{
    try{if(!audio)audio=new RainAudio();soundWanted=!soundWanted;sound.textContent=soundWanted?'Ljud av':'Ljud på';sound.setAttribute('aria-pressed',String(soundWanted));syncAudio();}
    catch(error){sound.disabled=true;status.textContent='Regnljud stöds inte i den här webbläsaren.';}
  });
  media.addEventListener('change',sync);
  document.addEventListener('visibilitychange',()=>{pointers.clear();holdingSpace=false;sync();});
  window.addEventListener('pagehide',()=>{pageActive=false;sync();});
  window.addEventListener('pageshow',()=>{pageActive=true;sync();});
  function useFallback(){
    renderer?.destroy();
    // A canvas cannot switch context type after WebGL was requested.
    const fallback=surface(width||1,height||1);fallback.className='rain-canvas';fallback.setAttribute('aria-hidden','true');
    const old=stage.querySelector('.rain-canvas');old.replaceWith(fallback);
    renderer=new CanvasRenderer(fallback);stage.dataset.renderer='canvas';
  }
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();if(!ready)return;useFallback();renderer.resize(width,height);render();
  });
  async function start(){
    try{
      await photo.decode();
      try{renderer=new GlassRenderer(canvas);stage.dataset.renderer='webgl';}catch(error){useFallback();}
      ready=true;resize();controls.hidden=false;stage.classList.add('rain-ready');sync();
    }catch(error){
      ready=false;renderer?.destroy();controls.hidden=true;
      status.textContent='Den interaktiva rutan kunde inte starta. Prova att ladda om sidan.';
      document.getElementById('rain-error').hidden=false;
      console.error('Regn mot rutan kunde inte starta.',error);
    }
  }
  const observer=new ResizeObserver(resize);observer.observe(stage);
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{state.offscreen=!entries[0].isIntersecting;sync();},{threshold:0}).observe(stage);
  }else{state.offscreen=false;}
  start();
})();
