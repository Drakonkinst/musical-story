// thing that queries API
const Search = (function() {
    const FULL_YOUTUBE_REG_EXP = /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/
    const SHORT_YOUTUBE_REG_EXP = /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/
    //const VIMEO_REG_EXP = /^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/    // maybe one day...
    const SOUNDCLOUD_REGEXP = /^(?:(https?):\/\/)?(?:(?:www|m)\.)?(soundcloud\.com|snd\.sc)\/(.*)$/

    // the default value is a public key that can only be used on drakonkinst.github.io
    // it can be replaced in the config
    let GOOGLE_API_KEY = "AIzaSyDzQGVy_WWoJRV4DRs8SnVGZ2DHSEF8IBI";
    let googleAPILoaded = false;
    
    /* HELPERS */
    // returns YouTube ID if any
    function isValidYouTubeURL(url) {
        let longURLMatch = url.match(FULL_YOUTUBE_REG_EXP);
        let shortURLMatch = url.match(SHORT_YOUTUBE_REG_EXP);
        
        if(longURLMatch && longURLMatch[2]) {
            // [0] is also a valid URL
            return longURLMatch[2];
        }
        
        if(shortURLMatch && shortURLMatch[2]) {
            // [0] is NOT a valid URL
            return shortURLMatch[2];
        }
        
        return null;
    }
    
    // returns url if any
    function isValidSoundCloudURL(url) {
        let match = url.match(SOUNDCLOUD_REGEXP);
        if(match && match[0]) {
            return match[0];
        }
        return null;
    }
    
    /* INIT */
    function init() {
        $.getJSON("/config.json", function (json) {
            console.log("API key loaded!");
            if(json.google_api_key) {
                GOOGLE_API_KEY = json.google_api_key;
            }
        }).fail(function () {
            console.log("API key not found, using default settings.");
        });
        
        setTimeout(loadYTAPI, 500);
        
        /*
        getSongFromSoundCloudURL("https://soundcloud.com/seradotvaw/seraphine-popstars-kda-cover", function(data) {console.log(data)});
        getSongFromSoundCloudURL("https://soundcloud.com/kieutown/story", function (data) { console.log(data) });
        getSongFromYouTubeURL("https://youtu.be/FdeioVndUhs", function (data) { console.log(data) });
        getSongFromYouTubeURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ", function (data) { console.log(data) });
        */
    }
    
    function loadYTAPI() {
        if(googleAPILoaded) {
            console.log(song);
            console.log("Attempted to load API, but API is already loaded");
            return;
        }
        googleAPILoaded = true;

        gapi.client.setApiKey(GOOGLE_API_KEY);
        let client = gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
            .then(function () { console.log("GAPI client loaded for API"); },
                function (err) { console.error("Error loading GAPI client for API", err); });
        return client;
    }
    
    /* API */
    function getSongFromYouTubeID(id, callback) {
        if(!id) {
            console.log("Invalid YouTube ID!");
            return;
        }
        
        $.getJSON("https://www.googleapis.com/youtube/v3/videos?id=" + id + "&key=" + GOOGLE_API_KEY + "&fields=items(id,snippet(channelId,title,description,thumbnails,channelTitle))&part=snippet", function(json) {
            let songInfo = json.items[0];
            //console.log(songInfo);
            let song = {
                type: "YT",
                name: songInfo.snippet.title,
                author: songInfo.snippet.channelTitle,
                songURL: "https://www.youtube.com/watch?v=" + id,
                authorURL: "https://www.youtube.com/channel/" + songInfo.snippet.channelId,
                description: songInfo.snippet.description,
                image: songInfo.snippet.thumbnails.default.url
            };
            //console.log(song);
            
            if(callback) {
                callback(song);
            }
        });
    }
    
    function getSongFromYouTubeURL(url, callback) {
        id = isValidYouTubeURL(url);
        
        if(!id) {
            console.log("Invalid YouTube URL!");
            return null;
        }
        
        return getSongFromYouTubeID(id, callback);
    }
    
    function getSongFromSoundCloudURL(url, callback) {
        url = isValidSoundCloudURL(url);
        
        if(!url) {
            console.log("Invalid SoundCloud URL!");
            return null;
        }
        
        $.get("http://soundcloud.com/oembed?format=js&url=" + url + "&iframe=true", function (data) {
            let iFrameData = data.substring(1, data.length - 2);
            let songInfo = JSON.parse(iFrameData);
            
            let lastIndex = songInfo.title.lastIndexOf(" by ");
            let songTitle = songInfo.title.substring(0, lastIndex);
            
            let song = {
                type: "SC",
                name: songTitle,
                author: songInfo.author_name,
                songURL: url,
                authorURL: songInfo.author_url,
                description: songInfo.description,
                image: songInfo.thumbnail_url
            }
            
            if(callback) {
                callback(song);
            }
        });
    }
    
    function isGAPILoaded() {
        return googleAPILoaded;
    }
    
    return {
        init,
        loadYTAPI,
        
        isValidYouTubeURL,
        isValidSoundCloudURL,
        getSongFromYouTubeID,
        getSongFromYouTubeURL,
        getSongFromSoundCloudURL,
        isGAPILoaded
    }
})();