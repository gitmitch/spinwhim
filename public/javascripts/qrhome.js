
/*

TODO:

add sliders for radius and range

discard place pages if the map center has moved in the meantime

 */




var coordPortland = {lat: 45.5424364,lng: -122.654422};

var innerCircle = null;
var doughnut = null;
var markers = [];

var homeLocation = coordPortland;

var curLowerBound = DEFAULT_LOWER;
var curUpperBound = DEFAULT_UPPER;

var homeMarker = null;


function tweakLocation(map) {

    // check whether the browser supports W3C geolocation
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            homeLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            centerMap(map, "Your Location");
        }, function() {
            centerMap(map, "Approximate Location", "Sorry, we couldn't figure out where you are, so we're assuming you're in Portland.");
        })
    }
    else {
        centerMap(map, "Lovely Portland", "Sorry, your browser doesn't support geolocation, so we're putting you in Portland.");
    }
}

function initSlider() {
    var slider = $("#range")[0];
    //var slider = document.getElementById('range');
    noUiSlider.create(slider, {
        start: [DEFAULT_LOWER, DEFAULT_UPPER], // Handle start position
        step: 0.25, // Slider moves in increments of '10'
        margin: 1, // Handles must be more than '20' apart
        connect: true, // Display a colored bar between the handles
        direction: 'ltr', // Put '0' at the bottom of the slider
        orientation: 'horizontal', // Orient the slider vertically
        behaviour: 'tap-drag', // Move handle on tap, bar is draggable
        range: { // Slider can select '0' to '100'
            'min': ABSOLUTE_LOWER,
            'max': ABSOLUTE_UPPER
        }
    });

    var lowerBound = $("#lowerBound")[0],
        upperBound = $("#upperBound")[0];

    slider.noUiSlider.on('update', function(values, handle) {
        if(handle == 0)
            lowerBound.innerHTML = values[handle].toString() + " mi";
        else
            upperBound.innerHTML = values[handle].toString() + " mi";

        //updateRadius(values[0], values[1]);

    });

    slider.noUiSlider.on('change', function(values, handle) {
        updateRadius(values[0], values[1], true);
    })

    slider.noUiSlider.on('slide', function(values, handle) {
        updateRadius(values[0], values[1], false);
    })
}





function centerMap(map, withMarker, errMsg) {
    map.setCenter(homeLocation);

    homeMarker = new google.maps.Marker({
        position: homeLocation,
        map: map,
        title: withMarker,
        draggable: true,
        icon: '/images/bikeicon.png'
    })

    google.maps.event.addListener(homeMarker, 'dragend', function() {
        clearAllMarkers();
        homeLocation = this.position;
        doughnut.moveTo(this.position);
        updateBounds();
        showDestinations(map, this.position, ['park'], fromMilesToMeters(curLowerBound), fromMilesToMeters(curUpperBound));
    });

    google.maps.event.addListener(homeMarker, 'drag', function() {
        homeLocation = this.position;
        doughnut.moveTo(this.position);
    })



    showDestinations(map, homeLocation, ['park'], fromMilesToMeters(curLowerBound), fromMilesToMeters(curUpperBound));
    drawMask(map, homeLocation, fromMilesToMeters(curLowerBound), fromMilesToMeters(curUpperBound), true);

}

function updateBounds() {
    var bounds = new google.maps.LatLngBounds();
    bounds.extend(google.maps.geometry.spherical.computeOffset(homeLocation, fromMilesToMeters(curUpperBound), 0));
    bounds.extend(google.maps.geometry.spherical.computeOffset(homeLocation, fromMilesToMeters(curUpperBound), 180));
    map.fitBounds(bounds);
}

function updateRadius(lowerBound, upperBound, searchAgain) {
    if(searchAgain === undefined)
        searchAgain = false;

    curLowerBound = lowerBound;
    curUpperBound = upperBound;

    drawMask(map, homeLocation, fromMilesToMeters(curLowerBound), fromMilesToMeters(curUpperBound), true);

    if(searchAgain) {
        clearAllMarkers();
        showDestinations(map, homeLocation, ['park'], fromMilesToMeters(curLowerBound), fromMilesToMeters(curUpperBound));
    }
}




