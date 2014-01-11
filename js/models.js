/*globals Backbone _ */

var OdCapture = OdCapture || {};

(function(NS) {

  NS.SurveyModel = Backbone.Model.extend({
    idAttribute: '_id',
    defaults: {
      responses: [],
      start_datetime: (new Date()).toISOString()
    }
  });

  NS.LocalSurveyCollection = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage('odcapture-surveys'),
    model: NS.SurveyModel
  });

  NS.RemoteSurveyModel = Backbone.Model.extend({
    idAttribute: '_id',
    url: function() {
      var base = _.result(this.collection, 'url'),
          result, key;
      if (this.isNew()) {
        return base;
      }

      result = base.split('?');
      base = result[0];
      key = result[1];
      return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id) + '?' + key;
    }
  });

  NS.RemoteSurveyCollection = Backbone.Collection.extend({
    model: NS.RemoteSurveyModel,
    url: NS.Config.storageUrl
  });

}(OdCapture));