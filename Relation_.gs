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
    }},
    
    first: { value: function() {
      var tables = this.all();
      return tables.length > 0 ? tables[0] : null;
    }},
    
    last: { value: function() {
      var tables = this.all();
      return tables.length > 0 ? tables[tables.length - 1] : null;
    }},
    
    order: { value: function(comparator) {
      this.comparator = comparator;
      return this;
    }},
  });
  
  return Relation_;
};