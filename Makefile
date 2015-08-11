OpenLayersVersion := 2.13.1

.PHONY: dependencies-get
dependencies-get: js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js
	git submodule update --init --recursive
	$(MAKE) --directory opening_hours.js/ dependencies-get

js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js:
	-wget --no-clobber -O js/OpenLayers-$(OpenLayersVersion).tar.gz http://github.com/openlayers/openlayers/releases/download/release-$(OpenLayersVersion)/OpenLayers-$(OpenLayersVersion).tar.gz
	tar -xzf js/OpenLayers-$(OpenLayersVersion).tar.gz -C js/
