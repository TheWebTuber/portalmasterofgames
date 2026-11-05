/* PMOG Card Arcade: three free, no-stakes mini-games. No user data is sent or stored. */
(() => {
  'use strict';
  const suits=[
    {key:'heart', symbol:'♥', label:'Hearts', color:'#cc355d'},
    {key:'spade', symbol:'♠', label:'Spades', color:'#793ac2'},
    {key:'diamond', symbol:'♦', label:'Diamonds', color:'#cc355d'},
    {key:'club', symbol:'♣', label:'Clubs', color:'#793ac2'}
  ];
  // cryptographically secure uniform integer between 0 (inclusive) and max (exclusive).
  function randomInt(max){
    if(!Number.isInteger(max)||max<=0)throw new Error('Invalid random range');
    if(window.crypto?.getRandomValues){
      const limit=Math.floor(0x100000000/max)*max;
      const value=new Uint32Array(1);
      do{crypto.getRandomValues(value)}while(value[0]>=limit);
      return value[0]%max;
    }
    return Math.floor(Math.random()*max);
  }
  const $=id=>document.getElementById(id);
  const guessCard=$('guessCard'),guessSymbol=$('guessSymbol'),guessLabel=$('guessSuitName');
  const guessMessage=$('guessMessage');
  const guess={wins:0,plays:0,streak:0,locked:false};
  function updateGuess(){
    $('guessWins').textContent=String(guess.wins);
    $('guessPlays').textContent=String(guess.plays);
    $('guessStreak').textContent=String(guess.streak);
  }
  document.querySelectorAll('[data-suit]').forEach(button=>{
    button.addEventListener('click',()=>{
      if(guess.locked)return;
      guess.locked=true;
      const pick=button.dataset.suit;
      const actual=suits[randomInt(4)];
      const good=pick===actual.key;
      guess.plays++;
      guess.wins+=Number(good);
      guess.streak=good?guess.streak+1:0;
      guessCard.classList.add('is-back');
      document.querySelectorAll('[data-suit]').forEach(b=>b.disabled=true);
      // Reveal the new identity after the face has turned away.
      setTimeout(()=>{
        guessSymbol.textContent=actual.symbol;guessSymbol.style.color=actual.color;
        guessLabel.textContent=actual.label.toUpperCase();
        guessCard.classList.remove('is-back');
        guessMessage.textContent=good?'A perfect read. The wolf raises an eyebrow.':'It was '+actual.label+'! The wolf pretends not to laugh.';
        updateGuess();
      },180);
      setTimeout(()=>{
        guess.locked=false;
        document.querySelectorAll('[data-suit]').forEach(b=>b.disabled=false);
      },650);
    });
  });
  $('guessReset').addEventListener('click',()=>{
    Object.assign(guess,{wins:0,plays:0,streak:0,locked:false});updateGuess();
    guessCard.classList.add('is-back');guessMessage.textContent='Make your prediction, traveler.';
    document.querySelectorAll('[data-suit]').forEach(b=>b.disabled=false);
  });

  // Higher / lower draws ranks 1–13 with independent replacement.
  // A tie is neither a win nor a loss and does not advance the streak.
  const hilo={current:randomInt(13)+1,streak:0,best:0,locked:false};
  function syncHilo(){
    $('currentNumber').textContent=String(hilo.current);
    $('hiloStreak').textContent=String(hilo.streak);
    $('hiloBest').textContent=String(hilo.best);
  }
  function playHilo(direction){
    if(hilo.locked)return;
    hilo.locked=true;
    const next=randomInt(13)+1;
    $('nextNumber').textContent=String(next);
    $('nextNumberCard').classList.remove('is-hidden');
    let msg;
    if(next===hilo.current) msg='A tie! The cards refuse to take sides.';
    else if((direction==='higher'&&next>hilo.current)||(direction==='lower'&&next<hilo.current)){
      hilo.streak++;hilo.best=Math.max(hilo.best,hilo.streak);
      msg='Well played! The wolf nods with suspicious respect.';
    }else{
      hilo.streak=0;msg='Not this time. The deck has a mischievous streak.';
    }
    $('hiloMessage').textContent=msg;syncHilo();
    $('higherBtn').disabled=true;$('lowerBtn').disabled=true;
    setTimeout(()=>{
      hilo.current=next;syncHilo();$('nextNumber').textContent='?';
      $('nextNumberCard').classList.add('is-hidden');
      $('higherBtn').disabled=false;$('lowerBtn').disabled=false;hilo.locked=false;
    },1300);
  }
  $('higherBtn').addEventListener('click',()=>playHilo('higher'));
  $('lowerBtn').addEventListener('click',()=>playHilo('lower'));
  $('hiloReset').addEventListener('click',()=>{
    if(hilo.locked)return;
    hilo.current=randomInt(13)+1;hilo.streak=0;hilo.best=0;
    $('hiloMessage').textContent='The deck is waiting for your call.';
    $('nextNumberCard').classList.add('is-hidden');$('nextNumber').textContent='?';syncHilo();
  });
  syncHilo();

  const fortunes=[
    {icon:'♥',line:'A kind word may open a door that magic cannot.'},
    {icon:'♠',line:'The path you missed might be the one worth exploring.'},
    {icon:'♦',line:'Small sparks become stories. Go make one.'},
    {icon:'♣',line:'Laughter is contagious. Share it recklessly.'},
    {icon:'✦',line:'The wolf knows a secret. Unfortunately, it involves snacks.'},
    {icon:'☾',line:'A quiet night might have the loudest surprise.'},
    {icon:'♥',line:'A friend may be waiting for you to say hello.'},
    {icon:'♦',line:'Today looks like an excellent day for a ridiculous idea.'},
    {icon:'♠',line:'A twist in the tale is not always a trap.'},
    {icon:'♣',line:'If the joke was terrible, tell it twice. For science.'},
    {icon:'✧',line:'Your next adventure starts with one brave little click.'},
    {icon:'✦',line:'The deck says you are lucky. The wolf says: define lucky.'}
  ];
  let copiedFortune='',fortuneLocked=false;
  $('fortuneDraw').addEventListener('click',()=>{
    if(fortuneLocked)return;
    fortuneLocked=true;
    const card=fortunes[randomInt(fortunes.length)];
    const sigil=$('fortuneSigil');
    sigil.classList.remove('spin');void sigil.offsetWidth;sigil.classList.add('spin');
    $('fortuneMessage').textContent='“'+card.line+'”';sigil.textContent=card.icon;
    copiedFortune=card.line;$('fortuneCopy').disabled=false;
    setTimeout(()=>fortuneLocked=false,600);
  });
  $('fortuneCopy').addEventListener('click',async()=>{
    if(!copiedFortune)return;
    try{
      await navigator.clipboard.writeText('The Wolf’s Deck ✦ '+copiedFortune);
      $('fortuneCopy').textContent='Copied! ✓';
      setTimeout(()=>$('fortuneCopy').textContent='Copy fortune ↗',1400);
    }catch{
      $('fortuneCopy').textContent='Copy unavailable';
      setTimeout(()=>$('fortuneCopy').textContent='Copy fortune ↗',1600);
    }
  });
})();
