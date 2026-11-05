/* The Wolf's Deck — one continuous, circular, arclength-spaced spiral.
 * Every card follows the SAME curve. Only its position along the curve changes.
 * No random per-card placements or rotations.
 */
(() => {
  'use strict';

  const SUITS = [
    {type:'heart',symbol:'♥',name:'Affection',file:'@PMOG(PortalMasterOfGames)_Alert Heart_2026-04-05-23-55-07.gif'},
    {type:'spade',symbol:'♠',name:'Enchantment',file:'@PMOG(PortalMasterOfGames)_Hypnosis_2026-04-05-23-58-16.gif'},
    {type:'diamond',symbol:'♦',name:'Sparkle',file:'@PMOG(PortalMasterOfGames)_Sparkling_2026-04-06-00-02-34.gif'},
    {type:'club',symbol:'♣',name:'Laughter',file:'@PMOG(PortalMasterOfGames)_Laugh_2026-04-05-23-58-42.gif'}
  ];
  const container = document.getElementById('spiralGlass');
  const stage = document.getElementById('cardStage');
  const extraStage = document.getElementById('extraStage');
  const sparkField = document.getElementById('sparkField');
  const pauseButton = document.getElementById('toggleMotion');
  const shuffleButton = document.getElementById('reshuffle');
  const speedSlider = document.getElementById('speedInput');
  const speedDisplay = document.getElementById('speedDisplay');
  const loadStatus = document.getElementById('loadStatus');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const clamp = (x,a,b) => Math.min(b, Math.max(a,x));

  // Deterministic star field so it doesn't flash or jitter when cards are dealt.
  for (let i = 0; i < 38; i++) {
    const s = document.createElement('i');
    s.className = 'spark' + (i % 7 === 0 ? ' cross' : '');
    s.style.setProperty('--x', (4 + (i * 31.31 % 92)) + '%');
    s.style.setProperty('--y', (4 + (i * 57.13 % 92)) + '%');
    s.style.setProperty('--dur', (2.4 + i % 5 * .64) + 's');
    s.style.setProperty('--delay', (-i * .29) + 's');
    sparkField.append(s);
  }

  const state = {
    playing: !reducedMotion, speed:1, time:1000, lastTime:0,
    cards:[], extras:[], path:[], fullLength:1, pitch:1,
    sequenceOffset:0, nextPairAt:11500, cardWidth:140
  };

  function makeCard(suit) {
    const el = document.createElement('div');
    el.setAttribute('aria-hidden','true');
    el.innerHTML = `<div class="card-face"><div class="corner"><span>A</span><small></small></div><div class="corner bottom-corner"><span>A</span><small></small></div><div class="emote-slot"><span class="placeholder"></span><img alt="" decoding="async"></div></div>`;
    applySuit(el, suit);
    return el;
  }
  function applySuit(card, suit) {
    card.suit = suit;
    card.className = 'playing-card ' + suit.type;
    card.querySelectorAll('.corner small').forEach(x => x.textContent = suit.symbol);
    card.querySelector('.placeholder').textContent = suit.symbol;
    const slot = card.querySelector('.emote-slot');
    const img = slot.querySelector('img');
    slot.classList.remove('loaded');
    img.onload = () => slot.classList.add('loaded');
    img.onerror = () => slot.classList.remove('loaded');
    if (suit.url) img.src = suit.url;
    else img.removeAttribute('src');
  }

  function imageWorks(url) {
    return new Promise(resolve => {
      let done = false;
      const img = new Image();
      const timeout = setTimeout(() => finish(false), 1700);
      function finish(ok){if(done)return;done=true;clearTimeout(timeout);img.onload=null;img.onerror=null;resolve(ok)}
      img.onload = () => finish(true); img.onerror = () => finish(false); img.src = url;
    });
  }
  async function findEmote(suit) {
    const escaped = encodeURIComponent(suit.file);
    const candidates = [
      `assets/gifs/${escaped}`,
      `https://pmog.creatorpromote.com/gifs/${escaped}`,
      `https://pmog.creatorpromote.com/gifs/gifs/${escaped}`,
      `https://creatorpromote.com/portalmasterofgames/gifs/${escaped}`
    ];
    for (const url of candidates){if(await imageWorks(url)){suit.url=url;return true}}
    return false;
  }

  // Circular Archimedean spiral. x and y ALWAYS use the same radius,
  // unlike the previous version's stretched elliptical curve.
  function position(t,w,h) {
    const turnCount = w < 430 ? 1.95 : 2.17;
    const a = Math.PI + TAU * turnCount * t;
    const outer = Math.min(w,h) * .49;
    const r = outer * Math.pow(1-t, .97);
    const scale = .18 + 1.02 * Math.pow(1-t,.70);
    return {x:Math.cos(a)*r,y:Math.sin(a)*r,u:t,angle:a,scale};
  }

  function calculate() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    // Find card width from its actual style, not from the viewport assumption.
    const sample = state.cards[0] || makeCard(SUITS[0]);
    if (!state.cards.length) stage.append(sample);
    state.cardWidth = sample.getBoundingClientRect().width || 140;
    if (!state.cards.length) sample.remove();
    const path=[];const steps=2600;
    let last=position(0,w,h), total=0;
    path.push({...last,d:0,rotation:0});
    for(let i=1;i<=steps;i++){
      const p=position(i/steps,w,h);
      const ds=Math.hypot(p.x-last.x,p.y-last.y);
      total+=ds/Math.max(.19,(p.scale+last.scale)/2);
      path.push({...p,d:total,rotation:Math.atan2(p.y-last.y,p.x-last.x)*180/Math.PI});
      last=p;
    }
    path[0].rotation=path[1].rotation;
    state.path=path;state.fullLength=total;
    // Overlap a little, like fanned playing cards lined up around a table.
    const count=clamp(Math.round(total/(state.cardWidth*.55)),15,w<430?27:40);
    state.pitch=total/count;
    while(state.cards.length<count){
      const card=makeCard(SUITS[(state.cards.length+state.sequenceOffset)%4]);
      state.cards.push(card);stage.append(card);
    }
    while(state.cards.length>count)state.cards.pop().remove();
    paint();
  }

  function pointAt(d) {
    const list=state.path;let lo=0,hi=list.length-1;
    while(lo<hi){const m=(lo+hi)>>1;if(list[m].d<d)lo=m+1;else hi=m}
    const b=list[lo],a=list[Math.max(0,lo-1)];
    const k=b.d===a.d?0:clamp((d-a.d)/(b.d-a.d),0,1);
    return {x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,
      scale:a.scale+(b.scale-a.scale)*k,u:a.u+(b.u-a.u)*k,
      rotation:a.rotation+(b.rotation-a.rotation)*k};
  }

  function paint() {
    if(!state.path.length)return;
    const travel=((state.time/28500)*state.fullLength)%state.fullLength;
    state.cards.forEach((card,i)=>{
      const d=(i*state.pitch+travel)%state.fullLength;
      const p=pointAt(d);
      const tiltX=10*Math.cos(p.u*TAU*2.17);
      const tiltY=12*Math.sin(p.u*TAU*2.17);
      const fadeIn=clamp(d/(state.pitch*1.4),0,1);
      const fadeOut=clamp((state.fullLength-d)/(state.pitch*1.6),0,1);
      const depth=38+(1-p.u)*105;
      card.style.transform=`translate3d(calc(-50% + ${p.x.toFixed(2)}px),calc(-50% + ${p.y.toFixed(2)}px),${depth.toFixed(2)}px) rotateZ(${p.rotation.toFixed(2)}deg) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg) scale(${p.scale.toFixed(3)})`;
      card.style.opacity=String(Math.min(fadeIn,fadeOut));
      card.style.zIndex=String(10+Math.round((1-p.u)*100));
    });
  }

  function surprisePair() {
    if(reducedMotion||!state.playing)return;
    const w=container.clientWidth,h=container.clientHeight;
    [0,1].forEach((side)=>{
      const fromTop=side===0;
      const card=makeCard(SUITS[(Math.floor(state.time/1000)+side)%4]);
      extraStage.append(card);state.extras.push(card);
      const x=fromTop?-.14*w:.18*w;
      const startY=(fromTop?-.77:.77)*h;
      const endY=(fromTop?-.20:.20)*h;
      const frames=[
        {opacity:0,transform:`translate3d(calc(-50% + ${x}px),calc(-50% + ${startY}px),70px) rotateZ(${fromTop?-36:34}deg) scale(1.05)`},
        {opacity:.98,transform:`translate3d(calc(-50% + ${x*.5}px),calc(-50% + ${endY}px),120px) rotateZ(${fromTop?12:-14}deg) rotateY(18deg) scale(.94)`},
        {opacity:0,transform:`translate3d(-50%,-50%,-80px) rotateZ(${fromTop?120:-115}deg) scale(.15)`}
      ];
      const anim=card.animate(frames,{duration:2850,delay:side*100,fill:'forwards',easing:'ease-in-out'});
      card._anim=anim;anim.playbackRate=state.speed;
      anim.onfinish=()=>{card.remove();state.extras=state.extras.filter(c=>c!==card)};
    });
  }

  function updateControls(){
    pauseButton.textContent=state.playing?'Ⅱ Pause':'▶ Play';
    pauseButton.setAttribute('aria-pressed',String(!state.playing));
    pauseButton.setAttribute('aria-label',state.playing?'Pause spiral animation':'Play spiral animation');
    for(const card of state.extras)card._anim?.[state.playing?'play':'pause']();
  }
  pauseButton.addEventListener('click',()=>{state.playing=!state.playing;updateControls()});
  shuffleButton.addEventListener('click',()=>{
    state.sequenceOffset=(state.sequenceOffset+1)%4;
    state.cards.forEach((card,i)=>applySuit(card,SUITS[(i+state.sequenceOffset)%4]));paint();
  });
  speedSlider.addEventListener('input',()=>{
    state.speed=Number(speedSlider.value);speedDisplay.textContent=state.speed+'×';
    for(const card of state.extras)if(card._anim)card._anim.playbackRate=state.speed;
  });
  function frame(now) {
    if(!state.lastTime)state.lastTime=now;
    const dt=Math.min(80,now-state.lastTime);state.lastTime=now;
    if(state.playing){
      state.time+=dt*state.speed;
      if(state.time>=state.nextPairAt){surprisePair();state.nextPairAt=state.time+12500}
      paint();
    }
    requestAnimationFrame(frame);
  }
  Promise.all(SUITS.map(findEmote)).then(found=>{
    state.cards.forEach(card=>applySuit(card,card.suit));
    const n=found.filter(Boolean).length;
    loadStatus.textContent=n===4?'All four GIF emotes loaded.':`${n} of 4 GIF emotes loaded; other cards display suit symbols.`;
  });
  if('ResizeObserver' in window)new ResizeObserver(calculate).observe(container);
  else window.addEventListener('resize',calculate);
  calculate();updateControls();requestAnimationFrame(frame);
})();
