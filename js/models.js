/*globals Backbone */

var OdCapture = OdCapture || {};

(function(NS) {

  NS.SurveyModel = Backbone.Model.extend({
    defaults: {
      responses: [],
      start_datetime: (new Date()).toISOString()
    }
  });

  NS.LocalSurveyCollection = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage('odcapture-surveys'),
    model: NS.SurveyModel
  });

}(OdCapture));