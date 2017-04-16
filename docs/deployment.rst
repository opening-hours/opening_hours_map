deployment and hosting
======================

openingh.openstreetmap.de
-------------------------

* https://wiki.openstreetmap.org/wiki/FOSSGIS/Server/Projects/opening_hours.js
* https://github.com/opening-hours/opening_hours.js/issues/169


openingh.ypid.de
----------------

Webserver deployment is handled by DebOps_, ypid-ansible-common_ and debops.nginx_.

The following Webserver configuration is currently deployed:

.. code-block:: yaml

   nginx__servers:

     - type: 'default'
       name: [ 'openingh.ypid.de', 'openingh.openstreetmap.de' ]
       owner: 'osm'
       csp: "default-src 'none'; script-src 'self' 'unsafe-inline' https://code.jquery.com; connect-src https://overpass-api.de https://nominatim.openstreetmap.org https://localhost:8111; img-src 'self' data: https://*.tile.openstreetmap.org https://*.tile.opencyclemap.org; style-src 'self' 'unsafe-inline';"
       csp_enabled: True
       location_list:
         - pattern: '/stats'
           options: 'return 307 http://openingh.openstreetmap.de$request_uri;'

Deployment of the site is done with the Makefile in this repository. Have a look at the ``deploy-on-ypid.de`` target.

.. _DebOps: https://debops.org/
.. _debops.nginx: https://github.com/debops/ansible-nginx
.. _ypid-ansible-common: https://github.com/ypid/ypid-ansible-common/
