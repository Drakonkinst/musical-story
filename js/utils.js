const Utils = (function() {
    /**
     * Returns a duration in HH:MM:SS format given a number of seconds.
     * @param {number}  seconds The number of seconds.
     * @return {string} duration string
     */
    function secondsToTimeStr(seconds) {
        seconds = Math.round(seconds);
        let hours = ~~(seconds / (60 * 60));
        seconds %= (60 * 60);
        let minutes = ~~(seconds / 60);
        seconds %= 60;

        let str = "";
        if(hours > 0) {
            str += hours + ":";
        }
        
        // formats seconds to always be 2 digits long
        str += minutes + ":" + ("00" + seconds).slice(-2);
        return str;
    }
    
    // https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
    function htmlDecode(input) {
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    }
    
    function convertISO8601ToHMSStr(duration) {
        let a = duration.match(/\d+/g);

        if(duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
            a = [0, a[0], 0];
        }

        if(duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
            a = [a[0], 0, a[1]];
        }
        if(duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
            a = [a[0], 0, 0];
        }

        duration = 0;

        if(a.length == 3) {
            duration = duration + parseInt(a[0]) * 3600;
            duration = duration + parseInt(a[1]) * 60;
            duration = duration + parseInt(a[2]);
        }

        if(a.length == 2) {
            duration = duration + parseInt(a[0]) * 60;
            duration = duration + parseInt(a[1]);
        }

        if(a.length == 1) {
            duration = duration + parseInt(a[0]);
        }
        return secondsToTimeStr(duration);
    }
    
    // shamelessly stolen from Cookie CLicker
    function compressData(str) {
        try {
            return LZString.compress(unescape(encodeURIComponent(str)));
        } catch(err) {
            return "";
        }
    }
    
    function decompressData(str) {
        try {
            return decodeURIComponent(escape(LZString.decompress(str)));
        } catch(err) {
            return "";
        }
    }
    
    function utf8ToBase64(str) {
        try {
            return LZString.compressToBase64(unescape(encodeURIComponent(str)));
        } catch(err) {
            return "";
        }
    }
    
    function base64ToUtf8(str) {
        try {
            return decodeURIComponent(escape(LZString.decompressFromBase64(str)));
        } catch(err) {
            return "";
        }
    }
    
    function clampString(str, length) {
        if(str.length < length) {
            return str;
        }
        return str.substring(0, length);
    }
    
    function getLocalStorageSize() {
        var _lsTotal = 0, _xLen, _x; for(_x in localStorage) { if(!localStorage.hasOwnProperty(_x)) { continue; } _xLen = ((localStorage[_x].length + _x.length) * 2); _lsTotal += _xLen; console.log(_x.substr(0, 50) + " = " + (_xLen / 1024).toFixed(2) + " KB") }; console.log("Total = " + (_lsTotal / 1024).toFixed(2) + " KB");
    }
    
    return {
        secondsToTimeStr,
        htmlDecode,
        convertISO8601ToHMSStr,
        compressData,
        decompressData,
        utf8ToBase64,
        base64ToUtf8,
        clampString,
        getLocalStorageSize
    };
})();