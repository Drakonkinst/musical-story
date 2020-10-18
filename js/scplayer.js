"use strict";

const SCPlayer = (function() {
    const SCWidget = SCEmbed.Widget;
    let widget;
    
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
        console.log("SC: Player ready!");
        widget.bind(SCWidget.Events.PLAY, function () {
            console.log("Began playing!");
        });
        Input.createSCControls();
    }
    
    function play() {
        console.log("SC: Play command called");
        widget.play();
    }
    
    function pause() {
        widget.pause();
    }
    
    function updateCurrentVideo() {
        widget.load(songList[songIndex], {
            callback: play
        });
    }
    
    function prev() {
        songIndex = (songIndex - 1 + songList.length) % songList.length;
        updateCurrentVideo();
    }

    function next() {
        songIndex = (songIndex + 1) % songList.length;
        updateCurrentVideo();
    }
    
    function checkName() {
        widget.getCurrentSound(function (music) {
            console.log("Now Playing: " + music.title);
            console.log("by " + music.user.permalink + " (" + music.user.full_name + ")");
            console.log(music.description);
            
        });
    }
    
    function getVolume() {
        return widget.getVolume();
    }
    
    function setVolume(percent) {
        widget.setVolume(percent);
    }
    
    return {
        init,
        play,
        pause,
        prev,
        next,
        checkName,
        getVolume,
        setVolume
    };
})();