"use strict"

// API: https://developers.google.com/youtube/iframe_api_reference
const YTVideoPlayer = (() => {
    const MIN_UNMUTE_VOLUME = 5;
    const PLAYER_STATE_NULL = -2;
    
    return class YTVideoPlayer {
        constructor(playerManager) {
            this.manager = playerManager;
            this.player = null;
            this.lastState = PLAYER_STATE_NULL;
        }

        /* INIT */

        // Asynchronous function that loads IFrame Player API
        init() {
            let tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            let firstScriptTag = document.getElementsByTagName("script")[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        initPlayer() {
            let self = this;
            this.player = new YTVideoPlayer.Player("ytplayer", {
                height: "600",
                width: "600",
                videoId: "",
                events: {
                    "onReady": self.onPlayerReady,
                    "onStateChange": self.onPlayerStateChange
                }
            });
        }

        /* EVENTS */
        
        onPlayerReady(event) {
            this.manager.onPlayerReady("YT");
        }
        
        onPlayerStateChange(event) {
            let currentState = event.data;
            
            if(currentState === YT.PlayerState.ENDED) {
                this.manager.onSongFinish();
            }
            
            if(currentState === YT.PlayerState.PLAYING
                    && lastState === YT.PlayerState.BUFFERING) {
                this.manager.onSongReady();
            }
            
            this.lastState = currentState;
        }
        
        /* PLAYER METHODS */
        
        play() {
            this.player.playVideo();
        }
        
        pause() {
            this.player.pauseVideo();
        }
        
        loadSongByURL(url) {
            let id = Search.isValidYouTubeVideoURL(url);
            
            if(!id) {
                console.log("Invalid url: " + url);
                return;
            }
            
            this.player.loadVideoById(id);
        }
        
        setVolume(percent) {
            this.player.setVolume(percent);
        }
        
        setMute(flag) {
            if(flag) {
                this.player.mute();
            } else {
                this.player.unMute();
                if(this.manager.getVolume() === 0) {
                    this.manager.setVolume(MIN_UNMUTE_VOLUME);
                    Input.setVolumeSlider(MIN_UNMUTE_VOLUME);
                }
            }
        }
        
        seekTo(seconds, allowSeekAhead) {
            this.player.seekTo(seconds, allowSeekAhead);
        }
        
        setPlaybackSpeed(number) {
            this.player.setPlaybackSpeed(number);
        }
        
        getVolume(callback) {
            if(!this.player.getVolume) {
                if(callback) {
                    callback(-1);
                }
                return -1;
            }

            let val = this.player.getVolume();
            if(callback) {
                callback(val);
            }
            return val;
        }
        
        isPaused(callback) {
            let flag = this.player.getPlayerState() !== YT.PlayerState.PLAYING;
            
            if(callback) {
                callback(flag);
            }
            
            return flag;
        }
        
        isMuted() {
            return this.player.isMuted();
        }
        
        getDuration(callback) {
            let duration = this.player.getDuration();
            
            if(callback) {
                callback(duration);
            }
            
            return duration;
        }
        
        getCurrentTime(callback) {
            let time = player.getCurrentTime();
            
            if(callback) {
                callback(time);
            }
            
            return time;
        }
    };
})();

// Creates an <iframe> (and YouTube player) after the API loads.
// function onYouTubeIframeAPIReady() {
//     YTVideoPlayer.initPlayer();
// }