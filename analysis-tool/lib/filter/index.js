/**
 * Dependencies
 */

var crossfilter = require('crossfilter').crossfilter;

/**
 * Expose `filter`
 */

exports.filter = null;

/**
 * Expose `dimensions`
 */

var dimensions = exports.dimensions = {};

/**
 * Expose `load`
 */

exports.load = function load(rows) {
  exports.filter = crossfilter(rows);
  return exports.filter;
};

/**
 * Expose `create`
 */

module.exports.create = function create(t, fn) {
  if (dimensions[t]) dimensions[t].dispose();
  if (fn) {
    dimensions[t] = exports.filter.dimension(fn);
  } else {
    dimensions[t] = exports.filter.dimension(function(d) {
      return d[t];
    });
  }
  return dimensions[t];
};