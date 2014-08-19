var fs = require('fs');
var Log = require('log');
var sqlite = require('sqlite3');
var http = require('http');
var Notify = require('./notify');
var stream = fs.createWriteStream(__dirname + '/watchdog.log', { flags: 'a' });

var path = require('path');

function dir(pieces) {
  return path.join(__dirname, pieces);
};

var log = new Log('debug', stream);



var run = function () {
  var msg;

  var db = new sqlite.Database(dir('watchdog.sqlite3'), function () {
    db.run('CREATE TABLE IF NOT EXISTS ips (value TEXT, created DATETIME)');
  });

  var req = http.get(config.service, function (res) {
    res.setEncoding('utf8');
    res.on('data', function (data) {

      db.get('SELECT * FROM ips ORDER BY rowid DESC LIMIT 1', function (err, row) {
        if (err) log.error(err);

        if (!row || row['value'] !== data) {
          var message = new Notify(config);

          msg = 'IP changed: ' + data;

          message.send(config.to, config.subject, data, function (err, done) {
            var stmt = db.prepare("INSERT INTO ips VALUES (?, datetime())");
            stmt.run(data);

            if (err) {
              log.log('info', err);
              return;
            }
          });
        } else {
          msg = 'IP still the same: ' + data;
        }

        log.info(msg);
      });

      req.end();
    });
  }).on('error', function (err) {
    log.error(err);
  });
}

module.exports = run;
