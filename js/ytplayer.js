"use strict";

const YTVideoPlayer = (function () {
    let player;
    let currentId = "";
    
    let songList = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=5D4gzZNOwU4",
        "https://www.youtube.com/watch?v=HbkR_y_QMnw",
        "https://www.youtube.com/watch?v=uq84RuBo2kg"
        //"https://www.youtube.com/watch?v=yCNUP2NAt-A"
    ];
    let songIndex = 0;

    /* HELPERS */
    function extractIdFromURL(url) {
        let index = url.lastIndexOf("v=");
        let id = url.substring(index + 2);
        return id;
    }
    
    function updateCurrentVideo() {
        loadVideoById(extractIdFromURL(songList[songIndex]));
        //cueVideoById(extractIdFromURL(songList[songIndex]));
    }
    
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
        
        getSongDataFromURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ", function() {
            console.log("Did it work?");
        });
    }
    
    function initPlayer() {
        let firstVideoID = extractIdFromURL(songList[songIndex]);
        setCurrentId(firstVideoID);
        player = new YT.Player("ytplayer", {
            height: "0",
            width: "0",
            videoId: firstVideoID,
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
    
    function getVideoProgress() {
        let time = player.getCurrentTime();

        // would probably want to calculate duration of the video only once
        let duration = player.getDuration();
        return (time / duration * 100).toFixed(2);
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
    
    function next() {
        songIndex = (songIndex + 1) % songList.length;
        updateCurrentVideo();
    }
    
    function prev() {
        songIndex = (songIndex - 1 + songList.length) % songList.length;
        updateCurrentVideo();
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
        let flag = player.getPlayerState() !== 1;
        callback(flag);
        return flag;
    }
    
    function isMuted(callback) {
        let flag = player.isMuted();
        callback(flag);
        return flag;
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
        next,
        prev,
        setVolume,
        setMute,
        seekTo,
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