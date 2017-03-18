var Table;
var Relation_;

/**
 * Initializes Tamotsu with the given objects
 *
 * @param {Spreadsheet} spreadsheet
 */
var initialize = function(spreadsheet) {
  Table = createTable_(spreadsheet);
  Relation_ = createRelation_();
}