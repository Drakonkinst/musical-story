"use strict"

// thing that queries API
const Search = (function () {
    const YOUTUBE_PLAYLIST_PATTERN = /(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:playlist|list|embed)(?:\.php)?(?:\?.*list=|\/))([a-zA-Z0-9\-_]+)/;
    const FULL_YOUTUBE_VIDEO_PATTERN = /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtube\.com\/watch.*v=([a-zA-Z0-9_-]+)/;
    const SHORT_YOUTUBE_VIDEO_PATTERN = /^(?:(https?):\/\/)?(?:(?:www|m)\.)?youtu\.be\/([a-zA-Z0-9_-]+)/;
    //const VIMEO_PATTERN = /^(?:(https?):\/\/)?(?:www\.)?vimeo\.com\/(\d+)/    // maybe one day
    const SOUNDCLOUD_REGEXP = /^(?:(https?):\/\/)?(?:(?:www|m)\.)?(soundcloud\.com|snd\.sc)\/(.*)$/;
    const NUM_YOUTUBE_RESULTS = 10;

    const SPOTIFY_PLAYLIST_PATTERN = /https?:\/\/.*\.spotify\.com\/(users?\/.*\/)?playlists?\/([^?\/\s]*)/;
    const SPOTIFY_TRACK_PATTERN = /https?:\/\/.*\.spotify\.com\/tracks?\/([^?\/\s]*)/;
    const SPOTIFY_ALBUM_PATTERN = /https?:\/\/.*\.spotify\.com\/albums?\/([^?\/\s]*)/;
    const SPOTIFY_TOPTEN_ARTIST_PATTERN = /https?:\/\/.*\.spotify\.com\/artists?\/([^?\/\s]*)/;

    const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3/videos";
    const SOUNDCLOUD_BASE_URL = "https://soundcloud.com/oembed";
    const SPOTIFY_BASE_URL = "https://api.spotify.com";

    // the default value is a public key that can only be used on drakonkinst.github.io
    // it can be replaced in the config
    let GOOGLE_API_KEY = "AIzaSyDzQGVy_WWoJRV4DRs8SnVGZ2DHSEF8IBI";
    let googleAPILoaded = false;

    /* HELPERS */
    // returns YouTube ID if any
    function isValidYouTubeVideoURL(url) {
        let longURLMatch = url.match(FULL_YOUTUBE_VIDEO_PATTERN);
        let shortURLMatch = url.match(SHORT_YOUTUBE_VIDEO_PATTERN);

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

    /* SEARCHING */
    function searchForVideo(queryStr) {
        PM.clearSearchResults();

        if(!queryStr.length) {
            PM.setQueryResponse("Search box is empty!", true);
            return;
        }

        if(isValidSoundCloudURL(queryStr)) {
            fetchSongFromSoundCloudURL(queryStr, function (song) {
                PM.addSongToSearchResults(song);
                PM.setQueryResponse("Query successful! Found 1 item:");
            });
        } else if(queryStr.match(YOUTUBE_PLAYLIST_PATTERN)) {
            console.log("Youtube Playlist");
            // separate PM.addPlaylistToSearchResults() -> Import Playlist?
            // How to view song lists?
            // How to see if videos on the playlist are invalid?
        } else if(isValidYouTubeVideoURL(queryStr)) {
            fetchSongFromYouTubeURL(queryStr, function(song) {
                PM.addSongToSearchResults(song);
                PM.setQueryResponse("Query successful! Found 1 item:");
            });
        } else if(queryStr.match(SPOTIFY_PLAYLIST_PATTERN)) {
            console.log("Spotify Playlist")
        } else if(queryStr.match(SPOTIFY_TRACK_PATTERN)) {
            console.log("Spotify Track");
        } else if(queryStr.match(SPOTIFY_ALBUM_PATTERN)) {
            console.log("Spotify Album");
        } else if(queryStr.match(SPOTIFY_TOPTEN_ARTIST_PATTERN)) {
            console.log("Top Ten Album");
        } else {
            queryYouTubeByKeywords(queryStr);
        }
    }

    /* API */
    function fetchSongFromYouTubeID(id, callback) {
        if(!id) {
            console.log("Invalid YouTube ID!");
            return;
        }

        $.getJSON(YOUTUBE_BASE_URL + "?id=" + id + "&key=" + GOOGLE_API_KEY + "&fields=items(id,snippet(channelId,title,description,thumbnails,channelTitle))&part=snippet", function (json) {
            let songInfo = json.items[0];
            let song = fetchSongFromYouTubeQuery(songInfo, id);

            if(callback) {
                callback(song);
            }
        }).fail(function () {
            console.error("Query error fetching song from YouTube ID");
        });
    }

    function fetchSongFromYouTubeQuery(item, id) {
        let snippet = item.snippet;

        let song = {
            type: "YT",
            name: Utils.htmlDecode(snippet.title),
            author: Utils.htmlDecode(snippet.channelTitle),
            songURL: "https://www.youtube.com/watch?v=" + id,
            authorURL: "https://www.youtube.com/channel/" + snippet.channelId,
            description: Utils.htmlDecode(snippet.description),
            image: snippet.thumbnails.default.url
        };

        return song;
    }

    function fetchSongFromYouTubeURL(url, callback) {
        let id = isValidYouTubeVideoURL(url);

        if(!id) {
            console.log("Invalid YouTube URL!");
            return null;
        }

        return fetchSongFromYouTubeID(id, callback);
    }

    function fetchSongFromSoundCloudURL(url, callback) {
        url = isValidSoundCloudURL(url);

        if(!url) {
            console.log("Invalid SoundCloud URL!");
            return null;
        }

        $.get(SOUNDCLOUD_BASE_URL + "?format=js&url=" + url + "&iframe=true", function (data) {
            let iFrameData = data.substring(1, data.length - 2);
            let songInfo = JSON.parse(iFrameData);

            let lastIndex = songInfo.title.lastIndexOf(" by ");
            let songTitle = songInfo.title.substring(0, lastIndex);

            let song = {
                type: "SC",
                name: Utils.htmlDecode(songTitle),
                author: Utils.htmlDecode(songInfo.author_name),
                songURL: url,
                authorURL: songInfo.author_url,
                description: Utils.htmlDecode(songInfo.description),
                image: songInfo.thumbnail_url
            }

            if(callback) {
                callback(song);
            }
        }).fail(function () {
            console.error("Query error fetching song from SoundCloud URL");
        });
    }

    function queryYouTubeByKeywords(keywords) {
        gapi.client.youtube.search.list({
            "part": [
                "snippet"
            ],
            "fields": "items(id, snippet(channelId, title, description, thumbnails, channelTitle))",
            "maxResults": NUM_YOUTUBE_RESULTS,
            "q": keywords
        }).then(function (response) {
            //console.log("Response result", response.result);
            let items = response.result.items;

            if(!items.length) {
                PM.setQueryResponse("No results found! Try different keywords or shorter queries.", true, false);
                return;
            }

            let numFound = 0;
            for(let i = 0; i < items.length; i++) {
                let item = items[i];
                let song = fetchSongFromYouTubeQuery(item, item.id.videoId);
                fetchYouTubeVideoDurationById(item.id.videoId, function (durationStr) {
                    numFound++;
                    PM.addSongToSearchResults(song, durationStr);
                    if(i >= items.length - 1) {
                        // last one
                        PM.setQueryResponse("Query successful!");
                    }
                });
            }

        }, function (err) {
            console.error("Query error", err);
        });
    }

    function fetchYouTubeVideoDurationById(id, callback) {
        $.getJSON(YOUTUBE_BASE_URL + "?id=" + id + "&key=" + GOOGLE_API_KEY + "&fields=items(contentDetails(duration))&part=contentDetails", function (json) {
            if(!json.items.length) {
                // Invalid item
                return;
            }
            let durationStr = Utils.convertISO8601ToHMSStr(json.items[0].contentDetails.duration);
            if(callback) {
                callback(durationStr);
            }
        }).fail(function () {
            console.error("Query error fetching duration of video");
        });
    }

    function fetchSongFromSpotifyTrack(url) {

    }

    function fetchSongsFromSpotifyPlaylist(url) {

    }

    function fetchSongsFromSpotifyAlbumPlaylist(url) {

    }

    function fetchSongsFromSpotifyTopTenPlaylist(url) {

    }

    function isGAPILoaded() {
        return googleAPILoaded;
    }

    return {
        init,
        loadYTAPI,

        searchForVideo,
        queryYouTubeByKeywords, // temp public

        isValidYouTubeVideoURL,
        isValidSoundCloudURL,
        fetchSongFromYouTubeID,
        fetchSongFromYouTubeURL,
        fetchSongFromSoundCloudURL,
        isGAPILoaded
    }
})();