# opening_hours_map

[![CI](https://github.com/opening-hours/opening_hours_map/workflows/CI/badge.svg)](https://github.com/opening-hours/opening_hours_map/actions)

[opening_hours](https://wiki.openstreetmap.org/wiki/Key:opening_hours) tag is used in [OpenStreetMap](https://openstreetmap.org) project to describe time ranges when a specific facility (for example, a cafe) is open.

This map shows the opening_hours as nicely readable time table.

[Check it out][online]

A mirror is set up under: https://openingh.ypid.de/

## Install

Just clone the repository:

```Shell
git clone --recursive https://github.com/opening-hours/opening_hours_map
```

and install its dependencies (execute inside the repository):

```Shell
npm install
make dependencies-get
```

This will:
- Install development dependencies (ESLint, html-validate)
- Download OpenLayers
- Initialize the opening_hours.js git submodule

## How does it work?

The map uses OpenLayers to show a base map from OpenStreetMap. An additional optional layer shows POIs which are tagged with opening_hours. The data for this additional layer is queried from the [OverpassAPI][]. The basic query in [OverpassQL][] looks like this:

    [out:json][timeout:3][bbox:{{bbox}}];
    (
        node["opening_hours"];
        way["opening_hours"];
    );
    out body center 1000;

## Development

### Local Development

Start the development server:

```Shell
npm run dev
```

This opens the app with `?mock=true` by default.

Use the normal map URL parameters (`lat`, `lon`, `zoom`) to center the map on
the mock region you want to work with.

This starts Vite on `http://127.0.0.1:5502/` (or the next free port) and
serves the app without a custom Overpass proxy.

**Why Mock in Development?**

Browser-direct calls to public Overpass endpoints often fail due to CORS and
rate limits. Local mock data keeps development predictable and avoids noisy
network failures.

### Overpass Request Flow

Default request order depends on runtime mode:

1. Vite development mode (`npm run dev`):
        - starts with `?mock=true` by default (local mock interpreter endpoint
            `/api/mock/interpreter`, backed by `data/dev-overpass-sample.json`)
        - use `lat=<...>&lon=<...>&zoom=<...>` to center the view on your target region
        - remove `mock=true` to use direct browser requests to public Overpass
            endpoints
2. Production build:
    - `https://overpass-api.de/api/interpreter`
    - `https://overpass.kumi.systems/api/interpreter`
    - `https://overpass.private.coffee/api/interpreter`

Network/CORS failures trigger endpoint cooldown and a short global cooldown to
avoid hammering endpoints.

### Building

To build the opening_hours.js library for production:

```Shell
make ready-for-hosting
```

This will build the minified version of opening_hours.js with all dependencies.

### Testing

Run validation and linting:

```Shell
npm test
```

## Dependencies

* This map is built with [OpenLayers 10][ol-lib].
* The opening_hours evaluation is handled by the [opening_hours.js][oh-lib] library.

## Author
[Robin `ypid` Schneider](https://wiki.openstreetmap.org/wiki/User:Ypid)

<!-- Credits {{{ -->
## Credits

* Big thanks goes to Netzwolf who created some OpenLayers extensions and [examples][]. He also created the same map showing opening\_hours with his JS implementation (which is withdrawn in favour of opening\_hours.js). Big parts of his code are still in use for the map. Although most code around the opening\_hours interpretation was rewritten.

* Also thanks to FOSSGIS for hosting a public instance of this service. See the [wiki][fossgis-project].

<!-- }}} -->

## License

LGPL-3.0-only - see [LICENSE](LICENSE) file for details.

[ol-lib]: https://openlayers.org/
[oh-lib]: https://github.com/opening-hours/opening_hours.js
[examples]: http://www.netzwolf.info/kartografie/openlayers/
[OverpassAPI]: https://overpass-api.de/
[OverpassQL]: https://wiki.openstreetmap.org/wiki/OverpassQL
[online]: http://openingh.openstreetmap.de
[fossgis-project]: https://wiki.openstreetmap.org/wiki/FOSSGIS/Server/Projects/opening_hours.js
