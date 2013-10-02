/*globals _ Backbone L FileTransfer device Handlebars jQuery */

var OdCapture = OdCapture || {};

(function(NS, $) {

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
    initialize: function() {
      this.fileSystem = this.options.fileSystem;
    },
    onShow: function() {
      var el = this.$el.find('.map').get(0),
          path = 'tiles',
          tileUrl;

      this.map = L.map(el, {
          minZoom: NS.Config.map_min,
          maxZoom: NS.Config.map_max
        }).fitBounds(
          [[NS.Config.map_south, NS.Config.map_west], [NS.Config.map_north, NS.Config.map_east]],
          NS.Config.map_min
        );

      // Because close clobbers the events
      this.delegateEvents();

      if (this.fileSystem) {
        tileUrl = NS.Util.getLocalTileUrl(NS.Util.getAbsolutePath(this.fileSystem, path), NS.Config.map_key);
      } else {
        tileUrl = 'http://{s}.tiles.mapbox.com/v3/' + NS.Config.map_key + '/{z}/{x}/{y}.png';
      }

      // add an OpenStreetMap tile layer
      L.tileLayer(tileUrl, {
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
      '$originLng': 'input[name=origin_lon]',
      '$originCheck': '.origin-check',
      '$destLat': 'input[name=destination_lat]',
      '$destLng': 'input[name=destination_lon]',
      '$destCheck': '.dest-check'
    },
    regions: {
      mapRegion: '#map-region'
    },
    events: {
      'submit form': 'handleSubmit',
      'click .select-origin-btn': 'selectOrigin',
      'click .select-dest-btn': 'selectDestination'
    },
    initialize: function() {
      var self = this;
      this.data = {};

      // Set some initial data
      this.data.start_datetime = (new Date()).toISOString();
      navigator.geolocation.getCurrentPosition(function(position) {
        self.data.survey_lat = position.coords.latitude;
        self.data.survey_lon = position.coords.longitude;
      },
      function() {
        self.data.survey_lat = 0;
        self.data.survey_lon = 0;
      });

      // Init the map views
      this.originMapView = new NS.MapView({
        fileSystem: this.options.fileSystem
      });
      this.originMapView.on('setcenter', function(lat, lng) {
        self.ui.$originLat.val(lat);
        self.ui.$originLng.val(lng);
        self.ui.$originCheck.removeClass('is-hidden');
      });

      this.destMapView = new NS.MapView({
        fileSystem: this.options.fileSystem
      });
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
    save: function(form) {
      var data = _.extend({}, NS.Util.serializeObject(form).attrs, this.data);

      // Implicit data properties
      data.end_datetime = (new Date()).toISOString();
      data.respondent_id = this.model.get('responses').length;

      this.model.get('responses').push(data);
      this.model.save();

      NS.app.router.navigate('surveys', {trigger: true});
    },
    handleSubmit: function(evt) {
      evt.preventDefault();
      var form = evt.target;

      if (NS.Util.isFormValid(form)) {
        this.save(form);
      } else {
        NS.Util.showValidity(form);
      }
    }
  });

  NS.SurveyFormView = Backbone.Marionette.ItemView.extend({
    template: '#survey-form-tpl',
    events: {
      'submit form': 'handleSubmit'
    },
    save: function(form) {
      var data = NS.Util.serializeObject(form).attrs;

      data.study_id = NS.Config.study_id;
      data.device_id = device.uuid;

      if (this.model) {
        this.model.save(data);
      } else {
        this.collection.create(data);
      }
      NS.app.router.navigate('surveys', {trigger: true});
    },
    handleSubmit: function(evt) {
      evt.preventDefault();
      var form = evt.target;

      if (NS.Util.isFormValid(form)) {
        this.save(form);
      } else {
        NS.Util.showValidity(form);
      }
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
    ui: {
      '$status': '.download-status'
    },
    events: {
      'click #refresh-tiles-btn': 'refreshTiles'
    },
    initialize: function() {
      this.fileSystem = this.options.fileSystem;
    },
    refreshTiles: function() {
      var self = this,
          path = 'tiles';

      if (this.fileSystem) {
        var fileTransfer = new FileTransfer(),
            rootPath = this.fileSystem.root.fullPath,
            tileUrls = NS.Util.getTileUrls(
              'http://api.tiles.mapbox.com/v3/' + NS.Config.map_key,
              NS.Config.map_north, NS.Config.map_west,
              NS.Config.map_south, NS.Config.map_east,
              NS.Config.map_min, NS.Config.map_max
            ),
            confirmation = 'Delete all tiles and download ' + tileUrls.length + ' new tiles?';

        if (window.confirm(confirmation)) {
          NS.Util.rmDir(self.fileSystem, path, function() {
            path = NS.Util.getAbsolutePath(self.fileSystem, path);

            NS.Util.bulkDownload(fileTransfer, tileUrls, 0, path,
              function() {
                self.ui.$status.text('100%');
              },
              function(fileTransfer, percent) {
                self.ui.$status.text((percent * 100.0).toFixed() + '%');
              },
              function() {
                window.alert('An error occurred while downloading the new tiles.');
              }
            );
          },
          function() {
            window.alert('An error occurred while deleting the old tiles.');
          });
        }
      }
    }
  });

}(OdCapture, jQuery));