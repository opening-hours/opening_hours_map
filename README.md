# opening_hours_map

[opening_hours](http://wiki.openstreetmap.org/wiki/Key:opening_hours) tag is used in [OpenStreetMap](http://openstreetmap.org) project to describe time ranges when a specific facility (for example, a cafe) is open.

This map shows the opening_hours as nicely readable time table.

[Check it out][online]

A mirror is setup up under: http://ypid.de/~osm/

## Install

Just clone the repository:

```Shell
git clone --recursive https://github.com/ypid/opening_hours_map.git
```

and install it’s dependencies (execute inside the repository):

```Shell
make dependencies-get
```

## How does it work?

The map uses OpenLayers to show a base map from OpenStreetMap. An additional optional layer shows POIs which are tagged with opening_hours. The data for this additional layer is queried for from the [OverpassAPI][]. The basic query in [OverpassQL][] looks like this:

    [out:json][timeout:3][bbox:{{bbox}}];
    (
        node["opening_hours"];
        way["opening_hours"];
    );
    out body center 1000;

## Dependencies

* This map is build with [OpenLayers][ol-lib].
* The opening_hours evaluation is handled by the [opening_hours.js][oh-lib] library.

## Author
[Robin `ypid` Schneider](http://wiki.openstreetmap.org/wiki/User:Ypid)

<!-- Credits {{{ -->
## Credits ##
* Big thanks goes to Netzwolf how created some OpenLayers extensions and [examples][]. He also created the same map showing opening\_hours with his JS implementation (which is withdrawn in favour of opening\_hours.js). Big parts of his code are still in use for the map. Although most code around the opening\_hours interpretation was rewritten.

* Also thanks to FOSSGIS for hosting a public instance of this service. See the [wiki][fossgis-project].

<!-- }}} -->

[ol-lib]: http://openlayers.org/
[oh-lib]: https://github.com/ypid/opening_hours.js
[examples]: http://www.netzwolf.info/kartografie/openlayers/
[OverpassAPI]: http://overpass-api.de/
[OverpassQL]: http://wiki.openstreetmap.org/wiki/OverpassQL
[online]: http://openingh.openstreetmap.de
[fossgis-project]: http://wiki.openstreetmap.org/wiki/FOSSGIS/Server/Projects/opening_hours.js
