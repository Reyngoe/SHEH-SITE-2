/* ============================================================================
   SHEH NEWS — PUBLIC (read-only) Cloudflare Worker
   The public face of SHEH News for the website. It ONLY reads and displays the
   cached brief that your PRIVATE worker already produces. It cannot pull, cannot
   spend money, and never touches your private app.

   • NO /refresh, NO scheduled cron, NO ANTHROPIC_API_KEY, NO REFRESH_PIN.
   • /brief serves the cached brief (CORS open) so the website can read it too.
   • / serves a read-only reader (your dispatch look, minus refresh + PIN).

   SETUP (one binding, no secrets):
   • KV namespace binding named:  DISPATCH_KV
     -> bind it to the SAME namespace your private worker uses (the one holding
        "brief:latest"). That shared cache is how this twin shows the same brief.
   • Do NOT add cron triggers. Do NOT add any secrets.
   ============================================================================ */

const TIMEZONE = "America/Los_Angeles";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/brief") return handleBrief(env);
    return new Response(PAGE_HTML, { headers: { "content-type": "text/html;charset=UTF-8" } });
  }
  // no scheduled() — this worker never pulls.
};

async function handleBrief(env) {
  const today = pacificDateKey(new Date());
  let brief = null;
  try {
    const raw = await env.DISPATCH_KV.get("brief:latest");
    if (raw) brief = JSON.parse(raw);
  } catch (e) {}
  return json({ brief, today }, 200, true); // CORS on for the website preview
}

function pacificDateKey(d) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).format(d);
}

function json(obj, status, cors) {
  const headers = { "content-type": "application/json;charset=UTF-8" };
  if (cors) headers["access-control-allow-origin"] = "*";
  return new Response(JSON.stringify(obj), { status: status || 200, headers });
}

/* -------------------------------- page ------------------------------------- */
/* Inner script uses single-quoted JS strings + literal unicode punctuation, so
   the outer template literal never collides with backticks or ${}. */

const PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<title>SHEH News</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#0D141C; --ink-2:#131D27; --ink-3:#22303D;
    --paper:#ECE6D9; --paper-dim:#9EAAB4; --paper-faint:#5E6B77;
    --ember:#E8772B; --ember-soft:rgba(232,119,43,0.13);
    --pos:#74B790; --neg:#D06A5A; --steel:#7D93A4;
    --mono:'IBM Plex Mono',ui-monospace,monospace;
    --sans:'IBM Plex Sans',system-ui,sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;}
  body{
    background:radial-gradient(120% 60% at 50% -10%, rgba(232,119,43,0.13), rgba(232,119,43,0) 60%), var(--ink);
    color:var(--paper);font-family:var(--sans);line-height:1.55;min-height:100vh;-webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:820px;margin:0 auto;padding:0 22px 80px;}
  .masthead{padding:38px 0 18px;}
  .brand-time{font-family:var(--mono);font-weight:600;font-size:clamp(30px,10vw,56px);line-height:0.96;letter-spacing:-0.01em;white-space:nowrap;}
  .brand-time .wm-accent{color:var(--ember);}
  .brand-sf{font-size:13px;color:var(--paper-faint);margin-top:12px;padding-left:3px;}
  .meta-line{margin-top:20px;font-family:var(--mono);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--paper-faint);}
  .meta-line b{color:var(--steel);font-weight:500;}
  .rule{height:2px;background:var(--ember);width:100%;margin-top:20px;}
  .nav{display:flex;gap:8px;overflow-x:auto;padding:14px 0 2px;-webkit-overflow-scrolling:touch;}
  .navlink{flex:0 0 auto;font-family:var(--mono);font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--paper-dim);text-decoration:none;border:1px solid var(--ink-3);padding:6px 10px;white-space:nowrap;}
  .navlink:hover{color:var(--ember);border-color:var(--ember);}
  .signal{font-family:var(--mono);font-size:12.5px;line-height:1.7;color:var(--paper-dim);padding:14px 0 4px;letter-spacing:0.02em;display:flex;gap:10px;align-items:baseline;}
  .signal-tag{color:var(--ember);font-weight:600;letter-spacing:0.14em;flex:0 0 auto;}
  .signal-body{color:var(--steel);}
  .err{color:var(--neg);}
  .feed{margin-top:24px;}
  .wire{padding:26px 0;border-top:1px solid var(--ink-3);opacity:0;transform:translateY(10px);animation:rise .5s ease forwards;scroll-margin-top:16px;position:relative;}
  .wire:first-child{border-top:none;}
  .wire-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;}
  .wire-slug{font-family:var(--mono);font-weight:600;font-size:12px;letter-spacing:0.12em;color:var(--ember);flex:0 0 auto;}
  .wire-desk{font-family:var(--mono);font-weight:500;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:var(--paper-dim);flex:1 1 auto;min-width:0;}
  .wire-status{font-family:var(--mono);font-weight:500;font-size:11px;letter-spacing:0.14em;color:var(--paper-faint);display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;}
  .dot{width:7px;height:7px;border-radius:50%;background:var(--steel);display:inline-block;}
  [data-status="ESCALATING"] .dot{background:var(--neg);} [data-status="ESCALATING"]{color:var(--neg);}
  [data-status="DEVELOPING"] .dot{background:var(--ember);box-shadow:0 0 8px rgba(232,119,43,0.6);} [data-status="DEVELOPING"]{color:var(--ember);}
  [data-status="WATCH"] .dot{background:var(--ember);} [data-status="WATCH"]{color:var(--ember);}
  [data-status="DE-ESCALATING"] .dot{background:var(--pos);} [data-status="DE-ESCALATING"]{color:var(--pos);}
  [data-status="SETTLING"] .dot{background:var(--steel);}
  .wire-headline{font-family:var(--sans);font-weight:700;font-size:clamp(19px,3.4vw,25px);line-height:1.22;letter-spacing:-0.01em;color:var(--paper);margin-bottom:14px;}
  .wire-points{list-style:none;display:flex;flex-direction:column;gap:9px;}
  .wire-points li{position:relative;padding-left:20px;font-family:var(--sans);font-size:15px;line-height:1.5;color:var(--paper-dim);}
  .wire-points li::before{content:"";position:absolute;left:0;top:10px;width:9px;height:1.5px;background:var(--ember);}
  .sources{margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
  .sources-label{font-family:var(--mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--paper-faint);}
  .src{font-family:var(--mono);font-size:11px;color:var(--steel);text-decoration:none;border-bottom:1px solid var(--ink-3);padding-bottom:1px;}
  .src:hover{color:var(--ember);border-color:var(--ember);}
  .footer{margin-top:42px;padding-top:22px;border-top:1px solid var(--ink-3);font-family:var(--mono);font-size:11px;line-height:1.8;letter-spacing:0.06em;color:var(--paper-faint);}
  .footer .end{color:var(--ember);letter-spacing:0.18em;}
  @keyframes rise{to{opacity:1;transform:translateY(0);}}
  @media (prefers-reduced-motion: reduce){.wire{animation:none;opacity:1;transform:none;}}
  .listen-row{margin-top:16px;}
  .listen-btn{font-family:var(--mono);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--paper-dim);background:transparent;border:1px solid var(--ink-3);padding:10px 15px;cursor:pointer;display:inline-flex;align-items:center;gap:10px;transition:color .12s ease,border-color .12s ease;-webkit-tap-highlight-color:transparent;}
  .listen-btn:hover{color:var(--ember);border-color:var(--ember);}
  .listen-btn.active{color:var(--ember);border-color:var(--ember);}
  .ic-play{display:inline-block;width:0;height:0;border-left:10px solid var(--ember);border-top:6px solid transparent;border-bottom:6px solid transparent;}
  .ic-pause{display:inline-block;position:relative;width:10px;height:12px;}
  .ic-pause::before,.ic-pause::after{content:"";position:absolute;top:0;width:3px;height:12px;background:var(--ember);}
  .ic-pause::before{left:0;}
  .ic-pause::after{right:0;}
  .ic-stop{display:inline-block;width:11px;height:11px;background:var(--ember);}
  .wire-headline-row{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;}
  .wire-headline-row .wire-headline{margin-bottom:0;}
  .wspeak{flex:0 0 auto;margin-top:4px;width:28px;height:28px;border:none;background:transparent;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;opacity:0.7;transition:opacity .12s ease;-webkit-tap-highlight-color:transparent;}
  .wspeak:hover,.wspeak.on{opacity:1;}
  .wire.speaking::before{content:"";position:absolute;left:-12px;top:24px;bottom:18px;width:2px;background:var(--ember);}
</style>
</head>
<body>
<div class="wrap">
  <header class="masthead">
    <div class="brand-time">SHEH <span class="wm-accent">NEWS</span></div>
    <div class="brand-sf">Morning brief &middot; markets, power, and what&rsquo;s moving</div>
    <div class="meta-line" id="metaLine">&mdash;</div>
    <div class="listen-row" id="listenRow" hidden>
      <button class="listen-btn" id="listenBtn" type="button"><span class="lic ic-play"></span><span class="llbl">Listen to the brief</span></button>
    </div>
  </header>
  <div class="rule"></div>
  <nav class="nav" id="nav"></nav>
  <div class="signal" aria-live="polite"><span class="signal-tag">SIGNAL</span><span class="signal-body" id="signal">&mdash;</span></div>
  <main class="feed" id="feed"></main>
</div>

