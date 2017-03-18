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
      return new this(this.objectFrom(values[0]), { row: 2 });
    },
    
    last: function() {
      var values = this.allValues();
      if (values.length === 0) return null;
      return new this(this.objectFrom(values[values.length - 1]));
    },
    
    all: function() {
      var records = [];
      var that = this;
      this.allValues().forEach(function(values) {
        records.push(new that(that.objectFrom(values)));
      });
      return records;
    },
    
    where: function(predicate) {
      var r = new Relation_(this);
      return r.where(predicate);
    },
    
    order: function(comparator) {
      var r = new Relation_(this);
      return r.order(comparator);
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
    
    rangeByRow: function(row) {
      return this.dataRange().offset(row - 1, 0, 1);
    },
    
    objectFrom: function(values) {
      var obj = {};
      this.columns().forEach(function(c, i) {
        obj[c] = values[i];
      });
      return obj;
    },
    
    valuesFrom: function(table) {
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
      var values = this.valuesFrom(table);
      var that = this;
      this.withNextId(function(nextId) {
        values[0] = nextId;
        that.sheet.getRange(that.sheet.getLastRow() + 1, 1, 1, that.columns().length).setValues([values]);
      });
    },
    
    update: function(table) {
      var values = this.valuesFrom(table);
      this.rangeByRow(table.row).setValues([values]);
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

var Relation_ = (function() {
  var Relation_ = function(TableClass) {
    this.Table = TableClass;
    this.predicates = [];
  };
  
  Object.assign(Relation_.prototype, {
    where: function(predicate) {
      this.predicates.push(predicate);
      return this;
    },
    
    all: function() {
      var tables = [];
      var that = this;
      this.Table.allValues().forEach(function(values, i) {
        var table = new that.Table(that.Table.objectFrom(values), { row: i + 2 });
        var passed = true;
        for (var i = 0; i < that.predicates.length; i++) {
          passed = passed && that.predicates[i](table);
          if (!passed) break;
        }
        if (passed) tables.push(table);
      });
      return this.comparator ? tables.sort(this.comparator) : tables;
    },
    
    first: function() {
      var tables = this.all();
      return tables.length > 0 ? tables[0] : null;
    },
    
    last: function() {
      var tables = this.all();
      return tables.length > 0 ? tables[tables.length - 1] : null;
    },
    
    order: function(comparator) {
      this.comparator = comparator;
      return this;
    },
  });
  
  return Relation_;
})();