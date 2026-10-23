// VIBE player: the welcome and landing pages are intentionally unchanged.
const $ = id => document.getElementById(id);
const audio = $('audio');
const tracks = initialTracks.map(track => ({...track}));
let current = 0;
let view = 'all';
let shuffled = false;
let toastTimer;
let liked = new Set();
try {
  const saved = JSON.parse(localStorage.getItem('vibe-library-likes') || '[]');
  if (Array.isArray(saved)) liked = new Set(saved.filter(id => typeof id === 'string'));
} catch {}
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));
function time(seconds) {
  return Number.isFinite(seconds) && seconds > 0
    ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
    : '0:00';
}
function notify(message) {
  $('toast').textContent = message;
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4000);
}
function visibleTracks() {
  const query = $('search').value.trim().toLowerCase();
  return tracks.filter(track =>
    (view !== 'liked' || liked.has(track.id)) &&
    (view !== 'local' || track.url) &&
    `${track.title} ${track.artist} ${track.album} ${track.number || ''}`.toLowerCase().includes(query)
  );
}
function coverImage(track, className = '') {
  return track.cover
    ? `<img class="${className}" src="${escapeHTML(track.cover)}" alt="" loading="lazy">`
    : '<span class="fallback-art" aria-hidden="true">♫</span>';
}
function renderCards() {
  $('cards').innerHTML = visibleTracks().map(track => `
    <article class="card ${tracks[current].id === track.id ? 'current-card' : ''}">
      <button class="cover song-cover" data-track="${track.id}"
        aria-label="${track.url ? 'Play' : 'Audio pending for'} ${escapeHTML(track.title)}"
        ${track.url ? '' : 'disabled'}>
        ${coverImage(track)}
        <span class="song-index">${String(track.number || tracks.indexOf(track) + 1).padStart(2, '0')}</span>
        ${track.url ? '<span class="cover-play" aria-hidden="true">▶</span>' : '<span class="pending-badge">Audio pending</span>'}
      </button>
      <h3>${escapeHTML(track.title)}</h3>
      <p>${escapeHTML(track.artist)}</p>
      ${track.url ? '' : '<small class="pending-note">10.mp3 not supplied</small>'}
    </article>
  `).join('');
}
function renderTracks() {
  const list = visibleTracks();
  $('empty').hidden = list.length > 0;
  $('tracks').innerHTML = list.map((track, index) => `
    <tr class="${tracks[current].id === track.id ? 'selected' : ''}">
      <td>${String(index + 1).padStart(2, '0')}</td>
      <td><button class="track-title" data-track="${track.id}"
        aria-label="Play ${escapeHTML(track.title)}" ${track.url ? '' : 'disabled'}>
        <span class="mini-cover">${coverImage(track)}</span>
        <span><strong>${escapeHTML(track.title)}</strong><small>${escapeHTML(track.artist)}</small></span>
      </button></td>
      <td class="album-column">${escapeHTML(track.album)}</td>
      <td>${track.url ? (track.duration ? time(track.duration) : '—') : 'Pending'}</td>
      <td><button class="icon-button ${liked.has(track.id) ? 'active-heart' : ''}"
        data-like="${track.id}" aria-label="${liked.has(track.id) ? 'Unlike' : 'Like'} ${escapeHTML(track.title)}"
        aria-pressed="${liked.has(track.id)}">${liked.has(track.id) ? '♥' : '♡'}</button></td>
    </tr>
  `).join('');
}
function renderLibrary() { renderCards(); renderTracks(); }
function renderCurrent() {
  const track = tracks[current];
  $('nowTitle').textContent = track.title;
  $('nowArtist').textContent = track.artist;
  $('nowCover').innerHTML = coverImage(track);
  $('duration').textContent = time(track.duration);
  $('sourceLabel').textContent = track.url?.startsWith('blob:') ? 'UPLOAD' : 'MP3';
  $('nowLike').textContent = liked.has(track.id) ? '♥' : '♡';
  $('nowLike').classList.toggle('active-heart', liked.has(track.id));
  $('nowLike').setAttribute('aria-pressed', String(liked.has(track.id)));
  renderLibrary();
}
function toggleLike(id) {
  liked.has(id) ? liked.delete(id) : liked.add(id);
  try {
    localStorage.setItem('vibe-library-likes', JSON.stringify([...liked].filter(id => id.startsWith('song-'))));
  } catch {}
  renderCurrent();
}
function setView(nextView) {
  view = nextView;
  document.querySelectorAll('[data-view]').forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('tracksHeading').textContent = {all:'On your wavelength', liked:'Songs you love', local:'Your playable library'}[view];
  $('breadcrumb').textContent = {all:'Discover', liked:'Liked songs', local:'Your library'}[view];
  renderLibrary();
}
async function playCurrent() {
  if (!tracks[current].url) { notify('Audio pending. Add the missing MP3 to this project.'); return; }
  try { await audio.play(); }
  catch (error) {
    if (error.name !== 'AbortError') notify('Playback could not start. Check the music file and press Play again.');
  }
}
function selectTrack(index, autoplay = true) {
  if (index < 0 || !tracks[index]?.url) return;
  audio.pause();
  current = index;
  $('seek').value = 0;
  $('seek').disabled = true;
  $('elapsed').textContent = '0:00';
  audio.src = tracks[current].url;
  audio.load();
  renderCurrent();
  if (autoplay) playCurrent();
}
function step(direction) {
  const queue = visibleTracks().filter(track => track.url);
  if (!queue.length) return;
  const position = queue.findIndex(track => track.id === tracks[current].id);
  let chosen;
  if (shuffled && queue.length > 1) {
    const alternatives = queue.filter(track => track.id !== tracks[current].id);
    chosen = alternatives[Math.floor(Math.random() * alternatives.length)];
  } else {
    chosen = queue[position < 0 ? 0 : (position + direction + queue.length) % queue.length];
  }
  selectTrack(tracks.indexOf(chosen));
}
document.addEventListener('click', event => {
  const viewButton = event.target.closest('[data-view]');
  const trackButton = event.target.closest('[data-track]');
  const likeButton = event.target.closest('[data-like]');
  if (viewButton) setView(viewButton.dataset.view);
  if (trackButton) selectTrack(tracks.findIndex(track => track.id === trackButton.dataset.track));
  if (likeButton) toggleLike(likeButton.dataset.like);
  if (event.target.closest('.upload-trigger')) $('upload').click();
});
$('search').addEventListener('input', renderLibrary);
$('searchNav').onclick = () => $('search').focus();
$('nowLike').onclick = () => toggleLike(tracks[current].id);
$('play').onclick = () => audio.paused ? playCurrent() : audio.pause();
$('next').onclick = () => step(1);
$('previous').onclick = () => {
  if (audio.currentTime > 3) audio.currentTime = 0;
  else step(-1);
};
$('heroPlay').onclick = () => {
  $('search').value = '';
  setView('all');
  selectTrack(tracks.findIndex(track => track.url));
};
$('shuffle').onclick = () => {
  shuffled = !shuffled;
  $('shuffle').classList.toggle('enabled', shuffled);
  $('shuffle').setAttribute('aria-pressed', String(shuffled));
};
$('repeat').onclick = () => {
  audio.loop = !audio.loop;
  $('repeat').classList.toggle('enabled', audio.loop);
  $('repeat').setAttribute('aria-pressed', String(audio.loop));
};
audio.volume = 0.7;
$('volume').oninput = event => { audio.volume = Number(event.target.value); audio.muted = false; };
$('mute').onclick = () => { audio.muted = !audio.muted; };
audio.addEventListener('volumechange', () => {
  const muted = audio.muted || audio.volume === 0;
  $('mute').textContent = muted ? '×' : '♫';
  $('mute').setAttribute('aria-pressed', String(muted));
  $('mute').setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
});
audio.addEventListener('play', () => { $('play').textContent = 'Ⅱ'; $('play').setAttribute('aria-label', 'Pause'); });
audio.addEventListener('pause', () => { $('play').textContent = '▶'; $('play').setAttribute('aria-label', 'Play'); });
audio.addEventListener('loadedmetadata', () => {
  const valid = Number.isFinite(audio.duration) && audio.duration > 0;
  $('seek').disabled = !valid;
  if (valid) { tracks[current].duration = audio.duration; renderCurrent(); }
});
audio.addEventListener('timeupdate', () => {
  $('elapsed').textContent = time(audio.currentTime);
  $('seek').value = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration * 100 : 0;
});
$('seek').oninput = event => {
  if (Number.isFinite(audio.duration)) audio.currentTime = Number(event.target.value) / 100 * audio.duration;
};
audio.addEventListener('ended', () => step(1));
audio.addEventListener('error', () => notify('This music file could not be played. Check assets/music and try again.'));
$('upload').addEventListener('change', event => {
  const files = [...event.target.files].filter(file => file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|opus|webm)$/i.test(file.name));
  if (!files.length) { notify('Choose an audio file such as MP3, WAV, or OGG.'); return; }
  const first = tracks.length;
  files.forEach(file => tracks.push({
    id:`local-${tracks.length}`, title:file.name.replace(/\.[^.]+$/, ''),
    artist:'Your upload', album:'Local uploads', duration:0,
    number:tracks.length + 1, url:URL.createObjectURL(file)
  }));
  $('search').value = '';
  setView('local');
  selectTrack(first, false);
  notify(`${files.length} audio file${files.length === 1 ? '' : 's'} added. Press Play to listen.`);
  event.target.value = '';
});
document.addEventListener('keydown', event => {
  if (event.code !== 'Space' || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input,button,textarea,a,[contenteditable]')) return;
  event.preventDefault(); $('play').click();
});
window.addEventListener('message', event => { if (event.source === parent && event.data === 'vibe:pause') audio.pause(); });
window.addEventListener('beforeunload', () => tracks.forEach(track => { if (track.url?.startsWith('blob:')) URL.revokeObjectURL(track.url); }));
selectTrack(0, false);
