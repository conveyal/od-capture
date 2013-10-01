var OdCapture = OdCapture || {};

(function(NS) {
  NS.Config = {
    "study_id"   : "123ABC",                   // a unique ID attached to all data captured as part of this study
    "study_name" : "Manila O/D data capture",  //  name of study
    "map_key"    : "conveyal.map-123adf",      // a Mabox map key
    "map_north"  : 14.606384,                  // latlng boundary for map download
    "map_east"   : 120.999899,                 // latlng boundary for map download
    "map_south"  : 14.574737,                  // latlng boundary for map download
    "map_west"   : 120.959902,                 // latlng boundary for map download
    "map_max"    : 15,                         // max map zoom level for boundary
    "map_min"    : 12                          // max map zoom level for boundary
  };
}(OdCapture));