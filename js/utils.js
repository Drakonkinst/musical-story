const Utils = (function() {
    function secondsToTimeStr(seconds) {
        seconds = Math.round(seconds);
        let hours = ~~(seconds / (60 * 60));
        seconds %= (60 * 60);
        let minutes = ~~(seconds / 60);
        seconds %= 60;

        let str = "";
        const zeroes = "00";
        if(hours > 0) {
            str += hours + ":";
        }
        str += minutes + ":" + (zeroes + seconds).slice(-2);
        return str;
    }
    
    // https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
    function htmlDecode(input) {
        var doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent;
    }
    
    return {
        secondsToTimeStr,
        htmlDecode
    };
})();