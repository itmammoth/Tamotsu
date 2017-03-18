var createRelation_ = function() {
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
};