sap.ui.define([
    "sap/ui/base/Object"
], function (
    BaseObject
) {
    "use strict";

    return BaseObject.extend("sap.ui.mr.learn.odatadraftone.localService.ODATAservice", {

        /**
         *
         * @param oComponent 
         * @param sModel 
         */
        constructor: function (oComponent, sModel) {
            this.oDataModel = oComponent.getModel(sModel);
        },

        readEntity: function (sPath, aFilter, sParam) {
            return new Promise(function (fnResolve, fnReject) {
                this.oDataModel.read(sPath, {
                    filters: aFilter,
                    urlParameters: sParam,
                    success: function (oData) {
                        fnResolve(oData);
                    },
                    error: function (oError) {
                        fnReject(oError);
                    }
                });
            }.bind(this));
        },

        

        createEntity: function (sPath, oPayload, sParam) {
            return new Promise(function (fnResolve, fnReject) {
                this.oDataModel.create(sPath, oPayload,
                    {
                        urlParameters: sParam,
                        success: function (oData) {
                            fnResolve(oData);
                        },
                        error: function (oError) {
                            fnReject(oError);
                        }
                    });
            }.bind(this));
        },

        updateEntity: function (sPath, oPayload, sParam) {
            return new Promise(function (fnResolve, fnReject) {
                this.oDataModel.update(sPath, oPayload, {
                    urlParameters: sParam,
                    success: function (oData) {
                        fnResolve(oData);
                    },
                    error: function (oError) {
                        fnReject(oError);
                    }
                });
            }.bind(this));
        },

        /*
       * @param sPath
       * @param oParam
       * @returns
       */
        callGetFunction: function (sPath, oParam) {
            return new Promise(function (fnResolve, fnReject) {
                this.oDataModel.callFunction(sPath, {
                    urlParameters: oParam,
                    method: "GET",
                    success: function (oData) {
                        fnResolve(oData);
                    },
                    error: function (oError) {
                        fnReject(oError);
                    }
                });
            }.bind(this));
        },







    });
});