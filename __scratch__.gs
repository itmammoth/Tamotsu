var Model = {};
(function() {
  Model.define = function(options) {
    var constructor = function() {
      this.options = options;
    };
    Object.assign(constructor, classMethods);
    Object.assign(constructor.prototype, instanceMethods);
    return constructor;
  };
  
  var classMethods = {
    all: function() { Logger.log('all selected!') },
  };
  
  var instanceMethods = {
    save: function() { Logger.log('saved!'); },
  };
})();

function __do() {
  var Customer = Model.define({ sheetName: 'abcdefg' });
  Customer.all();
  var customer = new Customer();
  customer['First Name'] = 'Johnny';
  customer['Last Name'] = 'Rotten';
  customer.save();
}