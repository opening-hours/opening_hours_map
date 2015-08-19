OpenLayersVersion := 2.13.1

## help {{{
.PHONY: list
# https://stackoverflow.com/a/26339924/2239985
list:
	@echo "This Makefile has the following targets:"
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$' | sed 's/^/    /'
## }}}

## Make this project ready to be served by a webserver.
.PHONY: ready-for-hosting
ready-for-hosting: dependencies-get
	$(MAKE) --directory opening_hours.js/ ready-for-hosting

.PHONY: dependencies-get
dependencies-get: js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js
	git submodule update --init --recursive

js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js:
	-wget --no-clobber -O js/OpenLayers-$(OpenLayersVersion).tar.gz https://github.com/openlayers/openlayers/releases/download/release-$(OpenLayersVersion)/OpenLayers-$(OpenLayersVersion).tar.gz
	tar -xzf js/OpenLayers-$(OpenLayersVersion).tar.gz -C js/

.PHONY: publish-website-on-all-servers
publish-website-on-all-servers: publish-website-on-openingh.openstreetmap.de

.PHONY: publish-website-on-openingh.openstreetmap.de
publish-website-on-openingh.openstreetmap.de:
	rsync . --archive gauss.osm.de:~/www
