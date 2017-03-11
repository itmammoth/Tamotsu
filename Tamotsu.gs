var Table = {};

/**
 * Tamotsu.Table
 */
Table = (function() {
  Table.define = function(options) {
    return new constructor(options);
  };
  
  /**
   * @constructor
   */
  var constructor = function(options) {
    this.sheet = Tamotsu_.ss.getSheetByName(options.sheetName);
    this.options = options;
    this.__ = new __Table__(this);
  };
  
  var _p = constructor.prototype;
  
  /**
   * Returns the first record.
   *
   * @return {object} the first record
   */
  _p.first = function() {
    var range = this.__.dataRange().offset(1, 0, 1);
    return this.__.toObject(range.getValues()[0]);
  };
  
  /**
   * Returns the last record.
   *
   * @return {object} the last record
   */
  _p.last = function() {
    var range = this.__.dataRange().offset(this.sheet.getLastRow() - 1, 0, 1);
    return this.__.toObject(range.getValues()[0]);
  };
  
  /**
   * Returns all records.
   *
   * @return {object} all records
   */
  _p.all = function() {
    var records = [];
    var that = this;
    this.__.allValues().forEach(function(values) {
      records.push(that.__.toObject(values));
    });
    return records;
  };
  
  /**
   * Returns the column values.
   *
   * @return {array} the column values
   */
  _p.columns = function() {
    if (!this.columns.memo) {
      this.columns.memo = this.__.dataRange().offset(0, 0, 1).getValues()[0];
    }
    return this.columns.memo;
  };
  
  return Table;
})();

// TODO: privateメソッドの作り方をQiitaかブログで公開しょうかな
// Private methods of Table
var __Table__ = (function(){
  var __Table__ = function(table) {
    this.table = table;
  };
  
  var _p = __Table__.prototype;
  
  _p.dataRange = function() {
    return this.table.sheet.getDataRange();
  };
  
  _p.toObject = function(values) {
    var obj = {};
    this.table.columns().forEach(function(c, i) {
      obj[c] = values[i];
    });
    return obj;
  };
  
  _p.allValues = function() {
    var allValues = this.dataRange().getValues();
    allValues.shift();
    return allValues;
  };
  
  return __Table__;
})();


var Tamotsu_ = {};
var init = function(spreadsheet) {
  Tamotsu_.ss = spreadsheet;
}