var repo_url = 'https://github.com/opening-hours/opening_hours_map';
var html_url = 'http://openingh.openstreetmap.de/';
var wiki_url = 'https://wiki.openstreetmap.org/wiki/Key:opening_hours';
var evaluation_tool_url = 'evaluation_tool/';
var map;

var nominatim_data_global = {};

var opening_hours = require('opening_hours');
/* Does not accept language change in Browser. Probably not the
 * correct version as it was bundled for NodeJS.
 */
// var moment = require('moment');
var i18n = require('i18next-client');

if (!document.onLoadFunctions) {
    document.onLoadFunctions = new Array();
    window.onload = function () { for (var i=0; document.onLoadFunctions.length>i;i++) document.onLoadFunctions[i](); }
}

var poi_layer;

var permalinkParams = {};
var permalinkObject;

function Evaluate(number, reset, value) {
    window.open(evaluation_tool_url + '?EXP='+encodeURIComponent(value), '_blank');
}

// From https://github.com/rurseekatze/OpenLinkMap/blob/master/js/small.js
function editPopupContent(content, lat, lon, type, id, oh_value) {
    var short_type = type.substr(0, 1);
    // add some links to the bottom of a popup
    content += '<br />';
    content += '<a href="https://www.openstreetmap.org/edit?editor=id&'+short_type+'='+id+'" target="_blank">iD</a>&nbsp;&nbsp;';
    content +=
        '<a href="https://www.openstreetmap.org/edit?'+short_type+'='+id+'&editor=potlatch2" target="_blank">Potlatch</a>'+
        '&nbsp;&nbsp;<a href="javascript:josm(\'import?url=' + encodeURIComponent('http://overpass-api.de/api/xapi_meta?*[opening_hours=' + oh_value + ']') + '\')">' + i18n.t('texts.load all with JOSM') + '</a>'+
        '&nbsp;&nbsp;<a href="javascript:josm(\'load_object?objects=' + short_type + id + '&select=' + short_type + id + '\')">JOSM</a>'+
        '&nbsp;&nbsp;<a href="https://www.openstreetmap.org/'+type+'/'+id+'" target="_blank">Details</a>'
        + '&nbsp;&nbsp;<a href="' + evaluation_tool_url + '?EXP='
        + encodeURIComponent(oh_value) + '&lat=' + lat + '&lon=' + lon + '" target="_blank">' + i18n.t('texts.evaluation tool') + '</a>';
    return content;
}

var tmp = 0;
/* Source ../opening_hours.js/related_tags.txt */
var related_tags = [
    'opening_hours',
    'opening_hours:kitchen',
    'opening_hours:warm_kitchen',
    'happy_hours',
    'delivery_hours',
    'opening_hours:delivery',
    'lit',
    'smoking_hours',
    'collection_times',
    'service_times',
    //
    // 'fee',
];

