const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
 
const PORT = process.env.PORT || 3000;
const root = path.resolve(__dirname);
 
const songs = [
  {id:1,title:'Gehra Hua',artist:'Arijit Singh',album:'Hindi Hits',duration:'5:34',plays:1245000,liked:true},
  {id:2,title:'Barsaat Song',artist:'Banjaare',album:'Rain Vibes',duration:'4:21',plays:845000,liked:false},
  {id:3,title:'Invincible',artist:'DEAF KEV',album:'NCS Classics',duration:'4:33',plays:3041000,liked:false},
  {id:4,title:'My Heart',artist:'Different Heaven & EH!DE',album:'NCS Classics',duration:'4:27',plays:2218000,liked:true},
  {id:5,title:'Heroes Tonight',artist:'Janji feat. Johnning',album:'Workout Boost',duration:'3:28',plays:4133000,liked:true},
  {id:6,title:'Rabba',artist:'Salam-e-Ishq',album:'Desi Mix',duration:'4:50',plays:723000,liked:false},
  {id:7,title:'Sakhiyaan',artist:'Salam-e-Ishq',album:'Desi Mix',duration:'3:54',plays:986000,liked:false},
  {id:8,title:'Bhula Dena',artist:'Salam-e-Ishq',album:'Late Night',duration:'4:00',plays:650000,liked:false},
  {id:9,title:'Tumhari Kasam',artist:'Featured Artist',album:'Love Notes',duration:'3:45',plays:598000,liked:false},
  {id:10,title:'Na Jaana',artist:'Salam-e-Ishq',album:'Desi Mix',duration:'4:12',plays:904000,liked:false}
].map(s => ({ ...s, file: `/songs/${s.id}.mp3`, cover: '/logo.svg' }));
 
let recent = [];
 
// Only these file types are ever served (so server.js, package.json etc. stay private)
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav'
};
const PRIVATE_FILES = new Set(['server.js', 'package.json', 'package-lock.json']);
 
// Built-in logo so /logo.svg and /favicon.ico never 404 when the file is missing
const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#1db954"/><path d="M8 12c5-1.5 11-1 15 1.5M9 16.5c4-1 8.5-.6 12 1.4M10 20.5c3-.8 6-.5 9 1" stroke="#000" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`;
 
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};
 
function json(res, data, code = 200, extra = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...CORS, ...extra });
  res.end(JSON.stringify(data));
}
function text(res, code, msg) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(msg);
}
 
// Streams a file and supports Range requests (needed for seeking and duration in <audio>)
function sendFile(req, res, file, type) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return text(res, 404, 'Not found');
    const size = st.size;
    const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'X-Content-Type-Options': 'nosniff' };
    let start = 0, end = size - 1, code = 200;
 
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m && (m[1] !== '' || m[2] !== '')) {
        if (m[1] === '') {                       // "bytes=-500" = last 500 bytes
          start = Math.max(size - Number(m[2]), 0);
        } else {
          start = Number(m[1]);
          if (m[2] !== '') end = Math.min(Number(m[2]), size - 1);
        }
        if (start > end || start >= size) {
          res.writeHead(416, { 'Content-Range': `bytes */${size}` });
          return res.end();
        }
        code = 206;
        headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      }
    }
 
    headers['Content-Length'] = size === 0 ? 0 : end - start + 1;
    res.writeHead(code, headers);
    if (req.method === 'HEAD' || size === 0) return res.end();
    const stream = fs.createReadStream(file, { start, end });
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  });
}
 
const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');   // don't trust the Host header
  } catch {
    return text(res, 400, 'Bad request');
  }
 
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
 
    /* ---------- API ---------- */
    if (url.pathname === '/api/health') return json(res, { ok: true });
 
    if (url.pathname === '/api/songs') {
      const out = [...songs];
      if (url.searchParams.get('sort') === 'title') out.sort((a, b) => a.title.localeCompare(b.title));
      else out.sort((a, b) => b.plays - a.plays);
      return json(res, out);
    }
 
    if (url.pathname === '/api/search') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      return json(res, songs.filter(s => `${s.title} ${s.artist} ${s.album}`.toLowerCase().includes(q)));
    }
 
    if (url.pathname === '/api/playlists') {
      return json(res, [
        { id: 'daily', name: 'Daily Mix', count: songs.length },
        { id: 'liked', name: 'Liked Songs', count: songs.filter(s => s.liked).length }
      ]);
    }
 
    if (url.pathname === '/api/recent') {
      return json(res, recent.map(id => songs.find(s => s.id === id)).filter(Boolean));
    }
 
    const m = url.pathname.match(/^\/api\/songs\/(\d+)\/(like|play)$/);
    if (m) {
      if (req.method !== 'POST') return json(res, { error: 'Use POST' }, 405, { Allow: 'POST, OPTIONS' });
      const s = songs.find(x => x.id === Number(m[1]));
      if (!s) return json(res, { error: 'Not found' }, 404);
      if (m[2] === 'like') {
        s.liked = !s.liked;
      } else {
        s.plays++;
        recent = [s.id, ...recent.filter(id => id !== s.id)].slice(0, 5);
      }
      return json(res, s);
    }
 
    // Unknown /api routes get a JSON 404 instead of falling through to the file server
    if (url.pathname.startsWith('/api/')) return json(res, { error: 'Not found' }, 404);
 
    /* ---------- Static files ---------- */
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
 
    let rel;
    try { rel = decodeURIComponent(url.pathname); }   // "%20" etc. now resolve to real file names
    catch { return text(res, 400, 'Bad request'); }
    if (rel.includes('\0')) return text(res, 400, 'Bad request');
    if (rel === '/') rel = '/index.html';
 
    const file = path.resolve(root, '.' + rel);
    if (file !== root && !file.startsWith(root + path.sep)) return text(res, 403, 'Forbidden');
 
    const parts = path.relative(root, file).split(path.sep);
    const blocked = parts.some(p => p.startsWith('.') || p === 'node_modules') ||
                    PRIVATE_FILES.has(path.basename(file).toLowerCase());
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext];
 
    if (blocked || !type) return text(res, 404, 'Not found');
 
    fs.access(file, fs.constants.R_OK, err => {
      if (!err) return sendFile(req, res, file, type);
      // Missing logo/favicon: serve the built-in one instead of a 404
      if (rel === '/logo.svg' || rel === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
        return res.end(LOGO);
      }
      text(res, 404, 'Not found');
    });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) text(res, 500, 'Server error');
    else res.end();
  }
});
 
server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use. Try: PORT=3001 node server.js`);
  else console.error(e);
  process.exit(1);
});
 
server.listen(PORT, () => console.log('Open http://localhost:' + PORT));
