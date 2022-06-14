var createTable_ = function () {
  var Table = function (attributes, options) {
    options = (options || {});
    this.row_ = options.row_;

    attributes = (attributes || {});
    var that = this;
    this.__class.columns().forEach(function (c) {
      that[c] = attributes[c];
    });
  };

  Object.assign(Table, {

    sheet: function () {
      if (!this.sheet_memo_) {
        this.sheet_memo_ = ss_.getSheetByName(this.sheetName);
      }
      return this.sheet_memo_;
    },

    baseRange: function () {
      return this.sheet().getRange(1 + this.rowShift, 1 + this.columnShift);
    },

    lastRange: function () {
      var lastAddress = this.dataRange().getA1Notation().replace(/^.*:/, '');
      return this.sheet().getRange(lastAddress);
    },

    first: function () {
      var values = this.allValues();
      if (values.length === 0) return null;
      return new this(this.objectFrom(values[0]), { row_: 2 + this.rowShift });
    },

    last: function () {
      var values = this.allValues();
      if (values.length === 0) return null;
      return new this(this.objectFrom(values[values.length - 1]), { row_: values.length + 1 + this.rowShift });
    },

    find: function (id) {
      var values = this.allValues();
      for (var i = 0; i < values.length; i++) {
        if (values[i][this.idColumnIndex()] === id) {
          return new this(this.objectFrom(values[i]), { row_: i + 2 + this.rowShift });
        }
      }
      throw 'Record not found [id=' + id + ']';
    },

    all: function () {
      var records = [];
      var that = this;
      this.allValues().forEach(function (values, i) {
        records.push(new that(that.objectFrom(values), { row_: i + 2 + that.rowShift }));
      });
      return records;
    },

    pluck: function (column) {
      var result = [];
      var that = this;
      this.allValues().forEach(function (values) {
        result.push(values[that.columnIndexOf(column)]);
      });
      return result;
    },

    sum: function (column) {
      var total = 0;
      var that = this;
      this.allValues().forEach(function (values) {
        total += Number(values[that.columnIndexOf(column)]);
      });
      return total;
    },

    max: function (column) {
      return Math.max.apply(null, this.pluck(column));
    },

    min: function (column) {
      return Math.min.apply(null, this.pluck(column));
    },

    where: function (predicate) {
      var r = new Relation_(this);
      return r.where(predicate);
    },

    order: function (comparator) {
      var r = new Relation_(this);
      return r.order(comparator);
    },

    columns: function () {
      if (!this.columns_memo_) {
        this.columns_memo_ = this.baseRange()
          .getDataRegion(SpreadsheetApp.Dimension.COLUMNS)
          .getValues()[0];
      }
      return this.columns_memo_;
    },

    columnIndexOf: function (column) {
      var index = this.columns().indexOf(column);
      if (index === -1) throw 'Invalid column given!';
      return index;
    },

    columnABCFor: function (column) {
      return indexToABC(this.columnIndexOf(column) + 1 + this.columnShift);
    },

    dataRange: function () {
      return this.baseRange().getDataRegion();
    },

    rangeByRow: function (row_) {
      return this.dataRange().offset(row_ - 1 - this.rowShift, 0, 1);
    },

    objectFrom: function (values) {
      var obj = {};
      this.columns().forEach(function (c, i) {
        obj[c] = values[i];
      });
      return obj;
    },

    valuesFrom: function (record) {
      var values = [];
      this.columns().forEach(function (c, i) {
        values.push(typeof record[c] === 'undefined' ? null : record[c]);
      });
      return values;
    },

    _allValues: [],

    allValues: function () {
      if (!this._allValues.length) {
        this._allValues = this.dataRange().getValues();
        this._allValues.shift();
      }
      return this._allValues;
    },

    allValuesIndex: function (record) {
      var recordValues = this.valuesFrom(record);

      for (var i = 0; i < this._allValues.length; i++) {
        if (this._allValues[i][this.idColumnIndex()] === recordValues[this.idColumnIndex()]) {
          return i;
        }
      }
      throw 'Record not found [id=' + recordValues[this.idColumnIndex()] + ']';
    },

    allValuesUpdate: function (record) {
      var recordValues = this.valuesFrom(record);
      var recordIndex = this.allValuesIndex(record);

      this._allValues[recordIndex] = recordValues;
    },

    allValuesAdd: function (record) {
      var recordValues = this.valuesFrom(record);
      this._allValues.push(recordValues);
    },

    allValuesAddMany: function (records) {
      for (record of records) {
        this.allValuesAdd(record);
      }
    },

    allValuesRemove: function (record) {
      var recordIndex = this.allValuesIndex(record);
      this._allValues = this._allValues.filter((value, index) => index !== recordIndex);
    },

    create: function (recordOrAttributes) {
      var record = recordOrAttributes.__class === this ? recordOrAttributes : new this(recordOrAttributes);
      delete record.row_;

      if (!record.isValid()) return false;

      var that = this;

      var appendRow = function (values) {
        var row = that.dataRange().getLastRow() + 1;
        that.sheet().getRange(row, 1 + that.columnShift, 1, that.columns().length).setValues([values]);
        record.row_ = row;
      };

      var values = this.valuesFrom(record);
      if (isPresent(record[this.idColumn])) {
        appendRow(values);
      } else {
        this.withNextId(function (nextId) {
          values[that.idColumnIndex()] = nextId;
          appendRow(values);
          record[that.idColumn] = nextId;
        });
      }
      this.allValuesAdd(record);

      return record;
    },

    batchCreate: function (recordOrAttributesArr) {
      var that = this;
      var appendRows = function (valuesArr) {
        var firstRow = that.dataRange().getLastRow() + 1;
        that.sheet().getRange(firstRow, 1 + that.columnShift,
          valuesArr.length, that.columns().length).setValues(valuesArr);
        for (var i = 0; i < records.length; i++) {
          records[i].row_ = firstRow + i;
        }
      };

      var startNextId; this.withNextId(nextId => startNextId = nextId);
      const records = [], valuesArr = [];
      for (var i = 0; i < recordOrAttributesArr.length; i++) {
        var recordOrAttributes = recordOrAttributesArr[i];
        var record = recordOrAttributes.__class === this ? recordOrAttributes : new this(recordOrAttributes);
        delete record.row_;
        if (!record.isValid()) return false;
        var values = this.valuesFrom(record);
        if (isPresent(record[this.idColumn])) {
          valuesArr.push(values);
        } else {
          values[that.idColumnIndex()] = startNextId + i;
          valuesArr.push(values);
          record[that.idColumn] = startNextId + i;
        }
        records.push(record);
      }
      appendRows(valuesArr);
      this.allValuesAddMany(records);
      return records;
    },

    update: function (recordOrAttributes) {
      var record = this.find(recordOrAttributes[this.idColumn]);
      record.setAttributes(recordOrAttributes);
      if (recordOrAttributes.__class === this) {
        recordOrAttributes.row_ = record.row_;
      }

      if (record.isValid()) {
        var values = this.valuesFrom(record);
        this.rangeByRow(record.row_).setValues([values]);
        this.allValuesUpdate(record);
        return true;
      }
      return false;
    },

    createOrUpdate: function (recordOrAttributes) {
      var id = recordOrAttributes[this.idColumn];
      if (isPresent(id)) {
        var condition = {};
        condition[this.idColumn] = id;
        if (this.where(condition).first()) {
          return this.update(recordOrAttributes);
        } else {
          return this.create(recordOrAttributes);
        }
      } else {
        return this.create(recordOrAttributes);
      }
    },

    destroy: function (record) {
      this.sheet().deleteRow(record.row_);
      this.allValuesRemove(record);
    },

    withNextId: function (callback) {
      var ids = this.idValues();
      var nextId = ids.length > 0 ? Math.max.apply(null, ids) + 1 : 1;
      callback(nextId);
    },

    idValues: function () {
      var idValues = [];
      var that = this;
      this.allValues().forEach(function (values) {
        idValues.push(values[that.idColumnIndex()]);
      });
      return idValues;
    },

    idColumnIndex: function () {
      if (!this.idColumnIndex_memo_) {
        var i = this.columns().indexOf(this.idColumn);
        if (i === -1) throw 'Not found id column "' + this.idColumn + '" on ' + this.sheet().getName();
        this.idColumnIndex_memo_ = i;
      }
      return this.idColumnIndex_memo_;
    },
  });

  Object.defineProperties(Table.prototype, {
    save: {
      value: function () {
        this.errors = {};
        var updateOrCreate = this.isNewRecord() ? 'create' : 'update';
        return this.__class[updateOrCreate](this);
      }
    },
    update: {
      value: function (attributes) {
        var that = this;
        this.__class.columns().forEach(function (c, i) {
          if (c in attributes) {
            that[c] = attributes[c];
          }
        });
        return this.save();
      }
    },
    destroy: {
      value: function () {
        this.__class.destroy(this);
      }
    },
    validate: {
      value: function (on) {
        // override it if you need
      }
    },
    isValid: {
      value: function () {
        this.errors = {};
        if (!this.__class.autoIncrement && isBlank(this[this.__class.idColumn])) {
          this.errors[this.__class.idColumn] = "can't be blank";
        }
        this.validate(this.isNewRecord() ? 'create' : 'update');
        return noKeys(this.errors);
      }
    },
    isNewRecord: {
      value: function () {
        return !this.row_;
      }
    },
    getAttributes: {
      value: function () {
        var obj = {};
        var that = this;
        this.__class.columns().forEach(function (c, i) {
          obj[c] = typeof that[c] === 'undefined' ? null : that[c];
        });
        return obj;
      }
    },
    setAttributes: {
      value: function (attributes) {
        var that = this;
        this.__class.columns().forEach(function (c, i) {
          that[c] = typeof attributes[c] === 'undefined' ? null : attributes[c];
        });
      }
    },
  });

  Table.define = function (classProps, instanceProps) {
    var Parent = this;
    var Child = function () { return Parent.apply(this, arguments); };
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
      rowShift: 0,
      columnShift: 0,
    }, classProps));

    return Child;
  };

  var indexToABC = function (index) {
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

  var noKeys = function (object) {
    return Object.keys(object || {}).length === 0;
  };

  var isBlank = function (value) {
    return typeof value === 'undefined' || value === null || String(value).trim() === '';
  };

  var isPresent = function (value) {
    return typeof value !== 'undefined' && value !== null && String(value) !== '';
  };

  return Table;
};
