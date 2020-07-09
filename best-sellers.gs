function runReport() {
  
  var merchantId = 123456789; // 1- Identifiant compte Merchant Center
  var tableId    = "ga:123456789"; // 2- Identifiant propriété Google Analytics
  var sheetId    = "123456xxxxxxxxxxxxxXXXXXXXXXXXXXXXXXX"; // 3- Identifiant feuille Google
  var nbJours    = 90; // 4 - Nombre de jours d'analyse
  
  var today = new Date();

  var ago = new Date(today.getTime() - nbJours * 24 * 60 * 60 * 1000);
  var startDate = Utilities.formatDate(ago, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var endDate   = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var request = {
    "reportRequests":
    [
      {
        "viewId": tableId,
        "dateRanges": [{"startDate": startDate, "endDate": endDate}],
        "dimensions": [{"name": "ga:productSku"},{"name": "ga:productName"}],
        "metrics": [{"expression": "ga:itemQuantity"}],
        "pageSize" : 500,
        "orderBys": [{"fieldName": "ga:itemQuantity", "orderType": "VALUE", "sortOrder": "DESCENDING"}],
        "dimensionFilterClauses": [
          {
            "operator" : "AND",
            "filters": [ // 5-A - Gestion des filtres à personnaliser
              {
                "dimensionName": "ga:productSku", // Filtre : Tous les produits avec un EAN bien formé
                "operator": "REGEXP",
                "expressions": ["^[0-9]{13}$"]
              },
              {
                "dimensionName": "ga:productName", // Filtre : Tous les produits sauf ceux dont le nom contient "XXX"
                "operator": "REGEXP",
                "not": true,
                "expressions": ["XXX"]
              }
            ]
          }
        ],
        "metricFilterClauses": [
          {
            "filters": [ // 5-B - Gestion des filtres à personnaliser
              {
                "metricName": "ga:itemQuantity", // Filtre : Tous les produits ayant généré plus de 50 ventes sur la période
                "operator": "GREATER_THAN",
                "comparisonValue": "50"
              }
            ]
          }
        ]
      }
    ]
  };
  
  
  var report = Analytics.Reports.batchGet(request);
  var datas  = JSON.parse(report);
  rows = datas.reports[0].data.rows;
  
  var spreadsheet = SpreadsheetApp.openById(sheetId);
  var sheet = spreadsheet.getSheetByName("products");
  sheet.getRange("A2:D1000").clearContent();
  
  var results  = new Array();
  
  var i = 0;
  
  for (var row in rows) {
    try {
      var offerId  = 'online:fr:FR:' + rows[row].dimensions[0]; // "fr:FR" à remplacer par "[langue]:[pays]" si besoin
      var value = ShoppingContent.Products.get(merchantId,offerId);
      var title = value.title;
      results.push([rows[row].dimensions[0],rows[row].metrics[0].values[0],title,"Best seller"]);
      i++;
    } catch (e) {
        Logger.log("erreur ID : "+ offerId);
    }
  }
  
  sheet.getRange(2, 1, results.length, 4).setValues(results);

}
