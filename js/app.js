/*globals Backbone jQuery LocalFileSystem */

var OdCapture = OdCapture || {};

(function(NS, $) {
  NS.Router = Backbone.Marionette.AppRouter.extend({
    appRoutes: {
      'surveys/new': 'surveyForm',
      'surveys/:id': 'surveyForm',
      'surveys/:id/new': 'responseForm',
      'surveys': 'surveyList',
      'admin': 'admin',
      '*anything': 'anything'
    }
  });

  NS.controller = {
    'responseForm': function(id) {
      var model = NS.app.surveyCollection.get(id);

      if (model) {
        window.scrollTo(0, 0);
        NS.app.mainRegion.show(new NS.ResponseFormView({
          model: model,
          fileSystem: NS.app.fileSystem
        }));
      } else {
        this.anything();
      }
    },
    'surveyForm': function(id) {
      var model = NS.app.surveyCollection.get(id);

      window.scrollTo(0, 0);
      NS.app.mainRegion.show(new NS.SurveyFormView({
        collection: NS.app.surveyCollection,
        model: model
      }));
    },
    'surveyList': function() {
      window.scrollTo(0, 0);
      NS.app.mainRegion.show(new NS.SurveyCollectionView({
        collection: NS.app.surveyCollection
      }));
    },
    'admin': function() {
      window.scrollTo(0, 0);
      NS.app.mainRegion.show(new NS.AdminView({
        fileSystem: NS.app.fileSystem
      }));
    },
    'anything': function() {
      // Default to the survey list
      window.scrollTo(0, 0);
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

    // Online detection
    if (navigator.onLine) {
      $('body').addClass('online');
    }
    window.addEventListener("offline", function(e) {
      $('body').removeClass('online');
    }, false);

    window.addEventListener("online", function(e) {
      $('body').addClass('online');
    }, false);
  });

  // Init =====================================================================
  $(function() {
    // For local testing. Assumed to not exist in production.
    if (NS.Config.is_browser) {
      navigator.webkitPersistentStorage.requestQuota(1024*1024, function(grantedBytes) {
        window.webkitRequestFileSystem(window.PERSISTENT, 0,
          function(fs) {
            NS.app.fileSystem = fs;
            NS.app.start();
          },
          function() {
            window.alert('Unable to access the file system.');
          }
        );
      });
    } else {
      document.addEventListener('deviceready', function(evt) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0,
          function(fs) {
            NS.app.fileSystem = fs;
            NS.app.start();
          },
          function() {
            window.alert('Unable to access the file system.');
          }
        );
      });
    }
  });

}(OdCapture, jQuery));