document.onLoadFunctions.push ( function () {

    window.useUserKey = function (key) {
        console.log(key);
        if (related_tags.indexOf(key) !== -1) { /* Add the new key to related_tags. */
            var select = document.getElementById('tag_selector_input');
            related_tags.push(key);
            select.options[select.options.length] = new Option(key, select.options.length);
        } else {
            document.getElementById('tag_selector_input').selectedIndex = related_tags.indexOf(key);
        }
    };

    window.keyChanged = function() {
        poi_layer.reloadPOIs();
        permalinkObject.updateLink();
    };

    permalinkParams.filter = OpenLayers.Util.getParameters().filter || 'none';
    document.getElementById('filter_form_' + permalinkParams.filter).checked = true;

    window.applyNewFilter = function (myRadio) {
        permalinkParams.filter = myRadio.value;
        poi_layer.redrawPOIs();
        permalinkObject.updateLink();
    };

    var OHMode = 0;
    var OSM_tags = []; // keys for the values which should be evaluated.

    var prmarr = window.location.search.replace( "?", "" ).split("&");
    var params = {};
    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }

    if (typeof params['mode'] != 'undefined') {
        OHMode = parseInt(params['mode']);
    }

    if (typeof params['tags'] != 'string') {
        switch (OHMode) {
            case 2:  OSM_tags.push('collection_times'); break;
            default: OSM_tags.push('opening_hours')   ; break;
        }
    } else {
        OSM_tags.push(params['tags']);
    }

    useUserKey(OSM_tags[0]);

    /* {{{ OpenLayers */
    //----------------------------------------------------------------------------
    //    Karte - der Name ('map') muss mit der id des <div> uebereinstimmen.
    //----------------------------------------------------------------------------
    map = new OpenLayers.Map ('map', {controls:[]});

    //----------------------------------------------------------------------------
    //    Default-Koordinatensystem fuer alle Controls
    //----------------------------------------------------------------------------
    map.displayProjection = new OpenLayers.Projection ('EPSG:4326');

    /* {{{ Patch updateLink function */
    OpenLayers.Control.Permalink.prototype.updateLink = function() {
        permalinkObject = this;
        var href=this.base;
        if(href.indexOf('?')!=-1){
            href=href.substring(0,href.indexOf('?'));
        }
        href+='?'+OpenLayers.Util.getParameterString(OpenLayers.Util.extend(this.createParams(), permalinkParams));
        this.element.href=href;
    };
    /* }}} */

    /* {{{ Steuerelemente */
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    map.addControl(new OpenLayers.Control.MousePosition());
    map.addControl(new OpenLayers.Control.Navigation());
    map.addControl(new OpenLayers.Control.PanZoomBar());
    map.addControl(new OpenLayers.Control.Permalink());
    map.addControl(new OpenLayers.Control.ZoomStatus({
        html: i18n.t('texts.low zoom level'),
    }));
    map.addControl(new OpenLayers.Control.LoadStatus({
        html: '<img src="img/ajax-loader.gif" /><br />${layers}'
    }));
    map.addControl(new OpenLayers.Control.Attribution());
    /* }}} */

    /* {{{ Base layers */
    map.addLayer(new OpenLayers.Layer.OSM.Mapnik('Mapnik'));
    map.addLayer(new OpenLayers.Layer.OSM.CycleMap('CycleMap'));
    /* }}} */

    /* {{{ opening_hours layer */
    map.addLayer(poi_layer = new OpenLayers.Layer.PopupMarker('opening hours like values (opening_hours, lit, …)', {

        minZoom: 11,
        blockSize: 0, // no cache
        clusterSize: 16,
        clusterLimit: 50,
        reftime: new Date(),

        createHtmlFromData: function (data) {
            var h_icon = '<img src="' + this.getIconUrl(data) + '" alt=""/>';
            var h_name = this.html(data.name||data.ref||data.barrier||data.operator||data.shop||data.amenity||data.craft||data.id);
            if (typeof data.cuisine == 'string') {
                h_name += ' (cuisine: ' + data.cuisine + ')';
            }
            if (typeof data.barrier == 'string') {
                h_name = 'barrier: ' + h_name;
            }

            var text = '<h3>'+h_icon+'&#160;'+h_name+'</h3>\n';
            text += '<div class="v">'+this.html(data._oh_value)+'</div>';

            this.evaluateOH(data);

            if (data._oh_state == 'error' || data._oh_state == 'na') {
                text += '<div class="e">'+data._oh_object+'</div>';
            } else {
                    var t= data._it_object.getComment() || '';

                    switch (data._it_object.getStateString(true)) {
                    case 'open':    text+='<b class="o">open @ '   +this.reftime.toLocaleString()+'<br/>'+t+'</b>'; break;
                    case 'closed':  text+='<b class="c">closed @ ' +this.reftime.toLocaleString()+'<br/>'+t+'</b>'; break;
                    case 'unknown': text+='<b class="u">unknown @ '+this.reftime.toLocaleString()+'<br/>'+t+'</b>'; break;
                    }

                var prettified = data._oh_object.prettifyValue();

                if (data._oh_value != prettified)
                    text += '<br/>' + i18n.t('texts.prettified value', {
                            copyFunc: 'javascript:Evaluate(null, null, \'' + data._oh_value + '\')',
                        }) + ': <div class="v">'+prettified+'</div>';

                var warnings = data._oh_object.getWarnings();
                if (warnings.length > 0)
                    text += '<br/>Warnings: <div class="v">'+warnings.join('<br/>\n')+'</div>';

                data._it_object.setDate(this.reftime);
                text += OpeningHoursTable.drawTableAndComments(data._oh_object, data._it_object, encodeURIComponent(data._oh_value));

                // if (!data._time.value && data._time.times.length>=1)
                // text+='<div class="o">will open @ '+data._time.times[0].t.toLocaleString()+
                //     (data._time.times[0].c? ' ('+data._time.times[0].c+')' : '') + '</div>';

                // if (data._time.warnings) text+='<div class="m">'+data._time.warnings.join('<br/>')+'</div>';
            }

            var rows=[];
            for (var tag in data) {
                if (data[tag] == '') continue;
                switch (tag) {
                case 'id': case '_id': case 'lat': case 'lon': case 'created_by':
                case '_oh_value': case '_oh_state': case '_oh_object': case '_it_object':
                    continue;
                }
                val=this.html(data[tag]);
                if (val.substr(0,7)=='http://') {
                    var res = [];
                    var list=data[tag].split (';');
                    for (var i=0; i<list.length;i++) {
                        var ele=this.html(OpenLayers.String.trim(list[i]));
                        res.push ('<a target="_blank" href="' + ele+'">'+ele+'</a>');
                    }
                    val=res.join('; ');
                }
                rows.push ('<tr><td>'+this.html(tag)+'</td><td>'+val+'</td></tr>');
            }

            if (rows.length>=1) text += '<table>'+rows.join('\n')+'</table>\n';

            return editPopupContent(text, data.lat, data.lon, data._type, data._id, data._oh_value);
        },

        // Copy past from js/popupmarker.js to change the translation.
        createHtmlFromList: function (list) {
            var items = [];
            var clusters = [];
            var nItems=0;
            var limit = this.clusterLimit && this.clusterLimit<list.length ? this.clusterLimit : list.length;
            for (var i=0; i<list.length; i++) {
                if (list[i]._csize || list[i].cluster) {
                    clusters.push (this.createHtmlFromData(list[i]));
                } else {
                    nItems++;
                    if (items.length<limit) {
                        items.push (this.createHtmlFromData(list[i]));
                    }
                }
            }
            if (nItems>limit) {
                if (limit!=1) {
                    items.unshift(i18n.t('texts.the first entries', { number: items.length, total: nItems } ) );
                }
            } else if (items.length) {
                if (limit!=1) {
                    items.unshift(i18n.t('texts.all n entries', { total: nItems } ) );
                }
            } else {
                items=clusters;
            }
            return items.join('<hr/>\n');
        },

        /* {{{ Icons */
        createIconFromData: function (data) {
            return new OpenLayers.Icon(this.getIconUrl(data));
        },

        getIconUrl: function (data) {
            if (this.evaluateOH(data) != 'na') {
                switch (data._oh_state) {
                case 'ok': case 'warning': return 'img/circle_' + (data._it_object.getState() ? 'green' : (data._it_object.getUnknown() ? 'yellow' : 'red'))
                       + (data._oh_state == 'warning' ? '_warn' : '') + '.png';
                case 'error':   return 'img/circle_err.png';
                default: return false;
                }
            }
        },
        /* }}} */

        //------------------------------------------------------------
        //    Welche POIs laden?
        //------------------------------------------------------------

        keyValues: [
        ],

        //------------------------------------------------------------
        //    Nach pan oder zoom: POIs neuladen.
        //------------------------------------------------------------
        moveTo: function (bounds, zoomChanged, dragging) {
            OpenLayers.Layer.Markers.prototype.moveTo.apply(this,arguments);

            if (dragging || !this.visibility || this.map.zoom<this.minZoom) return;

            this.reloadPOIs();
        },

        //------------------------------------------------------------
        //    POIs neuladen.
        //    Muss nach Ändern von keyValues augerufen werden.
        //------------------------------------------------------------
        reloadPOIs: function () {
            if (this.updateKeyValues) {
                this.updateKeyValues();
            }

            var xml = this.overpassQL(this.keyValues);
            var url = 'http://overpass-api.de/api/interpreter?&data=' + encodeURIComponent(xml);

            var self = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);      // true makes this call asynchronous
            xhr.onreadystatechange = function () {    // need eventhandler since our call is async
                if ( xhr.readyState == 4 && xhr.status == 200 ) {  // check for success
                    self.poi_data = JSON.parse(xhr.responseText);
                    self.redrawPOIs();
                }
            };
            xhr.send(null);
        },

        redrawPOIs: function() {
            this.jsonCallback(this.poi_data);
        },

        /* {{{ Overpass query */
        overpassQL: function (keyvalues) {
            if (!(keyvalues instanceof Array)) keyvalues = [keyvalues];

            var bbox = this.map.getExtent()
                .transform(this.map.getProjectionObject(), this.map.displayProjection);

            if ($.isEmptyObject(nominatim_data_global)) {
                var nominatim_query = OpenLayers.String.format('&lat=${top}&lon=${left}', bbox);
                this.updateNominatimData(nominatim_query);
            }

            var bboxQuery = OpenLayers.String.format (
                '[bbox:${bottom},${left},${top},${right}]',
                bbox);

            var components = [];
            for (var i in keyvalues) {
                var key = keyvalues[i];
                components.push("node['" + key + "'];");
                components.push("way['" + key + "'];");
            }

            var OverpassQL = '[out:json][timeout:3]' + bboxQuery + ';(' + components.join('') + ');out body center 1000;';

            return OverpassQL;
        },
        /* }}} */

        evaluateOH: function (data) {
            if (typeof data._oh_value === 'undefined' && typeof data._oh_state === 'undefined') {
                for (var i=0; i < OSM_tags.length; i++) {
                    if (typeof data[OSM_tags[i]] === 'string') {
                        data._oh_value = data[OSM_tags[i]];
                        break;
                    }
                }
                if (typeof data._oh_value === 'undefined') {
                    data._oh_value = false;
                    data._oh_state = 'na'; /* Not applicable. */
                    return data._oh_state;
                }

                var crashed = true;
                try {
                    var oh = new opening_hours(data._oh_value, nominatim_data_global, {
                            'mode': OHMode,
                            // 'warnings_severity': 7,
                            /* Use default for now. See: https://github.com/opening-hours/opening_hours.js/issues/81 */
                            'locale': i18n.lng()
                        }
                            );
                    var it = oh.getIterator(this.reftime);
                    crashed = false;
                } catch (err) {
                    crashed = err;
                    data._oh_object = crashed;
                    data._oh_state = 'error';
                }

                if (!crashed) {
                    data._oh_object = oh;
                    data._it_object = it;
                    if (oh.getWarnings().length > 0) {
                        data._oh_state = 'warning';
                    } else {
                        data._oh_state = 'ok';
                    }
                }
                return data._oh_state;
            }
        },

        lastLat: undefined,
        lastLon: undefined,
        poi_data: undefined,

        createMarkerFromData: function(elements) {
        },

        /* FIXME */
        // nominatim_data: {},
        updateNominatimData: function (query) {
            reverseGeocodeLocation(
                query,
                mapCountryToLanguage(i18n.lng()),
                function(nominatim_data) {
                    // console.log(JSON.stringify(nominatim_data, null, '\t'));
                    /* http://stackoverflow.com/a/1144249 */
                    if (JSON.stringify(nominatim_data_global) !== JSON.stringify(nominatim_data)) {
                        // this.nominatim_data = nominatim_data;
                        nominatim_data_global = nominatim_data;
                        // poi_layer.redrawPOIs();
                    }
                }
            );
        },

        jsonCallback: function (data) {
            if (typeof data === 'undefined') {
                return;
            }

            var elements = data.elements;
            if (!elements) {
                alert ('Missing "elements" in overpassQL json data.');
                return;
            }
            this.erase(true);

            for (var i in elements) {
                var element = elements[i];
                var data = element.tags;
                if (!data) data = {};
                if (element.id) {
                    data.id = (element.type ? element.type.substr(0,1) : '') + element.id;
                    data._id = element.id;
                }
                data._type = element.type;
                if (data._type == 'way') {
                    data.lat = element.center.lat;
                    data.lon = element.center.lon;
                } else {
                    data.lat = element.lat;
                    data.lon = element.lon;
                }
                this.createMarker (data);
            }

            if (typeof elements[0] !== 'undefined' && (typeof this.lastLat === 'undefined'
                || Math.abs(this.lastLat - elements[0].lat) > 2
                || Math.abs(this.lastLon - elements[0].lon) > 2)) {

                // console.log("updateNominatimData inside query");
                this.updateNominatimData('&osm_type=' + elements[0].type.substr(0,1).toUpperCase() + '&osm_id=' + elements[0].id);

                this.lastLat = elements[0].lat;
                this.lastLon = elements[0].lon;
            }
        },

        //------------------------------------------------------------
        //    Update keyValues
        //------------------------------------------------------------
        updateKeyValues: function () {
            var key = related_tags[document.getElementById('tag_selector_input').selectedIndex];
            this.keyValues = [ key ];
            OSM_tags = [ key ];
            permalinkParams.tags = key;
        },

        filter: function(data) {
            switch (permalinkParams.filter) {
                case 'error':
                    return this.evaluateOH(data) == 'error' || data._oh_object.getWarnings().length > 0;
                    break;
                case 'errorOnly':
                    return this.evaluateOH(data) == 'error';
                    break;
                case 'warnOnly':
                    return this.evaluateOH(data) != 'error' && data._oh_object.getWarnings().length > 0;
                    break;
                case 'open':
                    if (this.evaluateOH(data) == 'error')
                        return false;
                    else
                        return data._it_object.getState();
                    break;
                case 'unknown':
                    if (this.evaluateOH(data) == 'error')
                        return false;
                    else
                        return data._it_object.getUnknown();
                    break;
                case 'closed':
                    if (this.evaluateOH(data) == 'error')
                        return false;
                    else
                        return !data._it_object.getState() && !data._it_object.getUnknown();
                    break;
                case 'openOrUnknown':
                    if (this.evaluateOH(data) == 'error')
                        return false;
                    else
                        return data._it_object.getState() || data._it_object.getUnknown();
                    break;
                case 'none':
                default:
                    return true;
            }
        },
    }
));
/* }}} */

//----------------------------------------------------------------------------
//    Stelle bestimmten Bereich in maximaler Groesse dar
//----------------------------------------------------------------------------

if (!map.getCenter()) {
    map.zoomToExtent(
        new OpenLayers.Bounds(7.1042, 50.7362, 7.1171, 50.7417).
            transform(new OpenLayers.Projection('EPSG:4326'), map.getProjectionObject())
    );
}
/* }}} */

document.getElementById('tag_selector_input').onchange = keyChanged;

});
