/**
 * Dependencies
 */

var d3 = require('./d3-hexbin');

/**
 *
 */

var hexbinSvg = null;
var hexbinGroup = null;

/**
 * Expose `render`
 */

module.exports = function render(surveys, map, opts) {
  if (hexbinSvg) {
    hexbinSvg.remove();
  }

  var height = opts.height || 500;
  var width = opts.width || window.innerWidth;

  window.map = map;
  window.overlayPane = map.getPanes().overlayPane;

  hexbinSvg = d3.select(map.getPanes().overlayPane)
    .append('svg')
    .attr('width', width * 2)
    .attr('height', height * 2);

  hexbinGroup = hexbinSvg.append('g').attr('class',
    'leaflet-zoom-hide hexagons');

  var map_projection = function(p) {
    p = map.latLngToLayerPoint(new L.LatLng(p[0], p[1]));
    return [p.x, p.y];
  };

  // Project the points
  surveys = surveys.map(function(v) {
    var p = map_projection([v.origin_lat, v.origin_lon]);
    p.color = 1;
    return p;
  }).concat(surveys.map(function(v) {
    var p = map_projection([v.destination_lat, v.destination_lon]);
    p.color = -1;
    return p;
  }));

  // Bin into hexagons
  var hexbin = d3.hexbin().size([width, height]).radius(opts.radius || 20);
  var bins = hexbin(surveys).sort(function(a, b) {
    return b.length - a.length;
  });

  var maxColor = -Infinity;
  var minColor = Infinity;
  bins.forEach(function(bin) {
    bin.color = bin.reduce(function(total, p) {
      return total + p.color;
    }, 0);
    if (bin.color > maxColor) maxColor = bin.color;
    if (bin.color < minColor) minColor = bin.color;
  });

  var color = d3.scale.sqrt()
    .domain([minColor, maxColor])
    .range([opts.dcolor || '#d9534f', opts.ocolor || '#428bca']);

  var radius = d3.scale.log()
    .base(2)
    .domain([1, (bins && bins[0] && bins[0].length) || 1])
    .range([0, opts.radius || 20]);

  hexbinGroup.selectAll('path')
    .data(bins)
    .enter()
    .append('path')
    .attr('d', function(d) {
      return hexbin.hexagon(radius(d.length));
    })
    .attr('transform', function(d) {
      return 'translate(' + d.x + ',' + d.y + ')';
    })
    .attr('fill', function(d) {
      return color(d.color);
    })
    .style('opacity', 0.75);
};
