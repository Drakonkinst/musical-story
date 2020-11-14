"use strict"

const Annotation = (function () {
    const AUTOSAVE_INTERVAL = 5000;
    const CHANGE_INTERVAL = 100;
    let easyMDE;
    let lastChange = new Date().getTime();
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
        const IMAGE_HELP = "<!\n'+'--\nImage format: ![placeholder name](url)\n You can also add certain tags at the end of the url (e.g. url#medium,bordered) to format it.\n- thumbnail: Sets width to 75px.\n- small: Sets width to 150px.\n- medium: Sets width to 200px.\n- large: Sets width to 500px.\n- bordered: Adds a 1px border around the image.\n- wrap: Makes text wrap around the image.\n--'+'>\n";
        const LINK_HELP = "\n<!-- Link format: [display text](url) -->\n";
        easyMDE = new EasyMDE({
            element: $(".annotation-editor-textarea")[0],
            placeholder: "Type here...",
            toolbar: ["undo", "redo", "|", "bold", "italic", "heading", "|",
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
            insertTexts: {
                horizontalRule: ["\n---\n", ""],
                image: ["![](", ")" + IMAGE_HELP],
                link: ["[](", ")" + LINK_HELP],
                table: ["", "\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Text | Text | Text | "]
            },
            maxHeight: "500px",
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

    /* EVENTS */
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
    
    function removeAnnotationAtTime(annotationList, time) {
        let index = getAnnotationIndexAtTime(annotationList, time);

        if(index < 0) {
            return;
        }

        annotationList.splice(index, 1);
        updateAnnotationDisplay();
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
        PM.getCurrentAnnotation(function(annotation) {
            if(annotation) {
                annotation.text = easyMDE.value();
                PM.saveAll();
            }
        });
    }

    /* ACCESSOR */
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

    function isEditMode() {
        return !easyMDE.isPreviewActive();
    }

    /* RENDERING */
    // may want to find a better system where we just draw boxes
    function updateAnnotationDisplay() {
        //console.log("Updating annotation");

        let annotations = PM.getCurrentSong().annotations;
        let annotationBar = $(".annotations-bar").empty();
        let duration = PM.getDuration();
        if(!annotations || !annotations.length) {
            return;
        }
        let lastTimestamp = duration;

        for(let i = annotations.length - 1; i >= 0; i--) {
            let annotation = annotations[i];
            let start = annotation.start;
            let end = annotation.end;
            lastTimestamp = addGapSegmentIfNeeded(start, end, lastTimestamp, duration, annotationBar);
            lastTimestamp = addAnnotationSegment(start, lastTimestamp, duration, annotationBar, annotation.color);
        }
    }

    function addGapSegmentIfNeeded(start, end, lastTimestamp, duration, annotationBar) {
        if(isValidEndTime(start, end) && end < lastTimestamp) {
            let blankTime = lastTimestamp - end;
            addSegment("annotation-bar-separator", (blankTime / duration) * 100, annotationBar);
            return end;
        }
        return lastTimestamp;
    }

    function addAnnotationSegment(start, lastTimestamp, duration, annotationBar, color) {
        let time = lastTimestamp - start;
        let segment = addSegment("annotation-bar-item", (time / duration) * 100, annotationBar);
        if(color) {
            segment.css("background", color);
        }
        return start;
    }

    function addSegment(class_, percentWidth, parent) {
        return $("<div>").addClass(class_)
            .width(percentWidth + "%")
            .appendTo(parent);
    }

    function clearAnnotationBar() {
        $(".annotations-bar").empty();
    }
    
    function viewAnnotationAtTime(annotationList, time) {
        let now = new Date().getTime();
        if(lastChange + CHANGE_INTERVAL > now) {
            return;
        }
        
        lastChange = now;
        // should also call onTimeUpdate() to switch annotations if needed?
        let index = getAnnotationIndexAtTime(annotationList, time);

        if(index === lastAnnotationIndex) {
            return;
        }

        // this could cause some bugs
        setEditMode(false);

        if(index < 0) {
            lastAnnotationIndex = -1;
            easyMDE.value("");
            return;
        }

        easyMDE.value(annotationList[index].text);
        lastAnnotationIndex = index;
    }

    return {
        init,
        onSongChange,
        addBlankAnnotationAtTime,
        removeAnnotationAtTime,
        setEditMode,
        
        isEditMode,
        getAnnotationAtTime,
        
        updateAnnotationDisplay,
        clearAnnotationBar,
        viewAnnotationAtTime,
    };
})();