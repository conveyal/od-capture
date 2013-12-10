/**
 * Dependencies
 */

var initCharts = require('./charts');
var crossfilter = require('filter');
var d3 = require('d3');
var debug = require('debug')('boot');
var encode = require('base64-encode');
var hexbin = require('./hexbin');
var map = require('map');
var processCsv = require('./process-csv');
var Select = require('select');
var Table = require('./table');

/**
 * Max Points
 */

var TOP = Infinity;

/**
 * Map height
 */

var MAP_HEIGHT = 400;

/**
 * Load
 */

processCsv(function(err, rows) {
  if (err) return window.alert(err);

  // load
  crossfilter.load(rows);

  // init map
  map.load(renderAll);

  // initialize select boxes
  initPurposeSelects(renderAll);

  // create dimensions
  crossfilter.create('cost');
  crossfilter.create('distance');
  crossfilter.create('id');
  crossfilter.create('timeOfDay', function(d) {
    return timeOfDay(new Date(d.response_start_datetime).getHours() * 60 + new Date(d.response_start_datetime)
      .getMinutes()) / 60;
  });

  // init charts
  var charts = initCharts(crossfilter.dimensions);

  // init table
  var table = new Table('#survey-table', Object.keys(crossfilter.dimensions.id
    .top(1)[0]));

  // listen to checkbox changes
  listenToCheckboxes(renderAll);

  // bind charts to dom
  var domCharts = d3.selectAll('.chart')
    .data(charts)
    .each(function(chart) {
      chart.on('brush', function() {
        renderAll(chart.dimension());
      }).on('brushend', function() {
        renderAll(chart.dimension());
      });
    });

  // listen to resets
  window.reset = function(i) {
    $('.chart-' + i + ' .range').empty();
    $('.chart-' + i + ' .reset').css('display', 'none');
    charts[i].filter(null);
    renderAll();
  };

  // render
  renderAll();

  // Whenever the brush moves, re-rendering everything.
  function renderAll(d) {
    d = d || crossfilter.dimensions.id;

    domCharts.each(render);

    hexbin(d.top(TOP), {
      height: MAP_HEIGHT,
      width: window.innerWidth,
      radius: 20,
      ocolor: '#428bca',
      dcolor: '#d9534f'
    });

    table.render(d.top(10));

    $('#total-surveys').html(d3.format(',')(d.top(TOP).length));

    function render(method) {
      d3.select(this).call(method);
    }
  }
});

/**
 * Listen to OD checkboxes
 */

function listenToCheckboxes(renderAll) {
  $('input[type="checkbox"]').on('change', function() {
    map.update();
    renderAll();
  });
}

/**
 * Init Selects
 */

var purposes = ['Home', 'Work', 'Social', 'Education', 'Shopping', 'Healthcare',
  'Other'
];

function initPurposeSelects(fn) {
  var $el = document.getElementById('purpose-selection');
  ['Origin', 'Destination'].forEach(function(type) {
    var select = Select().label(type).multiple();

    purposes.forEach(function(purpose, i) {
      select.add(purpose, purpose).select(purpose);
    });

    $el.appendChild(select.el);

    select.on('change', function(select) {
      var name = type.toLowerCase() + '_purpose';
      var values = select.values();
      var dimension = crossfilter.create(name);

      dimension.filter(function(d) {
        return values.indexOf(d) !== -1;
      });

      fn(dimension);
    });
  });
}

/**
 * Manila Offset - Local Offset
 */

var TZ_OFFSET = 60 * 8 - (new Date()).getTimezoneOffset();
var H24 = 60 * 24;

/**
 * Time in hours
 */

function timeOfDay(minutes) {
  minutes += TZ_OFFSET;
  if (minutes >= H24) return minutes - H24;
  if (minutes < 0) return minutes + H24;
  return minutes;
}

/**
 * On download
 */

(function() {
  var Blob = window.Blob;
  var saveAs = window.saveAs;
  var $d = $('#download');
  var downloading = false;
  $d.on('click', function(event) {
    $(event.target).button('loading');

    var data = crossfilter.dimensions.id.top(TOP);
    var csv = d3.csv.format(data);
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

    saveAs(blob, 'surveys.csv');

    $(event.target).button('reset');
  });
})();
