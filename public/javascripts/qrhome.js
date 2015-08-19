/**
 * Created by mitch on 8/16/15.
 */

var coordPortland = {lat: 45.5424364,lng: -122.654422};


function tweakLocation(map) {

    // check whether the browser supports W3C geolocation
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            usersLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            centerMap(map, usersLocation, "Your Location");
        }, function() {
            centerMap(map, coordPortland, "Approximate Location", "Sorry, we couldn't figure out where you are, so we're assuming you're in Portland.");
        })
    }
    else {
        centerMap(map, coordPortland, "Lovely Portland", "Sorry, your browser doesn't support geolocation, so we're putting you in Portland.");
    }
}

function centerMap(map, onLocation, withMarker, errMsg) {
    map.setCenter(onLocation);
    var infoWindow = new google.maps.InfoWindow({map: map});
    infoWindow.setPosition(onLocation);
    infoWindow.setContent(withMarker);
    if(typeof errMsg !== "undefined")
        alert(errMsg);
}
