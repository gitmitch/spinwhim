
/*

TODO:

set map bounds based on location and radius, and update whenever those change

add sliders for radius and range

discard place pages if the map center has moved in the meantime



 */




var coordPortland = {lat: 45.5424364,lng: -122.654422};

var innerCircle = null;
var doughnut = null;
var markers = [];

var homeLocation = coordPortland;


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

function centerMap(map, withMarker, errMsg) {
    map.setCenter(homeLocation);

    var marker = new google.maps.Marker({
        position: homeLocation,
        map: map,
        title: withMarker,
        draggable: true,
        icon: '/images/bikeicon.png'
    })

    google.maps.event.addListener(marker, 'dragend', function() {
        clearAllMarkers();
        innerCircle.setMap(null);
        innerCircle = null;
        doughnut.setMap(null);
        doughnut = null;
        homeLocation = this.position;
        showDestinations(map, this.position, ['park'], 9656*0.8, 9656);
    });

    google.maps.event.addListener(marker, 'drag', function() {
        innerCircle.setMap(null);
        innerCircle = null;
        doughnut.setMap(null);
        doughnut = null;
        homeLocation = this.position;
        drawMask(map, this.position, 9656 * 0.8, 9656);
    })

    //var infoWindow = new google.maps.InfoWindow({map: map});
    //infoWindow.setPosition(onLocation);
    //infoWindow.setContent(withMarker);
    //if(typeof errMsg !== "undefined")
    //    alert(errMsg);


    showDestinations(map, homeLocation, ['park'], 9656 * 0.8, 9656);


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

    drawMask(map, searchFrom, fromRadius, toRadius);
}

function addMarkerForPlace(map, place) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    marker.addListener('click', function() {
        window.open(getDirectionsURL(homeLocation, this.position), "_blank");
    })

    markers.push(marker);
}


function getDirectionsURL(fromCoord, toCoord) {
    return "https://www.google.com/maps/dir/"
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

function drawMask(map, center, innerRadius, outerRadius) {
    drawDoughnut(map, center, outerRadius, outerRadius * 10);

    innerCircle = new google.maps.Circle({
        strokeWeight: 0,
        fillColor: "#999",
        fillOpacity: 0.45,
        map: map,
        center: center,
        radius: innerRadius
    });
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


