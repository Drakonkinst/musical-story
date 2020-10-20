"use strict";

const YTVideoPlayer = (function () {
    let player;
    let currentId = "";

    /* HELPERS */
    function getSongDataFromURL(url, callback) {
        console.log("Attempt to request data from YouTube");
        $.get("http://www.youtube.com/oembed?url=" + url + "&format=json", function (data) {
            console.log(data);
            /*
            let iFrameData = data.substring(1, data.length - 2);
            let decoded = JSON.parse(iFrameData);
            decoded.url = url;
            if(callback) {
                callback(decoded);
            }*/
        });
    }

    /* INIT */
    function init() {
        // Loads the IFrame Player API code asynchronously.
        let tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        getSongDataFromURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ", function () {
            console.log("Did it work?");
        });
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
        id = Search.isValidYouTubeURL(url);
        
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
        callback(val);
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