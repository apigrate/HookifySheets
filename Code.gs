/**
    A simple webhook function for change events.
    Assumes a header row in the first row of the sheet.
    
    When a change occurs, data will be taken from the active row.
    Headers are whitespace-stripped and then used as property names
    to create an object hash of the data. 
    
    The user may implement the doesQualify(entity) function to implement
    conditional webhook triggering.
    
    That data is used in an application/json POST to the endpoint provided. 
    The form of the data is:
    {
    metadata: {
    spreadsheetId: (id of spreadsheet),
    sheetName: (name of sheet),
    row: (1-based row number where data was modified).
    },
    entity: (the entity object produced)
    }
*/
function onEdit(event){
  
  var ENDPOINT = "https://runflow.built.io/run/2rhEDpFYwU"; //PropertiesService.getDocumentProperties().getProperty("Endpoint"); 

  if(ENDPOINT){
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var row = sheet.getActiveRange().getRowIndex();
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    if(row !== 1 && data){
      var entity = {};
      
      headers.forEach(function(header, i){
        var propertyName = header.replace(/[\W\s]/g, "");
        
        if(propertyName){
          var propertyValue = data[i];
          if(propertyValue){
            entity[propertyName] = propertyValue;
          } else {
            entity[propertyName] = null;
          }
        }
      });
      
      
      if(doesQualify(entity)){
        var thePayload = {
            metadata: {
              spreadsheetId: ss.getId(),
              sheetId: sheet.getSheetId(),
              sheetName: sheet.getName(),
              rowNumber: row
            },
            entity: entity
          };
        
        Logger.log( thePayload );
        
        var params = {
          method: "POST",
          contentType: "application/json",
          payload: JSON.stringify(thePayload)
        };
        
        var response = UrlFetchApp.fetch(ENDPOINT, params);
        
        Logger.log( response );
      }
    }  
  }
}

/**
    This function returns true by default. Override it to provide qualification logic
    for whether a webhook should be sent or not.
*/
function doesQualify(entity){
  return entity.FirstName && entity.LastName && entity.Email && entity.CompanyName;
}
