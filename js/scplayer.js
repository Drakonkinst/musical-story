"use strict";

const SCPlayer = (function() {
    const SCWidget = SCEmbed.Widget;
    const MILLISECONDS_TO_SECONDS = 1 / 1000;
    const SECONDS_TO_MILLISECONDS = 1000;
    const MIN_UNMUTE_VOLUME = 5;
    
    let widget;
    let lastVolume = 50;
    let muted = false;
    
    function init() {
        widget = SCWidget("scplayer");
        widget.bind(SCWidget.Events.READY, onPlayerReady);
        console.log("Widget loaded!");
        
        /*
        console.log("Attempting to initialize...");
        SC.initialize({
            client_id: "BVTnmQP4X7xo1VXiYwZTNAM9swaZthcP",
            redirect_uri: "https://drakonkinst.github.io/musical-story/"
        });
        
        console.log("Attempting to connect...");
        SC.connect().then(function() {
            console.log("Connected successfully!");
            
        }).catch(function(err) {
            console.log("Something went wrong!");
        });
        
        SC.get('/tracks', {
            q: 'buskers', license: 'cc-by-sa'
        }).then(function (tracks) {
            console.log(tracks);
        });*/
    }
    
    function onPlayerReady() {
        //widget.play();
        PM.onPlayerReady("SC");
        widget.bind(SCWidget.Events.PLAY, function () {
            // Soundcloud sometimes likes to play when it's not its turn
            // This stops that
            if(PM.getPlayer() !== SCPlayer) {
                //console.log("Caught SC player");
                pause();
            }
        });
        
        widget.bind(SCWidget.Events.FINISH, function() {
            PM.onSongFinish();
        });
    }
    
    function checkName() {
        widget.getCurrentSound(function(music) {
            console.log("Now Playing: " + music.title);
            console.log("by " + music.user.permalink + " (" + music.user.full_name + ")");
            console.log(music.description);

        });
    }
    
    /* PLAYER METHODS */
    function play() {
        console.log("SC: Play command called");
        widget.play();
    }
    
    function pause() {
        widget.pause();
    }
    
    function loadSongByURL(url, callback) {
        widget.load(url, {
            callback: function() {
                callback();
                play();
            }
        });
    }
    
    function setVolume(percent, force) {
        if(!muted || force) {
            widget.setVolume(percent);
            if(!force) {
                lastVolume = percent;
            }
        } else {
            lastVolume = percent;
        }
    }
    
    function setMute(flag) {
        muted = flag;
        if(flag) {
            getVolume(function(volume) {
                lastVolume = volume;
                setVolume(0, true);
            });
        } else {
            if(lastVolume === 0) {
                lastVolume = MIN_UNMUTE_VOLUME;
                PM.setVolume(lastVolume);
                Input.setVolumeSlider(lastVolume);
            }
            setVolume(lastVolume, true);
        }
    }
    
    function seekTo(seconds) {
        widget.seekTo(seconds * SECONDS_TO_MILLISECONDS);
    }
    
    function getVolume(callback) {
        return widget.getVolume(callback);
    }
    
    function isMuted() {
        return muted;
    }
    
    function isPaused(callback) {
        return widget.isPaused(callback);
    }
    
    function getDuration(callback) {
        return widget.getDuration(function(timeMS) {
            callback(timeMS * MILLISECONDS_TO_SECONDS);
        });
    }
    
    function getCurrentTime(callback) {
        return widget.getPosition(function(timeMS) {
            callback(timeMS * MILLISECONDS_TO_SECONDS);
        });
    }
    
    return {
        init,
        checkName,
        
        play,
        pause,
        loadSongByURL,
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