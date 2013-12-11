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
    debug('viewreset');

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
var olat = null, olon = null, dlat = null, dlon = null;
/**
 * Update Bounds filters
 */

function update() {
  if (!olat) {
    olat = filter.create('origin_lat');
    olon = filter.create('origin_lon');
    dlat = filter.create('destination_lat');
    dlon = filter.create('destination_lon');
  }

  var bounds = map.getBounds();

  var low = bounds.getSouthWest();
  var high = bounds.getNorthEast();

  debug('updating bounds filters [ %s, %s ] to [ %s, %s ]', low.lat, low.lng,
    high.lat, high.lng);

  if ($origin.is(':checked')) {
    olat.filter([low.lat, high.lat]);
    olon.filter([low.lng, high.lng]);
  } else {
    olat.filter(null);
    olon.filter(null);
  }

  if ($destination.is(':checked')) {
    dlat.filter([low.lat, high.lat]);
    dlon.filter([low.lng, high.lng]);
  } else if (filter.dimensions.destination_lat) {
    dlat.filter(null);
    dlon.filter(null);
  }
}
