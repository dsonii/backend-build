const busValidation = require('./bus.validation');
const buslayoutValidation = require('./buslayout.validation');
const bustypeValidation = require('./bustype.validation');
const driverValidation = require('./driver.validation');
const authValidation = require('./auth.validation');
const permissionValidation = require('./permission.validation');
const locationValidation = require('./location.validation');
const offerValidation = require('./offer.validation');
const roleValidation = require('./role.validation');
const routeValidation = require('./route.validation');
const suggestValidation = require('./suggest.validation');
const timetableValidation = require('./timetable.validation');
const userValidation = require('./user.validation');
const passValidation = require('./pass.validation');
const currencyValidation = require('./currency.validation');
const countryValidation = require('./country.validation');
const notificationValidation = require('./notification.validation');
const walletValidation = require('./wallet.validation');
const AgentValidation = require('./agent.validation');

module.exports = {
  authValidation,
  permissionValidation,
  busValidation,
  buslayoutValidation,
  bustypeValidation,
  driverValidation,
  locationValidation,
  offerValidation,
  roleValidation,
  routeValidation,
  suggestValidation,
  timetableValidation,
  userValidation,
  passValidation,
  currencyValidation,
  countryValidation,
  notificationValidation,
  walletValidation,
  AgentValidation,
};
