/**
 * Tamotsu.Table
 *
 * var sheet = SpreadsheetApp.getActiveSheet();
 * var ttable = new Tamotsu.Table(sheet);
 * Logger.log(ttable.first());
 * => { '#': 1, 'First Name': 'Charles', 'Last Name': 'Bartowski' }
 */
var Table = (function() {
  /**
   * @constructor
   */
  var Table = function(sheet, options) {
    this.sheet = sheet;
    this.options = options;
    this.__ = new __Table__(this);
  };
  
  var _p = Table.prototype;
  
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
  
  return __Table__;
})();