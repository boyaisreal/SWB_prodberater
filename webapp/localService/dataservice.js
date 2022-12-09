sap.ui.define([
	"sap/ui/base/Object",
    "sap/ui/mr/learn/odatadraftone/localService/ODATAservice"
], function(
	BaseObject,
	ODATAservice
) {
	"use strict";

	return BaseObject.extend("sap.ui.mr.learn.odatadraftone.localService.dataservice", 
    
 {

    /**
         *
         * @param oComponent 
         * @param sModel 
         */

        constructor: function (oComponent, sModel)
        {
            this.oDataModel = oComponent.getModel(sModel);
            this.oService = new ODATAservice(oComponent, sModel);

        }, 

        readAdressPLZandLocation: function ()
        {
            return this.oService.readEntity("/PostalCodeSet");
            
        },

        readBpContracts: function(aFilter){
            return this.oService.readEntity("/BpContractSet", aFilter);

        },

        readOldContractsData : function(sId, oParam){
            return this.oService.readEntity("/OldTariffSet('"+sId+"')",null,oParam);
        },

        readFullBpAdress: function (value){
            return this.oService.readEntity("/CustomerSet(CustomerId='"+ value+"')");
        },

        readDivisionSet: function(){
            return this.oService.readEntity("/DivisionSet");

        },

        readCustomizingCompanyCodeSet: function ()
        {
            return this.oService.readEntity("/CustomizingCompanyCodeSet");
            
        },

        readStreetData: function (aFilter)
        {
            return this.oService.readEntity("/AddressValidSet", aFilter);
            
        },

        readInstallationSet: function(sID){
            return this.oService.readEntity("/PremiseSet"+"('"+sID+"')/InstallationSet");
        },

        getConsumptionPointInputData: function (oParam)
        {
            return this.oService.callGetFunction("/GetPremisesBySearchHelp", oParam);
            
        }, 

        readProducts: function(oParam, Filter){
            return this.oService.callGetFunction("/GetConfigurations", oParam);
        },
       

        UpdateHeaderRecord: function(jPayload,RecordId)
        {

             return this.oService.updateEntity("/PARTNER_HEADERSet('"+RecordId +"')", jPayload);

        }
    
    
    
    
    
    });
});