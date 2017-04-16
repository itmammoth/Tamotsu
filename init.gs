var ss_;
var Table;
var Relation_;
var callbacks_ = [];

/**
 * Initializes Tamotsu with the given objects
 *
 * @param {Spreadsheet} spreadsheet Spreadsheet object you will handle.<br>
 *                                  When not given, SpreadsheetApp.getActive() is used.
 */
function initialize(spreadsheet) {
  ss_ = spreadsheet || SpreadsheetApp.getActive();
  Table = createTable_();
  Relation_ = createRelation_();
  callbacks_.forEach(function(callback) {
    callback(spreadsheet);
  });
}

/**
 * Register the given function as a callback on initialized
 *
 * @param {function} callback A function that is to be added to the callback list.
 */
function onInitialized(callback) {
  callbacks_.push(callback);
}