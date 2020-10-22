"use strict";

const PlayerManager = (function () {
    const PROGRESS_DISPLAY_UPDATE_INTERVAL = 100;
    const NUM_PLAYERS = 2;
    const INITIAL_VOLUME = 50;
    const IMAGE_URL_REGEX = /\.(jpeg|jpg|png|gif)\b/;

    let playersReady = 0;
    let currentPlayer = null;

    const defaultSongList = [
        "https://soundcloud.com/kieutown/story",
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://soundcloud.com/seradotvaw/seraphine-popstars-kda-cover",
        "https://www.youtube.com/watch?v=5D4gzZNOwU4",
        "https://www.youtube.com/watch?v=HbkR_y_QMnw",
        "https://www.youtube.com/watch?v=uq84RuBo2kg",
        "https://soundcloud.com/kieutown/dont-make-me-wait",
        "https://soundcloud.com/kieutown/no-worries",
        "https://www.youtube.com/watch?v=o37Za-ifxKw&ab_channel=ChrisTheFlautist",
        "https://www.youtube.com/watch?v=NSQZqVsaKWY",
        "https://www.youtube.com/watch?v=BO3XLE_eRPk"
    ];
    
    let playlists = [];
    let currentPlaylistIndex = -1;

    let songIndex = 0;
    let songInfo = [];

    let mute = false;
    let volume = INITIAL_VOLUME;
    let autoPlay = true;
    let loopCurrent = false;     // for now, takes precedent over loopPlaylist
    let loopPlaylist = true;

    /* INIT */
    function init() {
        setEmptySongInfoDisplay();
    }

    function onPlayerReady(name) {
        console.log(name + " Player is ready!");
        if(++playersReady < NUM_PLAYERS) {
            return;
        }

        loadAll();

        Input.createControls();
        setInterval(updateProgressDisplay, PROGRESS_DISPLAY_UPDATE_INTERVAL);
        updateProgressDisplay(true);
    }
    
    function onPlaylistsLoaded() {
        if(!isValidPlaylistIndex(currentPlaylistIndex)) {
            setPlaylistIndex(0);
        }
        
        let firstSong = getCurrentPlaylist().songList[0];
        if(firstSong) {
            playSong(firstSong);
        }
        setVolume(INITIAL_VOLUME);
    }
    
    /* EVENTS */
    function onSongFinish() {
        if(loopCurrent) {
            currentPlayer.play();
            return;
        }
        
        if(autoPlay) {
            nextSong();
        }
    }
    
    /* SAVING AND LOADING */
    function saveAll() {
        localStorage.setItem("playlists", JSON.stringify(playlists));
        console.log("Saved.");
    }
    
    function loadAll() {
        if(typeof(Storage) == "undefined") {
            console.log("Failed to locate localStorage");
            return;
        }
        
        let playlistsStr = localStorage.getItem("playlists");
        if(playlistsStr) {
            playlists = JSON.parse(playlistsStr);
            console.log("Playlists loaded successfully.");
            
        } else {
            console.log("No playlists found in localStorage, creating a default list");
            playlists = [];
            createNewPlaylist();
            createDefaultPlaylistRecursive(0);
        }
        
        let currentIndexStr = localStorage.getItem("currentPlaylistIndex");
        if(currentIndexStr) {
            currentPlaylistIndex = parseInt(currentIndexStr);
        } else {
            currentPlaylistIndex = 0;
        }
        
        onPlaylistsLoaded();
    }
    
    function onDefaultPlaylistLoad() {
        console.log("Created default playlist!");
        saveAll();
        onPlaylistsLoaded();
    }

    function createDefaultPlaylistRecursive(index) {
        if(index >= defaultSongList.length) {
            onDefaultPlaylistLoad();
            return;
        }
        let songURL = defaultSongList[index];
        if(Search.isValidSoundCloudURL(songURL)) {
            Search.getSongFromSoundCloudURL(songURL, function (song) {
                addSongToCurrentPlaylist(song, true);
                createDefaultPlaylistRecursive(index + 1);
            });
        } else if(Search.isValidYouTubeURL(songURL)) {
            Search.getSongFromYouTubeURL(songURL, function (song) {
                addSongToCurrentPlaylist(song, true);
                createDefaultPlaylistRecursive(index + 1);
            });
        }
    }
    
    function setPlaylistIndex(index) {
        currentPlaylistIndex = index;
        songIndex = 0;
        localStorage.setItem("currentPlaylistIndex", index);
    }

    /* PLAYLIST EDITOR */
    function createNewPlaylist() {
        let index = playlists.length;
        playlists.push({
            name: "New Playlist",
            image: "",
            songList: []
        });
        currentPlaylistIndex = index;
    }
    
    function addSongToCurrentPlaylist(song, noSave) {
        let playlist = getCurrentPlaylist();
        playlist.songList.push(song);
        if(!noSave) {
            saveAll();
        }
        if(playlist.songList.length === 1) {
            playSong(playlist.songList[0]);
        }
        updatePlaylistProgress();
    }
    
    function isValidPlaylistIndex(index) {
        return playlists.length > 0 && index >= 0 && index < playlists.length;
    }
    
    /* PLAYER CONTROLS */
    function setPlayer(player) {
        if(player === currentPlayer) {
            return;
        }

        if(currentPlayer != null) {
            currentPlayer.pause();
        }
        currentPlayer = player;

        if(playersReady >= NUM_PLAYERS) {
            updateProgressDisplay(true);
        }
    }

    function playSong(song) {
        if(!song) {
            console.log("Invalid song!");
            setProgressDisplay(0, 0);
            setEmptySongInfoDisplay();
            return;
        }

        if(song.type === "YT") {
            setPlayer(YTVideoPlayer);
        } else if(song.type === "SC") {
            setPlayer(SCPlayer);
        } else {
            console.log("Invalid song type!");
            return;
        }

        currentPlayer.loadSongByURL(song.songURL, function () {
            currentPlayer.setVolume(volume);
            currentPlayer.setMute(mute);
        });
        setProgressDisplay(0, 0);
        setSongInfoDisplay(song);
    }

    function nextSong() {
        let songList = getCurrentPlaylist().songList;
        
        if(songIndex + 1 >= songList.length && !loopPlaylist) {
            return;
        }
        
        songIndex = (songIndex + 1) % songList.length;
        playSong(songList[songIndex]);
    }

    function prevSong() {
        let songList = getCurrentPlaylist().songList;
        
        if(songIndex - 1 < 0 && !loopPlaylist) {
            return;
        }
        
        songIndex = (songIndex - 1 + songList.length) % songList.length;
        playSong(songList[songIndex]);
    }

    function setMute(flag) {
        mute = flag;
        if(flag) {
            if(!currentPlayer.isMuted()) {
                currentPlayer.setMute(true);
            }
        } else {
            if(currentPlayer.isMuted()) {
                currentPlayer.setMute(false);
            }
        }
    }

    function setVolume(percent) {
        currentPlayer.setVolume(percent);
        volume = percent;
    }
    
    function setAutoPlay(flag) {
        autoPlay = flag;    
    }
    
    function setLoopCurrent(flag) {
        loopCurrent = flag;     
    }
    
    function setLoopPlaylist(flag) {
        loopPlaylist = flag;
    }
    
    function attemptRemoveCurrentSong() {
        Input.createConfirmDialog("Are you sure you want to remove this song?",
            "It will be deleted from this playlist forever (a very long time!)",
            removeCurrentSong,
            function() {},
        );
    }
    
    function removeCurrentSong() {
        currentPlayer.pause();
        let songList = getCurrentPlaylist().songList;
        songList.splice(songIndex, 1);
        let n = songList.length;
        
        if(n === 0) {
            // playlist is empty
            songIndex = 0;
        } else if(songIndex >= n && songIndex - 1 < n && songIndex - 1 >= 0) {
            // nothing ahead of song, go to previous
            songIndex = songIndex - 1;
        }
        // otherwise, do nothing - there is a valid song ahead of this song
        saveAll();
        playSong(songList[songIndex]);
        updatePlaylistProgress();
    }

    /* GUI */
    function setSongInfoDisplay(song) {
        let songTitle = $(".song-title-container").empty();
        let songAuthor = $(".song-author-container").empty();

        let imageURL = song.image;
        if(imageURL && imageURL.match(IMAGE_URL_REGEX)) {
            $(".song-cover-art").attr("src", song.image);
            $(".song-cover-art").addClass("visible");
        } else {
            $(".song-cover-art").removeClass("visible");
        }
        //let url = song.songURL;
        $("<a>").attr("href", song.songURL)
            .text(song.name)
            .attr("target", "_blank")
            .click(function () {
                // when clicked, pauses song to prevent overlap
                currentPlayer.pause();
            })
            .appendTo(songTitle);
        $("<span>").text("by ")
            .appendTo(songAuthor);


        $("<a>").attr("href", song.authorURL)
            .text(song.author)
            .attr("target", "_blank")
            .appendTo(songAuthor);

        let source = "Unknown";
        if(song.type === "YT") {
            source = "YouTube";
        } else if(song.type = "SC") {
            source = "SoundCloud";
        }
        $("<span>").text(" (" + source + ")")
            .appendTo(songAuthor);
            
        updatePlaylistProgress();
    }
    
    function setEmptySongInfoDisplay() {
        let songTitle = $(".song-title-container").empty();
        let songAuthor = $(".song-author-container").empty();
        
        $(".song-cover-art").removeClass("visible");
        $("<div>").text("No song currently playing.").appendTo(songTitle);
        setProgressDisplay(0, 0);
    }
    
    function updatePlaylistProgress() {
        let index = songIndex + 1;
        let size = getCurrentPlaylist().songList.length;
        if(!size) {
            index = 0;
            size = 0;
        }
        $(".playlist-progress").text(index + " / " + size);
    }

    function setProgressDisplay(percent, duration) {
        if(isNaN(percent)) {
            return;
        }

        if(duration == null) {
            currentPlayer.getDuration(function (duration) {
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

        currentPlayer.isPaused(function (isPaused) {
            if(isPaused && !force) {
                return;
            }
            currentPlayer.getCurrentTime(function (time) {
                currentPlayer.getDuration(function (duration) {
                    setProgressDisplay((time / duration * 100).toFixed(2), duration);
                });
            });
        });
    }

    /* ACCESSORS */
    function getPlayer() {
        return currentPlayer;
    }

    function getSongsInfo() {
        return songInfo;
    }

    function isMuted() {
        return mute;
    }
    
    function getVolume() {
        return volume;
    }
    
    function getPlaylists() {
        return playlists;
    }
    
    function getCurrentPlaylist() {
        let n = playlists.length;
        if(n == 0 || currentPlaylistIndex < 0 || currentPlaylistIndex >= n) {
            return null;
        }

        return playlists[currentPlaylistIndex];
    }
    
    function getCurrentSong() {
        let song = getCurrentPlaylist().songList[songIndex];
        return song;
    }

    return {
        init,
        onPlayerReady,
        onSongFinish,
        
        addSongToCurrentPlaylist,

        setPlayer,
        playSong,
        nextSong,
        prevSong,
        setMute,
        setVolume,
        setAutoPlay,
        setLoopCurrent,
        setLoopPlaylist,
        attemptRemoveCurrentSong,

        setProgressDisplay,
        getPlayer,
        getSongsInfo,
        isMuted,
        getVolume,
        getPlaylists,
        getCurrentPlaylist,
        getCurrentSong
    };
})();
const PM = PlayerManager;

$(function () {
    YTVideoPlayer.init();
    SCPlayer.init();
    PM.init();
    PM.setPlayer(YTVideoPlayer);
    Search.init();

    console.log("Document loaded!");
});