/*globals Backbone jQuery */

var OdCapture = OdCapture || {};

(function(NS, $) {
  NS.Router = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
      'surveys/new': 'surveyForm',
      'surveys/:id': 'surveyForm',
      'surveys': 'surveyList',
      '*anything': 'anything'
    }
  });

  NS.controller = {
    'surveyForm': function(id) {
      var model = NS.app.surveyCollection.get(id) || null;

      NS.app.mainRegion.show(new NS.SurveyFormView({
        collection: NS.app.surveyCollection,
        model: model
      }));
    },
    'surveyList': function() {
      NS.app.mainRegion.show(new NS.SurveyCollectionView({
        collection: NS.app.surveyCollection
      }));
    },
    'anything': function() {
      // Default to the survey list
      this.surveyList();
      NS.app.router.navigate('surveys', {replace: true});
    }
  };

  // App ======================================================================
  NS.app = new Backbone.Marionette.Application();

  NS.app.addRegions({
    mainRegion: '#main-region'
  });

  NS.app.addInitializer(function(options){
    this.surveyCollection = new NS.LocalSurveyCollection();

    this.surveyCollection.fetch();

    // Construct a new app router
    this.router = new NS.Router({
      controller: NS.controller
    });

    Backbone.history.start();

    // Globally capture clicks. If they are internal and not in the pass
    // through list, route them through Backbone's navigate method.
    $(document).on('click', 'a[href^="/"]', function(evt) {
      var $link = $(evt.currentTarget),
          href = $link.attr('href'),
          url;

      evt.preventDefault();

      // Remove leading slashes and hash bangs (backward compatablility)
      url = href.replace(/^\//, '');

      // # Instruct Backbone to trigger routing events
      NS.app.router.navigate(url, { trigger: true });

      return false;
    });


  });

  // Init =====================================================================
  $(function() {
    NS.app.start();
  });

}(OdCapture, jQuery));