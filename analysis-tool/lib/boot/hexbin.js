/**
 * Dependencies
 */

var d3 = require('./d3-hexbin');
var L = require('leaflet');
var map = require('map');

/**
 * Polygons
 */

var polys = [];

/**
 * Expose `render`
 */

module.exports = function (surveys) {
  polys.forEach(function (p) {
    map().removeLayer(p);
  });

  // convert surveys to sets of lat, lon points
  var mapped_surveys = surveys.map(function (v) {
    var p = [ v.origin_lon, v.origin_lat ];
    p.origin = 1;
    p.destination = 0;
    return p;
  }).concat(surveys.map(function (v) {
    var p = [v.destination_lon, v.destination_lat];
    p.origin = 0;
    p.destination = 1;
    return p;
  }));

  // get the map bounds
  var bounds = map().getBounds();
  var maxRadius = (bounds.getNorth() - bounds.getSouth()) / 19;

  // Hexbins!
  var hexbin = d3.hexbin().radius(maxRadius);
  var bins = hexbin(mapped_surveys).sort(function(a, b) {
    return b.length - a.length;
  });

  var color = getColorRange(bins);

  var radius = d3.scale.log()
    .domain([1, (bins && bins[0] && bins[0].length) || 1])
    .range([ 0, maxRadius ]);

  polys = bins.map(function (bin) {
    var r = radius(bin.length);
    var x = bin.x;
    var y = bin.y;
    var lls = hexbin.hexagon1(r).map(function (ll) {
      x += ll[0];
      y += ll[1];
      return [ y, x ];
    }).slice(1);

    return L.polygon(lls, {
      stroke: true,
      weight: 1,
      color: '#e5e5e5',
      fill: true,
      fillOpacity: 0.75,
      fillColor: color(bin.color)
    }).addTo(map()).bindLabel(bin.origins + ' origins - ' + bin.destinations + ' destinations');
  });
};

/**
 * Color range
 */

function getColorRange(bins) {
  var maxColor = -Infinity;
  var minColor = Infinity;
  bins.forEach(function(bin) {
    bin.origins = bin.reduce(function (total, p) {
      return total + p.origin;
    }, 1);
    bin.destinations = bin.reduce(function (total, p) {
      return total + p.destination;
    }, 1);

    if (bin.origins >= bin.destinations) {
      bin.color = bin.origins / bin.destinations;
    } else {
      bin.color = -(bin.destinations / bin.origins);
    }

    if (bin.color > maxColor) maxColor = bin.color;
    if (bin.color < minColor) minColor = bin.color;
  });

  console.log(minColor, maxColor);

  var color = d3.scale.sqrt()
    .domain([minColor, maxColor])
    .range(['#d9534f', '#428bca']);

  return color;
}
