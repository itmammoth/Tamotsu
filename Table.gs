var createTable_ = function() {
  var Table = function(attributes, options) {
    options = (options || {});
    this.row_ = options.row_;
    this.errors = {};
    
    attributes = (attributes || {});
    var that = this;
    this.class.columns().forEach(function(c) {
      that[c] = attributes[c];
    });
  };
  
  Object.assign(Table, {
  
    sheet: function() {
      if (!this.sheet_memo_) {
        this.sheet_memo_ = ss_.getSheetByName(this.sheetName);
      }
      return this.sheet_memo_;
    },
  
    first: function() {
      var values = this.allValues();
      if (values.length === 0) return null;
      return new this(this.objectFrom(values[0]), { row_: 2 });
    },
    
    last: function() {
      var values = this.allValues();
      if (values.length === 0) return null;
      return new this(this.objectFrom(values[values.length - 1]), { row_: values.length + 1 });
    },
    
    find: function(id) {
      var values = this.allValues();
      for (var i = 0; i < values.length; i++) {
        if (values[i][this.idColumnIndex()] === id) {
          return new this(this.objectFrom(values[i]), { row_: i + 2 });
        }
      }
      throw 'Record not found [id=' + id + ']';
    },
    
    all: function() {
      var records = [];
      var that = this;
      this.allValues().forEach(function(values, i) {
        records.push(new that(that.objectFrom(values), { row_: i + 2 }));
      });
      return records;
    },
    
    pluck: function(column) {
      var result = [];
      var that = this;
      this.allValues().forEach(function(values) {
        result.push(values[that.columnIndexOf(column)]);
      });
      return result;
    },
    
    sum: function(column) {
      var total = 0;
      var that = this;
      this.allValues().forEach(function(values) {
        total += Number(values[that.columnIndexOf(column)]);
      });
      return total;
    },
    
    max: function(column) {
      return Math.max.apply(null, this.pluck(column));
    },
    
    min: function(column) {
      return Math.min.apply(null, this.pluck(column));
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
      if (!this.columns_memo_) {
        this.columns_memo_ = this.dataRange().offset(0, 0, 1).getValues()[0];
      }
      return this.columns_memo_;
    },
    
    columnIndexOf: function(column) {
      var index = this.columns().indexOf(column);
      if (index === -1) throw 'Invalid column given!';
      return index;
    },
  
    columnABCFor: function(column) {
      return indexToABC(this.columnIndexOf(column) + 1);
    },
    
    dataRange: function() {
      return this.sheet().getDataRange();
    },
    
    rangeByRow: function(row_) {
      return this.dataRange().offset(row_ - 1, 0, 1);
    },
    
    objectFrom: function(values) {
      var obj = {};
      this.columns().forEach(function(c, i) {
        obj[c] = values[i];
      });
      return obj;
    },
    
    valuesFrom: function(record) {
      var values = [];
      this.columns().forEach(function(c, i) {
        values.push(record[c] || null);
      });
      return values;
    },
    
    allValues: function() {
      var allValues = this.dataRange().getValues();
      allValues.shift();
      return allValues;
    },
    
    create: function(attributes) {
      var values = this.valuesFrom(attributes);
      var that = this;
      this.withNextId(function(nextId) {
        values[0] = nextId;
        that.sheet().getRange(that.sheet().getLastRow() + 1, 1, 1, that.columns().length).setValues([values]);
      });
    },
    
    update: function(record) {
      var values = this.valuesFrom(record);
      this.rangeByRow(record.row_).setValues([values]);
    },
    
    destroy: function(record) {
      this.sheet().deleteRow(record.row_);
    },
    
    withNextId: function(callback) {
      var nextId = Math.max.apply(null, this.idValues()) + 1;
      callback(nextId);
    },
    
    idValues: function() {
      var idValues = [];
      var that = this;
      this.allValues().forEach(function(values) {
        idValues.push(values[that.idColumnIndex()]);
      });
      return idValues;
    },
    
    idColumnIndex: function() {
      if (!this.idColumnIndex_memo_) {
        var i = this.columns().indexOf(this.idColumn);
        if (i === -1) throw 'Not found id column "' + this.idColumn + '" on ' + this.sheet().getName();
        this.idColumnIndex_memo_ = i;
      }
      return this.idColumnIndex_memo_;
    },
  });
  
  Object.defineProperties(Table.prototype, {
    save: { value: function() {
      if (typeof this.validate === 'function') this.validate();
      if (Object.keys(this.errors).length > 0) return false;
      this.row_ ? this.class.update(this) : this.class.create(this);
      return true;
    }},
    destroy: { value: function() {
      this.class.destroy(this);
    }},
  });
  
  Table.define = function(classProps, instanceProps) {
    var Parent = this;
    var Child = function() { return Parent.apply(this, arguments); };
    Object.assign(Child, Parent);
    Child.prototype = Object.create(Parent.prototype);
    Object.defineProperties(Child.prototype, {
      'class': { value: Child },
      'constructor': { value: Child }
    });
    for (var name in instanceProps) {
      Object.defineProperty(Child.prototype, name, { value: instanceProps[name] });
    }
    
    Object.assign(Child, Object.assign({ idColumn: '#' }, classProps));
    
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