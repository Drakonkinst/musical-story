"use strict";

const Input = (function() {
    let isDragging = false;
    let dragTask = "";
    
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
    function createVolumeSlider() {
        function updateVal() {
            let val = parseInt(slider.val());
            PM.setVolume(val);
            level.text(val + "%");
        }
        
        let level;
        let slider;
        PM.getPlayer().getVolume(function(volume) {
            let container = $("<div>").addClass("volume-control").appendTo($(".controls"));
            $("<p>").text("Volume: ").appendTo(container);
            level = $("<div>").addClass("volume-level").appendTo(container);
            slider = $("<input type='range'>").attr({
                "name": "Volume",
                "min": 0,
                "max": 100,
                "value": volume,
                "step": 1
            }).on("input", function () {
                updateVal();
            }).appendTo(container);

            updateVal();
        });
    }
    
    function createProgressControls() {
        $(".progress-bar-background").click(function(e) {
            
        }).mousedown(function(e) {
            isDragging = true;
            dragTask = "progress";
            return false;
        });
        
        function setVideoProgress(progress, allowSeekAhead) {
            PM.setProgressDisplay(progress * 100);
            PM.getPlayer().getDuration(function(duration) {
                PM.getPlayer().seekTo(progress * duration, allowSeekAhead);
            });
        }
        
        $(window).mousemove(function(e) {
            if(!isDragging || dragTask !== "progress") {
                return;
            }
            
            let el = $(".progress-bar-background");
            let posX = e.pageX - el.position().left;
            let progress = clamp(posX / el.width(), 0.0, 1.0);

            setVideoProgress(progress, false);
        }).mouseup(function(e) {
            if(!isDragging || dragTask !== "progress") {
                return;
            }
            
            let el = $(".progress-bar-background");
            let posX = e.pageX - el.position().left;
            let progress = clamp(posX / el.width(), 0.0, 1.0);

            setVideoProgress(progress, true);
            resetDragging();    
        });
        
        $(window).blur(function() {
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
        createControls,
        isDraggingMouse,
        getDragTask
    };
})();