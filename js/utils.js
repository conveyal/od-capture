/*globals jQuery */

var OdCapture = OdCapture || {};

(function(NS) {
  NS.Util = {
    serializeObject: function(form) {
      var $form = $(form),
          formArray = $form.serializeArray(),
          attrs = {},
          headers = {};

      _.each(formArray, function(obj){
        var $field = $form.find('[name="' + obj.name + '"]');
        if ($field.attr('data-placement') === 'header') {
          headers[obj.name] = obj.value;
        } else {
          if (attrs[obj.name]) {
            if ($.isArray(attrs[obj.name])) {
              attrs[obj.name].push(obj.value);
            } else {
              attrs[obj.name] = [attrs[obj.name], obj.value];
            }
          } else {
            attrs[obj.name] = obj.value;
          }
        }
      });

      return {
        headers: headers,
        attrs: attrs
      };
    }
  };
}(OdCapture, jQuery));