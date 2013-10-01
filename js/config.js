var OdCapture = OdCapture || {};

(function(NS) {
  NS.Config = {
    "study_id"   : "123ABC",                   // a unique ID attached to all data captured as part of this study
    "study_name" : "Manila O/D data capture",  //  name of study
    "map_key"    : "conveyal.map-123adf",      // a Mabox map key
    "map_north"  : "12.123",                   // latlng boundary for map download
    "map_east"   : "12.123",                   // latlng boundary for map download
    "map_south"  : "12.123",                   // latlng boundary for map download
    "map_west"   : "12.123",                   // latlng boundary for map download
    "map_max"    : "15",                       // max map zoom level for boundary
    "map_min"    : "12"                        // latlng boundary for map download
  };
}(OdCapture));