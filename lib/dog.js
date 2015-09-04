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


function initialize(config) {
    pid = process.pid;
    root = path.resolve(__dirname, '..');

    // format config with defaults
    _.extend(config, {
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(root, 'db.sqlite3')
            },
            tableName: 'logs'
        }
    });

    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.DailyRotateFile)({
                stream: fs.createWriteStream(path.join(root, 'log'), { flags: 'a' }),
                datePattern: format('.%d-yyyy-MM-dd-HH-mm', pid)
            })
        ]
    });

    db = knex(config.database);

    return db.schema.hasTable(config.database.tableName).then(function (exists) {
        if (!exists) {
            return db.schema.createTable('logs', function (table) {
                table.increments('id').primary();
                table.string('ip', 16).index();
                table.timestamps();
            });
        }
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
    return initialize(config)
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
