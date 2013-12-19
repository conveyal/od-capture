/**
 * Dependencies
 */

var d3 = require('d3');
var filter = require('filter');
var minstache = require('minstache');
var template = minstache.compile(require('./vehicle-template.html'));
var toSlugCase = require('to-slug-case');

/**
 * Purposes
 */

var VEHICLES = ['AUV', 'Aircon Bus', 'Car', 'Jeepney (PUJ)', 'Non-Aircon Bus'];

/**
 * Expose `init`
 */

module.exports.init = function() {
  return d3.select('#vehicles')
    .selectAll('.vehicle')
    .data(VEHICLES, function(d) {
      return d;
    })
    .enter()
    .append('li')
    .attr('class', 'list-group-item vehicle')
    .html(function(d) {
      return template({
        vehicle: d,
        id: toSlugCase(d)
      });
    });
};

module.exports.filter = function() {
  var vehicleTypes = get();
  filter.dimensions.vehicle_type.filter(function(d) {
    return vehicleTypes.indexOf(d) !== -1;
  });
};

function get() {
  return VEHICLES.filter(function(purpose) {
    return $('#' + toSlugCase(purpose)).is(':checked');
  });
}

module.exports.setPercentage = function(group, total) {
  group.top(Infinity).forEach(function(d) {
    var value = ((d.value / total * 100) || 0).toFixed(1);
    if (!$('#' + toSlugCase(d.key)).is(':checked')) value = 0;
    $('#' + toSlugCase(d.key) + '-percentage').html(value + '%');
  });
};
