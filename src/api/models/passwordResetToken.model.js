const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');

/**
 * Refresh Token Schema
 * @private
 */
const passwordResetTokenSchema = new mongoose.Schema({
  resetToken: {
    type: String,
    required: true,
    index: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'admin',
    required: true,
  },
  userEmail: {
    type: 'String',
    ref: 'Admin',
    required: true,
  },
  expires: { type: Date },
});

passwordResetTokenSchema.statics = {
  /**
   * Generate a reset token object and saves it into the database
   *
   * @param {Admin} admin
   * @returns {ResetToken}
   */
  async generate(admin) {
    const adminId = admin._id;
    const userEmail = admin.email;
    const resetToken = `${adminId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment()
      .add(2, 'hours')
      .toDate();
    const ResetTokenObject = new PasswordResetToken({
      resetToken,
      adminId,
      userEmail,
      expires,
    });
    await ResetTokenObject.save();
    return ResetTokenObject;
  },
};

/**
 * @typedef RefreshToken
 */
const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
module.exports = PasswordResetToken;
