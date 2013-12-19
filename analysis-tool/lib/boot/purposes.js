/**
 * Dependencies
 */

var d3 = require('d3');
var filter = require('filter');
var minstache = require('minstache');
var template = minstache.compile(require('./purpose-template.html'));

/**
 * Purposes
 */

var PURPOSES = ['Home', 'Work', 'Social', 'Education', 'Shopping', 'Healthcare',
  'Other'
];

/**
 * Expose `init`
 */

module.exports.init = function() {
  return d3.select('#purposes')
    .selectAll('.purpose')
    .data(PURPOSES, function(d) {
      return d;
    })
    .enter()
    .append('li')
    .attr('class', 'list-group-item purpose')
    .html(function(d) {
      return template({
        purpose: d
      });
    });
};

module.exports.filter = function() {
  var originPurposes = get('origin');
  filter.dimensions.origin_purpose.filter(function(d) {
    return originPurposes.indexOf(d) !== -1;
  });

  var destinationPurposes = get('destination');
  filter.dimensions.destination_purpose.filter(function(d) {
    return destinationPurposes.indexOf(d) !== -1;
  });
};

function get(type) {
  return PURPOSES.filter(function(purpose) {
    return $('#' + purpose + '-' + type).is(':checked');
  });
}

module.exports.setPercentage = function(type, group, total) {
  group.top(Infinity).forEach(function(d) {
    var value = ((d.value / total * 100) || 0).toFixed(1);
    if (!$('#' + d.key + '-' + type).is(':checked')) value = 0;
    $('#' + d.key + '-' + type + '-percentage').html(value + '%');
  });
};
