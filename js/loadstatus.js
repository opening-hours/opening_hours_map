//--------------------------------------------------------------------------------
//	$Id: loadstatus.js,v 1.8 2013/02/25 07:53:18 wolf Exp $
//--------------------------------------------------------------------------------
//	Erklaerung:	http://www.netzwolf.info/kartografie/openlayers/loadstatus
//--------------------------------------------------------------------------------
//	Fragen, Wuensche, Bedenken, Anregungen?
//	<openlayers(%40)netzwolf.info>
//--------------------------------------------------------------------------------

OpenLayers.Control.LoadStatus=OpenLayers.Class(OpenLayers.Control,{

	defaultHtml: '<b style="font-size:200%;">Loading ...</b><br/>${layers}',

	loadStatus: {},

	initialize: function (options) {
		OpenLayers.Control.prototype.initialize.apply (this,[options]);
		this.options=options || {};
	},

	destroy: function() {
		OpenLayers.Control.prototype.destroy.apply(this,arguments);
	},

	draw: function() {
		OpenLayers.Control.prototype.draw.apply(this,arguments);
		this.div.className=this.displayClass;
		return this.div;
	},

	setMap: function (map) {
		OpenLayers.Control.prototype.setMap.apply(this,arguments);
		for (var layer in this.map.layers) {
			this.attachLayer (layer);
		}
		this.map.events.register ("addlayer", this, this.registerLayer);
	},

	registerLayer: function (evt) {
		this.attachLayer (evt.layer);
	},

	attachLayer: function (layer) {
		if (!layer || layer==this || !layer.events || layer.noLoadStatus) { return; }
		layer.events.register ("loadend",   this, this.eventHandler);
		layer.events.register ("loadstart", this, this.eventHandler);
	},

	eventHandler: function (evt) {
		if (evt && evt.type=="loadstart") {
			this.loadStatus[evt.object.id] = evt.object.name || evt.object.id;
		}
		if (evt && evt.type=="loadend") {
			this.loadStatus[evt.object.id] = null;
		}
		var list = [];
		for (var id in this.loadStatus) {
			if (this.loadStatus[id] !== null) { list.push(this.loadStatus[id]); }
		}
		var text=this.options.html || this.defaultHtml;
		this.div.innerHTML=OpenLayers.String.format(text, {layers: list.join(',<br/>')});
		this.div.style.display = list.length>=1 ? "block" : "none";
	},

	CLASS_NAME:"OpenLayers.Control.LoadStatus"
});

//--------------------------------------------------------------------------------
//	$Id: loadstatus.js,v 1.8 2013/02/25 07:53:18 wolf Exp $
//--------------------------------------------------------------------------------
