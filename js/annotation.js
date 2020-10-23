"use strict"

const Annotation = (function () {
    const AUTOSAVE_INTERVAL = 5000;
    let easyMDE;
    let lastAnnotationIndex = -1;

    /* HELPERS */
    // start and 0 are invalid times for end
    function isValidEndTime(start, end) {
        return end && end > start;
    }

    // returns index of nearest item <= to value
    function binarySearch(arr, start, end, val) {
        if(start >= end) {
            if(arr[start] && arr[start].start <= val) {
                return start;
            }
            return -1;
        }

        let mid = start + ~~((end - start) / 2);
        if(val < arr[mid].start) {
            return binarySearch(arr, start, mid, val);
        }

        let ret = binarySearch(arr, mid + 1, end, val);
        if(ret < 0) {
            return mid;
        }
        return ret;
    }

    function quickSort(arr, start, end) {
        if(start >= end) {
            return;
        }

        let partitionIndex = partition(arr, start, end);
        quickSort(arr, start, partitionIndex - 1);
        quickSort(arr, partitionIndex + 1, end);
    }

    function partition(arr, start, end) {
        let pivot = arr[end].start;
        let i = start - 1;

        for(let j = start; j <= end - 1; j++) {
            if(arr[j].start < pivot) {
                i++;
                swap(arr, i, j);
            }
        }
        swap(arr, i + 1, end);
        return (i + 1);
    }

    function swap(arr, i, j) {
        let temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    /* INIT */
    function init() {
        easyMDE = new EasyMDE({
            element: $(".annotation-editor-textarea")[0],
            placeholder: "Type here...",
            toolbar: ["bold", "italic", "heading", "|",
                "code", "quote", "unordered-list", "ordered-list", "|",
                "link", "image", "table", "horizontal-rule", "|",
                {
                    name: "side-by-side",
                    action: function (editor) {
                        if(!easyMDE.isPreviewActive()) {
                            EasyMDE.toggleSideBySide(editor);
                        }
                    },
                    className: "fa fa-columns no-disable no-mobile",
                    title: "Toggle Side by Side (Editing Only)"
                }, "fullscreen", "|",
                "guide"],
            tabSize: 4,
            forceSync: true,
            renderingConfig: {
                codeSyntaxHighlighting: true
            }
        });
        /*
        easyMDE.codemirror.on("change", function () {
            console.log(easyMDE.value());
        });*/
        easyMDE.togglePreview();

        setInterval(function () {
            onAutosave();
        }, AUTOSAVE_INTERVAL)

    }

    function onAutosave() {
        if(easyMDE.isPreviewActive()) {
            return;
        }
        saveCurrentAnnotation();
    }
    
    function onSongChange() {
        updateAnnotationDisplay();
        lastAnnotationIndex = -1;
    }

    /* FUNCTIONS */
    function viewAnnotationAtTime(annotationList, time) {
        // should also call onTimeUpdate() to switch annotations if needed?
        let index = getAnnotationIndexAtTime(annotationList, time);

        if(index === lastAnnotationIndex) {
            return;
        }
        
        // this could cause some bugs
        setEditMode(false);

        if(index < 0) {
            //console.log("Clearing content");
            lastAnnotationIndex = -1;
            easyMDE.value("");
            return;
        }

        //console.log("Setting new content");
        easyMDE.value(annotationList[index].text);
        lastAnnotationIndex = index;
    }

    // can be null
    function getAnnotationAtTime(annotationList, time) {
        let index = getAnnotationIndexAtTime(annotationList, time);
        if(index >= 0) {
            return annotationList[index];
        }
        return null;
    }
    
    function getAnnotationIndexAtTime(annotationList, time) {
        if(!annotationList) {
            return -1;
        }
        let index = binarySearch(annotationList, 0, annotationList.length - 1, time);
        if(index < 0) {
            return -1;
        }
        let annotation = annotationList[index];
        if(isValidEndTime(annotation.start, annotation.end)) {
            if(time > annotation.end) {
                return -1;
            }
        }
        return index;
    }

    function removeAnnotationAtTime(annotationList, time) {
        let index = getAnnotationIndexAtTime(annotationList, time);

        if(index < 0) {
            return;
        }

        annotationList.splice(index, 1);
        updateAnnotationDisplay();
    }

    function addBlankAnnotationAtTime(annotationList, time) {
        // this is the laziest insert in existence
        // ah well
        annotationList.push({
            start: time,
            text: ""
        });
        quickSort(annotationList, 0, annotationList.length - 1);
        updateAnnotationDisplay();

        // TODO: set lastAnnotationIndex to proper value
    }
    
    function setEditMode(flag) {
        if(easyMDE.isPreviewActive() && flag) {
            // edit mode on
            if(lastAnnotationIndex < 0) {
                return;
            }
            easyMDE.togglePreview();
            
            // temp - should switch to Loop Annotation (forced) instead
            PM.getPlayer().pause();
        } else if(!easyMDE.isPreviewActive() && !flag) {
            // edit mode off
            easyMDE.togglePreview();
            saveCurrentAnnotation();
        }
    }
    
    function saveCurrentAnnotation() {
        PM.getCurrentAnnotation(function (annotation) {
            if(annotation) {
                annotation.text = easyMDE.value();
                PM.saveAll();
            }
        });    
    }
    
    function isEditMode() {
        return !easyMDE.isPreviewActive();
    }

    /* RENDERING */
    // may want to find a better system where we just draw boxes
    function updateAnnotationDisplay() {
        console.log("Updating annotation");

        PM.getPlayer().getDuration(function(duration) {
            let annotations = PM.getCurrentSong().annotations;
            let annotationBar = $(".annotations-bar").empty();
            if(!annotations || !annotations.length) {
                return;
            }
            let lastTimestamp = duration;
            for(let i = annotations.length - 1; i >= 0; i--) {
                let annotation = annotations[i];
                let start = annotation.start;
                let end = annotation.end;
                if(isValidEndTime(start, end)) {
                    if(end < lastTimestamp) {
                        let blankTime = lastTimestamp - end;
                        addSegment("annotation-bar-separator", (blankTime / duration) * 100, annotationBar);
                        lastTimestamp = end;
                    }
                }
                let time = lastTimestamp - annotation.start;
                lastTimestamp = start;
                addSegment("annotation-bar-item", (time / duration) * 100, annotationBar);
            }
        });
    }
    
    function clearAnnotationBar() {
        $(".annotations-bar").empty();
    }
    
    function addSegment(class_, percentWidth, parent) {
        //console.log("Adding segment", class_);
        $("<div>").addClass(class_)
            .width(percentWidth + "%")
            .appendTo(parent);
    }

    return {
        init,
        viewAnnotationAtTime,
        onSongChange,
        getAnnotationAtTime,
        addBlankAnnotationAtTime,
        removeAnnotationAtTime,
        updateAnnotationDisplay,
        clearAnnotationBar,
        
        setEditMode,
        isEditMode
    };
})();