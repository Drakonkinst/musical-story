"use strict";

const YTVideoPlayer = (function () {
    const MIN_UNMUTE_VOLUME = 5;
    
    let player;
    let currentId = "";

    /* INIT */
    function init() {
        // Loads the IFrame Player API code asynchronously.
        let tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    function initPlayer() {
        //let firstVideoID = extractIdFromURL(songList[songIndex]);
        //setCurrentId(firstVideoID);
        player = new YT.Player("ytplayer", {
            height: "600",
            width: "600",
            videoId: "",
            events: {
                "onReady": onPlayerReady,
                "onStateChange": onPlayerStateChange
            }
        });
    }

    /* EVENTS */
    function onPlayerReady(event) {
        PM.onPlayerReady("YT");
    }

    function onPlayerStateChange(event) {
        // if video starts playing, after 3 seconds, stops the video
        /*
        if(event.data == YT.PlayerState.PLAYING && !done) {
            setTimeout(stopVideo, 3000);
            done = true;
        }*/
        if(event.data === YT.PlayerState.ENDED) {
            PM.onSongFinish();
        }
    }

    /* CONTROLS */
    function setCurrentId(id) {
        currentId = id;
        console.log("Now playing: " + id);
    }

    function cueVideoById(id) {
        setCurrentId(id);
        player.cueVideoById(id);
    }

    function loadVideoById(id) {
        setCurrentId(id);
        player.loadVideoById(id);
    }

    function getCurrentVideoId() {
        return currentId;
    }

    /* PLAYER METHODS */
    function play() {
        player.playVideo();
    }

    function pause() {
        player.pauseVideo();
    }
    
    function loadSongByURL(url, callback) {
        let id = Search.isValidYouTubeURL(url);
        
        if(!id) {
            console.log("Invalid URL!");
            return;
        }
        
        player.loadVideoById(id);
        callback();
    }

    function setVolume(percent) {
        player.setVolume(percent);
    }

    function setMute(flag) {
        if(flag) {
            player.mute();
        } else {
            player.unMute();
            if(PM.getVolume() === 0) {
                PM.setVolume(MIN_UNMUTE_VOLUME);
                Input.setVolumeSlider(MIN_UNMUTE_VOLUME);
            }
        }
    }

    function seekTo(seconds, allowSeekAhead) {
        player.seekTo(seconds, allowSeekAhead);
    }
    
    function setPlaybackSpeed(number) {
        
    }

    function getVolume(callback) {
        if(!player.getVolume) {
            callback(-1);
            return -1;
        }
        let val = player.getVolume();
        
        if(callback) {
            callback(val);
        }
    
        return val;
    }

    function isPaused(callback) {
        let flag = player.getPlayerState() !== YT.PlayerState.PLAYING;
        callback(flag);
        return flag;
    }

    function isMuted() {
        return player.isMuted();
    }

    function getDuration(callback) {
        let duration = player.getDuration();
        callback(duration);
        return duration;
    }

    function getCurrentTime(callback) {
        let time = player.getCurrentTime();
        callback(time);
        return time;
    }

    return {
        init,
        initPlayer,
        getCurrentVideoId,

        play,
        pause,
        loadSongByURL,
        setVolume,
        setMute,
        seekTo,
        setPlaybackSpeed,
        getVolume,
        isPaused,
        isMuted,
        getDuration,
        getCurrentTime
    };
})();

// Creates an <iframe> (and YouTube player) after the API loads.
function onYouTubeIframeAPIReady() {
    YTVideoPlayer.initPlayer();
}