/*globals Backbone jQuery */

var OdCapture = OdCapture || {};

(function(NS, $) {
  NS.Router = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
      '*anything': 'home'
    }
  });

  NS.controller = {
    'home': function() {
      NS.app.mainRegion.show(new NS.SessionCollectionView({
        collection: NS.app.sessionCollection
      }));
    }
  };

  // App ======================================================================
  NS.app = new Backbone.Marionette.Application();

  NS.app.addRegions({
    mainRegion: '#main-region'
  });

  NS.app.addInitializer(function(options){
    this.sessionCollection = new NS.LocalSessionCollection();

    // Construct a new app router
    this.router = new NS.Router({
      controller: NS.controller
    });

    Backbone.history.start({ pushState: true });

  });

  // Init =====================================================================
  $(function() {
    NS.app.start();
  });

}(OdCapture, jQuery));