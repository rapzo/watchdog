'use strict';

var path = require('path');
var fs = require('fs');
var format = require('util').format;
var winston = require('winston');
var knex = require('knex');
var _ = require('underscore');
var publicIp = require('public-ip');
var promise = require('bluebird');

// var notifier = require('./notifier');

// var stream = ;
var pid;
var root;
var logger;
var db;

var Dog = function Dog(config) {
    this.options = {};

    this.config = _.extend(config, {
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(root, 'db.sqlite3')
            },
            tableName: 'logs'
        }
    });

    this.pid = process.pid;
    this.root = path.resolve(__dirname, '..');

    this.logger = new (winston.Logger)({
        transports: [
            new (winston.transports.DailyRotateFile)({
                stream: fs.createWriteStream(path.join(root, 'dog'), { flags: 'a' }),
                datePattern: format('.%d-yyyy-MM-dd-HH-mm', pid)
            })
        ]
    });

    this.db = probe(knex(config.database), this.config.database.tableName);
};

function probe(db, tableName) {
    return db.schema.hasTable(tableName).then(function (exists) {
        return exists ? db : initializeDb(db, tableName);
    });
}

function initializeDb(db, tableName) {
    return db.schema.createTable('logs', function (table) {
        table.increments('id').primary();
        table.string('ip', 16).index();
        table.timestamps();
    });
}

function checkIp() {
    return new promise(function (resolve, reject) {
        publicIp(function (err, ip) {
            return err ? reject(err) : resolve(ip);
        });
    });
}

function checkLastIp(ip) {
    return db.select('ip').from('logs').then(function (lastIp) {
        return [ip, lastIp];
    });
}

function updateIp(ip, lastIp) {
    var now;

    if (ip === lastIp) {
        return [false, ip];
    }

    now = Date.now();

    return db
        .insert({
            ip: ip,
            created_at: now,
            updated_at: now
        })
        .into('logs')
        .then(function (status) {
            return [status, ip];
        });
}


module.exports = function (config) {
    return new Dog(config)
        .then(checkIp)
        .then(checkLastIp)
        .spread(updateIp)
        .spread(function (status, ip) {
            if (!status) {
                logger.log(format('IP still at `%s`', ip));
            } else {
                logger.log(format('IP was set to `%s`'), ip);
            }
        })
        .catch(function (error) {
            logger.error(error);
        });
};
