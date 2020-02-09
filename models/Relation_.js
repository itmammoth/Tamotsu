var createRelation_ = function() {
  var Relation_ = function(TableClass) {
    this.Table = TableClass;
    this.predicates = [];
  };
  
  Object.defineProperties(Relation_.prototype, {
    where: { value: function(predicate) {
      this.predicates.push(predicate);
      return this;
    }},
    
    all: { value: function() {
      var records = [];
      var that = this;
      this.Table.allValues().forEach(function(values, i) {
        var record = new that.Table(that.Table.objectFrom(values), { row_: i + 2 });
        var passed = true;
        for (var i = 0; i < that.predicates.length; i++) {
          passed = passed && evaluate(that.predicates[i], record);
          if (!passed) break;
        }
        if (passed) records.push(record);
      });
      
      if (!this.comparator) return records;
      return compare(this.comparator, records);
    }},
    
    first: { value: function() {
      var records = this.all();
      return records.length > 0 ? records[0] : null;
    }},
    
    last: { value: function() {
      var records = this.all();
      return records.length > 0 ? records[records.length - 1] : null;
    }},
    
    pluck: { value: function(column) {
      var result = [];
      var that = this;
      this.all().forEach(function(record) {
        result.push(record[column]);
      });
      return result;
    }},
    
    sum: { value: function(column) {
      var total = 0;
      var that = this;
      this.all().forEach(function(record) {
        total += Number(record[column]);
      });
      return total;
    }},
    
    max: { value: function(column) {
      return Math.max.apply(null, this.pluck(column));
    }},
    
    min: { value: function(column) {
      return Math.min.apply(null, this.pluck(column));
    }},
    
    order: { value: function(comparator) {
      this.comparator = comparator;
      return this;
    }},
  });
  
  var evaluate = function(predicate, record) {
    var t = typeof predicate;
    if (t === 'function') {
      return predicate(record);
    } else if (t === 'object') {
      return evaludateAsObject(predicate, record);
    } else {
      throw 'Invalid where condition [' + predicate + ']';
    }
  };
  
  var evaludateAsObject = function(object, record) {
    var passed = true;
    for (var attr in object) {
      passed = passed && record[attr] === object[attr];
      if (!passed) return false;
    }
    return true;
  };
  
  var compare = function(comparator, records) {
    var t = typeof comparator;
    if (t === 'function') return records.sort(comparator);
    if (t === 'string') return records.sort(createComparator(comparator));
    throw 'Invalid order comparator [' + comparator + ']';
  };
  
  var createComparator = function(strComparator) {
    var funcs = [];
    strComparator.split(',').forEach(function(part) {
      var attr, order;
      [attr, order] = part.trim().split(/\s+(?=(?:asc|desc))/i);
      order = (order || 'asc');
      if (order.toLocaleLowerCase() === 'asc') {
        funcs.push(function(a, b) {
          if (a[attr] < b[attr]) return -1;
          if (a[attr] > b[attr]) return  1;
          return 0;
        });
      } else if (order.toLocaleLowerCase() === 'desc') {
        funcs.push(function(a, b) {
          if (a[attr] > b[attr]) return -1;
          if (a[attr] < b[attr]) return  1;
          return 0;
        });
      } else {
        throw 'Invalid order comparator [' + strComparator + ']';
      }
    });
  
    return createCombinedComparator(funcs);
  };
  
  var createCombinedComparator = function(comparators) {
    return function(a, b) {
      for (var i = 0; i < comparators.length; i++) {
        var r = comparators[i](a, b);
        if (r !== 0) return r;
      }
      return 0;
    };
  };

  return Relation_;
};