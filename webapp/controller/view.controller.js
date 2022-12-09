sap.ui.define([
    //after the controller starts with define you have to add all the Sap librariers you need in yor controller in here
    //this is similar to the namespaces in the views
    //rule of thumb: if you are using the new operator you need to add the element in here 
    "sap/ui/mr/learn/odatadraftone/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/library',
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/mr/learn/odatadraftone/localService/dataservice",
    "sap/ui/mr/learn/odatadraftone/model/Formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/core/Fragment',
    "sap/m/MessageBox",
    "sap/m/MessageToast",

    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
], function (BaseController, Controller, coreLibrary,
    ODataModel,
    dataservice,
    Formatter,
    Filter,
    FilterOperator,
    Fragment,
    MessageBox,
    MessageToast) {

    "use strict";

    return BaseController.extend("sap.ui.mr.learn.odatadraftone.controller.view", {
        Formatter: Formatter,
        onInit: function () {
            let oComponent = this.getOwnerComponent();
            this.Dataservice = new dataservice(oComponent, "main");
            this.AdressAndProductService = new dataservice(oComponent, "adress");
        },

        /**
         * @override
         */
        onAfterRendering: async function () {
            await this.getModel("util").dataLoaded();
            this._wizard = this.byId("CreateProductWizard");
            let oDataPLZandLocation = await this.Dataservice.readAdressPLZandLocation();
            let oDataDivison = await this.AdressAndProductService.readDivisionSet();
            this.getModel("util").setProperty("/plzAndLocation", oDataPLZandLocation.results);
            this.getModel("util").setProperty("/divisonSet", oDataDivison.results);
            this.manageDivisions();
            await this.checkIfCustomerID();
        },


        manageDivisions: function () {
            let divisonData = this.getModel("util").getProperty("/divisonSet");
            for (let i = 0; i < divisonData.length; i++) {
                let divisionKey = this.getModel("util").getProperty("/divisonSet/" + i + "/CustKey")
                switch (divisionKey) {
                    case "DIV_ELECTRICITY":
                        this.getModel("util").setProperty("/divisonSet/electric", this.getModel("util").getProperty("/divisonSet/" + i));
                        break;
                    case "DIV_GAS":
                        this.getModel("util").setProperty("/divisonSet/gas", this.getModel("util").getProperty("/divisonSet/" + i));
                        break;
                    default:
                        this.getModel("util").setProperty("/divisonSet/water", this.getModel("util").getProperty("/divisonSet/" + i));
                        break;

                }
            }

        },

        checkIfCustomerID: async function () {
            this.getView().getModel("util").setProperty("/bp/givenBP", false);
            this.getView().getModel("util").setProperty("/bp/bpId", "");
            var sURL = window.location.href;
            var oParamCust = sURL.split("&").find(function (item) {
                return item.includes("customerid");
            });
            if (oParamCust) {
                this.partner = oParamCust.split("=")[1];
                this.getView().getModel("util").setProperty("/bp/givenBP", true);
                this.getView().getModel("util").setProperty("/bp/bpId", this.partner);
            }
            var oParamContr = sURL.split("&").find(function (item) {
                return item.includes("contractsid");
            });
            if (oParamContr) {
                this.contract = oParamContr.split("=")[1];
            }

            if (this.getView().getModel("util").getProperty("/bp/givenBP") === true) {
                let bpAdress = await this.AdressAndProductService.readFullBpAdress(this.getView().getModel("util").getProperty("/bp/bpId"));
                this.getView().byId("plzInput").setValue(bpAdress.Postl);
                this.getView().byId("locationInput").setValue(bpAdress.City);
                this.getView().byId("streetInput").setValue(bpAdress.Street);
                this.getView().byId("housenummberInput").setValue(bpAdress.HouseNo);
                this.getView().byId("streetInput").setEnabled(true);
                this.getView().byId("housenummberInput").setEnabled(true);

                this.getView().getModel("util").setProperty(`/selectedAdress/HouseNumber`, bpAdress.HouseNo);
                this.getView().getModel("util").setProperty(`/selectedAdress/Street`, bpAdress.Street);
                this.getView().getModel("util").setProperty(`/selectedAdress/PostCode`, bpAdress.Postl);
                this.getView().getModel("util").setProperty(`/selectedAdress/City`, bpAdress.City);

                await this.readAddressData();
                let aFilter = [];
                aFilter.push(new sap.ui.model.Filter("AccountID", FilterOperator.EQ, this.getView().getModel("util").getProperty("/bp/bpId")));
                let oBpContracts = await this.Dataservice.readBpContracts(aFilter);
                for (let i = 0; oBpContracts.results.length > i; i++) {
                    let data = {
                        $expand: "ContractToWorkingPrices"
                    }
                    let oldContracts = await this.AdressAndProductService.readOldContractsData(oBpContracts.results[i].ContractID, data);
                    if (this.getModel("util").getProperty("/divisonSet/electric/CustValue") == oBpContracts.results[i].DivisionID) {
                        this.getModel("util").setProperty("/oldContracts/contractElectric", oldContracts);
                        this.getView().byId("consumptionInputelectric").setValue(this.getModel("util").getProperty("/oldContracts/contractElectric/Consumption"));
                        this.getProducts(parseInt(this.getModel("util").getProperty("/oldContracts/contractElectric/Consumption")), 'electric');
                        let PriceperYear = this.getModel("util").getProperty("/oldContracts/contractElectric/PricePerMonth") * 11;
                        this.getModel("util").setProperty("/oldContracts/contractElectric/PricePerYear", PriceperYear);
                    }
                    if (this.getModel("util").getProperty("/divisonSet/gas/CustValue") == oBpContracts.results[i].DivisionID) {
                        this.getModel("util").setProperty("/oldContracts/contractGas", oldContracts);
                        this.getView().byId("consumptionInputgas").setValue(this.getModel("util").getProperty("/oldContracts/contractGas/Consumption"));
                        this.getProducts(parseInt(this.getModel("util").getProperty("/oldContracts/contractGas/Consumption")), 'gas');
                        let PriceperYear = this.getModel("util").getProperty("/oldContracts/contractGas/PricePerMonth") * 11;
                        this.getModel("util").setProperty("/oldContracts/contractGas/PricePerYear", PriceperYear);
                    }
                    if (this.getModel("util").getProperty("/divisonSet/water/CustValue") == oBpContracts.results[i].DivisionID) {
                        this.getModel("util").setProperty("/oldContracts/contractWater", oldContracts);
                    }
                }


            }
        },




        onNextStep: function () {
            // let sStep = this._wizard.getCurrentStep();
            // if(sStep.includes("deliveryPointStep")){
            //     this.byId("BoxElectricity").getItems()[1].bindAggregation("items", "{util>/cardsElectricity}", this.byId("BoxElectricity").getItems()[1].getItems()[0])
            // }
            this._wizard.nextStep();
            this._wizard.getCurrentStep().includes(this.getModel("util").getProperty("/selectedConsumptionPoint/lastStep")) && this.getModel("util").setProperty("/visibility/forward", false);
        },

        onCardSelcted: function (oEvent, cardType) {
            let selctedProduct = oEvent.getSource().getBindingContext("util").getObject();
            let bSelected

            if (cardType != "service") {
                bSelected = oEvent.getSource().getBindingContext("util").getObject().Product.IsSelected;
            } else {
                bSelected = oEvent.getSource().getBindingContext("util").getObject().IsSelected;
            }
            if (bSelected == "X" || bSelected == true) {
                bSelected = true;
                // wenn bereits auf true, dann soll unselectiert werden
                this.deleteSelectedProduct(selctedProduct, cardType);
                if (this.getView().getModel("util").getProperty("/selectedProducts").length == 0) {
                    this.getView().byId("offerButton").setEnabled(false);
                    this.getView().byId("assignmentButton").setEnabled(false);
                }

            } else {
                // wenn bereits auf true, dann soll selectiert werden
                bSelected = false;
                this.saveSelectedProduct(selctedProduct, cardType, oEvent);
                this.getView().byId("offerButton").setEnabled(true);
                this.getView().byId("assignmentButton").setEnabled(true);
            }
            if (cardType != "service") {
                oEvent.getSource().getModel("util").setProperty(`${oEvent.getSource().getBindingContext("util").getPath()}/Product/IsSelected`, !bSelected);
            } else {
                oEvent.getSource().getModel("util").setProperty(`${oEvent.getSource().getBindingContext("util").getPath()}/IsSelected`, !bSelected);
            }

        },

        saveSelectedProduct: function (sProduct, cardType, oEvent) {
            let sorce = oEvent;
            let productData = {
                Data: sProduct,
                Source: sorce
            }
            // wenn ein Product aus der gleichen Sparte bereits selectiert wurde. Soll dies entselectiert werden wenn neues Produkt auf der gleichen seite ausgewählt
            // So kann pro seite nur jeweils ein Produkt selectiert werden.
            if (this.getView().getModel("util").getProperty("/selectedProducts/selectedProduct" + cardType + "/Source")) {
                let aAllProducts = this.getView().getModel("util").getProperty("/showed"+cardType+"Products");
                for (let i=0; aAllProducts.length>i ;i++){
                    aAllProducts[i].Product.IsSelected= false;
                }
                
            }
            this.getView().getModel("util").setProperty("/selectedProducts/selectedProduct" + cardType, productData);
            if (cardType != "service") {
                this.getView().getModel("util").setProperty("/selectedProducts/selectedProduct" + cardType + "/consumption", this.getView().byId("consumptionInput" + cardType).getValue());
            }
        },

        deleteSelectedProduct: function (sProduct, cardType) {
            this.getView().getModel("util").setProperty("/selectedProducts/selectedProduct" + cardType, {});
        },



        /**
         * function is triggert after the "Verbrauchsstelle" is set. Depending on the Energy-Category, the Wizard is build dynamic 
         * @param {*} min 
         * @param {*} max 
         */
        goToSparte: function () {
            if (this.getModel("util").getProperty("/selectedConsumptionPoint/electricNav")) {
                // setzt den anfagnsStep
                this.byId("deliveryPointStep").setNextStep(this.getView().byId("electricityStep"));

                //setzt den Step der nach diesem Step ausgeführt wird (wenn electric Next step alle überspring ist der schritt der für gas gesetzt wird egal)
                this.byId("electricityStep").setNextStep(this.getView().byId(this.getModel("util").getProperty("/selectedConsumptionPoint/electricNextStep")));

                //setzt  den Step für den schritt nach Gas Step ( ob zu wasser oder zu default)
                this.byId("gasStep").setNextStep(this.getView().byId(this.getModel("util").getProperty("/selectedConsumptionPoint/gasNextStep")));
            } else if (this.getModel("util").getProperty("/selectedConsumptionPoint/gasNav")) {
                this.byId("deliveryPointStep").setNextStep(this.getView().byId("gasStep"));
                this.byId("gasStep").setNextStep(this.getView().byId(this.getModel("util").getProperty("/selectedConsumptionPoint/gasNextStep")));
            } else if (this.getModel("util").getProperty("/selectedConsumptionPoint/waterNav")) {
                this.byId("deliveryPointStep").setNextStep(this.getView().byId("waterAndSewageStep"));
            }
        },


        /**
         * is triggert if yo push the cancel Button in the Wizard
         */
        handleWizardCancel: function () {
            this._handleMessageBoxOpen("Möchten Sie den Vorgang abbrechen?", "warning");
        },

        /**
         * is triggert if you finish in the Wizard
         */
        handleWizardSubmit: function () {
            this._handleMessageBoxOpen("Sie werden nun zu den Verbrauchervfreundlichen Verträgen weitergeleitet?", "confirm");
        },


        /**
         * Open MessageBox in wizard
         * @param {*} sMessage 
         * @param {*} sMessageBoxType 
         */
        _handleMessageBoxOpen: function (sMessage, sMessageBoxType) {
            MessageBox[sMessageBoxType](sMessage, {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        this._wizard.discardProgress(this._wizard.getSteps()[0]);
                        this.getView().getModel("util").dataLoaded();
                        this.resetAllData()
                        this._navBackToList();

                    }
                }.bind(this)
            });
        },


        /**
         * set selected Customertype to the model
         * @param {*} oEvent 
         */
        onChangeCustomerType: function (oEvent) {
            if (oEvent.selectedIndex == 0) {
                this.getModel("util").setProperty("/selectedAdress/CustomerType", "PK");
            } else {
                this.getModel("util").setProperty("/selectedAdress/CustomerType", "GK");
            }
        },


        /**
         * is triggert after all Contact-Information are filled. Make a request to find ot all possible consumptionPoints
         */
        readAddressData: function () {
            let oSelectedAddressData = this.getModel("util").getProperty("/selectedAdress");
            this.getModel("util").setProperty("/consumptionPointData", {});
            this.getView().byId("consumptionPointInput").setValue("");
            var oPromise = this.Dataservice.getConsumptionPointInputData({
                City: oSelectedAddressData.City,
                HouseNo1: oSelectedAddressData.HouseNumber,
                HouseNo2: "",
                PostalCode: oSelectedAddressData.PostCode,
                Street: oSelectedAddressData.Street,
                SerialNumber: "",
                PremiseId: "",
                $expand: 'InstallationSet'
            });

            oPromise.then(async function (oData) {
                if (oData.results.length > 0) {
                    let oView = this.getView();
                    this.generateModelInstalationSets(oView, oData)
                    this.getView().getModel("util").setProperty("/consumptionPointData", oData.results);
                    this.getView().byId("consumptionPointInput").setValue("-- Bitte wählen Sie eine Verbrauchsstelle --");

                } else {
                    this.getView().byId("consumptionPointInput").setValue("-- Verbrauchsstelle nicht bekannt --");
                    this.restNavPropertys();
                }
            }.bind(this))
                .catch(function (oError) {
                    MessageToast.show(oError.message);
                }.bind(this));
        },


        generateModelInstalationSets: function (oView, oData) {
            for (let i = 0; i < oData.results.length; i++) {
                let sInstallationSet = oData.results[i].InstallationSet.results;
                for (let j = 0; j < sInstallationSet.length; j++) {
                    if (sInstallationSet[j].DivisionID == oView.getModel("util").getProperty("/divisonSet/electric/CustValue")) {
                        oData.results[i].InstallationDataElectricity = sInstallationSet[j];
                    } else if (sInstallationSet[j].DivisionID == oView.getModel("util").getProperty("/divisonSet/gas/CustValue")) {
                        oData.results[i].InstallationDataGas = sInstallationSet[j];
                    } else {
                        oData.results[i].InstallationDataWater = sInstallationSet[j];
                    }
                }
            }
        },



        restNavPropertys: function () {
            this.getModel("util").setProperty("/selectedConsumptionPoint/electricNav", true);
            this.getModel("util").setProperty("/selectedConsumptionPoint/gasNav", true);
            this.getModel("util").setProperty("/selectedConsumptionPoint/waterNav", false);
            this.getModel("util").setProperty("/visibility/forward", true);
            this.getModel("util").setProperty("/selectedConsumptionPoint/electricNextStep", "gasStep");
            this.getModel("util").setProperty("/selectedConsumptionPoint/gasNextStep", "");

        },

        onConsumptionPointChange: function (oEvent) {
            this._wizard.discardProgress(this._wizard.getSteps()[0]);
            this.restNavPropertys();
            this.getModel("util").setProperty("/selectedConsumptionPoint/id", oEvent.getSource().getSelectedKey());
            this.getModel("util").setProperty("/selectedConsumptionPoint/consumptionPointData", oEvent.getSource().getSelectedItem().getBindingContext("util").getObject());
            let sVormieterUndVertragslänge = this.getModel("util").getProperty("/selectedConsumptionPoint/consumptionPointData/VorMieter");
            let aMieterUndVertragslängeGetrennt = this.splittMieterandContact(sVormieterUndVertragslänge);
            this.getModel("util").setProperty("/selectedConsumptionPoint/consumptionPointData/contractLength", aMieterUndVertragslängeGetrennt[1]);
            this.getModel("util").setProperty("/selectedConsumptionPoint/consumptionPointData/mieter", aMieterUndVertragslängeGetrennt[0]);

            if (oEvent.oSource.getSelectedItem().getBindingContext("util").getObject().InstallationDataElectricity) {
                this.getModel("util").setProperty("/selectedConsumptionPoint/electric", oEvent.getSource().getSelectedItem().getBindingContext("util").getObject().InstallationDataElectricity);
                this.getModel("util").setProperty("/selectedConsumptionPoint/electricNav", true);
                this.getModel("util").setProperty("/selectedConsumptionPoint/lastStep", "gasStep");
                this.getModel("util").setProperty("/counter/ElectricInstallation", this.getModel("util").getProperty("/selectedConsumptionPoint/electric/GERNR").replace(/\b0+/g, ''));
                this.formattLastConsumption("electric");
            }
            if (oEvent.oSource.getSelectedItem().getBindingContext("util").getObject().InstallationDataGas) {
                this.getModel("util").setProperty("/selectedConsumptionPoint/gas", oEvent.getSource().getSelectedItem().getBindingContext("util").getObject().InstallationDataGas);
                this.getModel("util").setProperty("/selectedConsumptionPoint/gasNav", true);
                this.getModel("util").setProperty("/selectedConsumptionPoint/electricNextStep", "gasStep");
                this.getModel("util").setProperty("/selectedConsumptionPoint/lastStep", "gasStep");
                this.getModel("util").setProperty("/counter/GasInstallation", this.getModel("util").getProperty("/selectedConsumptionPoint/gas/GERNR").replace(/\b0+/g, ''));
                this.formattLastConsumption("gas");
            }
            if (oEvent.oSource.getSelectedItem().getBindingContext("util").getObject().InstallationDataWater) {
                this.getModel("util").setProperty("/selectedConsumptionPoint/water", oEvent.getSource().getSelectedItem().getBindingContext("util").getObject().InstallationDataWater);
                this.getModel("util").setProperty("/selectedConsumptionPoint/waterNav", true);
                this.getModel("util").setProperty("/selectedConsumptionPoint/lastStep", "waterAndSewageStep");
                this.getModel("util").setProperty("/counter/WaterInstallation", this.getModel("util").getProperty("/selectedConsumptionPoint/water/GERNR").replace(/\b0+/g, ''));
                this.formattLastConsumption("water");
                if (!this.getModel("util").getProperty("/selectedConsumptionPoint/gasNav")) {
                    this.getModel("util").setProperty("/selectedConsumptionPoint/electricNextStep", "waterAndSewageStep");
                }
                this.getModel("util").setProperty("/selectedConsumptionPoint/gasNextStep", "waterAndSewageStep");
            }

        },

        formattLastConsumption: function (sEnergyType) {
            let lastConsumption = this.getModel("util").getProperty("/selectedConsumptionPoint/" + sEnergyType + "/LastConsumption");
            let formattedConsumption = lastConsumption.split(".");
            this.getModel("util").setProperty("/selectedConsumptionPoint/" + sEnergyType + "/LastConsumption", formattedConsumption[0]);

        },

        splittMieterandContact(sVormieterUndVertragslänge) {
            let myArray = sVormieterUndVertragslänge.split("|");
            return myArray;
        },

        /**
         * is triggert if the Segmented-Button on Waterview change. Set Consumption
         * @param {*} oEvent 
         */
        onSelectionChange: function (oEvent) {
            let personsAtHome = oEvent.oSource.mProperties.selectedKey;
            switch (personsAtHome) {
                case "one":
                    this.getView().byId("consumptionInputWater").setSelectedKey(160);
                    break;
                case "two":
                    this.getView().byId("consumptionInputWater").setSelectedKey(200);
                    break;
                case "three":
                    this.getView().byId("consumptionInputWater").setSelectedKey(240);
                    break;
                case "four":
                    this.getView().byId("consumptionInputWater").setSelectedKey(300);
                    break;
                case "five":
                    this.getView().byId("consumptionInputWater").setSelectedKey(340);
                    break;
                default:

            }
        },


        getProducts: async function (oEvent, energyType) {
            let commercialCustomer;

            let consumptionHT
            if(oEvent.mParameters){
                consumptionHT = oEvent.mParameters.value;
            }else{
                consumptionHT = oEvent;
            }

            let coontractSart = new Date();

            if (this.getModel("util").getProperty("/selectedAdress/CustomerType" == "PK")) {
                commercialCustomer = false;
            } else {
                commercialCustomer = true;
            }

            let oParam = {
                HouseNo: this.getModel("util").getProperty("/selectedAdress/HouseNumber"),
                City: this.getModel("util").getProperty("/selectedAdress/City"),
                Street: this.getModel("util").getProperty("/selectedAdress/Street"),
                //Kann aktuell noch leer gelassen werden -ggf. später nach Vertriebsbereichen
                SalesChannel: "",
                //Soll vorerst auf 0 bleiben da in App nicht differenziert
                ConsumptionNT: "0",
                ConsumptionHT: consumptionHT,
                Postl: this.getModel("util").getProperty("/selectedAdress/PostCode"),
                //Kann aktuell noch leer gelassen werden -ggf. später nach verschiedenen STadtwerke o.ä.
                CoCode: "",
                CommercialCustomer: commercialCustomer,
                $expand: "Product,Options,Prices",
                ContractStart: coontractSart,
            }

            let oProducts = await this.AdressAndProductService.readProducts(oParam);
            if (oProducts.results.length == 0) {
                MessageToast.show("Keine Produkte Verfügbar");
            }
            let showedProducts = [];

            for (let i = 0; oProducts.results.length > i; i++) {
                if (oProducts.results[i].Product.Division === this.getView().getModel("util").getProperty("/divisonSet/" + energyType + "/CustValue")) {
                    showedProducts.push(oProducts.results[i]);
                }
            }
            this.getModel("util").setProperty("/showed" + energyType + "Products", showedProducts);
            this.sortPrices(energyType);


        },

        sortPrices: function (energyType) {
            let aProducts = this.getModel("util").getProperty("/showed" + energyType + "Products");
            for (let j = 0; aProducts.length > j; j++) {
                let aPriceData = this.getModel("util").getProperty("/showed" + energyType + "Products/" + j + "/Prices/results");
                let workprice = "";
                let basPrice = "";
                let totalPrice = "";
                let workprice_N = "";

                for (let i = 0; aPriceData.length > i; i++) {
                    delete aPriceData[i].__metadata;
                    if (aPriceData[i].PriceComponent == "WORK_PRICE") {
                        workprice = aPriceData[i].PriceGross
                    }
                    if (aPriceData[i].PriceComponent == "WORK_PRICE_N") {
                        workprice_N = aPriceData[i].PriceGross
                    }
                    if (aPriceData[i].PriceComponent == "BASE_PRICE") {
                        basPrice = aPriceData[i].PriceGross
                    }
                    if (aPriceData[i].PriceComponent == "TOTAL_PRICE") {
                        totalPrice = aPriceData[i].PriceGross
                    }
                }
                this.getModel("util").setProperty("/showed" + energyType + "Products/" + j + "/Prices/results/0/PriceGross", workprice);
                this.getModel("util").setProperty("/showed" + energyType + "Products/" + j + "/Prices/results/1/PriceGross", basPrice);
                this.getModel("util").setProperty("/showed" + energyType + "Products/" + j + "/Prices/results/2/PriceGross", totalPrice);
                this.getModel("util").setProperty("/showed" + energyType + "Products/" + j + "/Prices/results/3/PriceGross", workprice_N);
                this.getModel("util").setProperty("/showed" + energyType + "Products/" + j + "/Prices/totalMonthPrice", (parseInt(totalPrice) / 11).toFixed(2));
            }

        },


        resetAllData: function () {
            //reset UI-Values
            this.getView().byId("plzInput").setValue("");
            this.getView().byId("locationInput").setValue("");
            this.getView().byId("streetInput").setValue("");
            this.getView().byId("housenummberInput").setValue("");
            this.getView().byId("consumptionPointInput").setValue("");
            this.getView().byId("consumptionInputelectric").setValue("");
            this.getView().byId("consumptionInputgas").setValue("");
            this.getView().byId("consumptionInputwater").setValue("");


            //reset relevant Models
            this.getModel("util").setProperty("/selectedConsumptionPoint/id", "");
            this.getModel("util").setProperty("/selectedConsumptionPoint/electric", {});
            this.getModel("util").setProperty("/selectedConsumptionPoint/gas", {});
            this.getModel("util").setProperty("/selectedConsumptionPoint/water", {});
            this.getModel("util").setProperty("/selectedConsumptionPoint/electricNav", false);
            this.getModel("util").setProperty("/selectedConsumptionPoint/gasNav", false);
            this.getModel("util").setProperty("/selectedConsumptionPoint/waterNav", false);
            this.getModel("util").setProperty("/selectedConsumptionPoint/electricNextStep", "gasStep");
            this.getModel("util").setProperty("/selectedConsumptionPoint/gasNextStep", "");
            this.getModel("util").setProperty("/selectedConsumptionPoint/consumptionPointData", {});

            this.getModel("util").setProperty("/selectedProducts/selectedProductelectric", {});
            this.getModel("util").setProperty("/selectedProducts/selectedProductgas", {});
            this.getModel("util").setProperty("/selectedProducts/selectedProductwater", {});
            this.getModel("util").setProperty("/selectedProducts/selectedProductservice", {});
            this.getModel("util").setProperty("/showedelectricProducts", {});
            this.getModel("util").setProperty("/showedgasProducts", {});
            this.getModel("util").setProperty("/showedwaterProducts", {});
            this.getModel("util").setProperty("/oldContracts/contractElectric", {});
            this.getModel("util").setProperty("/oldContracts/contractGas", {});
            this.getModel("util").setProperty("/oldContracts/contractWater", {});

            this.getModel("util").setProperty("/visibility/forward", true);

        },




        /**
         * Is triggert by clicking the "Angebot"-Btn
         * @param {*} evt 
         */
        onPress: function (evt) {
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
            oStorage.clear();
            const getCircularReplacer = () => {
                const seen = new WeakSet();
                return (key, value) => {
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value)) {
                            return;
                        }
                        seen.add(value);
                    }
                    return value;
                };
            };

            let oProducts = this.getModel("util").getProperty("/selectedProducts");
            if (oProducts.selectedProductelectric.Source) {
                delete oProducts.selectedProductelectric.Source;
            
                delete oProducts.selectedProductelectric.Data.__metadata;
            
                delete oProducts.selectedProductelectric.Data.Product.__metadata;
            
                delete oProducts.selectedProductelectric.Data.Options;
            }

            if (oProducts.selectedProductgas.Source) {
                delete oProducts.selectedProductgas.Source;
         
                delete oProducts.selectedProductgas.Data.__metadata;
           
                delete oProducts.selectedProductgas.Data.Product.__metadata;
            
                delete oProducts.selectedProductgas.Data.Options;
            }


            if (oProducts.selectedProductwater.Source) {
                delete oProducts.selectedProductwater.Source;
           
                delete oProducts.selectedProductwater.Data.__metadata;
           
                delete oProducts.selectedProductwater.Data.Product.__metadata;
           
                delete oProducts.selectedProductwater.Data.Options;
            }
            this.getModel("util").setProperty("/sendDataToApp/selectedProducts", oProducts);
            this.getModel("util").setProperty("/sendDataToApp/selectedAdress", this.getModel("util").getProperty("/selectedAdress"));
            this.getModel("util").setProperty("/sendDataToApp/selectedAdress/PremiseID", this.getModel("util").getProperty("/selectedConsumptionPoint/id"));
            this.getModel("util").setProperty("/sendDataToApp/bp", this.getModel("util").getProperty("/bp"));
            this.contract && this.getModel("util").setProperty("/sendDataToApp/oldContract/IDs", this.contract);
            this.getModel("util").setProperty("/sendDataToApp/counter", this.getModel("util").getProperty("/counter"));
            let oData = this.getModel("util").getProperty("/sendDataToApp");
            oStorage.put("sendData", JSON.stringify(oData, getCircularReplacer()));

            var sLink = "/sap/bc/ui5_ui5/REPLY/APSL004VFV/index.html";

            if (this.partner) {
                window.location.href = sLink + "?&customerid=" + this.partner;
            } else {
                window.location.href = sLink;
            }
        }

    });








    /*buildFragments: async function(){
            
        let Fragments = this.getModel("util").getData().fragments;
        Fragments.forEach(element => {
            this._getFormFragment(element.name).then(function(oVBox){
                this.byId("CreateProductWizard").addStep(oVBox);
            }.bind(this));                    
        });           
    },




    _getFormFragment: function (sFragmentName) {
        this._formFragments = {};
        var pFormFragment = this._formFragments[sFragmentName],
            oView = this.getView();

        if (!pFormFragment) {
            pFormFragment = Fragment.load({
                id: oView.getId(),
                name: sFragmentName
            });
            this._formFragments[sFragmentName] = pFormFragment;
        }

        return pFormFragment;
    },

    _detectFragment: function (sFragmentName) {
        var pFormFragment = this._formFragments[sFragmentName];
            return pFormFragment;
    },*/



});