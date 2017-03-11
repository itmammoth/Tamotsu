var SheetKeeper = (function() {
  var SheetKeeper = function(sheet, idColumn) {
    this.sheet = sheet;
    this.idColumn = idColumn;
  };
  
  var _p = SheetKeeper.prototype;
  
  _p.ids = function() {
    var ids = [];
    var that = this;
    this.values().forEach(function(line) {
      ids.push(line[that._idIndex()]);
    });
    return ids;
  };
  
  _p.columns = function() {
    if (!this.columns.memo) {
      this.columns.memo = this._dataRange().offset(0, 0, 1).getValues()[0];
    }
    return this.columns.memo;
  };
  
  _p.columnABCFor = function(column) {
    return this._toABC(this.columns().indexOf(column) + 1);
  };
  
  _p.append = function(obj) {
    this._dataRange().offset(this.sheet.getLastRow(), 0, 1).setValues(this._toValues(obj));
  };
  
  _p.last = function() {
    var range = this._dataRange().offset(this.sheet.getLastRow() - 1, 0, 1);
    var row = range.getRow();
    return new Record(this, row, this.columns(), range.getValues()[0]);
  };
  
  // Note: values won't be cached
  _p.values = function() {
    var values = this._dataRange().getValues();
    values.shift();
    return values;
  }
  
  _p._update = function(row, obj) {
    this._dataRange().offset(row - 1, 0, 1).setValues(this._toValues(obj));
    Logger.log('Updated with ' + obj)
  };
  
  _p._dataRange = function() {
    return this.sheet.getDataRange();
  };
  
  _p._idIndex = function() {
    if (!this._idIndex.memo) {
      this._idIndex.memo = this.columns().indexOf(this.idColumn);
    }
    return this._idIndex.memo;
  };
  
  _p._toValues = function(obj) {
    var values = [];
    this.columns().forEach(function(c) {
      values.push(obj[c] || '');
    });
    return [values];
  };

  _p._toABC = function(index) {
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
  }
  
  return SheetKeeper;
})();

var Record = (function() {
  var Record = function(keeper, row, columns, values) {
    this._keeper = keeper;
    this._row = row;
    var that = this;
    columns.forEach(function(c, i) {
      that[c] = values[i];
    });
  };
  
  var _p = Record.prototype;
  
  _p.save = function() {
    this._keeper._update(this._row, this);
  };
  
  return Record;
})();