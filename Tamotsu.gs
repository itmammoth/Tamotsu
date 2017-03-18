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

/**
 * Initializes Tamotsu with the given objects
 *
 * @param {Spreadsheet} spreadsheet
 */
var register = function(spreadsheet) {
  T_.ss = spreadsheet;
}

var Table = (function() {
  var Table = function(attributes, options) {
    options = (options || {});
    this.row = options.row;
    
    attributes = (attributes || {});
    var that = this;
    this.class.columns().forEach(function(c) {
      that[c] = attributes[c];
    });
  };
  
  Object.assign(Table, {
  
    first: function() {
      var values = this.allValues();
      if (values.length === 0) return null;
      return new this(this.toObject(values[0]), { row: 2 });
    },
    
    last: function() {
      var values = this.allValues();
      if (values.length === 0) return null;
      return new this(this.toObject(values[values.length - 1]));
    },
    
    all: function() {
      var records = [];
      var that = this;
      this.allValues().forEach(function(values) {
        records.push(new that(that.toObject(values)));
      });
      return records;
    },
    
    columns: function() {
      if (!this.columns.memo) {
        this.columns.memo = this.dataRange().offset(0, 0, 1).getValues()[0];
      }
      return this.columns.memo;
    },
    
    dataRange: function() {
      return this.sheet.getDataRange();
    },
    
    getRangeByRow: function(row) {
      return this.dataRange().offset(row - 1, 0, 1);
    },
    
    toObject: function(values) {
      var obj = {};
      this.columns().forEach(function(c, i) {
        obj[c] = values[i];
      });
      return obj;
    },
    
    toValues: function(table) {
      var values = [];
      this.columns().forEach(function(c, i) {
        values.push(table[c]);
      });
      return values;
    },
    
    allValues: function() {
      var allValues = this.dataRange().getValues();
      allValues.shift();
      return allValues;
    },
    
    create: function(table) {
      var values = this.toValues(table);
      var that = this;
      this.withNextId(function(nextId) {
        values[0] = nextId;
        that.sheet.getRange(that.sheet.getLastRow() + 1, 1, 1, that.columns().length).setValues([values]);
      });
    },
    
    update: function(table) {
      var values = this.toValues(table);
      this.getRangeByRow(table.row).setValues([values]);
    },
    
    destroy: function(table) {
      this.sheet.deleteRow(table.row);
    },
    
    withNextId: function(callback) {
      var nextId = Math.max.apply(null, this.idValues()) + 1;
      callback(nextId);
    },
    
    idValues: function() {
      var colIndex = this.columns().indexOf(this.idColumn);
      if (colIndex === -1) throw 'Not found id column "' + this.idColumn + '" on ' + this.sheet.getName();
      var idValues = [];
      this.allValues().forEach(function(values) {
        idValues.push(values[colIndex]);
      });
      return idValues;
    },
  });
  
  Object.assign(Table.prototype, {
    save: function() {
      if (this.row) {
        this.class.update(this);
      } else {
        this.class.create(this);
      }
    },
    
    destroy: function() {
      this.class.destroy(this);
    },
  });
  
  Table.define = function(options) {
    var Parent = this;
    var Child = function() { return Parent.apply(this, arguments); };
    Object.assign(Child, Table);
    Object.assign(Child.prototype, Table.prototype);
    Child.prototype.class = Child;

    var o = Object.assign({
      idColumn: '#',
    }, (options || {}));
    Child.sheet = T_.ss.getSheetByName(o.sheetName);
    Child.idColumn = o.idColumn;
    return Child;
  };
  
  return Table;
})();