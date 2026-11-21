import {watchCreatorFeed} from './hub-feed.mjs';

const themes = new Map([
  ['All topics', null],
  ['Minecraft', /minecraft|\bsmp\b/i],
  ['HoYoverse', /honkai|star rail|genshin|\bhsr\b|zenless/i],
  ['Fool’s Stage & MMD', /fool['’]?s stage|\bmmd\b/i],
  ['Reactions', /react(?:ion|ing|s)?\b/i],
  ['Pokémon', /pok[eé]mon|nuzlocke/i]
]);
const formatDate = new Intl.DateTimeFormat(undefined, {month:'short', day:'numeric', year:'numeric'});
const grids = [...document.querySelectorAll('[data-format]')];
const status = document.querySelector('#archive-status');
const refresh = document.querySelector('#refresh-archive');
let activeTopic = 'All topics', entries = [], lastSignature;

function entry(video, feed) {
  const snippet = video.snippet;
  if (!snippet || !/^[\w-]{11}$/.test(video.id) || video.status?.privacyStatus !== 'public') return null;
  const stream = video.liveStreamingDetails;
  const isStream = Boolean(stream || ['live','upcoming'].includes(snippet.liveBroadcastContent));
  const keywords = [snippet.title, ...(snippet.tags || [])].join(' ');
  const isShort = /#shorts?\b/i.test(snippet.title + ' ' + (snippet.description || '')) ||
    (snippet.tags || []).some(tag => /^shorts?$/i.test(tag));
  const format = isStream ? 'streams' : isShort ? 'shorts' : 'videos';
  const live = Boolean(feed.freshness?.liveFresh && feed.live?.id === video.id &&
    stream?.actualStartTime && !stream.actualEndTime && snippet.liveBroadcastContent === 'live');
  const scheduled = !stream?.actualStartTime && snippet.liveBroadcastContent === 'upcoming';
  const date = stream?.actualStartTime || (scheduled && stream?.scheduledStartTime) || snippet.publishedAt;
  return {id:video.id, title:snippet.title, keywords, date, format, live,
    label:live ? 'LIVE' : scheduled ? 'Scheduled' : stream?.actualEndTime ? 'Replay' :
      isStream ? 'Stream' : isShort ? 'Short' : 'Video',
    thumbnail:(snippet.thumbnails?.high || snippet.thumbnails?.medium)?.url};
}

function card(item) {
  const link = document.createElement('a');
  link.className = 'media-card';
  link.href = item.format === 'shorts' ? 'https://www.youtube.com/shorts/'+item.id : 'https://www.youtube.com/watch?v='+item.id;
  const poster = document.createElement('span');
  poster.className = 'poster';
  const img = new Image();
  img.alt = ''; img.loading = 'lazy';
  img.src = /^https:\/\/(?:[\w-]+\.)*ytimg\.com\//i.test(item.thumbnail) ? item.thumbnail : 'https://i.ytimg.com/vi/'+item.id+'/hqdefault.jpg';
  const badge = document.createElement('b');
  badge.textContent = item.label;
  if (item.live) badge.className = 'live';
  poster.append(img, badge);
  const title = document.createElement('strong');
  title.textContent = item.title;
  const date = document.createElement('small');
  if (Number.isFinite(Date.parse(item.date))) date.textContent = formatDate.format(new Date(item.date));
  link.append(poster, title, date);
  return link;
}

function draw() {
  const pattern = themes.get(activeTopic);
  const matches = entries.filter(item => !pattern || pattern.test(item.keywords));
  for (const grid of grids) {
    const items = matches.filter(item => item.format === grid.dataset.format).slice(0,6);
    if (items.length) grid.replaceChildren(...items.map(card));
    else {
      const empty = document.createElement('p');
      empty.textContent = 'No recent matches for this selection.';
      grid.replaceChildren(empty);
    }
  }
}

const filters = document.querySelector('#topics');
for (const topic of themes.keys()) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = topic;
  button.setAttribute('aria-pressed', String(topic === activeTopic));
  button.onclick = () => {
    activeTopic = topic;
    for (const child of filters.children) child.setAttribute('aria-pressed', String(child === button));
    draw();
  };
  filters.append(button);
}

const watcher = watchCreatorFeed({slug:'portalmasterofgames', channelId:'UCdOJvhjojFe3Z0yKeGEIERA'}, ({data,source}) => {
  const section = data.sections?.videos;
  if (!Array.isArray(data.catalog) || section?.status === 'unavailable') {
    status.textContent = 'Recent uploads are unavailable. Browse the channel using the YouTube links below.';
    entries = []; lastSignature = undefined;
    grids.forEach(grid => grid.replaceChildren());
    return;
  }
  const next = data.catalog.map(video => entry(video,data)).filter(Boolean)
    .sort((a,b) => Number(b.live)-Number(a.live) || Date.parse(b.date)-Date.parse(a.date));
  const signature = JSON.stringify(next);
  if (signature !== lastSignature) {entries = next; lastSignature = signature; draw();}
  const saved = source === 'fallback' || section?.status === 'cached';
  const stamp = new Date(section?.updatedAt || data.updatedAt);
  status.textContent = (saved ? 'Saved channel update · ' : 'Channel updated ') + stamp.toLocaleString();
}, () => {status.textContent = 'Recent uploads are unavailable. You can still browse on YouTube.';});
refresh.onclick = async () => {
  refresh.disabled = true;
  try {await watcher.refresh();} finally {refresh.disabled = false;}
};
