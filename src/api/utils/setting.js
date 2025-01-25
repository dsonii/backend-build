const Setting = require("../models/setting.model");
const Razorpay = require("razorpay");

const settingS3 = async () => {
  const getsetting = await Setting.findOne({}, "s3").lean();
  return {
    access_key: getsetting.s3.access_key,
    secret_key: getsetting.s3.secret_key,
    region: getsetting.s3.region,
    bucket: getsetting.s3.bucket,
  };
};

const settingRazorPay = async () => {
  const getsetting = await Setting.findOne({}, "payments").lean();
  if (getsetting.payments) {
    const is_production = getsetting.payments.is_production;
    let status = "";
    if (is_production) {
      // is_production is true
      status = "LIVE";
      let razor = new Razorpay({
        key_id: getsetting.payments.key, // process.env.RAZOR_KEY_ID,
        key_secret: getsetting.payments.secret, // process.env.RAZOR_KEY_SECRET,
      });
      return {
        status,
        payment_settings: getsetting.payments,
        razor
      };
    }
    status = "TEST";
    let razor = new Razorpay({
      key_id: getsetting.payments.key, // process.env.RAZOR_KEY_ID,
      key_secret: getsetting.payments.secret, // process.env.RAZOR_KEY_SECRET,
    });
    return {
      status,
      payment_settings: getsetting.payments,
      razor
    };
  }
};

const emailSetting = async () =>{
  const getsetting = await Setting.findOne({}, "smtp general").lean();
  const is_production = getsetting.smtp.is_production;
  if(is_production){
    return{
      host: getsetting.smtp.host,
      port: getsetting.smtp.port,
      username: getsetting.smtp.username,
      password: getsetting.smtp.password,
      encryption: getsetting.smtp.encryption,
      name:getsetting.smtp.name,
      from:getsetting.smtp.email,
      companyName:getsetting.general.name,
      companyAddress:getsetting.general.address,
    }
  }else {
      return {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        username: process.env.EMAIL_USERNAME,
        password: process.env.EMAIL_PASSWORD,
        from:process.env.EMAIL_FROM,
        companyName:'',
        companyAddress:'',
      }
  }
}
module.exports = { settingS3, settingRazorPay,emailSetting };