<script>
(function(){
  "use strict";
  var metaEl=document.getElementById('metaLine');
  var navEl=document.getElementById('nav');
  var signalEl=document.getElementById('signal');
  var feedEl=document.getElementById('feed');
  var listenRow=document.getElementById('listenRow');
  var listenBtn=document.getElementById('listenBtn');

  var ttsOK=('speechSynthesis' in window)&&(typeof SpeechSynthesisUtterance!=='undefined');
  var currentBrief=null;
  var speech={mode:null,queue:[],idx:0,paused:false,gen:0};
  var STATUSES={ESCALATING:1,DEVELOPING:1,WATCH:1,'DE-ESCALATING':1,SETTLING:1};
  var MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var DAYS=['SUN','MON','TUE','WED','THU','FRI','SAT'];

  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function fmtDay(ymd){if(!ymd)return '';var p=String(ymd).split('-');if(p.length!==3)return ymd;var y=parseInt(p[0],10),m=parseInt(p[1],10),d=parseInt(p[2],10);var wd=new Date(Date.UTC(y,m-1,d)).getUTCDay();return DAYS[wd]+' '+MONTHS[m-1]+' '+d+' '+y;}
  function fmtTimePT(iso){try{return new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'2-digit',minute:'2-digit'}).format(new Date(iso)).toUpperCase()+' PT';}catch(e){return '';}}

  function render(data){
    var brief=data.brief;
    if(ttsOK)stopSpeech();
    var today=data.today;
    if(!brief){
      currentBrief=null;
      if(listenRow)listenRow.hidden=true;
      metaEl.innerHTML=esc(fmtDay(today))+' · <b>NO DISPATCH YET</b>';
      signalEl.textContent='No brief stored yet. Check back after the morning run.';
      feedEl.innerHTML='';navEl.innerHTML='';return;
    }
    currentBrief=brief;
    var stale=brief.day&&today&&brief.day!==today;
    var dateStr=fmtDay(stale?today:(brief.day||today));
    var tail='';
    if(stale){
      tail='<b>LAST GOOD '+esc(fmtDay(brief.day))+'</b> — today’s pull pending';
    }else if(brief.updatedAt){
      tail='RECEIVED <b>'+esc(fmtTimePT(brief.updatedAt))+'</b>';
    }
    metaEl.innerHTML=esc(dateStr)+(tail?' · '+tail:'');
    signalEl.textContent=brief.signal||'';

    var wires=brief.wires||[];
    var navHtml='',feedHtml='';
    for(var i=0;i<wires.length;i++){
      var w=wires[i]||{};
      var wid='wire-'+(w.id||i);
      var st=(w.status&&STATUSES[w.status])?w.status:'WATCH';
      navHtml+='<a class="navlink" href="#'+wid+'">'+esc(w.desk||'')+'</a>';
      feedHtml+='<article class="wire" id="'+wid+'" data-status="'+esc(st)+'" style="animation-delay:'+(i*0.05)+'s">'
        +'<div class="wire-head"><span class="wire-slug">WIRE '+(i+1<10?'0'+(i+1):(i+1))+'</span>'
        +'<span class="wire-desk">'+esc(w.desk||'')+'</span>'
        +'<span class="wire-status"><span class="dot"></span>'+esc(st)+'</span></div>'
        +(ttsOK?'<div class="wire-headline-row"><button class="wspeak" type="button" data-speak="'+wid+'" aria-label="Listen to this section"><span class="ic-play"></span></button><h2 class="wire-headline">'+esc(w.headline||'')+'</h2></div>':'<h2 class="wire-headline">'+esc(w.headline||'')+'</h2>');
      var pts=w.points||[];
      if(pts.length){feedHtml+='<ul class="wire-points">';for(var j=0;j<pts.length;j++){feedHtml+='<li>'+esc(pts[j])+'</li>';}feedHtml+='</ul>';}
      var srcs=w.sources||[];
      var srcHtml='';
      for(var k=0;k<srcs.length;k++){var sc=srcs[k]||{};var u=(sc.url||'').toString();if(u&&/^https?:\\/\\//.test(u)){srcHtml+='<a class="src" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(sc.title||'source')+'</a>';}}
      if(srcHtml){feedHtml+='<div class="sources"><span class="sources-label">Sources</span>'+srcHtml+'</div>';}
      feedHtml+='</article>';
    }
    navEl.innerHTML=navHtml;feedEl.innerHTML=feedHtml;
    if(listenRow)listenRow.hidden=!(ttsOK&&wires.length);
  }

  // ---- audio (Web Speech API; phone's built-in voice, no API/cost) ----
  function speakClean(s){return String(s||'').replace(/[·•]/g,'. ').replace(/[—–]/g,', ').replace(/&/g,' and ').replace(/\\s+/g,' ').trim();}
  function wireChunks(w,domId){var out=[];if(w.desk)out.push({t:speakClean(w.desk)+'.',id:domId});if(w.headline)out.push({t:speakClean(w.headline)+'.',id:domId});var pts=w.points||[];for(var i=0;i<pts.length;i++){if(pts[i])out.push({t:speakClean(String(pts[i])),id:domId});}return out;}
  function allChunks(){var out=[];var b=currentBrief;if(!b)return out;if(b.signal)out.push({t:speakClean(b.signal),id:null});var ws=b.wires||[];for(var i=0;i<ws.length;i++){var w=ws[i]||{};var domId='wire-'+(w.id||i);var c=wireChunks(w,domId);for(var j=0;j<c.length;j++)out.push(c[j]);}return out;}
  function sectionChunks(domId){var ws=(currentBrief&&currentBrief.wires)||[];for(var i=0;i<ws.length;i++){if('wire-'+(ws[i].id||i)===domId)return wireChunks(ws[i]||{},domId);}return [];}
  function activeWireId(){return (speech.mode&&!speech.paused&&speech.queue[speech.idx])?speech.queue[speech.idx].id:null;}
  function setWireHighlight(domId){
    var arts=feedEl.querySelectorAll('.wire');
    for(var i=0;i<arts.length;i++){arts[i].classList.toggle('speaking',arts[i].id===domId&&!!domId);}
    var btns=feedEl.querySelectorAll('.wspeak');
    for(var k=0;k<btns.length;k++){var on=(btns[k].getAttribute('data-speak')===domId)&&!!domId;btns[k].classList.toggle('on',on);var ic=btns[k].querySelector('span');if(ic)ic.className=on?'ic-stop':'ic-play';}
    if(domId&&speech.mode==='all'){var el=document.getElementById(domId);if(el&&el.scrollIntoView){try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}}}
  }
  function updateListen(){
    if(!listenBtn)return;
    var ic=listenBtn.querySelector('.lic');var lbl=listenBtn.querySelector('.llbl');
    if(speech.mode==='all'&&!speech.paused){if(ic)ic.className='lic ic-pause';if(lbl)lbl.textContent='Pause';listenBtn.classList.add('active');}
    else if(speech.mode==='all'&&speech.paused){if(ic)ic.className='lic ic-play';if(lbl)lbl.textContent='Resume';listenBtn.classList.add('active');}
    else{if(ic)ic.className='lic ic-play';if(lbl)lbl.textContent='Listen to the brief';listenBtn.classList.remove('active');}
  }
  function speakNext(){
    if(speech.idx>=speech.queue.length){finishSpeech();return;}
    var chunk=speech.queue[speech.idx];
    setWireHighlight(chunk.id);
    var u=new SpeechSynthesisUtterance(chunk.t);u.rate=1;u.pitch=1;u.volume=1;
    var myGen=speech.gen;
    u.onend=function(){if(myGen!==speech.gen)return;speech.idx++;speakNext();};
    u.onerror=function(){if(myGen!==speech.gen)return;speech.idx++;speakNext();};
    try{window.speechSynthesis.speak(u);}catch(e){}
  }
  function startSpeech(chunks,mode){speech.gen++;try{window.speechSynthesis.cancel();}catch(e){}speech.queue=chunks||[];speech.idx=0;speech.mode=mode;speech.paused=false;updateListen();speakNext();}
  function pauseSpeech(){speech.gen++;try{window.speechSynthesis.cancel();}catch(e){}speech.paused=true;updateListen();setWireHighlight(null);}
  function resumeSpeech(){speech.paused=false;speech.gen++;updateListen();speakNext();}
  function stopSpeech(){speech.gen++;try{window.speechSynthesis.cancel();}catch(e){}speech.mode=null;speech.paused=false;speech.idx=0;speech.queue=[];updateListen();setWireHighlight(null);}
  function finishSpeech(){speech.mode=null;speech.paused=false;speech.idx=0;speech.queue=[];updateListen();setWireHighlight(null);}

  if(ttsOK&&listenBtn){listenBtn.addEventListener('click',function(){if(speech.mode==='all'){if(speech.paused)resumeSpeech();else pauseSpeech();}else{startSpeech(allChunks(),'all');}});}
  if(ttsOK&&feedEl){feedEl.addEventListener('click',function(e){var t=e.target;var b=(t&&t.classList&&t.classList.contains('wspeak'))?t:(t&&t.closest?t.closest('.wspeak'):null);if(!b)return;var domId=b.getAttribute('data-speak');if(speech.mode&&!speech.paused&&activeWireId()===domId){stopSpeech();}else{startSpeech(sectionChunks(domId),'section');}});}

  fetch('/brief').then(function(r){return r.json();}).then(function(d){render(d);}).catch(function(e){signalEl.innerHTML='<span class="err">Couldn’t load the brief. Reload the page.</span>';});
})();
</script>
</body>
</html>`;
