var nodemailer = require('nodemailer');
var _ = require('underscore');

var Notify = function (config) {

  this.config = {
    transport: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secureConnection: true,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass
    }
  };

  this.server = config.server;
  this.message = config.message;
  this.subject = config.subject;

  this.transport = nodemailer.createTransport('SMTP', this.config);
};


Notify.prototype.send = function (to, subject, data, fn) {
  if ('function' !== typeof fn) {
    throw new Error("Must provide a callback.");
  }

  var template = _.template(this.message.join('\n'));
  var message = template({ server: this.server.name, ip: data });

  var options = {
    from: '12FtJunk <junk@12feettallstudio.com>',
    to: to,
    subject: this.subject,
    text: message,
    domain: 'doris.12feettallstudio.com'
  };

  var transport = this.transport;
  transport.sendMail(options, function (err, res) {
    transport.close();
    
    if (err) {
      fn(err, null);
    } else {
      fn(null, res);
    }
  });
};


module.exports = Notify;