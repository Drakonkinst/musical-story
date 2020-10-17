const Input = (function() {
    const DRAG_STOP_DELAY = 1000;
    let isDragging = false;
    let dragTask = "";
    
    function createVolumeSlider() {
        function updateVal() {
            let val = parseInt(slider.val());
            YTVideoPlayer.setVolume(val);
            $(".volume-level").text(val + "%");
        }
        let container = $("<div>").addClass("volume-control").appendTo($(".controls"));
        $("<span>").text("Volume: ").appendTo(container);
        $("<span>").addClass("volume-level").appendTo(container);
        let slider = $("<input type='range'>").attr({
            "name": "Volume",
            "min": 0,
            "max": 100,
            "value": YTVideoPlayer.getVolume(),
            "step": 1
        }).on("input", function () {
            updateVal();
        }).appendTo(container);

        updateVal();   
    }
    
    function createProgressControls() {
        $(".progress-bar-background").click(function(e) {
            
        }).mousedown(function(e) {
            isDragging = true;
            dragTask = "progress";
            return false;
        });
        
        $(window).mousemove(function(e) {
            if(!isDragging || dragTask !== "progress") {
                return;
            }
            
            let el = $(".progress-bar-background");
            let posX = e.pageX - el.position().left;
            let progress = posX / el.width();

            if(progress < 0) {
                progress = 0;
            } else if(progress > 1.0) {
                progress = 1.0;
            }

            YTVideoPlayer.setProgressDisplay(progress * 100);
            YTVideoPlayer.setProgress(progress);
        }).mouseup(function(e) {
            if(!isDragging || dragTask !== "progress") {
                return;
            }
            
            let el = $(".progress-bar-background");
            let posX = e.pageX - el.position().left;
            let progress = posX / el.width();

            if(progress < 0) {
                progress = 0;
            } else if(progress > 1.0) {
                progress = 1.0;
            }

            YTVideoPlayer.setProgressDisplay(progress * 100);
            YTVideoPlayer.setProgress(progress);
            resetDragging();    
        });
        
        $(window).blur(function() {
            resetDragging();
        })
    }
    
    function createYTControls() {
        createVolumeSlider();
        createProgressControls();
    }
    
    function resetDragging() {
        isDragging = false;
        dragTask = "";
        /*
        setTimeout(function() {
            
        }, DRAG_STOP_DELAY);
        */
    }
    
    function isDraggingMouse() {
        return isDragging;
    }
    
    function getDragTask() {
        return dragTask;
    }
    
    return {
        createYTControls,
        isDraggingMouse,
        getDragTask
    };
})();