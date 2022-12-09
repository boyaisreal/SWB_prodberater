/*global QUnit*/

sap.ui.define([
	"sapui.mr.learn./odatadraftone/controller/view.controller"
], function (Controller) {
	"use strict";

	QUnit.module("view Controller");

	QUnit.test("I should test the view controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