function showDestinations(map, searchFrom, types, fromRadius, toRadius) {
    var service = new google.maps.places.PlacesService(map);

    var pageNum = 1;

    service.nearbySearch({
        location: searchFrom,
        radius: toRadius,
        types: types
    }, function(results, status, pagination) {


        if(status === google.maps.places.PlacesServiceStatus.OK) {
            for(var i=0; i < results.length; i++) {
                var distance = google.maps.geometry.spherical.computeDistanceBetween(searchFrom, results[i].geometry.location);
                if(distance >= fromRadius && distance <= toRadius)
                    addMarkerForPlace(map, results[i]);
            }
            if(pagination.hasNextPage) {
                pageNum++;
                pagination.nextPage();
            }
        }
        else {
            console.log("place search wasn't OK");
        }
    })


}

function addMarkerForPlace(map, place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    marker.addListener('click', function() {
        // thanks to http://stackoverflow.com/questions/13044805/how-to-check-if-an-app-is-installed-from-a-web-page-on-an-iphone

        var position = this.position;

        // open the web URL if the app URL didn't go anywhere
        var now = new Date().valueOf();
        setTimeout(function() {
            if(new Date().valueOf() - now > 1000) return;
            window.open(getWebDirectionsURL(homeLocation, position), "_blank");
        }, 25);

        window.location = getIosDirectionsURL(position);
    })

    markers.push(marker);
}


function getWebDirectionsURL(fromCoord, toCoord) {
    return "https://" + getDirectionsURLFragment(fromCoord, toCoord);
}

function getIosDirectionsURL(toCoord) {
    //return "comgooglemaps://" + getDirectionsURLFragment(fromCoord, toCoord);

    return "comgooglemaps://?daddr="
        + toCoord.lat().toString() + "," + toCoord.lng().toString()
        + "&directionsmode=bicycling";
}

function getDirectionsURLFragment(fromCoord, toCoord) {
    return "www.google.com/maps/dir/"
        + fromCoord.lat().toString() + "," + fromCoord.lng().toString()
        + "/" + toCoord.lat().toString() + "," + toCoord.lng().toString()
        + "/data=!3m1!4b1!4m2!4m1!3e1!5m1!1e3";
}


function clearAllMarkers() {
    for(var i=0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function drawMask(map, center, innerRadius, outerRadius, changeBounds) {

    if(innerCircle !== null)
        innerCircle.setMap(null);
    if(doughnut !== null)
        doughnut.setMap(null);

    drawDoughnut(map, center, outerRadius, outerRadius * 10);

    innerCircle = new google.maps.Circle({
        strokeWeight: 0,
        fillColor: "#999",
        fillOpacity: 0.45,
        map: map,
        center: center,
        radius: innerRadius
    });

    if(changeBounds !== undefined && changeBounds)
        updateBounds();

    innerCircle.bindTo("center", homeMarker, "position");

}


// how to draw a doughnut: http://stackoverflow.com/questions/14397874/draw-ring-not-circle-in-google-maps-api


function getCirclePoints(center, radius, numPoints, clockwise) {
    var points = [];
    for (var i = 0; i < numPoints; ++i) {
        var angle = i * 360 / numPoints;
        if (!clockwise) {
            angle = 360 - angle;
        }

        // the maps API provides geometrical computations
        // just make sure you load the required library (libraries=geometry)
        var p = google.maps.geometry.spherical.computeOffset(center, radius, angle);
        points.push(p);
    }

    // 'close' the polygon
    points.push(points[0]);
    return points;
}

function drawDoughnut(map, center, innerRadius, outerRadius) {

    var numPoints = 32;

    doughnut = new google.maps.Polygon({
        paths: [
            getCirclePoints(center, outerRadius, numPoints, true),
            getCirclePoints(center, innerRadius, numPoints, false)
        ],
        //strokeColor: "#666666",
        //strokeOpacity: 0.8,
        strokeWeight: 0,
        fillColor: "#999",
        fillOpacity: 0.45
    });

    doughnut.setMap(map);

}


