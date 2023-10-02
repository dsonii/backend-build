const httpStatus = require("http-status");
const { omit } = require("lodash");
const Wallet = require("../models/wallet.model");
const User = require("../models/user.model");
const Payment = require("../models/payment.model");
const firebaseUser = require('../services/firebaseUser');
const userNotification = require("../models/userNotification.model")
const {
    nanoid
} = require('nanoid');
const mongoose = require("mongoose")

/**
 * Create recharge amount
 * @public
 */
exports.create = async (req, res, next) => {
    try {
        const { adminId, user, amount } = req.body;
        let userId = user ? user.id : '';
        if (await User.exists({ _id: mongoose.Types.ObjectId(userId) })) {
            const getWallet = await Wallet.findOne({ users: mongoose.Types.ObjectId(userId) }).lean();
            if (getWallet) {
                const payment = new Payment({
                    orderId: "order_" + nanoid(10),
                    walletId: getWallet._id,
                    userId: userId,
                    amount: parseFloat(amount),
					payment_type:"wallet",
                    payment_status: "Completed",
                    title: "Wallet recharge",
                    type: 0,
                    method:"wallet",
                    adminId
                });
                const persistedPayment = await payment.save();
                if (persistedPayment) {
                    const update = {
                        amount: getWallet.amount + parseInt(amount)
                    }
                    const updateWallet = await Wallet.findOneAndUpdate({ users: mongoose.Types.ObjectId(getWallet.users) }, update, { new: true });
                    if (updateWallet) {

                        const getUser = await User.findById(userId).select("firstname lastname device_token device_type");

                        if (getUser && getUser.device_token) {
                            const title = `Wallet Recharge Successful`;
                            const content = `Hey ${getUser.firstname} ${getUser.lastname}, Amount ${DEFAULT_CURRENCY} ${amount} has been added in your wallet. Your new balance is ${DEFAULT_CURRENCY} ${updateWallet.amount}`;
                                      const payload = {
										token : getUser.device_token,
										title: title,
										body: content,
										picture: '',
									  };
							await firebaseUser.sendSingleMessage(payload);
                            userNotification.create('wallet',title, content, userId, adminId, {});

                        }
                        res.status(httpStatus.CREATED);
                        res.json({
                            message: `Amount Added successfully.`,
                            data:{},
                            status: true,
                        });
                    }
                }
            }
        }
    } catch (error) {
        next(error);
    }
};