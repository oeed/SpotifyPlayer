console.log("Turns out it was just an Injektor.");
var accessToken;
$(document).ready(function() {
    var spotifyWebView = document.getElementsByTagName("webview")[0];
    var $spotifyWebView = $(spotifyWebView);
    $spotifyWebView.on("dom-ready", function() {
        spotifyWebView.getWebContents().session.cookies.get({
            url: 'https://open.spotify.com',
            name: 'wp_access_token'
        }, function(error, cookies) {
            if (cookies[0]) {
                accessToken = cookies[0].value;
                // launchRenderer();
                launchPlayer();
            }
            else {
                console.error("Cookie not found");
                $spotifyWebView.removeClass("spotify-driver");
            }
        });
    });
});

var API_HOST = "https://api.spotify.com/v1";

var albums = [];

function launchRenderer() {
    console.log("Lift off!");
    getAlbums(function() {
        // Populate the albums page
        var $albums = $(".albums").html("");
        for (var i = 0; i < albums.length; i++) {
            var image = albums[i].images[0].url;
            var id = albums[i].id;
            var $album = $(`<div class="album" id="${id}" style="background-image:url(${image})"></div>`).click(function() {
                openAlbum(this.id);
                return false;
            });
            $albums.append($album);
        }
    });
}

function albumByID(id) {
    for (var i = 0; i < albums.length; i++) {
        if (albums[i].id == id)
            return albums[i];
    }
}

function albumColours(id, callback) {
    var album = albumByID(id);
    if (localStorage["colours:" + id]) {
        console.log("Cached");
        var cached = JSON.parse(localStorage["colours:" + id]);
        callback(cached[0], cached[1], cached[2]);
        return;
    }

    var image = new Image();
    // image.crossOrigin = 'anonymous';
    image.src = album.images[0].url;
    console.log("Calculating");

    ColorTunes.launch(image, $('<canvas>')[0], function(backgroundColour, primaryColour, secondaryColour) {
        localStorage["colours:" + id] = JSON.stringify([backgroundColour, primaryColour, secondaryColour]);
        callback(backgroundColour, primaryColour, secondaryColour);
    });
}

function rgb(colour) {
    return "rgb(" + colour + ")";
}

function rgba(colour, opacity) {
    return "rgba(" + colour + "," + opacity + ")";
}

function openAlbum(id) {
    // animate $album's cover moving up to the full position (although this is actually done backwards)
    var album = albumByID(id);
    var $album = $(".album#" + id);
    $(".page-playing").addClass("visible");

    var $cover = $(".cover");
    var offset = $album.offset();

    var x = (offset.left - $album.index() % 2 * $album.width()) * 2;
    var y = (offset.top - window.scrollY - $album.height()) * 2;
    $cover.css("transform", `scale(0.5) translate(${x}px, ${y}px)`).css("background-image", "url(" + album.images[0].url + ")");
    $cover.addClass($album.index() % 2 == 0 ? "left" : "right");
    $album.addClass("hide");
    albumColours(id, function(backgroundColour, primaryColour, secondaryColour) {
        $("body, .track-list").css("background", rgb(backgroundColour));
        $(".details").css("background", "linear-gradient(to top, " + rgba(backgroundColour, 1) + " 2%, " + rgba(backgroundColour, 0) + " 100%)");
        $(".content").css("color", rgb(primaryColour));

        $(".album-artist").text(album.artists[0].name).css("color", rgba(secondaryColour, 0.15));
        $(".album-name").text(album.name);
        $(".album-year").text(album.release_date.getFullYear()).css("color", rgba(secondaryColour, 0.8));;

        var $tracks = $(".track-list").html("");

        for (var i = 0; i < album.tracks.length; i++) {
            var track = album.tracks[i];
            var name = track.name;
            var duration = Math.floor(track.duration_ms / 60000) + ":" + ("0" + Math.round(track.duration_ms / 1000) % 60).substr(-2, 2);
            var $track = $(`<div class="track">
                                <div class="track-name">${name}</div>
                                <div class="track-duration">${duration}</div>
                            </div>`);
            $tracks.append($track);
        }

        $(".page-albums").addClass("out");
        $(".page-playing").addClass("in");
        setTimeout(function() {
            $cover.addClass("animate");
            $cover.css("transform", "");
        }, 20);
    });
}

function request(path, data, success) {
    $.ajax({
        dataType: "json",
        url: API_HOST + path,
        data: data,
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        success: success
    });
}

function filterAlbum(album) {
    album.sortArtist = album.artists[0].name.toLowerCase().replace(/^the\s+/, "");
    album.release_date = new Date(album.release_date);
    album.tracks = album.tracks.items;
}

function getAlbums(complete) {
    // Get a list of all the saved albums and replace albums with it once complete
    var _albums = [];

    var LIMIT = 50;
    var offset = 0;
    var getPage = function() {
        request("/me/albums", {
            offset: offset,
            limit: LIMIT
        }, function(data) {
            // If there is another page after this load it now
            for (var i = 0; i < data.items.length; i++) {
                filterAlbum(data.items[i].album);
                _albums.push(data.items[i].album);
            }
            if (data.next) {
                offset = offset + LIMIT;
                getPage();
            }
            else {
                // We now have the full list of albums, sort them.
                _albums = _albums.sort(function(a, b) {
                    return a.sortArtist.localeCompare(b.sortArtist) || a.release_date > b.release_date
                });

                albums = _albums;
                if (complete)
                    complete();
            }
        });
    }
    getPage();
}