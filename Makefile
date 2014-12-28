OpenLayersVersion?=	2.13.1

installDependencies: git_submodules js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js opening_hours.js/node_modules/suncalc/suncalc.js

git_submodules:
	git submodule update --init --recursive
	cd opening_hours.js/ && npm install

js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js:
	-wget --no-clobber -O js/OpenLayers-$(OpenLayersVersion).tar.gz http://github.com/openlayers/openlayers/releases/download/release-$(OpenLayersVersion)/OpenLayers-$(OpenLayersVersion).tar.gz
	tar -xzf js/OpenLayers-$(OpenLayersVersion).tar.gz -C js/
