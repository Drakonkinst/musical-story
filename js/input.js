"use strict";

const Input = (function() {
    const DRAG_UPDATE_INTERVAL = 100;
    const LEFT_CLICK = 1;
    
    let isDragging = false;
    let dragTask = "";
    let nextDragUpdate = 0;
    
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
    
    /* CREATE UI */
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
                "Cancel": function() {
                    $(this).dialog("close");
                    noCallback();
                },
                "Confirm": function() {
                    $(this).dialog("close");
                    yesCallback();
                }
            }
        });
    }
    
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
        $(".progress-bar-background").on("click", function(e) {
            
        }).on("mousedown", function(e) {
            isDragging = true;
            dragTask = "progress";
            return false;
        });
        
        function setVideoProgress(progress, allowSeekAhead, isFromDragging) {
            PM.setProgressDisplay(progress * 100);
            
            if(isFromDragging && Date.now() < nextDragUpdate) {
                // ignore if updated recently
                return;
            } else if(isFromDragging) {
                nextDragUpdate = Date.now() + DRAG_UPDATE_INTERVAL;
            }
            PM.getPlayer().getDuration(function(duration) {
                PM.getPlayer().seekTo(progress * duration, allowSeekAhead);
            });
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
    
    return {
        createConfirmDialog,
        createControls,
        setVolumeSlider,
        isDraggingMouse,
        getDragTask
    };
})();