/*global describe, it, chai, OdCapture */

(function () {
  'use strict';

  var assert = chai.assert;
  describe('utils.js', function () {
    describe('lat/lng and tile coordinate conversions', function () {
      // http://otile1.mqcdn.com/tiles/1.0.0/map/14/4771/6205.jpg
      it('should return the correct tile x value for the lng', function () {
        var z = 14, l = -75.163822,
            x = OdCapture.Util.lng2tile(l, z);

        assert.equal(x, 4771);
      });

      it('should return the correct tile y value for the lat', function () {
        var z = 14, l = 39.952912,
            y = OdCapture.Util.lat2tile(l, z);

        assert.equal(y, 6205);
      });

      it('should return a single url for a point and single zoom level', function () {
        var z = 14, lat = 39.952912, lng = -75.163822,
            urls = OdCapture.Util.getTileUrls('http://api.nicetiles.com/v1',
                   lat, lng, lat, lng, z, z);

        assert.equal(urls.length, 1);
        assert.equal(urls[0], 'http://api.nicetiles.com/v1/14/4771/6205.png');
      });

      it('should return a list of urls for a bounds and z range', function () {
        var z = 14, lat = 39.952912, maxLng = -75.163822, minLng = -75.172577,
            urls = OdCapture.Util.getTileUrls('http://api.nicetiles.com/v1',
                   lat, minLng, lat, maxLng, z, z);

        assert.equal(urls.length, 2);
        assert.equal(urls[0], 'http://api.nicetiles.com/v1/14/4770/6205.png');
        assert.equal(urls[1], 'http://api.nicetiles.com/v1/14/4771/6205.png');
      });
    });

  });
}());
