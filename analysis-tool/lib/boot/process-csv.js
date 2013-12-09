/**
 * Dependencies
 */

var d3 = require('d3');
var haversine = require('haversine');

/**
 * Expose `process`
 */

module.exports = function process(cb) {
  d3.csv('data/surveysall.csv')
    .row(function(d) {
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
        response_end_datetime: new Date(d.response_end_datetime),
        response_start_datetime: new Date(d.response_start_datetime),
        route: d.route,
        study_id: d.study_id,
        survey_end_datetime: new Date(d.survey_end_datetime),
        survey_lat: +d.survey_lat,
        survey_lon: +d.survey_lon,
        survey_start_datetime: new Date(d.survey_start_datetime),
        surveyor: d.surveyor,
        vehicle_count: +d.vehicle_count,
        vehicle_type: d.vehicle_type,
        vehicle_types: d.vehicle_types
      };

      data.distance = haversine(data.origin_lat, data.origin_lon, data.destination_lat,
        data.destination_lon);
      data.response_length = (data.response_end_datetime - data.response_start_datetime) /
        (1000 * 60);
      data.survey_length = (data.survey_end_datetime - data.survey_start_datetime) /
        (1000 * 60);

      return data;
    })
    .get(cb);
};
