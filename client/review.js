/*globals Backbone _ */

var OdCapture = OdCapture || {};

(function(NS) {

  NS.SurveyCollectionView = Backbone.View.extend({


  	events : {

  		'click .survey-delete-link' : 'deleteSurvey',
  		'click .survey-map-link' : 'mapSurvey',
  		'click .survey-csv-link' : 'csvSurvey'

  	},

  	initialize : function () {

  		_.bindAll(this, 'render', 'loadData', 'deleteSurvey', 'mapSurvey', 'csvSurvey');

  		$('.survey-map-link').on('click', this.mapSurvey);
  		$('.survey-csv-link').on('click', this.csvSurvey);

  		this.collection = new NS.RemoteSurveyCollection();

  		this.loadData();

  		this.surveyItemTpl = Handlebars.compile($('#survey-item-tpl').html());

  		this.maps = {};

  	},

  	loadData : function() {

  		this.$el.html("");

  		this.collection.fetch({success: this.render});
  	},

  	deleteSurvey : function(evt) {

  		if(confirm("Are you sure you want to delete this survey?")) {
  			
  			var id = $(evt.target).data("id");

	  		$.ajax( { url: '[URL to backend storage + object id]',
	          type: "DELETE",
	          async: true,
	          success: this.loadData
	        });

  		}
  	},

  	csvSurvey : function(evt) {

  		var this_ = this;

  		var id = $(evt.target).data("id");

  		var header = ['id','study_id','device_id','surveyor','survey_start_datetime','survey_end_datetime','route','origin_terminal','destination_terminal','vehicle_type','capacity','notes','origin_lat','origin_lon','origin_purpose','destination_lat','destination_lon','destination_purpose','vehicle_count','vehicle_types','cost','frequency','response_start_datetime','response_end_datetime','survey_lat','survey_lon'];

  		var lines = [];

  		lines.push(OdCapture.escapeCsvLine(header));

  		_.each(this.collection.models, function(obj) {

			if(!id || id == "all" || obj.attributes._id == id ) {

				_.each(obj.attributes.responses, function(response) {

					var line = [obj.attributes._id, obj.attributes.study_id, obj.attributes.device_id, obj.attributes.surveyor, obj.attributes.start_datetime, obj.attributes.end_datetime, obj.attributes.route, obj.attributes.origin_terminal, obj.attributes.destination_terminal, obj.attributes.vehicle_type, obj.attributes.capacity, obj.attributes.notes, response.origin_lat, response.origin_lon, response.origin_purpose, response.destination_lat, response.destination_lon, response.destination_purpose, response.vehicle_count, response.vehicle_types, response.cost, response.frequency, response.start_datetime, response.end_datetime, response.survey_lat, response.survey_lon];

					lines.push(OdCapture.escapeCsvLine(line));

				});
			}
		});	

  		var csvStr = lines.join('\n');

		var blob = new Blob([csvStr], {type: "text/csv;charset=utf-8"});
		saveAs(blob,"surveys" + id + ".csv");


  	},

  	mapSurvey: function(evt) {

  		var this_ = this;

  		var id = $(evt.target).data("id");

  		$('.inlineMap[data-id="' + id + '"]').toggle();

  		if(!this.maps[id]){

  			this.maps[id] = new L.map($('.inlineMap[data-id="' + id + '"]').get(0), {center: [51.505, -0.09],zoom: 13});

  			tileUrl = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-o1bd1xee/{z}/{x}/{y}.png';

  			L.tileLayer(tileUrl, {
		        attribution: '<a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
		      }).addTo(this.maps[id]);

  			var bounds = new L.LatLngBounds();

  			_.each(this.collection.models, function(obj) {

  				if(!id || id == "all" || obj.attributes._id == id ) {

  					_.each(obj.attributes.responses, function(response) {

	  					var opts = {radius: 3, color: 'blue'};

	  					this_.maps[id].addLayer(new L.CircleMarker([response.survey_lat,response.survey_lon], opts));

						opts = {radius: 3, color: 'green'};

	  					this_.maps[id].addLayer(new L.CircleMarker([response.origin_lat,response.origin_lon], opts));

	  					bounds.extend([response.origin_lat,response.origin_lon]);	

	  					opts = {radius: 3, color: 'red'};

	  					this_.maps[id].addLayer(new L.CircleMarker([response.destination_lat,response.destination_lon], opts));

	  					bounds.extend([response.destination_lat,response.destination_lon]);

	  				});
  				}
  			});

  			this.maps[id].fitBounds(bounds);
  		}
  	},

  	render : function() {

  		var this_ = this;

  		var sortedModels = _.sortBy(this.collection.models, function(obj) {

  			if (obj.attributes.responses && obj.attributes.length) {
		      return 0 - moment(_.last(obj.attributes.responses).end_datetime).unix();
		    }

		    return 0 - moment(obj.attributes.start_datetime).unix();

  		});

  		var reponseCount = 0;

  		_.each(sortedModels, function(obj) {

			var item = this_.surveyItemTpl(obj.attributes);
		
			reponseCount = reponseCount + obj.attributes.responses.length;

			this_.$el.append(item);

  		}); 

  		$('#totalSurveyCount').html(this.collection.models.length);
  		$('#totalResponseCount').html(reponseCount);

  	}

  });
	
  NS.escapeCsvLine = function(data) {

  	var outputString = "";

  	_.each(data, function(field) {

  		if(outputString != "")
   			outputString = outputString + ",";


		if(!field)
			field = "";

		if (typeof field=="string")
  			field = field.replace('"','""');

  		outputString = outputString + '"' + field + '"';

  	});

  	return outputString;

  }


}(OdCapture));


var surveyView;

$(document).ready(function() {

	surveyView = new OdCapture.SurveyCollectionView({el: "#surveyView"});

});

