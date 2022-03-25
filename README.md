# Tamotsu

Tamotsu(保つ) is an object-spreadsheet mapping library like ActiveRecord for google apps script.

![Agents](https://raw.githubusercontent.com/itmammoth/Tamotsu/master/images/Agents001.png "Agents")

```javascript
Tamotsu.initialize();
var Agent = Tamotsu.Table.define({ sheetName: 'Agents' });

var agent = Agent.find(1);
Logger.log(agent); //=>  {#=1.0, First Name=Charles, Last Name=Bartowski, Gender=Male, Salary=100.0, ...}
```

# Installation

Tamotsu is made available as a script library. This is how you add it to your project:

1. Select "Resources" > "Libraries..." in the Google Apps Script editor.
1. Enter the project key (`1OiJIgWlrg_DFHFYX_SoaEzhFJPCmwbbfEHEqYEfLEEhKRloTNVJ-3U4s`) in the "Find a Library" field, and choose "Select".
1. Select the highest version number, and choose Tamotsu as the identifier. (Do not turn on Development Mode unless you know what you are doing. The development version may not work.)
1. Press Save. You can now use the Tamotsu library in your code.

# Usage

When your spreadsheet is the following sheet.

![Agents](https://raw.githubusercontent.com/itmammoth/Tamotsu/master/images/Agents001.png "Agents")

__NOTICE__: Column `#` is used as id column.

```javascript
// You have to invoke this first.
Tamotsu.initialize();
// Define your table class
var Agent = Tamotsu.Table.define({ sheetName: 'Agents' }, {
  fullName: function() {
    return [this['First Name'], this['Last Name']].join(' ');
  },
});

Agent.first(); //=> {#=1.0, First Name=Charles, ...}
Agent.find(2); //=> {#=2.0, First Name=Sarah, ...}
Agent.last();  //=> {#=3.0, First Name=John, ...}

Agent.find(1).fullName(); //=> "Charles Bartowski"

Agent.where({ Gender: 'Male' })
     .order('Salary DESC')
     .all();  //=> [{#=3.0, First Name=John, ...}, {#=1.0, First Name=Charles}]

Agent.sum('Salary');  //=> 600

Agent.create({
  'First Name': 'Morgan',
  'Last Name': 'Grimes',
  'Gender': 'Male',
  'Salary': 50,
}); //=> {#=4.0, First Name=Morgan, ...}
    //   and the data will be appended to the sheet.

var agent = Agent.where(function(agent) { return agent['Salary'] > 150; })
                 .first(); //=> {#=2.0, First Name=Sarah, ...}
agent['Salary'] = 250;
agent.save(); //=> The salary on the sheet will be updated.
```

# API

## Tamotsu

### `Tamotsu.initialize([Spreadsheet])`

|Param                  |Type       |Description|
|:----------------------|:----------|:----------|
|Spreadsheet (optional) |Spreadsheet|A spreadsheet object you will handle. If nothing is given, it uses `SpreadsheetApp.getActive()` instead.|

You have to invoke this method before using `Tamotsu.Table`.

### `Tamotsu.onInitialized(callback)`

|Param   |Type    |Description|
|:-------|:-------|:----------|
|callback|function|A function that is to be added to the callback list.|

You can isolate table definitions from main code with this method.

```javascript
var Agent;
Tamotsu.onInitialized(function() {
  Agent = Tamotsu.Table.define({ sheetName: 'Agents' });
});

function main() {
  Tamotsu.initialize();
  Logger.log(Agent.first());
}
```

## Tamotsu.Table

### `Tamotsu.Table.define(classProperties[, instanceProperties])`

Returns a table class extended from `Tamotsu.Table`.

|Param                        |Type  |Description|
|:----------------------------|:-----|:----------|
|classProperties              |object|An object that is to be defined on your table class as class properties|
|instanceProperties (optional)|object|An object that is to be defined on your table class's instance as instance properties|

#### Prepared `classProperties`
|Key                      |Type   |Description|
|:------------------------|:------|:----------|
|__sheetName__ (necessary)|string |A sheet name you will use as a table|
|idColumn                 |string |Id column used as a key (Default: '#')|
|autoIncrement            |boolean|If true, id is automatically incremented when its value is blank (Default: true)|
|rowShift                 |number |Number of rows before the start of the table  (Default: 0)|
|columnShift              |number |Number of columns before the start of the table (Default: 0)|

#### Prepared `instanceProperties`
|Key     |Type    |Description|
|:-------|:-------|:----------|
|validate|function|A validation function that is to be called before `save`.<br>The callback will be given `on` param.|
```javascript
...
validate: function(on) {
  // on === 'create' or 'update'
  if (on === 'create') {
    if (!this['First Name']) this.errors['First Name'] = "can't be blank";
  } else if (on === 'update') {
    if (this['Salary'] > 500) this.errors['Salary'] = "is too much";
  }
  if (this['Gender'] !== 'Male' && this['Gender'] !== 'Female') {
    this.errors['Gender'] = "must be 'Male' or 'Female'";
  }
},
...
```

_An example of Tamotsu.Table.define:_

```javascript
Tamotsu.initialize();
var Agent = Tamotsu.Table.define({
  // classProperties
  sheetName: 'Agents2',
  idColumn: 'Agent No', // the column used as id
  aClassProp: 'A class property',
  rowShift: 1,
  columnShift: 0,
}, {
  // instanceProperties
  isMale: function() {
    return this['Gender'] === 'Male';
  },
  isFemale: function() {
    return this['Gender'] === 'Female';
  },
  validate: function(on) {
    if (!this['First Name']) {
      this.errors['First Name'] = "can't be blank";
    }
  },
});

Logger.log(Agent.aClassProp); //=> 'A class property'
var agent = Agent.where({ Gender: 'Male' }).first();
Logger.log(agent.isMale()); //=> true
Logger.log(agent.isFemale()); //=> false

Logger.log(Agent.create({ 'First Name': '' })); //=> false
Logger.log(Agent.create({ 'First Name': 'James' })); //=> {Agent No=4.0, First Name=James, ...}
```

### `Tamotsu.Table.first()`

Retunrs the first model in the table.

### `Tamotsu.Table.last()`

Retunrs the last model in the table.

### `Tamotsu.Table.find(id)`

Returns the model found by the given id.

|Param|Type  |Description|
|:----|:-----|:----------|
|id   |any   |An id to find|

### `Tamotsu.Table.all()`

Returns the all model in the table.

### `Tamotsu.Table.pluck(column)`

Returns an array of the given column's values.

|Param |Type  |Description|
|:-----|:-----|:----------|
|column|string|a column name to pluck|
```javascript
var firstNames = Agent.pluck('First Name');
Logger.log(firstNames); //=> ['Charles', 'Sarah', 'John']
```

### `Tamotsu.Table.sum(column)`

Returns the summed up number of the given column's values.

|Param |Type  |Description|
|:-----|:-----|:----------|
|column|string|a column name to sum up|
```javascript
var total = Agent.sum('Salary');
Logger.log(total); //=> 600
```

### `Tamotsu.Table.max(column)`

Returns the maximum value of the given column's values.

|Param |Type  |Description|
|:-----|:-----|:----------|
|column|string|a column name to examine|
```javascript
var max = Agent.max('Salary');
Logger.log(max); //=> 300
```

### `Tamotsu.Table.min(column)`

Returns the minimum value of the given column's values.

|Param |Type  |Description|
|:-----|:-----|:----------|
|column|string|a column name to examine|
```javascript
var min = Agent.min('Salary');
Logger.log(min); //=> 100
```

### `Tamotsu.Table.where(conditions)`

Returns the relation object which meets the given conditions.

|Param     |Type              |Description|
|:---------|:-----------------|:----------|
|conditions|object or function|a condition object or predicate function|

```javascript
// Object condition
var men = Agent.where({ Gender: 'Male' }).all();
Logger.log(men); //=> [{#=1.0, First Name=Charles...}, {#=3.0, First Name=John...}

// Function condition
var highPay = Agent.where(function(agent) { return agent['Salary'] > 150; })
                   .all();
Logger.log(highPay); //=> [{#=2.0, First Name=Sarah...}, {#=3.0, First Name=John...}]
```

For sure `where` returns not models but a relation object that is to be chained with other scope functions, so you can get the records in such an elegant way.

```javascript
Agent.where(condition1).where(condition2).order(comparator).all();
```

### `Tamotsu.Table.order(comparator)`

Returns the relation object which meets the given sort order.

|Param     |Type              |Description|
|:---------|:-----------------|:----------|
|comparator|string or function|a column name or comparator function|

```javascript
// Object comparator
var asc = Agent.order('Salary').all();
Logger.log(asc); //=> [{#=1.0, Salary=100...}, {#=3.0, Salary=200...}, {#=2.0, Salary=300}]

// Supports ASC/DESC
var desc = Agent.order('Salary DESC').all();
Logger.log(desc); //=> [{#=2.0, Salary=300...}, {#=3.0, Salary=200...}, {#=1.0, Salary=100}]

// Function comparator
Agent.order(function(agent1, agent2) {
  // complex comparator
  return agent2['First Name'].length - agent1['First Name'].length;
}).all();

```

### `Tamotsu.Table.create(modelOrAttributes)`

Creates new record in the spreadsheet with the given model or attributes and returns the new model if created successfully.

|Param              |Type           |Description|
|:------------------|:--------------|:----------|
|modelOrAttributes|model or object|Tamotsu.Table model or attribtues object|

```javascript
var agent = new Agent({
  'First Name': 'Morgan',
  'Last Name': 'Grimes',
  'Gender': 'Male',
  'Salary': 50,
});
Agent.create(agent); //=> {#=4.0, First Name=Morgan, ...}
                     // and the data will be appended to the sheet.
// or
Agent.create({
  'First Name': 'Morgan',
  'Last Name': 'Grimes',
  'Gender': 'Male',
  'Salary': 50,
});
```

### `Tamotsu.Table.batchCreate(modelOrAttributesArray)`

Creates new recoreds in the spreadsheet with the given models or attributes and returns the new models if created successfully.
**Better performace than `create` one by one**

|Param              |Type                    |Description|
|:------------------|:-----------------------|:----------|
|modelsOrAttributes |array of model or object|Array of Tamotsu.Table model or attribtues object|

```javascript
var agents = [
  new Agent({
    'First Name': 'Morgan',
    'Last Name': 'Grimes',
    'Gender': 'Male',
    'Salary': 50,
  }),
  new Agent({
    'First Name': 'Bryce',
    'Last Name': 'Larkin',
    'Gender': 'Male',
    'Salary': 400,
  }),
];
Agent.batchCreate(agents);  //=> [{#=4.0, First Name=Morgan, ...}, {#=5.0, First Name=Bryce, ...}]
                            // and the data will be appended to the sheet.
// or
Agent.batchCreate([
  {
    'First Name': 'Morgan',
    'Last Name': 'Grimes',
    'Gender': 'Male',
    'Salary': 50,
  },
  {
    'First Name': 'Bryce',
    'Last Name': 'Larkin',
    'Gender': 'Male',
    'Salary': 400,
  },
]);
```

### `Tamotsu.Table.createOrUpdate(modelOrAttributes)`

[with NOT existing id] Creates new record in the spreadsheet with the given model or attributes and returns the new model if created successfully.

[with existing id] Updates existing record in the spreadsheet with the given model or attributes and returns true if updated successfully.

|Param              |Type           |Description|
|:------------------|:--------------|:----------|
|modelOrAttributes|model or object|Tamotsu.Table model or attribtues object|

```javascript
var agent = new Agent({
  '#': '999',
  'First Name': 'Morgan',
  'Last Name': 'Grimes',
  'Gender': 'Male',
  'Salary': 50,
});
// If there is no record with id=999, the data will be appended to the sheet. Otherwise, the row with id=999 will be updated with the given data.
Agent.createOrUpdate(agent);  //=> {#=999.0, First Name=Morgan, ...}

// with attributes
Agent.createOrUpdate({
  '#': '999',
  'First Name': 'Morgan',
  'Last Name': 'Grimes',
  'Gender': 'Male',
  'Salary': 50,
});
```


## Tamotsu.Model

### `Tamotsu.Model.save()`

Creates or updates on the spreadsheet with the model attributes.

```javascript
// Creates
var newAgent = new Agent({
  'First Name': 'Morgan',
  'Last Name': 'Grimes',
  'Gender': 'Male',
  'Salary': 50,
});
newAgent.save(); // The data will be appended to the last of the sheet.

// Updates
var agent = Agent.last();
agent['Salary'] = 10;
agent.save(); // The data on the sheet will be updated.
```

### `Tamotsu.Model.updateAttributes(attributes)`

Updates model and spreadsheet with the given attributes and returns true if updated successfully.

|Param     |Type  |Description|
|:---------|:-----|:----------|
|attributes|object|attribtues object (column to value)|

```javascript
var agent = Agent.first();
agent.updateAttributes({ 'First Name': 'Chuck', 'Salary': 500 }); // The data on the sheet will be updated.
Logger.log(agent); //=>  {#=1.0, First Name=Chuck, Last Name=Bartowski, Gender=Male, Salary=500.0, ...}
```

### `Tamotsu.Model.destroy()`

Delete the model away from the spreadsheet.

```javascript
var fired = Agent.first();
fired.destroy(); // The data will be removed away from the sheet.
```

### `Tamotsu.Model.isValid()`

Returns boolean of the model being valid/invalid.

```javascript
Tamotsu.initialize();
var Agent = Tamotsu.Table.define({ sheetName: 'Agents' }, {
  validate: function(on) {
    if (!this['First Name']) {
      this.errors['First Name'] = "can't be blank";
    }
  },
});

var agent = new Agent();
Logger.log(agent.isValid()); //=> false

agent['First Name'] = 'Morgan';
Logger.log(agent.isValid()); //=> true
```

### `Tamotsu.Model.isNewRecord()`

Returns boolean of the model being new record or not.

```javascript
var agent = new Agent();
Logger.log(agent.isNewRecord()); //=> true

agent = Agent.first();
Logger.log(agent.isNewRecord()); //=> false
```

### `Tamotsu.Model.getAttributes()`

Returns an object of the model attributes. (column to value)

```javascript
var agent = new Agent();
Logger.log(agent.getAttributes()); //=> {'#': 1, 'First Name': 'Charles', 'Last Name': 'Bartowski', ...}
```

### `Tamotsu.Model.setAttributes()`

Set attributes to a model.

|Param     |Type  |Description|
|:---------|:-----|:----------|
|attributes|object|attribtues object (column to value)|

```javascript
var agent = Agent.first();
agent.setAttributes({ 'First Name': 'Morgan', 'Last Name': 'Grimes' });
```

# Test

Here is the specs.

https://github.com/itmammoth/Tamotsu_Test

# Licence

MIT Licence.
