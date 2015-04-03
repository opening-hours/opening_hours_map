OpenLayersVersion := 2.13.1

.PHONY: dependencies-get git_submodules
dependencies-get: git_submodules js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js

git_submodules:
	git submodule update --init --recursive
	make --directory opening_hours.js dependencies-get

js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js:
	-wget --no-clobber -O js/OpenLayers-$(OpenLayersVersion).tar.gz http://github.com/openlayers/openlayers/releases/download/release-$(OpenLayersVersion)/OpenLayers-$(OpenLayersVersion).tar.gz
	tar -xzf js/OpenLayers-$(OpenLayersVersion).tar.gz -C js/
