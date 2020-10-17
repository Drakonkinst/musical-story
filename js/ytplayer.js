const YTVideoPlayer = (function () {
    let player;
    let done = false;
    let currentId = "";
    
    let songList = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://www.youtube.com/watch?v=5D4gzZNOwU4",
        "https://www.youtube.com/watch?v=HbkR_y_QMnw"
        
    ];
    let songIndex = 0;
    let currentDuration = 0;

    /* HELPERS */
    function extractIdFromURL(url) {
        let index = url.lastIndexOf("v=");
        let id = url.substring(index + 2);
        return id;
    }
    
    function secondsToTimeStr(seconds) {
        seconds = ~~seconds;
        let hours = ~~(seconds / (60 * 60));
        seconds %= (60 * 60);
        let minutes = ~~(seconds / 60);
        seconds %= 60;
        
        let str = "";
        const zeroes = "00";
        if(hours > 0) {
            str += hours + ":";
        }
        str += minutes + ":" + (zeroes + seconds).slice(-2);
        return str;
    }
    
    function updateCurrentVideo() {
        loadVideoById(extractIdFromURL(songList[songIndex]));
        //cueVideoById(extractIdFromURL(songList[songIndex]));
        console.log(secondsToTimeStr(player.getDuration()));
    }
    
    /* INIT */
    function init() {
        // Loads the IFrame Player API code asynchronously.
        let tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        let firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    
    function initPlayer() {
        let firstVideoID = extractIdFromURL(songList[songIndex]);
        setCurrentId(firstVideoID);
        player = new YT.Player("ytplayer", {
            height: "0", //"390",
            width: "0", //"640",
            videoId: firstVideoID,
            //"M7lc1UVf-VE",
            events: {
                "onReady": onPlayerReady,
                "onStateChange": onPlayerStateChange
            }
        });
    }
    
    /* EVENTS */
    function onPlayerReady(event) {
        
        console.log("Player is ready!");

        setInterval(updateDisplay, 100);
        
        setTimeout(play, 500);

        Input.createYTControls();
    }

    function onPlayerStateChange(event) {
        // if video starts playing, after 3 seconds, stops the video
        /*
        if(event.data == YT.PlayerState.PLAYING && !done) {
            setTimeout(stopVideo, 3000);
            done = true;
        }*/
    }
    
    function updateDisplay() {
        if(Input.getDragTask() === "progress") {
            return;
        }
        
        let progress = getVideoProgress();
        setProgressDisplay(progress);
    }
    
    // visual change only
    function setProgressDisplay(progress) {
        if(isNaN(progress)) {
            return;
        }
        
        let percent = progress / 100;
        let seconds = progress * player.getDuration() / 100;
        
        //$(".percent-display").text(parseFloat(progress).toFixed(2) + "%");
        $(".progress").text(secondsToTimeStr(seconds) + " / " + secondsToTimeStr(player.getDuration()));
        $(".progress-bar").css("width", progress + "%");
    }

    /* CONTROLS */
    function play() {
        console.log("Playing!");
        player.playVideo();
    }

    function pause() {
        console.log("Paused!");
        player.pauseVideo();
        stopVideo();
    }
    
    function prev() {
        songIndex = (songIndex - 1 + songList.length) % songList.length;
        updateCurrentVideo();
    }
    
    function next() {
        songIndex = (songIndex + 1) % songList.length;
        updateCurrentVideo();
    }

    function stopVideo() {
        player.stopVideo();
        
    }

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

    function setVolume(percent) {
        player.setVolume(percent);
    }
    
    function setProgress(percent) {
        player.seekTo(percent * player.getDuration());
    }

    /* ACCESSORS */
    function getVolume() {
        if(!player.getVolume) {
            return -1;
        }
        return player.getVolume();
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

    return {
        init,
        initPlayer,
        setProgressDisplay,
        play,
        pause,
        prev,
        next,
        setVolume,
        setProgress,
        getVolume,
        getCurrentVideoId
    };
})();

// Creates an <iframe> (and YouTube player) after the API loads.
onYouTubeIframeAPIReady = YTVideoPlayer.initPlayer;