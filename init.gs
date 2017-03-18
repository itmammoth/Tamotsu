var Table;
var Relation_;

/**
 * Initializes Tamotsu with the given objects
 *
 * @param {Spreadsheet} spreadsheet Spreadsheet object you will handle.<br>
 *                                  When not given, SpreadsheetApp.getActive() is used.
 */
function initialize(spreadsheet) {
  Table = createTable_(spreadsheet || SpreadsheetApp.getActive());
  Relation_ = createRelation_();
}