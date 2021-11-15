var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var database = require('./lib/database');
var session = require('express-session');
var databaseConfig = require('./config/db.json');
var cors = require('cors');

var MySQLStore = require('express-mysql-session')(session);
var options = {
  host: databaseConfig.development.host,
  port: databaseConfig.development.port,
  user: databaseConfig.development.username,
  password: databaseConfig.development.password,
  database: databaseConfig.development.database,
};
var sessionStore = new MySQLStore(options);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var gameRouter = require('./routes/game');
var adminRouter = require('./routes/admin');
var accountRouter = require('./routes/account');
var recordRouter = require('./routes/record');

var app = express();

database.load();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors({
  origin: 'http://localhost:8080',
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: "A#$afA%Gyq3$YUIIW3q47*WERGa((#$",
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/game', gameRouter);
app.use('/admin', adminRouter);
app.use('/account', accountRouter);
app.use('/record', recordRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
