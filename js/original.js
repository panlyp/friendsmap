document.addEventListener('DOMContentLoaded', function () {
    init();
    fetchData();
});

var loaded = false;
var map;
var friends = {
    'type': 'FeatureCollection',
    'features': []
};
var iconSize = [60, 60];

/* Control visibility of elements */
function init() {
    if (loaded == false) {
        window.setTimeout(init, 100);
    } else {
        // Remove loading spinners
        var spinner = document.getElementById('spinner');
        spinner.remove();
        var mainComponent = document.getElementById('main');
        mainComponent.classList.remove('d-none');
        initMap();
        initFriendsList();
        addMarkers();
    };
};

/* Get data from api */
function fetchData() {
    const url = 'https://next.json-generator.com/api/json/get/41P1_UhSI'
    fetch(url)
        .then(res => res.json())
        .then(data => {
            // Sort friends by name
            data.sort((object1, object2) => {
                return object1.name.first > object2.name.first;
            })
            // Convert into Geojson format
            for (var i = 0; i < data.length; i++) {
                convert(data[i]);
            }
            loaded = true;
        }).catch((err) => {
            console.log(err);
        });
};

/* Setup map and control */
function initMap() {
    // Token with access restrictions
    mapboxgl.accessToken = 'pk.eyJ1Ijoic3V6dTAiLCJhIjoiY2thZHM4ZmZ2MDFwNDJ5dGU3YTgwY2N2ayJ9.n96QuUhk0Tbhb69iHd3gzw';
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [114.1535941, 22.3700556], // starting at Central
        zoom: 10 // starting zoom
    });
    map.addControl(new mapboxgl.NavigationControl());
};

/* Populate friends list */
function initFriendsList() {
    const list = document.getElementById('friend-list');
    friends.features.forEach(person => {
        var row = document.createElement('div');
        row.id = 'friends-' + person.properties.id;
        row.className = 'm-1 d-block justify-content-center';
        // Image
        var img = document.createElement('img');
        img.src = person.properties.picture;
        img.className = 'icon p-2';
        // Name
        var btn = document.createElement('button');
        btn.className = 'btn btn-light';
        btn.innerHTML = person.properties.name.first + " " + person.properties.name.last;

        btn.addEventListener('click', function (e) {
            click(person)
        });
        row.appendChild(img);
        row.appendChild(btn);
        list.appendChild(row);
    });
};

/* Convert json data to Geojson */
function convert(data) {
    // filter data with invalid lng / lat
    if (!data.location.longitude || !data.location.latitude) {
        return;
    }
    var person = {
        'type': 'Feature',
        'properties': {
            "id": data._id,
            "picture": data.picture || "https://placekitten.com/g/60",
            "name": {
                "first": data.name.first,
                "last": data.name.last
            },
            "email": data.email || "No email provided",
            'iconSize': iconSize
        },
        'geometry': {
            'type': 'Point',
            'coordinates': [data.location.longitude, data.location.latitude]
        }
    };
    friends['features'].push(person);
};

/* Add markers on map */
function addMarkers() {
    friends.features.forEach(marker => {
        let props = marker.properties;
        var el = document.createElement('div');
        el.id = props.id;
        el.className = 'marker border shadow';
        el.style.backgroundImage = 'url(' + props.picture + ')';
        el.style.width = props.iconSize[0] + 'px';
        el.style.height = props.iconSize[1] + 'px';

        // add marker to map
        new mapboxgl.Marker(el)
            .setLngLat(marker.geometry.coordinates)
            .addTo(map);
        // add event listener to marker
        el.addEventListener('click', function (e) {
            click(marker);
        });
    });
};

/* List of actions triggered when clicking on a person (button/marker) */
function click(person) {
    navigate(person);
    highlight(person);
    displayPopup(person);
}

/* Go to the person's position */
function navigate(person) {
    map.flyTo({
        center: person.geometry.coordinates,
        zoom: 12,
    });
};

/* Highlight the corresponing button in friend-list */
function highlight(person) {
    var friends = document.querySelectorAll('#friend-list > div');
    for (var i = 0; i < friends.length; i++) {
        // Highlight the current selection and remove highlights from other buttons
        var btn = friends[i].children[1]
        if (friends[i].id === 'friends-' + person.properties.id) {
            btn.className = 'btn btn-warning';
            btn.scrollIntoView({
                behavior: "smooth",
                block: 'center',
                inline: 'start'
            });
        } else {
            btn.className = 'btn btn-light';
        }
    };
};

/* Display a popup showing the person's info */
function displayPopup(person) {
    // remove the current popup
    var popups = document.getElementsByClassName('mapboxgl-popup');
    if (popups[0]) {
        popups[0].remove();
    }
    var props = person.properties;
    new mapboxgl.Popup({ offset: 25, closeOnClick: false })
        .setLngLat(person.geometry.coordinates)
        .setHTML(
            '<div class="name"><h5>' + props.name.first + ' ' + props.name.last + '</h5></div>' +
            '<div class="email"><a href="mailto:' + props.email + '">' + props.email + '</a>' + '</div>'
        ).addTo(map);
};