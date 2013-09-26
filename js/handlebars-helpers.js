/*globals Handlebars moment _ */

var OdCapture = OdCapture || {};

(function(NS) {

  Handlebars.registerHelper('last_updated', function() {
    if (this.responses && this.responses.length) {
      return moment(_.last(this.responses).created_datetime).fromNow();
    }

    return moment(this.created_datetime).fromNow();
  });

  Handlebars.registerHelper('fromnow', function(datetime) {
    if (datetime) {
      return moment(datetime).fromNow();
    }
    return '';
  });

}(OdCapture));