"use strict";

const Input = (function() {
    const DRAG_UPDATE_INTERVAL = 100;
    const LEFT_CLICK = 1;
    
    let isDragging = false;
    let dragTask = "";
    let nextDragUpdate = 0;
    let canSongChange = true;
    
    /* HELPERS */
    function clamp(num, min, max) {
        if(num < min) {
            return min;
        } else if(num > max) {
            return max;
        }
        return num;
    }
    
    function resetDragging() {
        isDragging = false;
        dragTask = "";
    }
    
    function createConfirmDialog(title, message, yesCallback, noCallback) {
        yesCallback = yesCallback || function () { };
        noCallback = noCallback || function () { };
        $(".confirm-dialog-text").text(message);
        $(".confirm-dialog").dialog({
            resizable: false,
            draggable: false,
            title: title,
            height: "auto",
            modal: true,
            width: 500,
            buttons: {
                "Cancel": function () {
                    $(this).dialog("close");
                    noCallback();
                },
                "Confirm": function () {
                    $(this).dialog("close");
                    yesCallback();
                }
            }
        });
    }

    function createTextDialog(title, message, doneCallback, placeholder, initialValue, editable) {
        doneCallback = doneCallback || function () { };
        $(".text-dialog-text").text(message);
        $(".text-dialog").dialog({
            resizable: false,
            draggable: false,
            title: title,
            height: "auto",
            modal: true,
            width: 500,
            buttons: {
                'OK': function () {
                    var code = $(".text-dialog-input").val();
                    doneCallback(code);
                    $(this).dialog('close');
                },
                'Cancel': function () {
                    $(this).dialog('close');
                }
            }
        });
        let input = $(".text-dialog-input");
        input.attr("readonly", !editable)
            .attr("placeholder", placeholder)
            .val(initialValue);
        if(input.val().length > 0) {
            input.select();
        }
    }
    
    function validateInput(input) {
        if(typeof input === "string") {
            console.log(input);
            return input != null && input.length > 0;
        } else {
            // array
            for(let i of input) {
                let result = validateInput(i);
                if(!result) {
                    return false;
                }
            }
            return true;
        }
    }
    
    /* DIALOGS */
    function exportPlaylist() {
        let currentPlaylist = PM.getCurrentPlaylist();
        createTextDialog("Export Playlist", "Copy-paste this code somewhere safe!", null, "", Utils.utf8ToBase64(JSON.stringify(currentPlaylist)), false);
    }

    function importPlaylist() {
        createTextDialog("Import Playlist", "Paste your playlist code here!", function (code) {
            try {
                let playlist = JSON.parse(Utils.base64ToUtf8(code));
                if(playlist != null) {
                    console.log(playlist);
                }
            } catch(err) {
                // TODO: Display error instead of/in addition to printing it to console
                console.error(err);
            }
        }, "Playlist code", "", true);
    }

    function exportSong() {
        let currentSong = PM.getCurrentSong();
        createTextDialog("Export Song", "Copy-paste this code somewhere safe!", null, "", Utils.utf8ToBase64(JSON.stringify(currentSong)), false);
    }

    function importSong() {
        createTextDialog("Import Song", "Paste your song code here!", function (code) {
            try {
                let song = JSON.parse(Utils.base64ToUtf8(code));
                if(song != null) {
                    PM.addSongToCurrentPlaylist(song);
                }
            } catch(err) {
                // TODO: Display error instead of/in addition to printing it to console
                console.error(err);
            }
        }, "Song code", "", true);
    }

    function removeCurrentSong() {
        createConfirmDialog("Are you sure you want to remove this song?",
            "It will be deleted from this playlist forever (a very long time!)",
            PM.removeCurrentSong,
            function () { },
        );
    }

    function removeCurrentPlaylist() {
        if(playlists.length <= 1) {
            // TODO: Display error: Cannot delete only playlist
            console.log("Cannot remove only playlist!");
            return;
        }
        createConfirmDialog("Are you sure you want to remove this playlist?",
            "It will be deleted FOREVER (a very long time!)",
            PMremoveCurrentPlaylist, function () { }
        );
    }
    
    // temporarily in dialogs for now
    function editCurrentSong() {
        let song = PM.getCurrentSong();
        if(song == null) {
            return;
        }
        let songTitle = $(".song-edit-title").attr("maxlength", PM.MAX_SONG_TITLE_LENGTH).val(song.name);
        let songAuthor = $(".song-edit-author").attr("maxlength", PM.MAX_SONG_AUTHOR_LENGTH).val(song.author);
        let songImage = $(".song-edit-image").val(song.image);
        let songDescription = $(".song-edit-description").attr("maxlength", PM.MAX_SONG_DESCRIPTION_LENGTH).val(song.description);
        $(".song-edit-dialog").dialog({
            resizable: false,
            draggable: false,
            title: "Edit Song Info",
            height: "auto",
            modal: true,
            width: 500,
            buttons: {
                'Save': function () {
                    //songImage and songDescription can be blank without consequence
                    if(validateInput([songTitle.val(), songAuthor.val()])) {
                        song.name = songTitle.val();
                        song.author = songAuthor.val();
                        song.image = songImage.val();
                        song.description = songDescription.val();
                        
                        PM.setSongInfoDisplay(song);
                        PM.saveAll();
                    }
                    
                    $(this).dialog('close');
                },
                'Cancel': function () {
                    $(this).dialog('close');
                }
            }
        });
        
        function editPlaylist() {
            let playlist = PM.getCurrentPlaylist();
        }
    }
    
    /* CREATE UI */
    
    // not the most elegant way to do things but ah well
    function setVolumeSlider(percent) {
        $(".volume-slider").val(percent);
        $(".volume-level").text(percent + "%");
    }
    
    function createVolumeSlider() {
        function updateVal() {
            let val = parseInt(slider.val());
            PM.setVolume(val);
            level.text(val + "%");
        }
        
        let level;
        let slider;
        let container = $("<div>").addClass("volume-control").appendTo($(".controls"));
        $("<p>").text("Volume: ").appendTo(container);
        level = $("<div>").addClass("volume-level").appendTo(container);
        slider = $("<input type='range'>").addClass("volume-slider").attr({
            "name": "Volume",
            "min": 0,
            "max": 100,
            "value": 50,
            "step": 1
        }).on("input", function () {
            updateVal();
        }).appendTo(container);

        updateVal();
    }
    
    function createProgressControls() {
        const THRESHOLD = 0.00001;
        let lastProgress = -1;
        let wasPlaying = false;
        
        $(".progress-bar-background").on("click", function (e) {

        }).on("mousedown", function (e) {
            isDragging = true;
            dragTask = "progress";
            PM.getPlayer().isPaused(function (paused) {
                wasPlaying = !paused;
            });
            return false;
        });
        
        function setVideoProgress(progress, allowSeekAhead, isFromDragging) {
            if(Math.abs(progress - lastProgress) < THRESHOLD) {
                lastProgress = progress;
                return;
            }
            lastProgress = progress;
            
            PM.setProgressDisplay(progress * 100);
            
            if(isFromDragging && Date.now() < nextDragUpdate) {
                // ignore if updated recently
                return;
            } else if(isFromDragging) {
                nextDragUpdate = Date.now() + DRAG_UPDATE_INTERVAL;
            }
            PM.getPlayer().seekTo(progress * PM.getDuration(), allowSeekAhead);
            PM.setCurrentTime(progress * PM.getDuration());
        }
        
        $(window).on("mousemove", function(e) {
            if(!isDragging || dragTask !== "progress") {
                return;
            }
            
            let el = $(".progress-bar-background");
            let posX = e.pageX - el.offset().left;
            let progress = clamp(posX / el.width(), 0.0, 1.0);
            
            setVideoProgress(progress, false, true);                
        }).on("mouseup", function(e) {
            if(!isDragging || dragTask !== "progress") {
                return;
            }
            
            let el = $(".progress-bar-background");
            let posX = e.pageX - el.offset().left;
            let progress = clamp(posX / el.width(), 0.0, 1.0);

            setVideoProgress(progress, true, false);
            resetDragging();
            
            if(wasPlaying) {
                PM.getPlayer().play();
            }
            PM.getPlayer().seekTo(PM.getCurrentTime());
        });
        
        $(window).on("blur", function() {
            resetDragging();
        });
    }
    
    function createControls() {
        createVolumeSlider();
        createProgressControls();
    }
    
    /* ACCESSORS */
    function isDraggingMouse() {
        return isDragging;
    }
    
    function getDragTask() {
        return dragTask;
    }
    
    function canChangeSong() {
        return canSongChange;
    }
    
    return {
        createConfirmDialog,
        createTextDialog,
        createControls,
        setVolumeSlider,
        isDraggingMouse,
        getDragTask,
        exportPlaylist,
        importPlaylist,
        exportSong,
        importSong,
        removeCurrentPlaylist,
        removeCurrentSong,
        canChangeSong,
        editCurrentSong
    };
})();