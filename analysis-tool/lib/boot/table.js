/**
 * Dependencies
 */

var d3 = require('d3');
var toTitleCase = require('to-title-case');

/**
 * Expose `Table`
 */

module.exports = Table;

/**
 * Init table
 */

function Table(el, keys) {
  this.el = d3.select(el);
  this.el.select('thead tr')
    .selectAll('th')
    .data(keys)
    .enter()
    .append('th')
    .text(function(d) {
      return toTitleCase(d);
    });
}

/**
 * Render the list
 */

Table.prototype.render = function(list) {
  var table = this.el.select('tbody');
  table.selectAll('tr').remove();

  var datum = table
    .selectAll('tr')
    .data(list);

  var tr = datum.enter().append('tr');
  var td = tr.selectAll('td')
    .data(function(d) {
      var data = [];
      for (var k in d) {
        data.push(d[k]);
      }
      return data;
    })
    .enter()
    .append('td')
    .text(function(d) {
      return d;
    });
};
