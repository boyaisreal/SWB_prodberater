/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require(["sap/ui/mr/learn/odatadraftone/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
