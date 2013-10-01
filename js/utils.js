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
    },

    // http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
    lng2tile: function(lon,zoom) {
      return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
    },

    lat2tile: function(lat,zoom)  {
      return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
    },

    tile2url: function(urlPrefix, z, x, y) {
      return urlPrefix + '/' + z + '/' + x + '/' + y + '.png';
    },

    getTileUrls: function(urlPrefix, minLat, minLng, maxLat, maxLng, minZ, maxZ) {
      var urls = [],
          minX, minY, maxX, maxY,
          x, y, z;

      for (z=minZ; z<=maxZ; z++) {
        minX = NS.Util.lng2tile(minLng, z);
        minY = NS.Util.lat2tile(minLat, z);
        maxX = NS.Util.lng2tile(maxLng, z);
        maxY = NS.Util.lat2tile(maxLat, z);

        for(x=minX; x<=maxX; x++) {
          for(y=minY; y<=maxY; y++) {
            urls.push(NS.Util.tile2url(urlPrefix, z, x, y));
          }
        }
      }

      return urls;
    },

    getLocalTilePath: function(fileSystem, mapId) {
      var rootDir = fileSystem.root.fullPath;
      if (rootDir[rootDir.length-1] !== '/') {
        rootDir += '/';
      }
      return rootDir + 'tiles/' + mapId + '/{z}/{x}/{y}.png';
    },

    rmDir: function(fileSystem, dirName, success, error) {
      fileSystem.root.getDirectory(dirName, {create: true},
        function(dir) { //success
           dir.removeRecursively(success, error);
        },
        error
      );
    },

    downloadFiles: function(urls, targetDir, success, progress, error) {
      /*
       * Bulk download of urls to the targetDir (relative path from root)
       */
      window.requestFileSystem(
        LocalFileSystem.PERSISTENT, 0,
        function(fileSystem) { //success
            var rootDir = fileSystem.root.fullPath,
                dirPath;

            if (rootDir[rootDir.length-1] != '/') {
              rootDir += '/';
            }
            dirPath = rootDir + targetDir;

            NS.Utils.downloadFile(urls, 0, dirPath, success, progress, error);
        },
        error
      );
    },

    downloadFile: function(urls, index, dirPath, success, progress, error) {
      var url, tail, filePath, fileTransfer;

      if (index >= urls.length) { //callback if done
          //clear and hide modal
          success();
          return;
      }

      //update modal progress
      if (progress) {
        progress(index * 100.0 / urls.length);
      }

      url = urls[index];

      // TODO: use a regex to select the xyz ending of the url
      // all urls start with: http://api.tiles.mapbox.com/v3/ - length 31
      tail = url.slice(31); //something like ex.map-1234saf/15/8580/12610.png

      filePath = dirPath + '/' + tail;

      fileTransfer = new FileTransfer();
      fileTransfer.download(url, filePath,
          function(theFile) {
              downloadFile(urls, index+1, dirPath, success, progress, error);
          },
          error
      );
    }

  };
}(OdCapture, jQuery));