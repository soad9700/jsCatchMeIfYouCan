let appName = 'catch' //nazwa aplikacji dla websocket
let nick = "";

let mapElement = document.getElementById('map');
let players = {}; //lista graczy

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


function geoOk(data) {
    showNickForm();
    coords = {
        lat: data.coords.latitude,
        lng: data.coords.longitude
    }
    map.setCenter(coords);
    marker.setPosition(coords);
}

function geoFail() {
    setTimeout(getLocalization, 1000);
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

function startWebsocket() {
    let url = 'ws://91.121.6.192:8010';
    ws = new WebSocket(url);
    ws.addEventListener('open', onWsOpen);
    ws.addEventListener('message', onWsMessage);
}

function onWsOpen() {
    sendPosition();
}

function onWsMessage(e) {
    let data = JSON.parse(e.data)

    //checking if received data is destinated to this application
    if (data.app && data.app == appName)
        positionMsgIn(data);
}

//update pozycji userów i dodawanie nowych
function positionMsgIn(data) {
    if (data.id == nick) return;
    if (!players["user" + data.id]) {
        players["user" + data.id] = new google.maps.Marker({
            position: {
                lat: data.lat,
                lng: data.lng
            },
            map: map,
            animation: google.maps.Animation.DROP,
            label: data.id
        })
    } else {
        players["user" + data.id].setPosition({
            lat: data.lat,
            lng: data.lng
        });
    }
}

function addEvents() {
    document.getElementById('map').addEventListener('mousemove', setMoveMarker)
}

let mousePos;
let markerIsMoving = false;
//śledzenie pozycji kursora i przesuwanie markera
function setMoveMarker(e) {
    mousePos = {
        x: e.layerX,
        y: e.layerY
    }
    if (!markerIsMoving) {
        markerIsMoving = true;
        moveMarker();
    }
}

let wsData;
const sendFrequency = 200; //częstotliwosc wysyłania danych
function sendPosition() {
    setTimeout(sendPosition, sendFrequency);
    if (wsData)
        ws.send(JSON.stringify(wsData));
}

const speed = 10; //prędkość markera
function moveMarker() {
    let lat = marker.getPosition().lat()
    let lng = marker.getPosition().lng()

    let mvValue = (1 / Math.pow(2, map.zoom)) * speed;

    //marker posiotion from map position to px position
    let markerPos = overlay.getProjection().fromLatLngToContainerPixel(marker.getPosition())

    //dystans miedzy markerem i kursorem
    let distance = {
        x: Math.abs(markerPos.x - mousePos.x),
        y: Math.abs(markerPos.y - mousePos.y)
    }

    //multiplier dependent on x and y difference
    let multiplier = {
        x: distance.x / (distance.x + distance.y),
        y: distance.y / (distance.x + distance.y)
    }

    //przesuwanie markera w strone kursora
    if (markerPos.x < mousePos.x) lng += mvValue * multiplier.x
    else if (markerPos.x > mousePos.x) lng -= mvValue * multiplier.x

    if (markerPos.y < mousePos.y) lat -= mvValue * multiplier.y
    else if (markerPos.y > mousePos.y) lat += mvValue * multiplier.y

    //update pozycji markera
    marker.setPosition({
        lat: lat,
        lng: lng
    })

    //dane do wysłania do serwera
    wsData = {
        app: appName,

        lat: lat,
        lng: lng,
        id: nick
    }

    //sprawdzanie dystansu
    let maxVal = 0.5;
    if (distance.x > maxVal && distance.y > maxVal)
        requestAnimationFrame(() => {
            moveMarker()
        })
    else
        markerIsMoving = false

}

//obsługa pola do ustawiania nicku
function showNickForm() {
    document.querySelector("#locInfo").style.display = "none";
    document.querySelector("#nicknameForm").style.display = "flex";
    document.querySelector("#nickSubmit").addEventListener('click', nickSubmit);
    window.addEventListener('keypress', (e) => {
        if (e.key == "Enter") nickSubmit();
    });
}

//ustawianie nicku gracza
function nickSubmit() {
    let formValue = document.querySelector("#nickField").value
    if (formValue == "") {
        document.querySelector("#errorBlock").innerHTML = "nickname can't be blank"
        document.querySelector("#errorBlock").style.maxHeight = "500px";
    } else {
        nick = formValue;
        marker.set('label', nick);
        document.querySelector("#lockScreen").style.display = "none";
    }
}