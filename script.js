const $ = id => document.getElementById(id);
 
// Inline image so a missing logo.svg / cover can never 404
const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%231db954'/%3E%3C/svg%3E";
 
const TITLES = ['Gehra Hua','Barsaat Song','Invincible','My Heart','Heroes Tonight','Rabba','Sakhiyaan','Bhula Dena','Tumhari Kasam','Na Jaana'];
const fallback = TITLES.map((title, n) => ({
  id: n + 1,
  title,
  artist: n < 2 ? 'Arijit / Banjaare' : 'NCS Artist',
  album: n % 2 === 0 ? 'Daily Mix' : 'Bollywood Mood',
  duration: '3:45',
  plays: 1000000 - (n + 1) * 32000,
  liked: n === 0 || n === 3,
  file: `songs/${n + 1}.mp3`,
  cover: ''
}));
 
let all = [];          // full library (source of truth)
let songs = [];        // what is currently visible (filtered + sorted)
let curId = null;      // id of the current song (not an index, so search/sort can't break it)
let playing = false, timer = null, cur = 0, dur = 225;
let sim = false;       // true = no real audio file, run a simulated timer instead
let counted = false;   // play count is sent once per track, not on every resume
 
const audio = new Audio();
audio.preload = 'none';           // don't request songs/N.mp3 until the user presses play
audio.volume = +$('volumeRange').value || 0.8;
 
/* ---------- helpers ---------- */
async function api(u, o) {
  try {
    const r = await fetch(u, o);
    if (!r.ok) throw Error(r.status);
    return await r.json();
  } catch (e) {
    console.warn('API fallback used:', u, e.message || e);
    return null;
  }
}
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function parseDur(d) {
  if (typeof d === 'number') return d;
  const p = String(d || '').split(':').map(Number);
  if (p.some(isNaN)) return 225;
  return p.length === 2 ? p[0] * 60 + p[1] : (p[0] || 225);
}
function normalize(s, i) {
  return {
    id: s.id ?? i + 1,
    title: s.title ?? s.name ?? 'Untitled',
    artist: s.artist ?? 'Unknown',
    album: s.album ?? '',
    duration: s.duration ?? '3:45',
    plays: +s.plays || 0,
    liked: !!s.liked,
    file: s.file || '',
    cover: s.cover || ''
  };
}
const curSong = () => all.find(s => s.id === curId);
const curIndex = () => songs.findIndex(s => s.id === curId);
 
/* ---------- rendering ---------- */
function render() {
  $('songCount').textContent = songs.length + (songs.length === 1 ? ' song' : ' songs');
  if (!songs.length) {
    $('songsList').innerHTML = '<div class="muted">No songs match your search.</div>';
    return;
  }
  $('songsList').innerHTML = songs.map((s, i) => `
    <div class="song ${s.id === curId ? 'active' : ''}" data-i="${i}">
      <span>${i + 1}</span>
      <div class="title"><div class="cover">♫</div><div><b>${esc(s.title)}</b><div class="artist">${esc(s.artist)}</div></div></div>
      <span class="muted">${esc(s.duration)}</span>
      <span><button class="icon playBtn">${s.id === curId && playing ? '⏸' : '▶'}</button><button class="icon likeBtn ${s.liked ? 'liked' : ''}">${s.liked ? '♥' : '♡'}</button></span>
    </div>`).join('');
}
function applyView() {
  const q = $('searchInput').value.trim().toLowerCase();
  songs = all.filter(s => (s.title + ' ' + s.artist + ' ' + s.album).toLowerCase().includes(q));
  songs.sort($('sortSelect').value === 'title'
    ? (a, b) => a.title.localeCompare(b.title)
    : (a, b) => b.plays - a.plays);
  render();
}
function update() {
  $('currentTime').textContent = fmt(cur);
  $('durationTime').textContent = fmt(dur);
  $('myProgressBar').value = dur ? (cur / dur) * 100 : 0;
}
 
