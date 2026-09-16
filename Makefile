OpenLayersVersion := 2.13.1

## help {{{
.PHONY: list
# https://stackoverflow.com/a/26339924/2239985
list:
	@echo "This Makefile has the following targets:"
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | egrep -v -e '^[^[:alnum:]]' -e '^$@$$' | sed 's/^/    /'
## }}}

.PHONY: check
check:
	npm run test

.PHONY: build-main-bundle
build-main-bundle:
	npm run build

## Make this project ready to be served by a webserver.
.PHONY: ready-for-hosting
ready-for-hosting: dependencies-get build-main-bundle
	$(MAKE) --directory opening_hours.js/ ready-for-hosting

.PHONY: opening_hours+deps.min.js
opening_hours+deps.min.js:
	$(MAKE) --directory opening_hours.js/ build/opening_hours+deps.min.js

taginfo.json: ./opening_hours.js/scripts/related_tags.txt ./opening_hours.js/scripts/gen_taginfo_json.js taginfo_template.json
	./opening_hours.js/scripts/gen_taginfo_json.js --key-file="$<" --template-file=taginfo_template.json > "$@"

.PHONY: dependencies-get
dependencies-get:
	git verify-commit HEAD || (echo "The author is signing all recent git commits. If the command failed because you don’t have ypid’s key in your keyring, you can import it from a keyserver and verify it’s authenticity." && exit 1)
	git submodule update --init --recursive

.PHONY: deploy-on-all-servers
deploy-on-all-servers: deploy-on-openingh.openstreetmap.de deploy-on-ypid.de

.PHONY: deploy-on-openingh.openstreetmap.de
deploy-on-openingh.openstreetmap.de: opening_hours+deps.min.js build-main-bundle
	rsync --archive --delete-after * everest.openstreetmap.de:~/www -v

# Custom deployment method which allows me to fully isolate the development and build environment from the server.
# Copy tar because qvm-copy blocks relative symlinks.
# Ref: https://github.com/QubesOS/qubes-issues/issues/9667
.PHONY: deploy-on-openingh.openstreetmap.de
deploy-on-ypid.de: opening_hours+deps.min.js build-main-bundle
	rm -f "/tmp/opening_hours_map.tar"
	/bin/tar --exclude-vcs --exclude='./js/*.tar.gz' --exclude='./js/OpenLayers-$(OpenLayersVersion)/doc' --exclude='./opening_hours.js/node_modules/bower' --exclude='./opening_hours.js/submodules/panieravide.github.io/id-indoor' --exclude='./opening_hours.js/submodules/panieravide.github.io/pic4carto' --exclude='./opening_hours.js/submodules/YoHours/node_modules/**' --no-acls -cf /tmp/opening_hours_map.tar .
	qvm-copy "/tmp/opening_hours_map.tar"
