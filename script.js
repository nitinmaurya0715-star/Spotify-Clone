console.log("Welcome to Spotify")

//Initialize the variable
let songIndex = 0;
let audioElement = new Audio('songs/1.mp3');
let masterPlay = document.getElementById('masterPlay')
let myProgressBar = document.getElementById('myProgressBar');
let gif = document.getElementById('gif');
let masterSongName = document.getElementById('masterSongName');
let songItem = Array.from(document.getElementsByClassName('songItem'));

let song = [
    {songName: "Gehar Hua - Arijit Singh", filePath: "songs/1.mp3", coversPath: "covers/1.jpg"},
    {songName: "Barsaat Song - Banjaare", filePath: "songs/2.mp3", coversPath: "covers/2.jpg"},
    {songName: "DEAF KEV - Invincible [NCS Release]-320k", filePath: "songs/3.mp3", coversPath: "covers/3.jpg"},
    {songName: "Different Heaven & EH!DE - My Heart [NCS Release]", filePath: "songs/4.mp3", coversPath: "covers/4.jpg"},
    {songName: "Janji-Heroes-tonight-feat-Johnnings-NCS-Release", filePath: "songs/5.mp3", coversPath: "covers/5.jpg"},
    {songName: "Rabba - Salam-e-Isqh", filePath: "songs/6.mp3", coversPath: "covers/6.jpg"}, 
    {songName: "sakhiyaan - Salam-e-Isqh", filePath: "songs/7.mp3", coversPath: "covers/7.jpg"}, 
    {songName: "Bhula Dena - Salam-e-Isqh", filePath: "songs/8.mp3", coversPath: "covers/8.jpg"}, 
    {songName: "Tumhari Kasam ", filePath: "songs/9.mp3", coversPath: "covers/9.jpg"}, 
    {songName: "Na Jaana - Salam-e-Isqh", filePath: "songs/10.mp3", coversPath: "covers/10.jpg"}, 
]

songItem.forEach((element, i) => {
    element.getElementsByTagName("img")[0].src = song[i].coversPath;
    element.getElementsByClassName("songName")[0].innerText = song[i].songName;
})

//Handle Play/Pause click
masterPlay.addEventListener('click', () => {
    if (audioElement.paused || audioElement.currentTime <= 0) {
        audioElement.play();
        masterPlay.classList.remove('fa-circle-play')
        masterPlay.classList.add('fa-circle-pause');
        gif.style.opacity = 1;
    }
    else {
        audioElement.pause();
        masterPlay.classList.remove('fa-circle-pause');
        masterPlay.classList.add('fa-circle-play');
        gif.style.opacity = 0;
    }
})
//listen to Events

audioElement.addEventListener('timeupdate', () => {
    // Update Seekbar
    progress = parseInt((audioElement.currentTime / audioElement.duration) * 100);
    myProgressBar.value = progress;
})

myProgressBar.addEventListener('change', () => {
    audioElement.currentTime = myProgressBar.value * audioElement.duration / 100;
})

// const makeAllPlays = () => {
//     document.addEventListener('click', (e) => {
//         e.target.classList.remove('fa-circle-pause')
//         e.target.classList.add('fa-circle-play')
//     })
// }

// document.addEventListener('click', (e) => {
//     const playBtn = e.target.closest('.songItemPlay');
//     if (playBtn) {
//         console.log("Clicked song play button:", playBtn)
//         makeAllPlays();
//         e.target.classList.remove('fa-circle-play')
//         e.target.classList.add('fa-circle-pause')
//     }
    
// });

// makeAllPlays function update karein
const makeAllPlays = () => {
    Array.from(document.getElementsByClassName('songItemPlay')).forEach((element) => {
        element.classList.remove('fa-circle-pause');
        element.classList.add('fa-circle-play');
    });
};

// Event listener update karein
document.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.songItemPlay');
    if (playBtn) {
        console.log("Clicked song play button:", playBtn);
        makeAllPlays();
        songIndex = parseInt(playBtn.id);
        playBtn.classList.remove('fa-circle-play');
        playBtn.classList.add('fa-circle-pause');
        audioElement.src = `songs/${songIndex + 1}.mp3`;
        masterSongName.innerText = song[songIndex].songName;
        audioElement.currentTime = 0; 
        audioElement.play();
        gif.style.opacity = 1;
        masterPlay.classList.remove('fa-circle-play');
        masterPlay.classList.add('fa-circle-pause');
    }
});

document.getElementById('next').addEventListener('click', () => {
    if (songIndex >= 9) {
        songIndex = 0
    }
    else {
        songIndex += 1;
    }
    audioElement.src = `songs/${songIndex + 1}.mp3`;
     masterSongName.innerText = song[songIndex].songName;
    audioElement.currentTime = 0; 
    audioElement.play();
    masterPlay.classList.remove('fa-circle-play');
    masterPlay.classList.add('fa-circle-pause');
})


document.getElementById('previous').addEventListener('click', () => {
    if (songIndex <= 0) {
        songIndex = 0
    }
    else {
        songIndex -= 1;
    }
    audioElement.src = `songs/${songIndex + 1}.mp3`;
    masterSongName.innerText = song[songIndex].songName;
    audioElement.currentTime = 0; 
    audioElement.play();
    masterPlay.classList.remove('fa-circle-play');
    masterPlay.classList.add('fa-circle-pause');
})