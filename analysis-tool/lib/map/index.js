/**
 * Dependencies
 */

var debug = require('debug')('map');
var filter = require('filter');
var L = require('leaflet');

/**
 * Global map
 */

var map = null;

/**
 * Expose `map`
 */

module.exports = function() {
  return map;
};

/**
 * Expose `load`
 */

module.exports.load = function(render) {
  map = L.mapbox.map('map', 'conveyal.gepida3i', {
    touchZoom: false,
    scrollWheelZoom: false,
  }).setView([14.5630, 121.0535], 9);

  map.on('viewreset', function() {
    debug('map viewreset');

    update();
    render();
  });

  return map;
};

/**
 * Expose `update`
 */

module.exports.update = update;

/**
 * Within map bounds?
 */

var $origin = $('input[name="origin-in-map"]');
var $destination = $('input[name="destination-in-map"]');

/**
 * Update Bounds filters
 */

function update() {
  var bounds = map.getBounds();

  var low = bounds.getSouthWest();
  var high = bounds.getNorthEast();

  debug('updating map bounds filters [ %s, %s ] to [ %s, %s ]', low.lat, low.lng,
    high.lat, high.lng);

  if ($origin.is(':checked')) {
    var olat = filter.create('origin_lat');
    var olon = filter.create('origin_lon');

    olat.filter([low.lat, high.lat]);
    olon.filter([low.lng, high.lng]);
  } else if (filter.dimensions.origin_lat) {
    filter.dimensions.origin_lat.dispose();
    filter.dimensions.origin_lon.dispose();
  }

  if ($destination.is(':checked')) {
    var dlat = filter.create('destination_lat');
    var dlon = filter.create('destination_lon');

    dlat.filter([low.lat, high.lat]);
    dlon.filter([low.lng, high.lng]);
  } else if (filter.dimensions.destination_lat) {
    filter.dimensions.destination_lat.dispose();
    filter.dimensions.destination_lon.dispose();
  }
}
