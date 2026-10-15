/* Regn mot rutan. A botanical rain film with independently wiped inside condensation. */
(() => {
  'use strict';
  const {RainState, FogField, MediaPlayback, coverCrop, clamp} = window.RainCore;
  const stage = document.getElementById('rain-stage');
  if (!stage) return;
  const canvas = document.getElementById('rain-glass');
  const photo = document.getElementById('rain-photo');
  const video = document.getElementById('rain-video');
  let videoFailed=false, videoLoaded=false;
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
  let renderer, fog, ready = false, soundWanted = false, audio;
  let width = 0, height = 0;

  const surface = (w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
  };
  function visualSource() { return !videoFailed&&video.readyState>=2 ? video : photo; }
  function sourceSize(source) { return source===video ? [video.videoWidth,video.videoHeight] : [photo.naturalWidth,photo.naturalHeight]; }
  function cropSource(target) {
    const source=visualSource(),[sw,sh]=sourceSize(source),w=target.width,h=target.height;
    const [sx,sy]=coverCrop(sw/sh,w/h),cw=sw*sx,ch=sh*sy;
    target.getContext('2d').drawImage(source,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,w,h);
  }

  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`;
  const blurFragment = `precision mediump float; varying vec2 uv;
    uniform sampler2D source; uniform vec2 stepSize, crop;
    void main(){
      vec4 c=vec4(0.); float total=0.;
      for(int i=-12;i<=12;i++){
        float x=float(i), weight=exp(-x*x/56.);
        c+=texture2D(source,(uv-.5)*crop+.5+stepSize*x*crop)*weight;total+=weight;
      }
      gl_FragColor=c/total;
    }`;
  const glassFragment = `precision highp float; varying vec2 uv;
    uniform sampler2D sharpImage, softImage, wipeMap;
    uniform vec2 resolution, crop;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      float clear=texture2D(wipeMap,uv).r;
      float fog=1.-clear;
      vec3 sharp=texture2D(sharpImage,(uv-.5)*crop+.5).rgb;
      vec3 soft=texture2D(softImage,uv).rgb;
      // A continuous satin surface; clear finger marks retain the film's real detail.
      vec3 colour=mix(sharp,soft,fog);
      colour=mix(colour,vec3(.79,.83,.76),fog*.23);
      float grain=hash(floor(uv*resolution*1.2));
      colour+=(grain-.5)*.065*fog;
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
        this.mask=this.texture();
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
      const bw=Math.min(w,640), bh=Math.round(bw*h/w);
      this.bw=bw;this.bh=bh;this.sourceTime=-1;this.sourceElement=null;
      [this.temp,this.soft].forEach(t=>{
        gl.bindTexture(gl.TEXTURE_2D,t);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,bw,bh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
        const f=gl.createFramebuffer(); this.frames.push(f); gl.bindFramebuffer(gl.FRAMEBUFFER,f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw new Error('Incomplete framebuffer');
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      this.refresh();
    }
    refresh() {
      const source=visualSource(),time=source===video?video.currentTime:0;
      if(source===this.sourceElement&&time===this.sourceTime)return;
      this.sourceElement=source;this.sourceTime=time;
      const gl=this.gl,[sw,sh]=sourceSize(source),bw=this.bw,bh=this.bh;
      this.crop=coverCrop(sw/sh,this.canvas.width/this.canvas.height);
      gl.activeTexture(gl.TEXTURE0);this.upload(this.base,source);
      this.use(this.blur);gl.viewport(0,0,bw,bh);
      gl.bindFramebuffer(gl.FRAMEBUFFER,this.frames[0]);this.bind(this.blur,'source',this.base,0);
      gl.uniform2f(gl.getUniformLocation(this.blur,'crop'),...this.crop);
      gl.uniform2f(gl.getUniformLocation(this.blur,'stepSize'),3.6/bw,0);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      gl.bindFramebuffer(gl.FRAMEBUFFER,this.frames[1]);this.bind(this.blur,'source',this.temp,0);
      gl.uniform2f(gl.getUniformLocation(this.blur,'crop'),1,1);
      gl.uniform2f(gl.getUniformLocation(this.blur,'stepSize'),0,3.6/bh);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    }
    draw(mask) {
      const gl=this.gl;this.refresh();
      gl.activeTexture(gl.TEXTURE0);this.upload(this.mask,mask);
      this.use(this.glass);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
      gl.viewport(0,0,this.canvas.width,this.canvas.height);
      this.bind(this.glass,'sharpImage',this.base,0);this.bind(this.glass,'softImage',this.soft,1);
      this.bind(this.glass,'wipeMap',this.mask,2);
      gl.uniform2f(gl.getUniformLocation(this.glass,'resolution'),this.canvas.width,this.canvas.height);
      gl.uniform2f(gl.getUniformLocation(this.glass,'crop'),...this.crop);
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
      this.base=surface(w,h);this.soft=surface(w,h);this.layer=surface(w,h);this.cutout=surface(1,1);
      this.small=surface(Math.max(2,Math.round(w/30)),Math.max(2,Math.round(h/30)));
      this.sourceTime=-1;this.sourceElement=null;this.refresh();
    }
    refresh() {
      const source=visualSource(),time=source===video?video.currentTime:0;
      if(source===this.sourceElement&&time===this.sourceTime)return;
      this.sourceElement=source;this.sourceTime=time;
      const w=this.canvas.width,h=this.canvas.height,ctx=this.soft.getContext('2d');
      cropSource(this.base);
      this.small.getContext('2d').drawImage(this.base,0,0,this.small.width,this.small.height);
      ctx.filter='blur(18px)';ctx.drawImage(this.small,-36,-36,w+72,h+72);ctx.filter='none';
      ctx.fillStyle='rgba(201,212,194,.23)';ctx.fillRect(0,0,w,h);
    }
    draw(mask) {
      this.refresh();
      const w=this.canvas.width,h=this.canvas.height,ctx=this.ctx;
      const cut=this.cutout, c=cut.getContext('2d');
      cut.width=mask.width; cut.height=mask.height;
      const pixels=mask.getContext('2d').getImageData(0,0,mask.width,mask.height);
      for(let i=0;i<pixels.data.length;i+=4)pixels.data[i+3]=pixels.data[i];
      c.putImageData(pixels,0,0);
      const l=this.layer.getContext('2d'); l.globalCompositeOperation='source-over'; l.clearRect(0,0,w,h);
      l.drawImage(this.soft,0,0); l.globalCompositeOperation='destination-out'; l.drawImage(cut,0,0,w,h);
      ctx.drawImage(this.base,0,0); ctx.drawImage(this.layer,0,0);
    }
    destroy() {}
  }

  let maskCanvas,maskContext,maskImage;
  function buildSurfaces(w,h) {
    const mw=Math.min(480,Math.round(w)),mh=Math.round(mw*h/w);
    const previous=fog;
    fog=new FogField(mw,mh);
    if(previous)for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){
      const i=y*mw+x;const oldX=Math.round(x/(mw-1)*(previous.width-1)),oldY=Math.round(y/(mh-1)*(previous.height-1));
      const oldI=oldY*previous.width+oldX;fog.strength[i]=previous.strength[oldI];fog.stamp[i]=previous.stamp[oldI];
    }
    maskCanvas=surface(mw,mh);maskContext=maskCanvas.getContext('2d');maskImage=maskContext.createImageData(mw,mh);
  }
  function render() {
    if(!ready||state.hidden||state.offscreen)return;
    fog.pixels(state.time,maskImage.data);maskContext.putImageData(maskImage,0,0);
    renderer.draw(maskCanvas);
  }
  function frame(ms) {
    raf=0;
    if(!ready||!state.running)return;
    if(ms-lastPaint>=1000/30){
      state.tick(ms);lastPaint=ms;render();
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
  const playback=new MediaPlayback(video,()=>{
    if(videoFailed)return;
    state.paused=true;sync();
    status.textContent='Videon kunde inte starta automatiskt. Tryck på Fortsätt för att starta den.';
  });
  function syncVideo(){
    if(!ready)return;
    if(state.running&&!videoLoaded&&!videoFailed){videoLoaded=true;video.src=video.dataset.src;video.load();}
    playback.sync(state.running&&videoLoaded&&!videoFailed);
  }
  video.addEventListener('loadeddata',()=>{render();syncVideo();});
  video.addEventListener('error',()=>{
    videoFailed=true;playback.sync(false);render();
    status.textContent='Videon kunde inte laddas. Du kan fortfarande torka imman över stillbilden.';
  });
  function sync(){
    state.hidden=document.hidden||!pageActive;state.reduced=media.matches;state.last=null;
    cancelAnimationFrame(raf);raf=0;
    pause.textContent=state.paused?'Fortsätt':'Pausa';pause.setAttribute('aria-pressed',String(state.paused));
    pause.disabled=state.reduced;note.hidden=!state.reduced;
    syncAudio();syncVideo();render();wake();
  }
  function wipe(a,b){
    if(!ready)return;
    const radius=clamp(9/stage.clientHeight,.009,.027);
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
