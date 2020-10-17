"use strict";

const SCPlayer = (function() {
    let widget;
    
    function init() {
        widget = SC.Widget("scplayer");
        widget.bind(SC.Widget.Events.READY, onPlayerReady);
        console.log("Widget loaded!");
    }
    
    function onPlayerReady() {
        //widget.play();
        console.log("SC: Player ready!");
        widget.bind(SC.Widget.Events.PLAY, function () {
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
    
    function prev() {
        
    }
    
    function next() {
        const prefix = "https://api.soundcloud.com/tracks/";
        let songID = 880233430;
        widget.load(prefix + songID);
        widget.bind(SC.Widget.Events.READY, play);
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