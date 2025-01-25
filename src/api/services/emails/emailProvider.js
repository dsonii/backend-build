const nodemailer = require("nodemailer");
const createTransport = require("../../../config/nodemailer");
const Email = require("email-templates");

exports.sendPasswordReset = async (passwordResetObject) => {
  const transporter = await createTransport();
  const email = new Email({
    views: { root: __dirname },
    message: {
      from: transporter.from,
    },
    // uncomment below to send emails in development/test env:
    send: true,
    transport: transporter.transporter,
  });

  email
    .send({
      template: "passwordReset",
      message: {
        to: passwordResetObject.userEmail,
      },
      locals: {
        productName: transporter.companyName,
        companyName: transporter.companyName,
        companyAddress: transporter.companyAddress,
        year:new Date().getFullYear(),
        // passwordResetUrl should be a URL to your app that displays a view where they
        // can enter a new password along with passing the resetToken in the params
        passwordResetUrl: `http://localhost:8000/#/auth/new-password/${passwordResetObject.resetToken}`,
      },
    })
    .catch(() => console.log("error sending password reset email"));
};

exports.sendPasswordChangeEmail = async (user) => {
  const transporter = await createTransport();
  const email = new Email({
    views: { root: __dirname },
    message: {
      from: transporter.from,
    },
    // uncomment below to send emails in development/test env:
    send: true,
    transport: transporter.transporter,
  });

  email
    .send({
      template: "passwordChange",
      message: {
        to: user.email,
      },
      locals: {
        productName: "Ferri",
        name: user.firstname,
        productName: transporter.companyName,
        companyName: transporter.companyName,
        companyAddress: transporter.companyAddress,
        year:new Date().getFullYear(),
      },
    })
    .catch(() => console.log("error sending change password email"));
};
