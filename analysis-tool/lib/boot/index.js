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
var purposes = require('./purposes');
var vehicles = require('./vehicles');

/**
 * Max Points
 */

var TOP = Infinity;

/**
 * Map height
 */

var MAP_HEIGHT = 400;

/**
 * Load default CSV & init
 */

processCsv(function(err, rows) {
  if (err) return window.alert(err);
  init(rows);
});

/**
 * Load
 */

function init(rows) {
  // load
  crossfilter.load(rows);

  // create dimensions
  crossfilter.create('origin_lat');
  crossfilter.create('origin_lon');
  crossfilter.create('destination_lat');
  crossfilter.create('destination_lon');
  crossfilter.create('origin_purpose');
  crossfilter.create('destination_purpose');
  crossfilter.create('vehicle_type');
  crossfilter.create('cost');
  crossfilter.create('distance');
  crossfilter.create('id');
  crossfilter.create('timeOfDay', function(d) {
    return timeOfDay(new Date(d.response_start_datetime).getUTCHours() * 60 +
      new Date(d.response_start_datetime)
      .getUTCMinutes()) / 60;
  });

  crossfilter.create('pip', function(d) {
    return JSON.stringify([
      [d.origin_lat, d.origin_lon],
      [d.destination_lat, d.destination_lon]
    ]);
  });

  var originPurposeGroup = crossfilter.dimensions.origin_purpose.group();
  var destinationPurposeGroup = crossfilter.dimensions.destination_purpose.group();
  var vehicleTypeGroup = crossfilter.dimensions.vehicle_type.group();

  // init map
  map.load(renderAll);

  // init charts
  var domCharts = initCharts(renderAll);

  // init purposes
  var purposeInputs = purposes.init();

  // init vehicle types
  var veichleInputs = vehicles.init();

  // reset all
  window.resetAll = function() {
    $('input').off();
    for (var i in crossfilter.dimensions) crossfilter.dimensions[i].filter(null);
    domCharts.each(function(chart) {
      chart.filter(null);
    });
    $('.chart .range').empty();
    $('.chart .reset').css('display', 'none');
    listenToInputChanges(renderAll);
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

    purposes.filter();
    vehicles.filter();

    domCharts.each(render);

    var records = d.top(TOP);
    var totalRecords = records.length;

    vehicles.setPercentage(vehicleTypeGroup, totalRecords);
    purposes.setPercentage('origin', originPurposeGroup, totalRecords);
    purposes.setPercentage('destination', destinationPurposeGroup,
      totalRecords);

    hexbin(records, {
      radius: parseInt($('input[name="radius"]').val(), 10),
      origins: $('input[name="show-origins-in-map"]').is(':checked'),
      destinations: $('input[name="show-destinations-in-map"]').is(':checked')
    });

    $('#total-surveys').html(d3.format(',')(totalRecords));

    function render(method) {
      d3.select(this).call(method);
    }
  }

  listenToInputChanges(renderAll);
}

/**
 * Listen to inptu changes
 */

function listenToInputChanges(renderAll) {
  $('input[name="show-origins-in-map"]').attr('checked', true);
  $('input[name="show-destinations-in-map"]').attr('checked', true);
  $('input[name="origin-in-map"]').attr('checked', false);
  $('input[name="destination-in-map"]').attr('checked', false);
  $('#purposes input').attr('checked', true);
  $('#vehicles input').attr('checked', true);

  $('input').on('change', function() {
    map.update();
    renderAll();
  });
}

/**
 * Manila Offset - Local Offset
 */

var TZ_OFFSET = 60 * 8; // - (new Date()).getTimezoneOffset();
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
 * Proxy the upload button to the file input
 */

$('#upload-button').on('click', function() {
  $('#upload').click();
});

/**
 * Handle CSV Upload
 */

window.handleUpload = function(file) {
  processCsv.upload(file, init);
};

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
