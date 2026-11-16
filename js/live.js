// Statistics and live observations from the central CreatorPromote Hub.
(() => {
const subscribersEl = document.getElementById("subscribers");
const viewsEl = document.getElementById("views");
const videosEl = document.getElementById("videos");
const liveEl = document.getElementById("liveStatus");
const updatedEl = document.getElementById("updated");
const clockEl = document.getElementById("clock");
const goalFill = document.getElementById("goalFill");
const goalText = document.getElementById("goalText");

let lastStats = { subs: 0, views: 0, videos: 0 };

function animateValue(el, start, end, duration = 800) {
  if (!el) return;
  const range = end - start;

  if (range === 0) {
    el.textContent = end.toLocaleString();
    return;
  }

  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;

    const progress = Math.min((timestamp - startTime) / duration, 1);
    const value = Math.floor(start + range * progress);

    el.textContent = value.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function updateClock() {
  const now = new Date();

  clockEl.textContent = now.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function updateGoal(subs) {
  let goal = 100;

  if (subs >= 100) goal = 500;
  if (subs >= 500) goal = 1000;
  if (subs >= 1000) goal = 5000;
  if (subs >= 5000) goal = 10000;
  if (subs >= 10000) goal = 50000;
  if (subs >= 50000) goal = 100000;
  if (subs >= 100000) goal = 500000;
  if (subs >= 500000) goal = 1000000;

  const percent = Math.min((subs / goal) * 100, 100);

  goalFill.style.width = percent + "%";
  goalText.textContent = `${subs.toLocaleString()} / ${goal.toLocaleString()}`;
}


const config = {hubUrl:'https://api.creatorpromote.com',slug:'portalmasterofgames',channelId:'UCdOJvhjojFe3Z0yKeGEIERA'};
const adapterUrl = new URL('./hub-feed.mjs', document.currentScript.src).href;
let statisticsSignature = '';
function unavailable() {
  liveEl.textContent = 'Live status unavailable';
  updatedEl.textContent = statisticsSignature ? 'Saved data · refresh unavailable' : 'Feed unavailable';
  if (!statisticsSignature) {
    subscribersEl.textContent = viewsEl.textContent = videosEl.textContent = '—';
    goalText.textContent = 'Unavailable'; goalFill.style.width = '0%';
  }
}
updateClock();
setInterval(updateClock, 1000);
import(adapterUrl).then(({watchCreatorFeed}) => {
  watchCreatorFeed(config, ({data,source}) => {
    const stats = data.channel.statistics || {};
    const nextSignature = JSON.stringify(stats);
    if (statisticsSignature !== nextSignature) {
      const fields = [['subscriberCount','subs',subscribersEl],['viewCount','views',viewsEl],['videoCount','videos',videosEl]];
      for (const [field,key,element] of fields) {
        const number = stats[field] == null || stats[field] === '' ? NaN : Number(stats[field]);
        if (Number.isFinite(number) && number >= 0 && !(key === 'subs' && stats.hiddenSubscriberCount)) {
          animateValue(element, lastStats[key], number); lastStats[key] = number;
          if (key === 'subs') updateGoal(number);
        } else {
          element.textContent = '—';
          if (key === 'subs') {goalText.textContent = 'Unavailable'; goalFill.style.width = '0%';}
        }
      }
      statisticsSignature = nextSignature;
    }
    // A recent uploads scan cannot prove a channel is offline.
    const live = data.freshness.liveFresh && data.live?.snippet?.liveBroadcastContent === 'live' &&
      data.live.liveStreamingDetails?.actualStartTime && !data.live.liveStreamingDetails?.actualEndTime;
    liveEl.textContent = live ? 'Streaming Live' : data.freshness.liveFresh ? 'No live stream detected' : 'Live status unavailable';
    const observed = data.sections?.channel?.updatedAt || data.updatedAt;
    const cached = source === 'fallback' || data.sections?.channel?.status === 'cached';
    updatedEl.textContent = (cached ? 'Saved · ' : '') + new Date(observed).toLocaleString('nl-NL', {
      day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
    });
  }, unavailable);
}).catch(unavailable);

})();
