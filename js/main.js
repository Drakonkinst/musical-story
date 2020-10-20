"use strict";

const PlayerManager = (function () {
    const PROGRESS_DISPLAY_UPDATE_INTERVAL = 100;
    const NUM_PLAYERS = 2;


    let playersReady = 0;
    let currentPlayer = null;

    let songList = [
        "https://soundcloud.com/kieutown/story",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://soundcloud.com/seradotvaw/seraphine-popstars-kda-cover",
        "https://www.youtube.com/watch?v=5D4gzZNOwU4",
        "https://www.youtube.com/watch?v=HbkR_y_QMnw",
        "https://www.youtube.com/watch?v=uq84RuBo2kg"
    ];

    let songIndex = 0;
    let songInfo = [];

    let mute = false;
    let volume = 52;

    /* INIT */
    function init() {

    }

    function onPlayerReady(name) {
        console.log(name + " Player is ready!");
        if(++playersReady < NUM_PLAYERS) {
            return;
        }

        createSongInfoRecursive(0);

        Input.createControls();
        setInterval(updateProgressDisplay, PROGRESS_DISPLAY_UPDATE_INTERVAL);
        updateProgressDisplay(true);
    }

    function onSongsLoad() {
        playSong(songInfo[0]);
    }

    function createSongInfoRecursive(index) {
        if(index >= songList.length) {
            console.log("All songs loaded!");
            onSongsLoad();
            return;
        }
        let songURL = songList[index];
        if(Search.isValidSoundCloudURL(songURL)) {
            Search.getSongFromSoundCloudURL(songURL, function (song) {
                songInfo.push(song);
                createSongInfoRecursive(index + 1);
            });
        } else if(Search.isValidYouTubeURL(songURL)) {
            Search.getSongFromYouTubeURL(songURL, function (song) {
                songInfo.push(song);
                createSongInfoRecursive(index + 1);
            });
        }
    }

    /* PLAYER CONTROLS */
    function setPlayer(player) {
        if(player === currentPlayer) {
            return;
        }

        if(currentPlayer != null) {
            currentPlayer.pause();
        }
        currentPlayer = player;

        if(playersReady >= NUM_PLAYERS) {
            updateProgressDisplay(true);
        }
    }

    function playSong(song) {
        if(!song) {
            console.log("Invalid song!");
        }

        if(song.type === "YT") {
            setPlayer(YTVideoPlayer);
        } else if(song.type === "SC") {
            setPlayer(SCPlayer);
        } else {
            console.log("Invalid song type!");
            return;
        }

        currentPlayer.loadSongByURL(song.songURL, function () {
            currentPlayer.setVolume(volume);
            currentPlayer.setMute(mute);
        });
        setSongInfoDisplay(song);
    }

    function nextSong() {
        songIndex = (songIndex + 1) % songInfo.length;
        playSong(songInfo[songIndex]);
    }

    function prevSong() {
        songIndex = (songIndex - 1 + songInfo.length) % songInfo.length;
        playSong(songInfo[songIndex]);
    }

    function setMute(flag) {
        mute = flag;
        if(flag) {
            if(!currentPlayer.isMuted()) {
                currentPlayer.setMute(true);
            }
        } else {
            if(currentPlayer.isMuted()) {
                currentPlayer.setMute(false);
            }
        }
    }

    function setVolume(percent) {
        currentPlayer.setVolume(percent);
        volume = percent;
    }

    /* GUI */
    function setSongInfoDisplay(song) {
        let songTitle = $(".song-title-container").empty();
        let songAuthor = $(".song-author-container").empty();

        //let url = song.songURL;
        $("<a>").attr("href", song.songURL)
            .text(song.name)
            .attr("target", "_blank")
            .click(function () {
                // when clicked, pauses song to prevent overlap
                currentPlayer.pause();
            })
            .appendTo(songTitle);
        $("<span>").text("by ")
            .appendTo(songAuthor);


        $("<a>").attr("href", song.authorURL)
            .text(song.author)
            .attr("target", "_blank")
            .appendTo(songAuthor);

        let source = "Unknown";
        if(song.type === "YT") {
            source = "YouTube";
        } else if(song.type = "SC") {
            source = "SoundCloud";
        }
        $("<span>").text(" (" + source + ")")
            .appendTo(songAuthor);
    }

    function setProgressDisplay(percent, duration) {
        if(isNaN(percent)) {
            return;
        }

        if(duration == null) {
            currentPlayer.getDuration(function (duration) {
                setProgressDisplay(percent, duration);
            });
            return;
        }

        let seconds = percent * duration / 100;
        //$(".percent-display").text(parseFloat(percent).toFixed(2) + "%");

        $(".progress").text(Utils.secondsToTimeStr(seconds) + " / " + Utils.secondsToTimeStr(duration));
        $(".progress-bar").css("width", percent + "%");
    }

    function updateProgressDisplay(force) {
        if(Input.getDragTask() === "progress") {
            return;
        }

        currentPlayer.isPaused(function (isPaused) {
            if(isPaused && !force) {
                return;
            }
            currentPlayer.getCurrentTime(function (time) {
                currentPlayer.getDuration(function (duration) {
                    setProgressDisplay((time / duration * 100).toFixed(2), duration);
                });
            });
        });
    }

    /* ACCESSORS */
    function getPlayer() {
        return currentPlayer;
    }

    function getSongsInfo() {
        return songInfo;
    }

    function isMuted() {
        return mute;
    }
    
    function getVolume() {
        return volume;
    }

    return {
        init,
        onPlayerReady,

        setPlayer,
        playSong,
        nextSong,
        prevSong,
        setMute,
        setVolume,

        setProgressDisplay,
        getPlayer,
        getSongsInfo,
        isMuted,
        getVolume
    };
})();
const PM = PlayerManager;

$(function () {
    YTVideoPlayer.init();
    SCPlayer.init();
    PM.init();
    PM.setPlayer(YTVideoPlayer);
    Search.init();

    console.log("Document loaded!");
});