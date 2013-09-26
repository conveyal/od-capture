/*globals Backbone */

var OdCapture = OdCapture || {};

(function(NS) {

  NS.LocalSessionCollection = Backbone.Collection.extend({
    localStorage: new Backbone.LocalStorage('odcapture-sessions')
  });

}(OdCapture));