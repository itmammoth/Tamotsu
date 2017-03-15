if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (Object.prototype.hasOwnProperty.call(source, nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}


var T_ = {};
var register = function(spreadsheet) {
  T_.ss = spreadsheet;
}

var Table = (function() {
  /**
   * @constructor
   *
   * @param {object} attributes TODO
   */
  var Table = function(attributes) {
    attributes = (attributes || {});
    var that = this;
    this.class.columns().forEach(function(c) {
      that[c] = attributes[c];
    });
  };
  
  Object.assign(Table, {
    /**
     * Returns the first record.
     *
     * @return {object} the first record
     */
    first: function() {
      var values = this.allValues();
      if (values.length === 0) return null;
      return new this(this.toObject(values[0]));
    },
    
    /**
     * Returns the last record.
     *
     * @return {object} the last record
     */
    last: function() {
      var values = this.allValues();
      if (values.length === 0) return null;
      return new this(this.toObject(values[values.length - 1]));
    },
    
    /**
     * Returns all records.
     *
     * @return {object} all records
     */
    all: function() {
      var records = [];
      var that = this;
      this.allValues().forEach(function(values) {
        records.push(new that(that.toObject(values)));
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
        this.columns.memo = this.dataRange().offset(0, 0, 1).getValues()[0];
      }
      return this.columns.memo;
    },
    
    /**
     * Returns the data range.
     *
     * @return {Range} the data range
     */
    dataRange: function() {
      return this.sheet.getDataRange();
    },
    
    /**
     * Returns the object converted from values array.
     *
     * @param {array} values
     * @return {object} the object converted from the given values
     */
    toObject: function(values) {
      var obj = {};
      this.columns().forEach(function(c, i) {
        obj[c] = values[i];
      });
      return obj;
    },
    
    /**
     * Returns the all values
     *
     * @return {array} the all values
     */
    allValues: function() {
      var allValues = this.dataRange().getValues();
      allValues.shift();
      return allValues;
    },
  });
  
  Object.assign(Table.prototype, {
    save: function() {
      return 'saved!';
    },
  });
  
  Table.define = function(options) {
    var Parent = this;
    var Child = function() { return Parent.apply(this, arguments); };
    Object.assign(Child, Table);
    Object.assign(Child.prototype, Table.prototype);
    Child.prototype.class = Child;
    Child.sheet = T_.ss.getSheetByName(options.sheetName);
    return Child;
  };
  
  return Table;
})();