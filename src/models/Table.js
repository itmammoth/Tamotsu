var createTable_ = function() {
  var Table = function(attributes, options) {
    options = (options || {});
    this.row_ = options.row_;
    
    attributes = (attributes || {});
    var that = this;
    this.__class.columns().forEach(function(c) {
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
        values.push(typeof record[c] === 'undefined' ? null : record[c]);
      });
      return values;
    },
    
    allValues: function() {
      var allValues = this.dataRange().getValues();
      allValues.shift();
      return allValues;
    },
    
    create: function(recordOrAttributes) {
      var record = recordOrAttributes.__class === this ? recordOrAttributes : new this(recordOrAttributes);
      delete record.row_;
      
      if (!record.isValid()) return false;
      
      var that = this;
      
      var appendRow = function(values) {
        var row = that.sheet().getLastRow() + 1;
        that.sheet().getRange(row, 1, 1, that.columns().length).setValues([values]);
        record.row_ = row;
      };
      
      var values = this.valuesFrom(record);
      if (record[this.idColumn]) {
        appendRow(values);
      } else {
        this.withNextId(function(nextId) {
          values[that.idColumnIndex()] = nextId;
          appendRow(values);
          record[that.idColumn] = nextId;
        });
      }
      
      return record;
    },
    
    update: function(record) {
      if (record.isValid()) {
        var values = this.valuesFrom(record);
        this.rangeByRow(record.row_).setValues([values]);
        return true;
      }
      return false;
    },
    
    destroy: function(record) {
      this.sheet().deleteRow(record.row_);
    },
    
    withNextId: function(callback) {
	  var ids = this.idValues();
      var nextId = ids.length > 0 ? Math.max.apply(null, ids) + 1 : 1;
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
      this.errors = {};
      var updateOrCreate = this.isNewRecord() ? 'create' : 'update';
      return this.__class[updateOrCreate](this);
    }},
    destroy: { value: function() {
      this.__class.destroy(this);
    }},
    validate: { value: function(on) {
      // override it if you need
    }},
    isValid: { value: function() {
      this.errors = {};
      if (!this.__class.autoIncrement && isBlank(this[this.__class.idColumn])) {
        this.errors[this.__class.idColumn] = "can't be blank";
      }
      this.validate(this.isNewRecord() ? 'create' : 'update');
      return noKeys(this.errors);
    }},
    isNewRecord: { value: function() {
      return !this.row_;
    }},
    attributes: { value: function() {
      var obj = {};
      var that = this;
      this.__class.columns().forEach(function (c, i) {
        obj[c] = typeof that[c] === 'undefined' ? null : that[c];
      });
      return obj;
    }},
  });
  
  Table.define = function(classProps, instanceProps) {
    var Parent = this;
    var Child = function() { return Parent.apply(this, arguments); };
    Object.assign(Child, Parent);
    Child.prototype = Object.create(Parent.prototype);
    Object.defineProperties(Child.prototype, {
      '__class': { value: Child },
      'constructor': { value: Child }
    });
    for (var name in instanceProps) {
      Object.defineProperty(Child.prototype, name, { value: instanceProps[name] });
    }
    
    Object.assign(Child, Object.assign({
      idColumn: '#',
      autoIncrement: true,
    }, classProps));
    
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
  
  var noKeys = function(object) {
    return Object.keys(object || {}).length === 0;
  };
  
  var isBlank = function(value) {
    return typeof value === 'undefined' || value === null || String(value).trim() === '';
  };
  
  return Table;
};
