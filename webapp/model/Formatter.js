sap.ui.define([], function () {
    "use strict";

    function formatImagePath(sRelativeImagePath) {
        return `${jQuery.sap.getModulePath("sap.ui.mr.learn.odatadraftone")}${sRelativeImagePath}`;
    }

    function formatPrices (sPrice){
        if(sPrice== undefined){
            return "0";
        }
        sPrice = sPrice.toString();
        const aValue = sPrice.split(".");
        let euro = aValue[0];
        let cent = aValue[1];
        if (cent== undefined){
            cent="00"
        }
        cent = cent.substring(0,2);

        

        return euro+"," +cent+" €/Monat"
    }

    function formatPricesWorkingPrice (sPrice){
        if(sPrice== undefined){
            return "0";
        }
        const aValue = sPrice.split(".");
        let euro = aValue[0];
        let cent = aValue[1];
        if (cent== undefined){
            cent="00"
        }
        cent = cent.substring(0,2);

        return euro+"," +cent+" €/kWh"
        

    }

    function formatPricesWorkingPriceInCent (sPrice){
        if(sPrice== undefined){
            return "0";
        }
        let newPrice = (parseFloat(sPrice) * 100).toFixed(2).toString().replace(".", ",");
        return newPrice + " Cent/kWh"
    }

    function formatLoadingZero (sValue){
        if(!sValue){
            return sValue;
        }
        let newValue = sValue.replace(/\b0+/g, '');
        return newValue;
    }


    function formatPricesYear (sPrice){
        if(sPrice== undefined){
            return "0";
        }
        sPrice = sPrice.toString();
        const aValue = sPrice.split(".");
        let euro = aValue[0];
        let cent = aValue[1];
        if (cent== undefined){
            cent="00"
        }
        cent = cent.substring(0,2);

        

        return euro+"," +cent+" €/Jahr"
    }

   

    return {
        formatImagePath: formatImagePath,
        formatPrices: formatPrices,
        formatPricesWorkingPrice:formatPricesWorkingPrice,
        formatPricesWorkingPriceInCent: formatPricesWorkingPriceInCent,
        formatPricesYear:formatPricesYear,
        formatLoadingZero:formatLoadingZero
    };
});