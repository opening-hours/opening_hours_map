OpenLayersVersion?=	2.13.1

installDependencies: js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js opening_hours.js/node_modules/suncalc/suncalc.js
	git submodule update --init --recursive

opening_hours.js/node_modules/suncalc/suncalc.js:
	cd opening_hours.js/ && npm install

js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js:
	-wget --no-clobber -O js/OpenLayers-$(OpenLayersVersion).tar.gz http://github.com/openlayers/openlayers/releases/download/release-$(OpenLayersVersion)/OpenLayers-$(OpenLayersVersion).tar.gz
	tar -xzf js/OpenLayers-$(OpenLayersVersion).tar.gz -C js/
