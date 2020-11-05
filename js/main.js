"use strict";

const PlayerManager = (function () {
    const UPDATE_INTERVAL = 100;
    const NUM_PLAYERS = 2;
    const INITIAL_VOLUME = 50;
    const IMAGE_URL_REGEX = /\.(jpeg|jpg|png|gif)\b/;
    const MAX_SONG_DESCRIPTION_LENGTH = 300;
    const MAX_SONG_TITLE_LENGTH = 100;
    const MAX_SONG_AUTHOR_LENGTH = 100;
    const MILLISECONDS_TO_SECONDS = 1 / 1000;

    const LOOP_NONE = 0;
    const LOOP_CURRENT = 1;
    const LOOP_PLAYLIST = 2;
    const LOOP_ANNOTATION = 3;  // if no annotation found, waits till annotation is reached - otherwise, acts like LOOP_NONE

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
    let currentTime = 0;
    let duration = 0;
    let autoPlay = true;
    let loopState = LOOP_NONE;

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
        setInterval(onSongUpdate, UPDATE_INTERVAL);
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
        if(Input.getDragTask() === "progress") {
            return;
        }
        if(loopState === LOOP_CURRENT) {
            currentPlayer.play();
            return;
        }

        if(autoPlay && Input.canChangeSong()) {
            nextSong();
        }
    }

    function onSongUpdate() {
        currentPlayer.getCurrentTime(function(time) {
            let song = getCurrentSong();
            if(song == null) {
                return;
            }
            let currentAnnotation = Annotation.getAnnotationAtTime(song.annotations, time);
            if(currentAnnotation != null && loopState === LOOP_ANNOTATION) {
                let nextTime = time + UPDATE_INTERVAL * MILLISECONDS_TO_SECONDS;
                if(Annotation.getAnnotationAtTime(song.annotations, nextTime) != currentAnnotation || nextTime > duration) {
                    currentPlayer.seekTo(currentAnnotation.start);
                    return;
                }
            }
            
            if(Input.getDragTask() !== "progress") {
                currentTime = time;
            }

            Annotation.viewAnnotationAtTime(song.annotations, currentTime);
            
            // set song link to time, rounded down
            if(song.type === "YT") {
                $(".song-title").attr("href", song.songURL + "&t=" + ~~time);
            } else if(song.type === "SC") {
                $(".song-title").attr("href", song.songURL + "#t=" + ~~time);
            }
        });
        updateProgressDisplay();
    }

    function onSongReady() {
        currentPlayer.setVolume(volume);
        currentPlayer.setMute(mute);
        currentPlayer.getDuration(function (val) {
            duration = val;
            Annotation.onSongChange();
        });
    }

    /* SAVING AND LOADING */
    function saveAll() {
        localStorage.setItem("playlists", Utils.compressData(JSON.stringify(playlists)));
        console.log("Saved.");
    }

    function loadAll() {
        if(typeof (Storage) == "undefined") {
            console.log("Failed to locate localStorage");
            return;
        }

        let compressed = localStorage.getItem("playlists");
        let playlistsStr = Utils.decompressData(compressed);
        if(compressed && compressed.charAt(0) == '[') {
            // for people on old builds with uncompressed data
            localStorage.setItem("playlists", Utils.compressData(compressed));
            playlistsStr = compressed;
        }

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
        updatePlaylistProgress();
        onPlaylistsLoaded();
    }

    function createDefaultPlaylistRecursive(index) {
        if(index >= defaultSongList.length) {
            onDefaultPlaylistLoad();
            return;
        }
        let songURL = defaultSongList[index];
        if(Search.isValidSoundCloudURL(songURL)) {
            Search.fetchSongFromSoundCloudURL(songURL, function (song) {
                addSongToCurrentPlaylist(song, true);
                createDefaultPlaylistRecursive(index + 1);
            });
        } else if(Search.isValidYouTubeVideoURL(songURL)) {
            Search.fetchSongFromYouTubeURL(songURL, function (song) {
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

    function validateSongInfo(song) {
        song.description = Utils.clampString(song.description, MAX_SONG_DESCRIPTION_LENGTH);
        song.author = Utils.clampString(song.author, MAX_SONG_AUTHOR_LENGTH);
        song.name = Utils.clampString(song.name, MAX_SONG_TITLE_LENGTH);
    }

    function addSongToCurrentPlaylist(song, noSave) {
        if(!song) {
            return;
        }

        validateSongInfo(song);
        let playlist = getCurrentPlaylist();
        playlist.songList.push(song);

        if(playlist.songList.length === 1) {
            playSong(playlist.songList[0]);
        }

        if(!noSave) {
            saveAll();
            updatePlaylistProgress();
        }
    }

    function isValidPlaylistIndex(index) {
        return playlists.length > 0 && index >= 0 && index < playlists.length;
    }

    /* SEARCH FUNCTION */
    function searchForVideo() {
        let queryStr = $(".search-bar").val();
        Search.searchForVideo(queryStr);
    }

    function setQueryResponse(msg, isError, isConfirm) {
        isError = isError || false;
        isConfirm = isConfirm || false;
        let el = $(".query-response")
            .toggleClass("error", isError)
            .toggleClass("confirm", isConfirm)
            .text(msg);
    }

    function clearSearchResults() {
        $(".search-results").empty();
    }

    function addSongToSearchResults(song, durationStr) {
        let songEl = $("<div>").addClass("search-result-item").appendTo(".search-results");
        durationStr = durationStr || "";
        if(durationStr.length) {
            durationStr = "[" + durationStr + "]";
        }

        $("<a>").attr("href", song.songURL)
            .attr("target", "_blank")
            .text(song.name)
            .appendTo(songEl);
        $("<span>").text(" (").appendTo(songEl);
        $("<a>").attr("href", song.authorURL)
            .attr("target", "_blank")
            .text(song.author)
            .appendTo(songEl);
        $("<span>").text(") " + durationStr).appendTo(songEl);
        $("<button>").text("Add to Playlist")
            .addClass("search-add-to-playlist")
            .on("click", function () {
                PM.addSongToCurrentPlaylist(song);
                clearSearchResults();
                //$(this).setDisabled(true);
                setQueryResponse("Song added to playlist!", false, true);
            }).appendTo(songEl);
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

        currentPlayer.loadSongByURL(song.songURL);

        // clear stuff until it loads
        Annotation.clearAnnotationBar();
        currentTime = 0;
        duration = 0;
        setProgressDisplay(0, 0);
        setSongInfoDisplay(song);
    }

    function nextSong() {
        let songList = getCurrentPlaylist().songList;

        if(songIndex + 1 >= songList.length && !(loopState !== LOOP_PLAYLIST)) {
            return;
        }

        songIndex = (songIndex + 1) % songList.length;
        playSong(songList[songIndex]);
    }

    function prevSong() {
        let songList = getCurrentPlaylist().songList;

        if(songIndex - 1 < 0 && !(loopState !== LOOP_PLAYLIST)) {
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
    
    function setLoopState(val) {
        loopState = val;
    }
    
    function setCurrentTime(time) {
        currentTime = time;
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
    
    function removeCurrentPlaylist() {
        // TODO remove current, move to new -> should always exist
        console.log("Removing current playlist!");
    }

    function addAnnotation() {
        let song = getCurrentSong();
        if(!song.hasOwnProperty("annotations")) {
            song.annotations = [];
        }

        Annotation.addBlankAnnotationAtTime(song.annotations, currentTime);
        saveAll();
    }

    function removeAnnotation() {
        let song = getCurrentSong();
        if(!song.hasOwnProperty("annotations")) {
            return;
        }

        Annotation.removeAnnotationAtTime(song.annotations, currentTime);
        saveAll();
    }

    function setAnnotationEnd() {
        getCurrentAnnotation(function (annotation, time) {
            if(annotation != null) {
                annotation.end = time;
                Annotation.updateAnnotationDisplay();
                saveAll();
            }
        });
    }

    function getCurrentAnnotation(callback) {
        let song = getCurrentSong();
        if(!song.annotations) {
            callback(null);
            return;
        }
        let annotation = Annotation.getAnnotationAtTime(song.annotations, currentTime);
        if(annotation != null) {
            callback(annotation, currentTime);
        } else {
            callback(null);
        }
    }

    function resetAnnotationEnd() {
        getCurrentAnnotation(function (annotation) {
            if(annotation != null) {
                delete annotation.end;
                Annotation.updateAnnotationDisplay();
                saveAll();
            }
        });
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
            .addClass("song-title")
            .attr("target", "_blank")
            .on("click", function () {
                // when clicked, pauses song to prevent overlap
                currentPlayer.pause();
            })
            .appendTo(songTitle);
        $("<span>").text("by ")
            .appendTo(songAuthor);


        $("<a>").attr("href", song.authorURL)
            .text(song.author)
            .addClass("song-author")
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
            duration = PM.getDuration();
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

            setProgressDisplay((currentTime / duration * 100).toFixed(2));
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

    function getCurrentTime() {
        return currentTime;
    }

    function getDuration() {
        return duration;
    }
    
    function getLoopState() {
        return loopState;
    }

    return {
        MAX_SONG_DESCRIPTION_LENGTH,
        MAX_SONG_AUTHOR_LENGTH,
        MAX_SONG_TITLE_LENGTH,
        init,
        onPlayerReady,
        onSongFinish,
        onSongReady,
        saveAll,

        addSongToCurrentPlaylist,

        searchForVideo,
        setQueryResponse,
        clearSearchResults,
        addSongToSearchResults,

        setPlayer,
        playSong,
        nextSong,
        prevSong,
        setMute,
        setVolume,
        setAutoPlay,
        setLoopState,
        setCurrentTime,
        addAnnotation,
        removeAnnotation,
        setAnnotationEnd,
        getCurrentAnnotation,
        resetAnnotationEnd,
        setSongInfoDisplay,
        
        removeCurrentSong,
        removeCurrentPlaylist,

        setProgressDisplay,
        getPlayer,
        getSongsInfo,
        isMuted,
        getVolume,
        getPlaylists,
        getCurrentPlaylist,
        getCurrentSong,
        getCurrentTime,
        getDuration,
        getLoopState
    };
})();
const PM = PlayerManager;

$(function () {
    YTVideoPlayer.init();
    SCPlayer.init();
    PM.init();
    PM.setPlayer(YTVideoPlayer);
    Search.init();
    Annotation.init();

    console.log("Document loaded!");
});