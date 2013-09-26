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

  NS.SessionItemView = Backbone.Marionette.ItemView.extend({
    template: '#session-item-tpl'
  });

  NS.SessionCollectionView = Backbone.Marionette.CompositeView.extend({
    template: '#session-collection-tpl',
    itemView: NS.SessionItemView,
    itemViewContainer: '.session-list',
    appendHtml: NS.OrderedCollectionMixin.appendHtml
  });

}(OdCapture));