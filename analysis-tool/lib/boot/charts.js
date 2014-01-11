/**
 * Dependencies
 */

var barchart = require('./barchart');
var crossfilter = require('filter');
var d3 = require('d3');

/**
 * Init charts
 */

module.exports = function init(render) {
  $('.charts').empty();

  var dimensions = crossfilter.dimensions;

  // build groupings for the charts
  var groupings = [{
    name: 'Cost',
    dimension: dimensions.cost,
    group: dimensions.cost.group(function(d) {
      return Math.round(d / 5) * 5;
    }),
    max: 150
  }, {
    name: 'Distance',
    dimension: dimensions.distance,
    group: dimensions.distance.group(function(d) {
      return Math.round(d / 5) * 5;
    }),
    max: 100
  }, {
    name: 'Time',
    dimension: dimensions.timeOfDay,
    group: dimensions.timeOfDay.group(function(d) {
      return Math.floor(d);
    }),
    max: 24
  }];

  var charts = [];
  groupings.forEach(function(g, i) {
    $('.charts').append('<div class="chart chart-' + i +
      ' col-lg-4 col-md-4 col-sm-6"><h3 class="title">' + g.name +
      ' <span class="range"></span> <a href="javascript:resetChart(' + i +
      ')" class="reset">reset</a></h3></div>');

    charts.push(barchart()
      .dimension(g.dimension)
      .group(g.group)
      .x(d3.scale.linear()
        .domain([0, g.max])
        .rangeRound([0, 260])
      ));
  });

  charts[2].displayRange(function(from, to) {
    return [floatToTime(from), floatToTime(to)];
  });

  // listen to resets
  window.resetChart = function(i) {
    $('.chart-' + i + ' .range').empty();
    $('.chart-' + i + ' .reset').css('display', 'none');
    charts[i].filter(null);
    render();
  };

  // bind charts to dom
  var domCharts = d3.selectAll('.chart')
    .data(charts)
    .each(function(chart) {
      chart.on('brush', function() {
        render(chart.dimension());
      }).on('brushend', function() {
        render(chart.dimension());
      });
    });

  return domCharts;
};

/**
 *
 */

function floatToTime(f) {
  var hours = Math.floor(f);
  var minutes = Math.floor((f - hours) * 60);
  if (hours < 10) hours = '0' + hours;
  if (minutes < 10) minutes = '0' + minutes;
  return hours + ':' + minutes;
}
