/*globals jQuery _ */

var OdCapture = OdCapture || {};

(function(NS, $) {
  NS.Util = {
    serializeObject: function(form) {
      var $form = $(form),
          formArray = $form.serializeArray(),
          attrs = {},
          headers = {};

      _.each(formArray, function(obj){
        var $field = $form.find('[name="' + obj.name + '"]');
        
        var value = null;
        
        if(obj.name.indexOf("_lat") != -1 || obj.name.indexOf("_lon") != -1)
          value = parseFloat(obj.value);
        else
          value = obj.value;
        
        if ($field.attr('data-placement') === 'header') {
          headers[obj.name] = value;
        } else {
          if (attrs[obj.name]) {
            if ($.isArray(attrs[obj.name])) {
              attrs[obj.name].push(value);
            } else {
              attrs[obj.name] = [attrs[obj.name], value];
            }
          } else {
            attrs[obj.name] = value;
          }
        }
      });

      return {
        headers: headers,
        attrs: attrs
      };
    },

    isFormValid: function(form) {
      var $form = $(form),
          valid = true;

      // Special case for checkbox groups
      $form.find('[data-checkboxgroup]').each(function(i, el) {
        var $checkboxes = $(el).find('input[type="checkbox"]'),
            checked = $checkboxes.is(':checked');

        $checkboxes.each(function(i, el) {
          el.setCustomValidity('');

          if (!checked && i === 0) {
            el.setCustomValidity('At least on checkbox should be checked.');
          }
        });
      });

      $form.find('input, select, textarea').each(function(i, el) {
        if (!el.validity.valid) {
          valid = false;
          // break out of loop
          return false;
        }
      });

      return valid;
    },

    showValidity: function(form) {
      var $form = $(form),
          $fieldsets = $form.find('fieldset'),
          $firstError = $form.find(':invalid').filter(':visible').first(),
          valid = true;

      $fieldsets.removeClass('invalid');
      $firstError.focus();
      $fieldsets.each(function(i, el) {
        var $fs = $(el);
        $fs.find('input, select, textarea').each(function(i, el) {
          if (!el.validity.valid) {
            $fs.addClass('invalid');
          }
        });
      });
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

    getAbsolutePath: function(fileSystem, dirName) {
      var rootDir = fileSystem.root.fullPath;
      if (rootDir[rootDir.length-1] !== '/') {
        rootDir += '/';
      }

      return rootDir + dirName;
    },

    getLocalTileUrl: function(dirPath, mapId) {
      return dirPath + '/' + mapId + '/{z}/{x}/{y}.png';
    },

    rmDir: function(fileSystem, dirName, success, error) {
      fileSystem.root.getDirectory(dirName, {create: true},
        function(dir) { //success
           dir.removeRecursively(success, error);
        },
        error
      );
    },

    bulkDownload: function(fileTransfer, urls, index, dirPath, success, progress, error) {
      var regex = /\/(\w+\.map-\w+\/\d+\/\d+\/\d+\.png$)/, // user.map-1234asdf/15/8540/10643.png
          url, tail, filePath;

      if (index >= urls.length) {
          success();
          return;
      }

      if (progress) {
        progress(fileTransfer, (index / urls.length));
      }

      url = urls[index];
      tail = url.match(regex)[0];
      filePath = dirPath + '/' + tail;

      fileTransfer.download(url, filePath,
        function(file) {
          NS.Util.bulkDownload(fileTransfer, urls, index+1, dirPath, success, progress, error);
        },
        error
      );
    }
  };
}(OdCapture, jQuery));
