"use strict";

const SCPlayer = (function() {
    const SCWidget = SCEmbed.Widget;
    const MILLISECONDS_TO_SECONDS = 1 / 1000;
    const SECONDS_TO_MILLISECONDS = 1000;
    const MIN_UNMUTE_VOLUME = 5;
    
    let widget;
    let lastVolume = 50;
    let muted = false;
    
    /* INIT */
    function init() {
        widget = SCWidget("scplayer");
        widget.bind(SCWidget.Events.READY, onPlayerReady);
        console.log("Widget loaded!");
    }
    
    function onPlayerReady() {
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
        
        PM.onPlayerReady("SC");
    }
    
    /* PLAYER METHODS */
    function play() {
        widget.play();
    }
    
    function pause() {
        widget.pause();
    }
    
    function loadSongByURL(url) {
        widget.load(url, {
            callback: function() {
                PM.onSongReady();
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
        if(callback) {
            widget.getVolume(callback);
        }
        
    }
    
    function isMuted() {
        return muted;
    }
    
    function isPaused(callback) {
        if(callback) {
            return widget.isPaused(callback);
        }
    }
    
    function getDuration(callback) {
        return widget.getDuration(function(timeMS) {
            if(callback) {
                callback(timeMS * MILLISECONDS_TO_SECONDS);
            }
        });
    }
    
    function getCurrentTime(callback) {
        return widget.getPosition(function(timeMS) {
            if(callback) {
                callback(timeMS * MILLISECONDS_TO_SECONDS);
            }
        });
    }
    
    return {
        init,
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