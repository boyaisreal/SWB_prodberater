sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/base/Log",
    "sap/ui/core/routing/History",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
], function (Controller, Log, History, Fragment, MessageToast, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("sap.ui.mr.learn.odatadraftone.controller.BaseController", {
        Log: Log,

        /**
         * Gibt den Router der Applikation zurück
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
             return this.getOwnerComponent().getRouter();
        },

        /**
         * Gibt das Model zum übergebenen Namen zurück
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getOwnerComponent().getModel(sName);
        },

        /**
         * Setzt das übergebene Model mit dem Namen in die View
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setViewModel: function (oModel, sName) {
            return this.getOwnerComponent().setModel(oModel, sName);
        },

        /**
         * Gibt das Resourcebundle zurück. Mit diesem kann auf i18n-Texte zugegriffen werden.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler für eine Rückwärtsnavigation
         * Falls es einen Eintrag in der Historie gibt, wird dieser zurück navigieren. Ansonsten wird zur Master Route navigiert.
         * @public
         */
        onNavBack: function () {
            try {
                const sPreviousHash = History.getInstance().getPreviousHash();
                if (sPreviousHash !== undefined) {
                    // The history contains a previous entry
                    history.go(-1);
                } else {
                    // Otherwise we go backwards with a forward history
                    const bReplace = true;
                    this.getRouter().navTo("master", {}, bReplace);
                }
            } catch (oError) {
                Log.error(oError.message);
            }
        },

        /**
         * Erstellt ein Fragement und gibt dieses zurück
         * @param {string} sId - Id für das zu erstellende Fragment
         * @param {string} sPath - Pfad zum Fragment
         * @returns {object} Neu erstelltes Fragment
         */
        createFragment: function (sId, sPath) {
            try {
                return sap.ui.xmlfragment(sId, sPath, this);
            } catch (oError) {
                Log.error(oError.message);
            }
        },

        /**
         * Setzt die übergebene Controller-Instanz
         * @param {object} oController: Controller-Instanz
         */
        setActiveController: function (oController) {
            this._oActiveController = oController;
        },

        /**
         * Gibt die aktive Controller-Instanz zurück
         * @returns {object} Controller-Instanz
         */
        getActiveController: function () {
            return this._oActiveController;
        },

        /**
         * Setzt das "route matched" Event an die übergebene Controller-Instanz und bindet die Funktion onHandleRouteMatched an diesen
         * @param {object} oController: Controller-Instanz
         * @param {string} sRoute: Name der Route
         */
        initHandleRouteMatchedFor: function (oController, sRoute) {
            try {
                oController._oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
                oController._oRouter.getRoute(sRoute).attachMatched(oController.onHandleRouteMatched, oController);
            } catch (oError) {
                Log.error(oError.message);
            }
        },

        /**
         * Prüft ob ein String im Quellstring vorkommt
         * @param {string} sSource: Quellstring
         * @param {string} sString: Zeichenkette
         * @returns {boolean} Gibt true zurück, wenn sString in sSource vorkommt, andernfalls wird false zurückgegeben
         */
        containsString: function (sSource, sString) {
            if (sSource.indexOf(sString) > -1) {
                return true;
            } else {
                return false;
            }
        },

        /**
         * Prüft auf Gleichheit zwischen zwei JSON-Objekten
         * @param {object} oObject1: JSON-Objekt
         * @param {object} oObject2: JSON-Objekt
         * @returns {boolean} Gibt true zurück, wenn beide Objekte identisch sind, andernfalls wird false zurückgegeben
         */
        isEqual: function (oObject1, oObject2) {
            return JSON.stringify(oObject1) === JSON.stringify(oObject2);
        },

        getDialog: async function (sDialogName, sId) {
            const oDialog = this.byId(sId);
            if (!oDialog) {
                const sFragmentPath = `pt.smshub.root.view.fragments.${sDialogName}`;
                const oNewDialog = await Fragment.load({
                    name: sFragmentPath,
                    controller: this,
                    id: this.getView().getId()
                });
                this.getView().addDependent(oNewDialog);
                oNewDialog.setEscapeHandler((oPromise) => oPromise.reject());
                return oNewDialog;
            }
            return oDialog;
        },

        onCancelDialog: function (sDialogName) {
            this.byId(sDialogName).close();
            this.byId(sDialogName).destroy();
        },









        /**
         * Calles the address validation data from Backend
         * @param {*} sPostCode 
         * @param {*} sCity 
         */
         _getStreetData: async function (sPostCode, sCity) {
            let aFilter = [];
            aFilter.push(new sap.ui.model.Filter("PostalCode", FilterOperator.EQ, sPostCode));
            aFilter.push(new sap.ui.model.Filter("City", FilterOperator.EQ, sCity));
            try {
                let oData = await this.Dataservice.readStreetData(aFilter);
                var aStreets = oData.results.map(function (item) {
                    var oObj = {
                        Street: item.Street
                    };
                    return oObj;
                });
                this.getModel("util").setProperty("/streetSuggestion", aStreets);
            } catch (oError) {
                MessageToast.show("Can't read /AddressValidCollection: " + oError.statusCode + ", " + oError.message);
            }
        },




        /**
         * Is Called while typping in PLZ-Input and show suggestions from util model
         * @param {*} oEvent 
         */
        handlePLZSuggest: function (oEvent) {
            var oInput = oEvent.getSource();
            if (!oInput.getSuggestionItems().length) {
                oInput.bindAggregation("suggestionItems", {
                    path: "util>/plzAndLocation/",
                    length: 10000,
                    template: new sap.ui.core.ListItem({
                        text: "{util>Postl}",
                        additionalText: "{util>City}"
                    })
                });
            }
            var sTerm = oEvent.getParameter("suggestValue");
            var aFilters = [];
            if (sTerm) aFilters.push(new Filter("Postl", FilterOperator.StartsWith, sTerm));
            oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
        },



        /**
         * Is Called while typping in City-Input and show suggestions from util model
         * @param {*} oEvent 
         */
        handleCitySuggest: function (oEvent) {
            var oInput = oEvent.getSource();
            if (!oInput.getSuggestionItems().length) {
                oInput.bindAggregation("suggestionItems", {
                    path: "util>/plzAndLocation/",
                    length: 1500,
                    template: new sap.ui.core.ListItem({
                        text: "{util>Postl}",
                        additionalText: "{util>City}"
                    })
                });
            }
            var sTerm = oEvent.getParameter("suggestValue");
            var aFilters = [];
            if (sTerm) aFilters.push(new Filter("City", FilterOperator.Contains, sTerm));
            oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
        },

         /**
         * Is Called while typping in Street-Input and show suggestions from util model
         * @param {*} oEvent 
         */
        handleStreetSuggest: function (oEvent) {
            var oInput = oEvent.getSource();
            if (!oInput.getSuggestionItems().length) {
                oInput.bindAggregation("suggestionItems", {
                    path: `util>/streetSuggestion/`,
                    length: 10000,
                    template: new sap.ui.core.ListItem({
                        text: "{util>Street}"
                    })
                });
            }
            var sTerm = oEvent.getParameter("suggestValue");
            var aFilters = [];
            if (sTerm) aFilters.push(new Filter("Street", FilterOperator.StartsWith, sTerm));
            oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
        },


        onPostcodeChange: function (oEvent, sBinding) {
            this.setAddressState(oEvent, "Postl", sBinding, "Postleizahl");
        },

        onCityChange: function (oEvent, sBinding) {
            this.setAddressState(oEvent, "City", sBinding, "Ort");
        },
        onStreetChange: function (oEvent, sBinding) {
            this.setAddressState(oEvent, "Street", sBinding, "Straße");
        },


        
        /**
         * Is Called after typping in PLZ-Input and show if there is any match with the suggestions, if not, error appears
         * @param {*} evt 
         * @param {*} sFieldId 
         * @param {*} sBinding 
         * @param {*} sFieldName 
         */
        setAddressState: function (evt, sFieldId, sBinding, sFieldName) {
            var sTerm = evt.getSource().getValue();
            var aFilters = [];
            if (sTerm) aFilters.push(new Filter(sFieldId, FilterOperator.EQ, sTerm));
            if (evt.getSource().getBinding("suggestionItems")) {
                evt.getSource().getBinding("suggestionItems").filter(aFilters);
                if (evt.getSource().getSuggestionItems().length === 0) {
                    evt.getSource().setValueState("Error")
                    evt.getSource().setValueStateText("Bitte die Adresse nochmal überprüfen");
                } else {
                    evt.getSource().setValueState("None")
                }
            } else {
                evt.getSource().setValueState("Error");
                evt.getSource().setValueStateText("Bitte die Adresse nochmal überprüfen");
            }

        },




        onSuggestionAddressItemSelected: async function (oEvent, sBinding, sAddressValidation) {
            let oUtilModel = this.getModel("util");

            this.getView().getControlsByFieldGroupId(sBinding).forEach(function (item) {
                if (item.getMetadata()._sClassName === "sap.m.Input") {
                    item.setValueState("None");
                }
            }.bind(this));
            var sSelectedCity = oEvent.getParameter("selectedItem").getAdditionalText(),
                sSelectedPLZ = oEvent.getParameter("selectedItem").getText();
            oUtilModel.setProperty(`/selectedAdress/HouseNumber`, "");
            oUtilModel.setProperty(`/selectedAdress/Street`, "");
            oUtilModel.setProperty(`/selectedAdress/PostCode`, sSelectedPLZ);
            oUtilModel.setProperty(`/selectedAdress/City`, sSelectedCity);

            //call ans Backend für gefilterte STraßen
            this._getStreetData(sSelectedPLZ, sSelectedCity);

            this.getView().byId("streetInput").setEnabled(true);
            this.getView().byId("housenummberInput").setEnabled(true);
        },



        resetStartupParameters: function () {
            const oComponentData = this.getOwnerComponent().getComponentData();
            if (oComponentData) {
                oComponentData.startupParameters = null;
            }
        }
    });

    

});