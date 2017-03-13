var T_ = {};
var initialize = function(spreadsheet) {
  T_.ss = spreadsheet;
}

var Table = {};
(function() {
  Table.define = function(options) {
    /**
     * @constructor
     *
     * @param {object} attributes TODO
     */
    var TableClass = function(attributes) {
      // TODO: attributesを代入する処理
    };
    TableClass.sheet = T_.ss.getSheetByName(options.sheetName);
    TableClass.options = options;
    TableClass.__ = privateClassPropsWith(TableClass);
    Object.assign(TableClass, classProps);
    Object.assign(TableClass.prototype, instanceProps);
    return TableClass;
  };
  
  var classProps = {
    /**
     * Returns the first record.
     *
     * @return {object} the first record
     */
    first: function() {
      var range = this.__.dataRange().offset(1, 0, 1);
      return this.__.toObject(range.getValues()[0]);
    },
    
    /**
     * Returns the last record.
     *
     * @return {object} the last record
     */
    last: function() {
      var range = this.__.dataRange().offset(this.sheet.getLastRow() - 1, 0, 1);
      return this.__.toObject(range.getValues()[0]);
    },
    
    /**
     * Returns all records.
     *
     * @return {object} all records
     */
    all: function() {
      var records = [];
      var that = this;
      this.__.allValues().forEach(function(values) {
        records.push(that.__.toObject(values));
      });
      return records;
    },
    
    /**
     * Returns the column values.
     *
     * @return {array} the column values
     */
    columns: function() {
      if (!this.columns.memo) {
        this.columns.memo = this.__.dataRange().offset(0, 0, 1).getValues()[0];
      }
      return this.columns.memo;
    },
  };
  
  var privateClassPropsWith = function(TableClass) {
    return {
      dataRange: function() {
        return TableClass.sheet.getDataRange();
      },
      
      toObject: function(values) {
        var obj = {};
        TableClass.columns().forEach(function(c, i) {
          obj[c] = values[i];
        });
        return obj;
      },
      
      allValues: function() {
        var allValues = this.dataRange().getValues();
        allValues.shift();
        return allValues;
      },
    };
  };
  
  var instanceProps = {};
})();