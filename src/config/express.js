//Hello today is april 16

const express = require('express');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const routes = require('../api/routes/v1/index');
const {
    logs,
} = require('./vars');
const strategies = require('./passport');
const error = require('../api/middlewares/error');
const path = require('path');
const Setting = require("../api/models/setting.model")
/**
 * Express instance
 * @public
 */
const app = express();

// enable files upload
// app.use(fileUpload({
// 	createParentPath: true,
// 	// limits: {
// 	// 	fileSize: 2000000 // 2MB max file size
// 	// },
// 	// abortOnLimit: true,
// 	// responseOnLimit:"File 2mb size limit has been reached."
// }))

app.enable('trust proxy')
    // request logging. dev: console | production: file
app.use(morgan(logs));

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));


// parse body params and attache them to req.body
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({
//   extended: true,
// }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// gzip compression
app.use(compress());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());


// enable authentication
app.use(passport.initialize());
passport.use('jwt', strategies.jwt);
// passport.use('facebook', strategies.facebook);
// passport.use('google', strategies.google);

app.use('/public', express.static(path.join(__dirname, '../../public')));

// Middleware to set the timezone value in the app.locals object
app.use(async (req, res, next) => {
	const getSetting = await Setting.getgeneral();
	if (getSetting) {
	//app.locals.timezone = getSetting.general.timezone;
		global.DEFAULT_TIMEZONE = getSetting.timezone;
		global.DEFAULT_DATEFORMAT = getSetting.date_format.value ? getSetting.date_format.value : 'DD MMM YYYY'
		global.DEFAULT_TIMEFORMAT = getSetting.time_format.value ? getSetting.time_format.value : 'hh:mm A';
          global.DEFAULT_CURRENCY = getSetting.default_currency;
	}
	next();
  });



// mount api v1 routes
app.use('/', routes);
console.log(routes);
// if error is not an instanceOf APIError, convert it.
app.use(error.converter);

// catch 404 and forward to error handler
// app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);
console.log(error);
module.exports = app;
