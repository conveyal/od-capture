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
 * Purposes
 */

var PURPOSES = ['Home', 'Work', 'Social', 'Education', 'Shopping', 'Healthcare',
  'Other'
];

/**
 * Load
 */

processCsv(function(err, rows) {
  if (err) return window.alert(err);

  // load
  crossfilter.load(rows);

  // create dimensions
  crossfilter.create('origin_lat');
  crossfilter.create('origin_lon');
  crossfilter.create('destination_lat');
  crossfilter.create('destination_lon');
  crossfilter.create('cost');
  crossfilter.create('distance');
  crossfilter.create('id');
  crossfilter.create('timeOfDay', function(d) {
    return timeOfDay(new Date(d.response_start_datetime).getHours() * 60 +
      new Date(d.response_start_datetime)
      .getMinutes()) / 60;
  });
  crossfilter.create('pip', function(d) {
    return JSON.stringify([
      [d.origin_lat, d.origin_lon],
      [d.destination_lat, d.destination_lon]
    ]);
  });

  // init map
  map.load(renderAll);

  // initialize select boxes
  var selects = initPurposeSelects(renderAll);

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

  window.resetAll = function() {
    for (var i in crossfilter.dimensions) {
      crossfilter.dimensions[i].filter(null);
    }

    $('input[type="checkbox"]').attr('checked', null);

    selects.forEach(function(sel) {
      var selected = sel.values();
      PURPOSES.filter(function(purpose) {
        return selected.indexOf(purpose) == -1;
      }).forEach(function(purpose) {
        sel.select(purpose);
      });
    });

    renderAll();
  };

  window.pointsInPolygon = function(lls, destination) {
    debug('filtering points in polygon');

    map().closePopup();

    var bounds = lls.reduce(function(mm, ll) {
      if (ll[0] < mm[0][0]) mm[0][0] = ll[0];
      if (ll[0] > mm[1][0]) mm[1][0] = ll[0];
      if (ll[1] < mm[0][1]) mm[0][1] = ll[1];
      if (ll[1] > mm[1][1]) mm[1][1] = ll[1];
      return mm;
    }, [
      [Infinity, Infinity],
      [-Infinity, -Infinity]
    ]);

    crossfilter.dimensions.pip.filter(function(d) {
      var lls = JSON.parse(d);
      var ll = destination ? lls[1] : lls[0];
      return latLngInBounds(ll, bounds);
    });

    renderAll();
  };

  // render
  renderAll();

  // Whenever the brush moves, re-rendering everything.
  function renderAll(d) {
    debug('rendering everything');

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

function initPurposeSelects(fn) {
  var $el = document.getElementById('purpose-selection');
  return ['Origin', 'Destination'].map(function(type) {
    var select = Select().label(type).multiple();

    PURPOSES.forEach(function(purpose, i) {
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

    return select;
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
 * In bounds?
 *
 * @param {Array} lat, lon point
 * @param {Array} two lat, lon points.
 */

function latLngInBounds(ll, bounds) {
  var lat0 = bounds[0][0];
  var lat1 = bounds[1][0];
  var lon0 = bounds[0][1];
  var lon1 = bounds[1][1];

  var temp;
  if (lat0 > lat1) {
    temp = lat0;
    lat0 = lat1;
    lat1 = temp;
  }

  if (lon0 > lon1) {
    temp = lon0;
    lon0 = lon1;
    lon1 = temp;
  }

  return lat0 <= ll[0] && lon0 <= ll[1] && lat1 >= ll[0] && lon1 >= ll[1];
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
    var blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8'
    });

    saveAs(blob, 'surveys.csv');

    $(event.target).button('reset');
  });
})();
