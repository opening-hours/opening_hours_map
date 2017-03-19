OpenLayersVersion := 2.13.1

## help {{{
.PHONY: list
# https://stackoverflow.com/a/26339924/2239985
list:
	@echo "This Makefile has the following targets:"
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$' | sed 's/^/    /'
## }}}

.PHONY: check
check: check-html

.PHONY: check-html
check-html:
	html5validator --root . --blacklist js opening_hours.js --ignore-re 'Start tag seen without seeing a doctype first'

## Make this project ready to be served by a webserver.
.PHONY: ready-for-hosting
ready-for-hosting: dependencies-get
	$(MAKE) --directory opening_hours.js/ ready-for-hosting

.PHONY: opening_hours+deps.min.js
opening_hours+deps.min.js:
	$(MAKE) --directory opening_hours.js/ opening_hours+deps.min.js

taginfo.json: ./opening_hours.js/gen_taginfo_json.js ./opening_hours.js/related_tags.txt taginfo_template.json
	opening_hours_map --key-file ./opening_hours.js/related_tags.txt --template-file taginfo_template.json > "$@"

.PHONY: dependencies-get
dependencies-get: js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js
	git submodule update --init
	cd opening_hours.js/ && git verify-commit HEAD && git submodule update --init --recursive

js/OpenLayers-$(OpenLayersVersion)/OpenLayers.js:
	-wget --no-clobber -O js/OpenLayers-$(OpenLayersVersion).tar.gz https://github.com/openlayers/openlayers/releases/download/release-$(OpenLayersVersion)/OpenLayers-$(OpenLayersVersion).tar.gz
	tar -xzf js/OpenLayers-$(OpenLayersVersion).tar.gz -C js/

.PHONY: deploy-on-all-servers
deploy-on-all-servers: deploy-on-openingh.openstreetmap.de deploy-on-ypid.de

.PHONY: deploy-on-openingh.openstreetmap.de
deploy-on-openingh.openstreetmap.de: opening_hours+deps.min.js
	rsync  --archive * gauss.osm.de:~/www -v

## Custom deployment method which allows me to fully isolate the development and build environment from the server.
.PHONY: deploy-on-openingh.openstreetmap.de
deploy-on-ypid.de: opening_hours+deps.min.js
	rm -rf "/tmp/opening_hours_map"
	mkdir --parents "/tmp/opening_hours_map"
	/bin/tar --exclude-vcs --exclude='./js/*.tar.gz' --exclude='./js/OpenLayers-$(OpenLayersVersion)/doc' --exclude='./opening_hours.js/node_modules/bower' --exclude='./opening_hours.js/submodules/panieravide.github.io/id-indoor' --exclude='./opening_hours.js/submodules/panieravide.github.io/pic4carto' --no-acls -czf - . | /bin/tar -xz --directory "/tmp/opening_hours_map" -f -
	qvm-copy-to-vm s-cm "/tmp/opening_hours_map"
