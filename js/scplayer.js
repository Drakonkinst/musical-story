"use strict";

const SCPlayer = (function() {
    const SCWidget = SCEmbed.Widget;
    const MILLISECONDS_TO_SECONDS = 1 / 1000;
    const SECONDS_TO_MILLISECONDS = 1000;
    
    let widget;
    let lastVolume = 0;
    let muted = false;
    
    let songList = [
        "https://soundcloud.com/kieutown/story",
        "https://soundcloud.com/seradotvaw/seraphine-popstars-kda-cover"
    ];
    let songIndex = 0;
    
    function init() {
        widget = SCWidget("scplayer");
        widget.bind(SCWidget.Events.READY, onPlayerReady);
        console.log("Widget loaded!");
        
        //"https://soundcloud.com/kieutown/story"
        getSongDataFromURL("https://soundcloud.com/seradotvaw/seraphine-popstars-kda-cover", function(data) {
            let lastIndex = data.title.lastIndexOf(" by ");
            let songTitle = data.title.substring(0, lastIndex);
            let songAuthor = data.title.substring(lastIndex + 4);
            console.log("Title: " + songTitle);
            console.log("Author: " + songAuthor);
            console.log("Song URL: " + data.url);
            console.log("Author URL: " + data.author_url);
            console.log(data);
        });
        
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
    
    function millisecondsToSeconds(milliseconds) {
        return Math.round(milliseconds * MILLISECONDS_TO_SECONDS);
    }
    
    // not sure if this snippet actually works
    function validateURL(url) {
        let pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + //port
            '(\\?[;&amp;a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i');
        return pattern.test(url);
    }
    
    function getSongDataFromURL(url, callback) {
        if(!validateURL(url)) {
            console.log("Error: Bad URL!");
            return;
        }
        $.get("http://soundcloud.com/oembed?format=js&url=" + url + "&iframe=true", function(data) {
            let iFrameData = data.substring(1, data.length - 2);
            let decoded = JSON.parse(iFrameData);
            decoded.url = url;
            if(callback) {
                callback(decoded);
            }
        });
    }
    
    function onPlayerReady() {
        //widget.play();
        PM.onPlayerReady("SC");
        widget.bind(SCWidget.Events.PLAY, function () {
            //console.log("Began playing!");
        });
    }
    
    function updateCurrentVideo() {
        widget.load(songList[songIndex], {
            callback: play
        });
    }
    
    function checkName() {
        widget.getCurrentSound(function (music) {
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
    
    function next() {
        songIndex = (songIndex + 1) % songList.length;
        updateCurrentVideo();
    }
    
    function prev() {
        songIndex = (songIndex - 1 + songList.length) % songList.length;
        updateCurrentVideo();
    }
    
    function setVolume(percent, force) {
        if(!muted || force) {
            widget.setVolume(percent);
        } else {
            lastVolume = percent;
        }
    }
    
    function setMute(flag) {
        if(muted == flag) {
            return;
        }
        
        muted = flag;
        if(flag) {
            getVolume(function(volume) {
                lastVolume = volume;
                setVolume(0, true);
            });
        } else {
            setVolume(lastVolume, true);
        }
    }
    
    function seekTo(seconds, allowSeekAhead) {
        widget.seekTo(seconds * SECONDS_TO_MILLISECONDS);
    }
    
    function getVolume(callback) {
        return widget.getVolume(callback);
    }
    
    function isMuted(callback) {
        callback(muted);
        return muted;
    }
    
    function isPaused(callback) {
        return widget.isPaused(callback);
    }
    
    function getDuration(callback) {
        return widget.getDuration(function(timeMS) {
            callback(millisecondsToSeconds(timeMS));
        });
    }
    
    function getCurrentTime(callback) {
        return widget.getPosition(function(timeMS) {
            callback(millisecondsToSeconds(timeMS));
        });
    }
    
    return {
        init,
        checkName,
        
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