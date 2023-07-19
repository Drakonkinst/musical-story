"use strict"

/**
 * Utility class containing various data-manipulating functions.
 */
const Utils = (function() {
    /**
     * Returns a duration in HH:MM:SS format given a number of seconds.
     * 
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
    
    
    /**
     * Decodes an html-encoded string, such as a website link
     * Source: https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
     * @param {string} input
     * @return {string} decoded output
     */
    function htmlDecode(input) {
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    }
    
    /**
     * Converts a duration in ISO-8601 into HH:MM:SS format
     * 
     * @param {string} duration in ISO-8601
     * @return {string} duration in HH:MM:SS format
     */
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
    
    /**
     * Compresses string for storage
     * Source: Cookie Clicker (thanks Orteil!)
     * 
     * @param {string} str original string
     * @return {string} compressed string
     */
    function compressData(str) {
        try {
            return LZString.compress(unescape(encodeURIComponent(str)));
        } catch(err) {
            return "";
        }
    }
    
    /**
     * Decompresses string
     * 
     * @param {string} str compressed string 
     * @return {string} original string
     */
    function decompressData(str) {
        try {
            return decodeURIComponent(escape(LZString.decompress(str)));
        } catch(err) {
            return "";
        }
    }
    
    /**
     * Encodes string into UTF-8 then compresses it to base 64
     * 
     * @param {string} str original string
     * @return base 64 string
     */
    function utf8ToBase64(str) {
        try {
            return LZString.compressToBase64(unescape(encodeURIComponent(str)));
        } catch(err) {
            return "";
        }
    }
    
    /**
     * Decodes string from base 64 to UTF-8
     * 
     * @param {string} str base 64 string
     * @return UTF-8 string
     */
    function base64ToUtf8(str) {
        try {
            return decodeURIComponent(escape(LZString.decompressFromBase64(str)));
        } catch(err) {
            return "";
        }
    }
    
    /**
     * If the given string is longer than the given length, truncates the
     * string to the given length.
     * 
     * @param {string} str The string to clamp
     * @param {number} length The maximum length of the string
     * @return The clamped string
     */
    function clampString(str, length) {
        if(str.length < length) {
            return str;
        }
        return str.substring(0, length);
    }
    
    /**
     * Internal function to print the current size of local storage
     * Source: https://stackoverflow.com/questions/4391575/how-to-find-the-size-of-localstorage
     */
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