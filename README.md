# Start App in localhost #
npm run start-local

# Test data #
## For localhost ##
http://localhost:8080/test/flpSandbox.html#sapuimrlearnodatadraftone-display?&customerId=1000000655
## For Gateway ##
https://power-gw.4brandsreply.de:44300/sap/bc/ui5_ui5/reply/APSL004PT/index.html?&customerid=1000000655

PLZ: 58093

Ort: Hagen

Straße: Sievekingstr.

Nr. 12

# Delete App in system before deploy #
SE38,  

Put "/UI5/UI5_REPOSITORY_LOAD" in field Programm, 

Ausführen, 

Put "/REPLY/APSL004PT" in field Name der SAPUI5-App, 

Select "löschen", 

Select "In Orig. Sprache Pflegen"

# Deploy App #
npm run deploy-new