/* ---------- playback ---------- */
function stopTimer() { clearInterval(timer); timer = null; }
function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    cur++;
    if (cur >= dur) { next(); return; }
    update();
  }, 1000);
}
function setSong(s, auto = true) {
  if (!s) return;
  stopTimer();
  audio.pause();
  curId = s.id;
  cur = 0;
  dur = parseDur(s.duration);
  counted = false;
  sim = !s.file;
  if (s.file) audio.src = s.file; else audio.removeAttribute('src');
  $('masterSongName').textContent = s.title;
  $('masterArtist').textContent = s.artist;
  $('currentCover').src = s.cover || ICON;
  playing = false;
  $('masterPlay').textContent = '▶';
  update();
  if (auto) play(); else render();
}
function play() {
  const s = curSong();
  if (!s) return;
  playing = true;
  $('masterPlay').textContent = '⏸';
  if (!counted) { counted = true; api(`/api/songs/${s.id}/play`, { method: 'POST' }); }
  if (sim) startTimer();
  else audio.play().catch(err => {
    if (err.name === 'NotAllowedError') pause();   // browser blocked autoplay
    // any other failure is handled by audio.onerror -> simulated timer
  });
  render();
}
function pause() {
  playing = false;
  $('masterPlay').textContent = '▶';
  stopTimer();
  audio.pause();
  render();
}
function next() {
  if (!songs.length) return;
  setSong(songs[(curIndex() + 1) % songs.length], true);
}
function prev() {
  if (!songs.length) return;
  if (cur > 3) { cur = 0; if (!sim) audio.currentTime = 0; update(); return; }
  const i = curIndex();
  setSong(songs[(i <= 0 ? songs.length : i) - 1], true);
}
 
// Real audio events
audio.onerror = () => {               // songs/N.mp3 missing or unplayable -> simulate
  if (sim) return;
  console.warn('Audio file not found, using simulated playback');
  sim = true;
  if (playing) startTimer();
};
audio.ontimeupdate = () => { if (!sim) { cur = audio.currentTime; update(); } };
audio.onloadedmetadata = () => { if (isFinite(audio.duration)) { dur = audio.duration; update(); } };
audio.onended = () => next();
 
/* ---------- events ---------- */
$('masterPlay').onclick = () => {
  if (!curSong()) { setSong(songs[0], true); return; }
  playing ? pause() : play();
};
$('heroPlay').onclick = () => setSong(songs[0], true);
$('shuffleBtn').onclick = () => {
  if (!songs.length) return;
  let pool = songs.length > 1 ? songs.filter(s => s.id !== curId) : songs;
  setSong(pool[Math.floor(Math.random() * pool.length)], true);
};
$('next').onclick = next;
$('previous').onclick = prev;
$('myProgressBar').oninput = e => {
  cur = (+e.target.value / 100) * dur;
  if (!sim) audio.currentTime = cur;
  update();
};
$('volumeRange').oninput = e => { audio.volume = +e.target.value; };
$('songsList').onclick = e => {
  const row = e.target.closest('.song');
  if (!row) return;
  const s = songs[+row.dataset.i];
  if (!s) return;
  if (e.target.closest('.likeBtn')) {
    s.liked = !s.liked;                                   // optimistic; works offline too
    api(`/api/songs/${s.id}/like`, { method: 'POST' });
    render();
    return;
  }
  if (s.id === curId) { playing ? pause() : play(); return; }
  setSong(s, true);
};
$('searchInput').oninput = applyView;
$('sortSelect').onchange = applyView;
$('currentCover').onerror = function () { this.onerror = null; this.src = ICON; };
 
/* ---------- boot ---------- */
(async () => {
  const data = await api('/api/songs?sort=popular');
  all = (Array.isArray(data) && data.length ? data : fallback).map(normalize);
  applyView();
  setSong(songs[0], false);
})();