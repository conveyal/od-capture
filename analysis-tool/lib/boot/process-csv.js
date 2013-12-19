/**
 * Dependencies
 */

var d3 = require('d3');
var debug = require('debug')('process-csv');
var haversine = require('haversine');

/**
 * Expose `loadDefault`
 */

module.exports = function loadDefault(cb) {
  d3.csv('data/surveysall.csv')
    .row(parseRow)
    .get(cb);
};

/**
 * Expose `upload`
 */

module.exports.upload = function upload(file, cb) {
  debug('upload file %s', file.name);
  var reader = new FileReader();
  reader.onload = function(e) {
    cb(d3.csv.parse(e.target.result, parseRow));
  };

  reader.readAsText(file);
};

/**
 * Function to process a row
 */

function parseRow(d) {
  var data = {
    capacity: +d.capacity,
    cost: +d.cost,
    destination_lat: +d.destination_lat,
    destination_lon: +d.destination_lon,
    destination_purpose: d.destination_purpose,
    destination_terminal: d.destination_terminal,
    device_id: d.device_id,
    device_name: d.device_name,
    frequency: d.frequency,
    id: d.id,
    notes: d.notes,
    origin_lat: +d.origin_lat,
    origin_lon: +d.origin_lon,
    origin_purpose: d.origin_purpose,
    origin_terminal: d.origin_terminal,
    response_end_datetime: d.response_end_datetime,
    response_start_datetime: d.response_start_datetime,
    route: d.route,
    study_id: d.study_id,
    survey_end_datetime: d.survey_end_datetime,
    survey_lat: +d.survey_lat,
    survey_lon: +d.survey_lon,
    survey_start_datetime: d.survey_start_datetime,
    surveyor: d.surveyor,
    vehicle_count: +d.vehicle_count,
    vehicle_type: d.vehicle_type,
    vehicle_types: d.vehicle_types
  };

  data.distance = haversine(data.origin_lat, data.origin_lon, data.destination_lat,
    data.destination_lon);

  return data;
}
