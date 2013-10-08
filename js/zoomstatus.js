//--------------------------------------------------------------------------------
//	$Id: zoomstatus.js,v 1.8 2013/02/25 07:51:19 wolf Exp $
//--------------------------------------------------------------------------------
//	Erklaerung:	http://www.netzwolf.info/kartografie/openlayers/zoomstatus
//--------------------------------------------------------------------------------
//	Fragen, Wuensche, Bedenken, Anregungen?
//	<openlayers(%40)netzwolf.info>
//--------------------------------------------------------------------------------

OpenLayers.Control.ZoomStatus=OpenLayers.Class(OpenLayers.Control,{

	defaultHtml: '<b>Zoom=${actual}, bei Zoom=${next} werden weitere Daten eingeblendet</b>',
	displayClass: 'olControlZoomStatus',

	//---------------------------------------------------------
	//	init
	//---------------------------------------------------------

	initialize: function (options) {
		OpenLayers.Control.prototype.initialize.apply (this,[options]);
		this.options=options || {};
		this.lastZoom=-1;
	},

	//---------------------------------------------------------
	//	destroy
	//---------------------------------------------------------

	destroy: function() {
		if (this.map){
			this.map.events.unregister('move', this, this.redraw);
		}
		OpenLayers.Control.prototype.destroy.apply(this,arguments);
	},

	//---------------------------------------------------------
	//	attached to map
	//---------------------------------------------------------

	setMap: function() {
		OpenLayers.Control.prototype.setMap.apply(this,arguments);
		this.map.events.register ('move', this, this.checkZoomChanged);
		this.map.events.register ('addlayer', this, this.redraw);
		this.map.events.register ('changelayer', this, this.redraw);
	},

	//---------------------------------------------------------
	//	make control visible
	//---------------------------------------------------------

	draw: function() {
		OpenLayers.Control.prototype.draw.apply(this,arguments);
		this.div.className=this.displayClass;
		this.div.style.display='none';
		return this.div;
	},

	//---------------------------------------------------------
	//	update info
	//---------------------------------------------------------

	checkZoomChanged: function () {
		if (this.map.zoom!=this.lastZoom) { this.redraw(); }
	},

	redraw: function () {
		this.lastZoom=this.map.zoom;
		var next = this.getNextZoomStep();
		var text = this.div.innerHTML=this.options.html || this.defaultHtml;

		this.div.innerHTML=OpenLayers.String.format(text, {
			actual: this.lastZoom,
			delta: next-this.lastZoom,
			next: next
		});

		this.div.style.display=next>this.lastZoom ? 'block' : 'none';
	},

	//---------------------------------------------------------
	//	get next info
	//---------------------------------------------------------

	getNextZoomStep: function (current) {
		if (!this.map) { return null; }
		var steps=0;
		for (var i in this.map.layers) {
			var layer = this.map.layers[i];
			if (layer.zoomSteps && layer.visibility) {
				steps |= layer.zoomSteps;
			}
		}
		for (i=this.map.zoom+1; i<30; i++) {
			if ((steps>>i) & 1) { return i; }
		}
		return 0;
	},

	CLASS_NAME:'OpenLayers.Control.ZoomStatus'
});

//--------------------------------------------------------------------------------
//	$Id: zoomstatus.js,v 1.8 2013/02/25 07:51:19 wolf Exp $
//--------------------------------------------------------------------------------
