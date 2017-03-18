var createTable_ = function(ss) {
  Table = function(attributes, options) {
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
  
    columnABCFor: function(column) {
      return indexToABC(this.columns().indexOf(column) + 1);
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
    var o = Object.assign({
      idColumn: '#',
      mixin: {},
    }, (options || {}));
    
    var Parent = this;
    var Child = function() { return Parent.apply(this, arguments); };
    
    Object.assign(Child, Table);
    Object.assign(Child.prototype, Table.prototype, o.mixin);
    Child.prototype.class = Child;
    Child.sheet = ss.getSheetByName(o.sheetName);
    Child.idColumn = o.idColumn;
    
    return Child;
  };
  
  var indexToABC = function(index) {
    var n = index - 1;
    var ordA = 'A'.charCodeAt(0);
    var ordZ = 'Z'.charCodeAt(0);
    var len = ordZ - ordA + 1;
    
    var s = '';
    while (n >= 0) {
      s = String.fromCharCode(n % len + ordA) + s;
      n = Math.floor(n / len) - 1;
    }
    return s;
  };
  
  return Table;
};