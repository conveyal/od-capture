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
 * Manager
 */

module.exports = function(surveys) {
  // map
  var m = map();

  // remove all existing polys from the map
  polys.forEach(m.removeLayer.bind(m));

  // convert surveys to sets of lat, lon points
  var mapped_surveys = surveys.map(function(v) {
    var p = [v.origin_lon, v.origin_lat];
    p.origin = 1;
    p.destination = 0;
    return p;
  }).concat(surveys.map(function(v) {
    var p = [v.destination_lon, v.destination_lat];
    p.origin = 0;
    p.destination = 1;
    return p;
  }));

  // get the map bounds
  var bounds = m.getBounds();
  var maxRadius = (bounds.getNorth() - bounds.getSouth()) / 19;

  polys = createHexbins(mapped_surveys, maxRadius, function(bins) {
    return d3.scale.log()
      .domain([1, (bins && bins[0] && bins[0].length) || 1])
      .range([maxRadius / 5, maxRadius]);
  }, getColorRange);

  polys.forEach(function(p) {
    p.addTo(m);
    p.on('click', function() {
      L.popup({
        closeButton: false
      })
        .setLatLng([p.bin.y, p.bin.x])
        .setContent(
          '<a href="javascript:pointsInPolygon(' + JSON.stringify(p.bin.latLngs) +
          ')" title="Only surveys that originated from this hexagon">' + p.bin
          .origins +
          '</a> O<br><a href="javascript:pointsInPolygon(' + JSON.stringify(
            p.bin.latLngs) +
          ', true)" title="Only show surveys that ended in this hexagon">' +
          p.bin.destinations + '</a> D')
        .openOn(m);
    });
  });
};

/**
 * Expose `render`
 */

function createHexbins(data, max, rscale, cscale) {
  // Hexbins!
  var hexbin = d3.hexbin().radius(max);
  var bins = hexbin(data).sort(function(a, b) {
    return b.length - a.length;
  });

  rscale = rscale(bins);
  cscale = cscale(bins);

  return bins.map(function(bin) {
    var x = bin.x;
    var y = bin.y;
    var lls = hexbin.hexagon1(rscale(bin.length)).map(function(ll) {
      x += ll[0];
      y += ll[1];
      return [y, x];
    }).slice(1);

    // create the polygon
    var poly = L.polygon(lls, {
      stroke: true,
      weight: 1,
      color: '#e5e5e5',
      fill: true,
      fillOpacity: 0.75,
      fillColor: cscale(bin.color)
    });

    x = bin.x;
    y = bin.y;
    var maxlls = hexbin.hexagon1(max).map(function(ll) {
      x += ll[0];
      y += ll[1];
      return [y, x];
    }).slice(1);

    // attach the bin
    poly.bin = {
      x: bin.x,
      y: bin.y,
      color: bin.color - 1,
      origins: bin.origins - 1,
      destinations: bin.destinations,
      latLngs: maxlls
    };

    return poly;
  });
}

/**
 * Color range
 */

function getColorRange(bins) {
  var maxColor = -Infinity;
  var minColor = Infinity;
  bins.forEach(function(bin) {
    bin.origins = bin.reduce(function(total, p) {
      return total + p.origin;
    }, 1);
    bin.destinations = bin.reduce(function(total, p) {
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

  var color = d3.scale.sqrt()
    .domain([minColor, maxColor])
    .range(['#d9534f', '#428bca']);

  return color;
}
