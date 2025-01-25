const nodemailer = require("nodemailer");
const { emailSetting } = require("../api/utils/setting");

const createTransport = async () => {
  // SMTP is the main transport in Nodemailer for delivering messages.
  // SMTP is also the protocol used between almost all email hosts, so its truly universal.
  // if you dont want to use SMTP you can create your own transport here
  // such as an email service API or nodemailer-sendgrid-transport
  const emailConfig = await emailSetting();

  const transporter = nodemailer.createTransport({
    port: emailConfig.port,
    host: emailConfig.host,
    auth: {
      user: emailConfig.username,
      pass: emailConfig.password,
    },
    secure: false, // upgrades later with STARTTLS -- change this based on the PORT
  });

  // verify connection configuration
  transporter.verify((error) => {
    if (error) {
      console.log("error with email connection");
    }
  });
  return {
    transporter,
    from:emailConfig.from,
    name:emailConfig.name,
    companyName:emailConfig.companyName,
    companyAddress:emailConfig.companyAddress
  };
};


// export createTransport function as a module
module.exports = createTransport;
