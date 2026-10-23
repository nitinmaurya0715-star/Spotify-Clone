const intro = document.getElementById('intro');
const website = document.getElementById('website');
const music = document.getElementById('vibeMusic');
const menu = document.getElementById('menuOverlay');
const menuToggle = document.getElementById('menuToggle');
const soundToggle = document.getElementById('soundToggle');
const frame = document.getElementById('musicFrame');
const playerScreen = document.getElementById('playerScreen');
let noticeTimer;
function notify(message) {
  const status = document.getElementById('siteStatus');
  status.textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { status.textContent = ''; }, 4000);
}
function updateSound() {
  const on = !music.paused && !music.muted;
  document.getElementById('soundState').textContent = on ? 'ON' : 'OFF';
  soundToggle.setAttribute('aria-pressed', String(on));
}
async function setSound(on) {
  if (!on) { music.pause(); updateSound(); return; }
  music.volume = 0.35;
  try { await music.play(); } catch { notify('Sound could not start. Try the Sound button again.'); }
  updateSound();
}
function enterWebsite(withSound) {
  intro.hidden = true;
  website.hidden = false;
  website.inert = false;
  website.classList.add('ready');
  setSound(withSound);
  window.scrollTo(0, 0);
  document.getElementById('heading').focus({preventScroll:true});
}
function setMenu(open) {
  menu.hidden = !open;
  menu.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  document.querySelector('.hero').inert = open;
  document.getElementById('about').inert = open;
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) document.getElementById('closeMenu').focus();
}
document.getElementById('enterButton').onclick = () => enterWebsite(true);
document.getElementById('skipButton').onclick = () => enterWebsite(false);
soundToggle.onclick = () => setSound(music.paused);
music.addEventListener('play', updateSound);
music.addEventListener('pause', updateSound);
music.addEventListener('error', () => notify('The supplied MP3 could not be loaded. Check assets/theme.mp3.'));
menuToggle.onclick = () => setMenu(true);
document.getElementById('closeMenu').onclick = () => { setMenu(false); menuToggle.focus(); };
menu.querySelectorAll('a').forEach(link => link.onclick = () => setMenu(false));
document.getElementById('backIntro').onclick = () => {
  setMenu(false); setSound(false); website.hidden = true; website.inert = true;
  intro.hidden = false; window.scrollTo(0,0); document.getElementById('enterButton').focus();
};
document.querySelectorAll('.open-player').forEach(button => button.onclick = () => {
  setMenu(false); setSound(false); website.hidden = true; website.inert = true;
  playerScreen.hidden = false;
  if (!frame.getAttribute('src')) frame.src = frame.dataset.src;
  frame.hidden = false; document.getElementById('backHome').focus();
});
document.getElementById('backHome').onclick = () => {
  frame.contentWindow?.postMessage('vibe:pause', '*');
  playerScreen.hidden = true; website.hidden = false; website.inert = false;
  document.querySelector('.explore-link').focus();
};
document.addEventListener('keydown', event => {
  if (menu.hidden) return;
  if (event.key === 'Escape') { setMenu(false); menuToggle.focus(); }
  if (event.key === 'Tab') {
    const controls = [...menu.querySelectorAll('a,button')];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
const dot = document.getElementById('minicircle');
if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
  document.addEventListener('pointermove', event => {
    dot.classList.add('active');
    dot.style.transform = `translate(${event.clientX - 6}px,${event.clientY - 6}px)`;
  });
  document.documentElement.addEventListener('pointerleave', () => dot.classList.remove('active'));
}
