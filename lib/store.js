var sqlite = require('sqlite3');


var default = {
  'engine': 'sqlite3',
  'database': 'watchdog'
};


var Store = function(config) {
  config = config || {};

  this.db = new sqlite.Database();


};

Store.prototype.open = function () {
};

Store.prototype.close = function () {
};

Store.prototype.write = function (data) {
};

Store.prototype.read = function (params) {
};


module.exports = Store;
