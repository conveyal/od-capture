/*globals Backbone */

var OdCapture = OdCapture || {};

(function(NS) {

  Backbone.Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate) {
    return Handlebars.compile(rawTemplate);
  };

  // Views ====================================================================
  NS.OrderedCollectionMixin = {
    // https://github.com/marionettejs/backbone.marionette/wiki/Adding-support-for-sorted-collections
    // Inspired by the above link, but it doesn't work when you start with an
    // empty (or unsorted) list.
    appendHtml: function(collectionView, itemView, index){
      var childrenContainer = collectionView.itemViewContainer ? collectionView.$(collectionView.itemViewContainer) : collectionView.$el,
          children = childrenContainer.children(),
          indices = childrenContainer.data('indices') || [],
          sortNumber = function(a,b) { return a - b; },
          goHereIndex;
      // console.log(index, $(itemView.el).find('.feed-item-title').text());

      // console.log('before', indices);
      indices.push(index);
      indices.sort(sortNumber);
      // console.log('after', indices);
      goHereIndex = indices.indexOf(index);
      // console.log('at', goHereIndex);

      if(goHereIndex === 0) {
        childrenContainer.prepend(itemView.el);
        // console.log('prepend');
      } else {
        // console.log('insert after', childrenContainer.children().eq(goHereIndex-1).find('.feed-item-title').text());
        childrenContainer.children().eq(goHereIndex-1).after(itemView.el);
      }

      // console.log(childrenContainer)
      childrenContainer.data('indices', indices);
    }
  };

  NS.MapView = Backbone.Marionette.ItemView.extend({
    template: '#map-tpl',
    className: 'map-container',
    events: {
      'click .map-cancel-btn': 'hide',
      'click .map-btn': 'setCenter'
    },
    onShow: function() {
      var el = this.$el.find('.map').get(0);

      this.map = L.map(el).setView([14.5995124, 120.9842195], 13);

      // Because close clobbers the events
      this.delegateEvents();

      // add an OpenStreetMap tile layer
      L.tileLayer('http://{s}.tiles.mapbox.com/v3/conveyal.map-l6w1x0sp/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors, CC-BY-SA. <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
      }).addTo(this.map);
    },
    hide: function(evt) {
      evt.preventDefault();
      this.close();
    },
    setCenter: function(evt) {
      evt.preventDefault();
      var center = this.map.getCenter();

      this.trigger('setcenter', center.lat, center.lng);
      this.close();
    }
  });

  NS.ResponseFormView = Backbone.Marionette.Layout.extend({
    template: '#response-form-tpl',
    ui: {
      '$originLat': 'input[name=origin_lat]',
      '$originLng': 'input[name=origin_lng]',
      '$originCheck': '.origin-check',
      '$destLat': 'input[name=destination_lat]',
      '$destLng': 'input[name=destination_lng]',
      '$destCheck': '.dest-check'
    },
    regions: {
      mapRegion: '#map-region'
    },
    events: {
      'submit form': 'saveResponse',
      'click .select-origin-btn': 'selectOrigin',
      'click .select-dest-btn': 'selectDestination'
    },
    initialize: function() {
      var self = this;

      this.originMapView = new NS.MapView();
      this.originMapView.on('setcenter', function(lat, lng) {
        self.ui.$originLat.val(lat);
        self.ui.$originLng.val(lng);
        self.ui.$originCheck.removeClass('is-hidden');
      });

      this.destMapView = new NS.MapView();
      this.destMapView.on('setcenter', function(lat, lng) {
        self.ui.$destLat.val(lat);
        self.ui.$destLng.val(lng);
        self.ui.$destCheck.removeClass('is-hidden');
      });

    },
    selectOrigin: function(evt) {
      evt.preventDefault();
      this.mapRegion.show(this.originMapView);
    },
    selectDestination: function(evt) {
      evt.preventDefault();
      this.mapRegion.show(this.destMapView);
    },
    saveResponse: function(evt) {
      evt.preventDefault();

      var form = evt.target,
          data = NS.Util.serializeObject(form).attrs;

      data.created_datetime = (new Date()).toISOString();

      this.model.get('responses').push(data);
      this.model.save();
      NS.app.router.navigate('surveys', {trigger: true});
    }
  });

  NS.SurveyFormView = Backbone.Marionette.ItemView.extend({
    template: '#survey-form-tpl',
    events: {
      'submit form': 'saveSurvey'
    },
    saveSurvey: function(evt) {
      evt.preventDefault();

      var form = evt.target,
          data = NS.Util.serializeObject(form).attrs;

      if (this.model) {
        this.model.save(data);
      } else {
        this.collection.create(data);
      }
      NS.app.router.navigate('surveys', {trigger: true});
    }
  });

  NS.EmptySurveyCollectionView  = Backbone.Marionette.ItemView.extend({
    template: '#empty-survey-collection-tpl',
    tagName: 'li',
    className: 'clearfix'
  });

  NS.SurveyItemView = Backbone.Marionette.ItemView.extend({
    template: '#survey-item-tpl',
    tagName: 'li',
    className: 'clearfix'
  });

  NS.SurveyCollectionView = Backbone.Marionette.CompositeView.extend({
    template: '#survey-collection-tpl',
    itemView: NS.SurveyItemView,
    itemViewContainer: '.survey-list',
    emptyView: NS.EmptySurveyCollectionView,
    appendHtml: NS.OrderedCollectionMixin.appendHtml
  });

  NS.AdminView = Backbone.Marionette.ItemView.extend({
    template: '#admin-tpl',
    events: {
      'click #refresh-tiles-btn': 'refreshTiles'
    },
    initialize: function() {
      this.fileSystem = this.options.fileSystem;
    },
    refreshTiles: function() {
      var path = 'tiles';

      if (this.fileSystem) {
        var fileTransfer = new FileTransfer(),
            rootPath = this.fileSystem.root.fullPath;

        NS.Util.rmDir(this.fileSystem, path, function() {
          window.alert(path + '/ has been deleted.');

          var minZ = 14, maxZ = 15, lat = 39.952912, lng = -75.163822,
              tileUrls = NS.Util.getTileUrls(
                'http://api.tiles.mapbox.com/v3/conveyal.map-l6w1x0sp',
                lat, lng, lat, lng, minZ, maxZ);

          path = rootPath + path;

          NS.Util.bulkDownload(fileTransfer, tileUrls, 0, path,
            function() {
              window.alert('successful download');
            },
            function(fileTransfer, percent) {
              window.alert('percent ' + percent);
            },
            function() {
              window.alert('error downloading');
            }
          );
        },
        function() {
          window.alert('An error occurred while deleting ' + path + '/');
        });
      }
    }
  });

}(OdCapture));