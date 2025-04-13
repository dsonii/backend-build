const express = require('express');

const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const roleRoutes = require('./role.route');
const resourceRoutes = require('./resource.route');
const locationRoutes = require('./location.route');
const driverRoutes = require('./driver.route');
const agentRoutes = require('./agent.route');
const busRoutes = require('./bus.route');
const buslayoutRoutes = require('./buslayout.route');
const bustypeRoutes = require('./bustype.route');
const routeRoutes = require('./route.route');
const helperRoutes = require('./helper.route');
const settingRoutes = require('./setting.route');
const timetableRoutes = require('./timetable.route');
const routebusRoutes = require('./routebus.route');
const offerRoute = require('./offer.route');
const passRoute = require('./pass.route');
const currencyRoute = require('./currency.route');
const countryRoute = require('./country.route');
const bookingRoute = require('./booking.route');
const dashboardRoute = require('./dashboard.route');
const cityRoute = require('./city.route');
const bookingassignRoute = require('./bookingassign.route');
const suggestRoute = require('./suggest.route');
const paymentRoute = require('./payment.route');
const referralRoutes = require('./refferal.route');
const uploadRoutes = require('./upload.route');
const walletRoutes = require('./wallet.route');
const notificationRoutes = require('./notification.route');
const permissionRoutes = require('./permission.route');
const paymentgatewayRoutes = require('./paymentgateway.route');
const MapRoutes = require('./map.route');
const busScheduleRoutes = require('./busschedule.route');
const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/resources', resourceRoutes);
router.use('/locations', locationRoutes);
router.use('/drivers', driverRoutes);
router.use('/agents', agentRoutes);
router.use('/buses', busRoutes);
router.use('/buslayouts', buslayoutRoutes);
router.use('/bustypes', bustypeRoutes);
router.use('/routes', routeRoutes);
router.use('/routebuses', routebusRoutes);
router.use('/helpers', helperRoutes);
router.use('/settings', settingRoutes);
router.use('/timetables', timetableRoutes);
router.use('/offers', offerRoute);
router.use('/passes', passRoute);
router.use('/currencies', currencyRoute);
router.use('/countries', countryRoute);
router.use('/bookings', bookingRoute);
router.use('/dashboard', dashboardRoute);
router.use('/cities', cityRoute);
router.use('/booking-assigns', bookingassignRoute);
router.use('/suggests', suggestRoute);
router.use('/payments', paymentRoute);
router.use('/referrals', referralRoutes);
router.use('/uploads', uploadRoutes);
router.use('/wallets', walletRoutes);
router.use('/notifications', notificationRoutes);
router.use('/permissions', permissionRoutes);
router.use('/payment-gateways', paymentgatewayRoutes);
router.use('/map', MapRoutes);
router.use('/bus-schedules',busScheduleRoutes);

module.exports = router;
