// Replace these with your API key and channel ID
const API_KEY = 'AIzaSyBvpCwNhDR-PvJ02tJ2iJDekFc3R9-g5V0';
const CHANNEL_ID = 'UCdOJvhjojFe3Z0yKeGEIERA'; // e.g., UCxxxxxx

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
    second: "2-digit"
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

async function fetchStats() {
  try {
    const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${CHANNEL_ID}&key=${API_KEY}`;
    const statsResponse = await fetch(statsUrl);
    const statsData = await statsResponse.json();

    if (!statsData.items || statsData.items.length === 0) {
      liveEl.textContent = "Channel error";
      return;
    }

    const stats = statsData.items[0].statistics;

    const subs = Number(stats.subscriberCount || 0);
    const views = Number(stats.viewCount || 0);
    const videos = Number(stats.videoCount || 0);

    animateValue(subscribersEl, lastStats.subs, subs);
    animateValue(viewsEl, lastStats.views, views);
    animateValue(videosEl, lastStats.videos, videos);

    updateGoal(subs);

    lastStats = { subs, views, videos };

    const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEY}`;
    const liveResponse = await fetch(liveUrl);
    const liveData = await liveResponse.json();

    const isLive = liveData.items && liveData.items.length > 0;

    liveEl.textContent = isLive ? "Streaming Live" : "Not Livestreaming";

    updatedEl.textContent = new Date().toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit"
    });

  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    liveEl.textContent = "Error";
  }
}

updateClock();
setInterval(updateClock, 1000);

fetchStats();
setInterval(fetchStats, 60000);