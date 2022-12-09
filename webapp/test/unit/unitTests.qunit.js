/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"sapui.mr.learn./odatadraftone/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
