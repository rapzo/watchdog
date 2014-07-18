var nodemailer = require('nodemailer');
var _ = require('underscore');

var Notify = function (config) {

  this.config = {
    transport: this.config.mail.transport,
    host: this.config.mail.server,
    port: 465,
    secureConnection: this.config.mail.secure,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass
    }
  };

  this.server = config.server;
  this.message = config.message;
  this.subject = config.subject;

  this.transport = nodemailer.createTransport(
      this.config.mail.service,
      this.config
  );
};


Notify.prototype.send = function (to, subject, data, fn) {
  if ('function' !== typeof fn) {
    throw new Error("Must provide a callback.");
  }

  var template = _.template(this.message.join('\n'));
  var message = template({ server: this.server.name, ip: data });

  var options = {
    from: this.config.to,
    to: to,
    subject: this.subject,
    text: message,
    domain: this.config.domain ? this.config.domain : null
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
