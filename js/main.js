"use strict";

const PlayerManager = (function() {
    const PROGRESS_DISPLAY_UPDATE_INTERVAL = 100;
    const NUM_PLAYERS = 2;
    let playersReady = 0;
    let currentPlayer = null;
    
    function init() {
        
    }
    
    function onPlayerReady(name) {
        console.log(name + " Player is ready!");
        if(++playersReady < NUM_PLAYERS) {
            return;
        }
        
        Input.createControls();
        setInterval(updateProgressDisplay, PROGRESS_DISPLAY_UPDATE_INTERVAL);
        updateProgressDisplay(true);
    }
    
    function getPlayer() {
        return currentPlayer;
    }
    
    function setPlayer(player) {
        if(currentPlayer != null) {
            currentPlayer.pause();
        }
        currentPlayer = player;
        if(playersReady >= NUM_PLAYERS) {
            updateProgressDisplay(true);
        }
    }
    
    function setProgressDisplay(percent, duration) {
        if(isNaN(percent)) {
            return;
        }

        if(duration == null) {
            currentPlayer.getDuration(function(duration) {
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
        
        currentPlayer.isPaused(function(isPaused) {
            if(isPaused && !force) {
                return;
            }
            currentPlayer.getCurrentTime(function(time) {
                currentPlayer.getDuration(function(duration) {
                    setProgressDisplay((time / duration * 100).toFixed(2), duration);
                });
            });
        });
        
    }
    
    return {
        init,
        onPlayerReady,
        getPlayer,
        setPlayer,
        setProgressDisplay,
    };
})();
const PM = PlayerManager;



$(function () {
    YTVideoPlayer.init();
    SCPlayer.init();
    PM.init();
    
    PM.setPlayer(YTVideoPlayer);    
    
    console.log("Document loaded!");
});