var specs_ = {
  test_new_Table: function(helper) {
    var sheet = helper.getSheetByName('fixture');
    var ttable = new Tamotsu.Table(sheet);
    GSUnit.assertEquals(sheet, ttable.sheet);
  },
  
  test_columns: function(helper) {
    var ttable = helper.newFixtureTable();
    GSUnit.assertArrayEquals(['#', 'First Name', 'Last Name'], ttable.columns());
  },
  
  test_first: function(helper) {
    var ttable = helper.newFixtureTable();
    var first = ttable.first();
    GSUnit.assertEquals(1, first['#'])
    GSUnit.assertEquals('Charles', first['First Name'])
    GSUnit.assertEquals('Bartowski ', first['Last Name'])
  },
  
  test_last: function(helper) {
    var ttable = helper.newFixtureTable();
    var last = ttable.last();
    GSUnit.assertEquals(3, last['#'])
    GSUnit.assertEquals('John', last['First Name'])
    GSUnit.assertEquals('Casey', last['Last Name'])
  },
};

var Helper_ = (function() {
  var Helper_ = function() {
    this.app = SpreadsheetApp.getActive();
  };
  
  var _p = Helper_.prototype;
  
  _p.getSheetByName = function(name) {
    return this.app.getSheetByName(name);
  };
  
  _p.newFixtureTable = function(options) {
    return new Tamotsu.Table(this.getSheetByName('fixture'), options || {});
  };

  return Helper_;
})();


function runAll() {
  var helper = new Helper_();
  for (var spec in specs_) {
    specs_[spec](helper);
  }
  Logger.log('All specs were passed!')
}