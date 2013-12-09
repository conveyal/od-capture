/**
 * Dependencies
 */

var barchart = require('./barchart');
var d3 = require('d3');

/**
 * Init charts
 */

module.exports = function init(dimensions) {
  // build groupings for the charts
  var groupings = [{
    name: 'Cost',
    dimension: dimensions.cost,
    group: dimensions.cost.group(function(d) {
      return d;
    }),
    max: 150
  }, {
    name: 'Distance',
    dimension: dimensions.distance,
    group: dimensions.distance.group(function(d) {
      return +d.toFixed(2);
    }),
    max: 100
  }, {
    name: 'Time',
    dimension: dimensions.timeOfDay,
    group: dimensions.timeOfDay.group(function(d) {
      return +d.toFixed(2);
    }),
    max: 24
  }];

  var charts = [];
  groupings.forEach(function(g, i) {
    $('.charts').append('<div class="chart chart-' + i +
      ' col-lg-4 col-md-4 col-sm-4"><h3 class="title">' + g.name +
      ' <span class="range"></span> <a href="javascript:reset(' + i +
      ')" class="reset">reset</a></h3></div>');

    charts.push(barchart()
      .dimension(g.dimension)
      .group(g.group)
      .x(d3.scale.linear()
        .domain([g.min || 0, g.max])
        .range([0, 300])
      ));
  });

  return charts;
};
