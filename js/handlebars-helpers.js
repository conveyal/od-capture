/*globals Handlebars moment _ jQuery*/

var OdCapture = OdCapture || {};

(function(NS, $) {

  Handlebars.registerHelper('last_updated', function() {
    if (this.responses && this.responses.length) {
      return moment(_.last(this.responses).end_datetime).fromNow();
    }

    return moment(this.start_datetime).fromNow();
  });

  Handlebars.registerHelper('select', function( value, options ){
    var $el = $('<select />').html( options.fn(this) );
    $el.find('[value="' + value + '"]').attr({'selected':'selected'});
    return $el.html();
  });

  Handlebars.registerHelper('fromnow', function(datetime) {
    if (datetime) {
      return moment(datetime).fromNow();
    }
    return '';
  });

  Handlebars.registerHelper('deviceName', function() {
    return NS.Config.device_name;
  });

}(OdCapture, jQuery));