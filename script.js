let appName = 'catch' //nazwa aplikacji dla websocket
let nick = "";
let mapElement = document.getElementById('map');

let uluru, map, marker; //zmienne dla google maps
function initMap() {
    uluru = {
        lat: -25.363,
        lng: 131.044
    };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: uluru,
        keyboardShortscuts: false,
        disableDefaultUI: true
    });

    marker = new google.maps.Marker({
        position: uluru,
        map: map,
        label: nick
    });
    getLocalization();
    setOverlay();
}

let coords;

// pobieranie lokalizacji od usera
function getLocalization() {
    navigator.geolocation.getCurrentPosition(geoOk, geoFail);
}

let overlay; //obiekt google.maps.OverlayView
//ustawianie nakładki google maps
function setOverlay() {
    overlay = new google.maps.OverlayView();
    if (!overlay) setTimeout(setOverlay, 500);
    else {
        overlay.draw = function () {};
        overlay.setMap(map);
        startWebsocket();
        addEvents();
    }
}