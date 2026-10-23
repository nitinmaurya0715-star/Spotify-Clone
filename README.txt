VIBE — YOUR SONGS + COVER ART

RUN
Extract the ZIP completely. Open index.html in your browser, or use VS Code Live Server.
Enter the site, then choose Open music player.

INCLUDED
- Original supplied welcome and home screens (index.html/style.css/script.js unchanged).
- 13 supplied JPG/WebP covers, displayed as numbered song cards.
- 12 supplied playable MP3 files, plus the existing landing-page theme.
- Cover thumbnails in the track list and the bottom now-playing bar.
- Click-to-play cards, next/previous, shuffle, repeat, seek, volume, search, favorites and uploads.
- Separate HTML, CSS and JavaScript files; no external player dependency.

NUMBER PAIRING
assets/covers/1.jpg -> assets/music/1.mp3, and so on through 9, plus 11, 12 and 13.
10.jpg is displayed but disabled with Audio pending because 10.mp3 was not supplied.
No substitute audio was assigned to cover 10.

SOURCE FILE NOTES
5.mp3, 6.mp3 and 9.mp3 are byte-identical copies of the same supplied audio.
3.mp3 and 7.mp3 are byte-identical copies of the same supplied audio.
These have been kept as separate numbered cards, exactly as supplied.
The embedded title of audio 5/6/9 is Heroes Tonight, which differs from text on some covers.
Where present, audio tags were used for titles/artists. For untagged audio, readable cover
labels were used provisionally; card 8 is named Track 08 because its title was not identified.
The cover labels do not verify the identity of untagged audio. Edit library.js to correct names
or number-to-cover pairing if desired.

FILES
index.html, style.css, script.js: welcome and landing page.
player.html, player.css, player.js: player interface and controls.
library.js: editable song names, cover paths, audio paths and durations.
assets/covers/: supplied images, unmodified.
assets/music/: supplied MP3 files, unmodified.
assets/: original fonts, logo and theme.mp3.

ADD THE MISSING SONG LATER
Place 10.mp3 in assets/music/. In library.js, locate song-10 and set:
  "url": "assets/music/10.mp3"
It will become playable; its duration is detected when selected.

Uploaded tracks last only for the current session. Favorites for numbered songs are stored
locally when the browser permits localStorage. This is a local music player, not a Spotify
streaming/API connection. No additional songs or artwork have been downloaded.

THREE NEW TRACKS
11: 2 Khatole — Masoom Sharma
12: Tough — Krish Rao
13: Kalyani (Remix) — ARJN, KDS, FIFTY4, Shreya Ghoshal
Kalyani.mpeg was inspected and is actually an MP3 audio container with attached
cover art. It was copied byte-for-byte as 13.mp3; no quality-loss conversion.
The existing welcome/home design and previous tracks are unchanged.
