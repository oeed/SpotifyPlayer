var CONNECT_API = "connect-api/v2/";
var TRACK_PLAYBACK = "track-playback/v1/";

function deviceRequest(path, data, success) {
    $.ajax({
        dataType: "json",
        url: "https://gae-spclient.spotify.com/connect-api/v2/" + path,
        data: data,
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        success: success
    });
}

function getRequest(path, method, data, success) {
    $.ajax({
        dataType: "json",
        url: "https://gae-spclient.spotify.com/" + path,
        data: data,
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        success: success
    });
}

function postRequest(path, data, success) {
    $.ajax({
        method: "post",
        url: "https://gae-spclient.spotify.com/" + path,
        data: data ? JSON.stringify(data) : null,
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        success: success
    });
}


var socket;
var connectionID;
var deviceID = randomID();

function launchPlayer() {
    var socket = new WebSocket("wss://gae-dealer.spotify.com/?access_token=" + accessToken);
    socket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        // console.log(data);
        if (!connectionID) {
            var matches = data.uri.match(/hm:\/\/pusher\/(?:[^]+)?\/connections\/([^]+)/);
            connectionID = matches[1];
            connected();
        }
    }
}

function randomID() {
    var digits = function(length) {
        var bytes = crypto.getRandomValues(new Uint8Array(length))
        var str = ""
        for (var i = 0; i < bytes.length; i++) {
            str += bytes[i].toString(16)
        }
        return str;
    }
    return digits(4) + "-" + digits(2) + "-" + digits(2) + "-" + digits(2) + "-" + digits(6)
}

function connected() {
    console.log("Connected! ID: " + connectionID);
    registerDevice();
}

// TODO: we might want to get the dealer and spclient urls from https://apresolve.spotify.com/?type=dealer&type=spclient

// TODO: not entirely sure what the subscription does
function subscribeDevice() {
    postRequest(CONNECT_API + "state/subscriptions", {
        connection_id: connectionID,
        enable_discovery: false,
        name: deviceID
    }, function(data) {
        console.log(data);
    });
}

function registerDevice() {
    subscribeDevice();
    postRequest(TRACK_PLAYBACK + "devices", {
        connection_id: connectionID,
        previous_session_state: null,
        client_version: "harmony:2.18.0-fe97a3a",
        device: {
            device_id: deviceID,
            device_type: "computer",
            name: "Ollie's super mega awesome player",
            brand: "spotify",
            model: "web_player",
            capabilities: {
                change_volume: true,
                audio_podcasts: true,
                enable_play_token: true,
                manifest_formats: ["file_urls_mp3", "file_ids_mp4"]
            }
        }
    }, function(data) {
        console.log("Device registered! ID: " + deviceID);
    });


}

// function getDevices(callback) {
// connectRequest("devices", [], callback);
// }

function endpoint(path) {
    return CONNECT_API + "from/" + deviceID + "/device/d084abc00b2011d156b0db24dd0a34d4939bb0f7/" + path;
}

function pause() {
    postRequest(endpoint("pause"));
}