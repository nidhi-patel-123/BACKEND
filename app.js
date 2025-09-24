require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');

var indexRouter = require('./routes/index'); // Changed from './routes/app' to './routes/index'
var employeeRouter = require('./routes/employee');
var settingsRouter = require('./routes/settings');
var performanceRoutes = require('./routes/performanceRoutes');

var app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
    'https://admin-mu-teal.vercel.app',
    'https://backend-6bli.onrender.com',
    'https://employee-swart.vercel.app',
    'http://localhost:3003'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.IO middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join user-specific room
  socket.on('join', (userId, role) => {
    socket.join(`${role}_${userId}`);
    console.log(`User ${userId} joined ${role} room`);
    if (role === 'admin') {
      socket.join('admins');
      console.log('Socket joined admins broadcast room');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Configure CORS
app.use(cors({
  origin: [
    'https://admin-mu-teal.vercel.app',
    'https://backend-6bli.onrender.com',
    'https://employee-swart.vercel.app',
    'http://localhost:3003'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'X-User-Id'],
  credentials: true,
}));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected✔️'))
  .catch(err => console.error('MongoDB connection error:', err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/employee', employeeRouter);
app.use('/admin/settings', settingsRouter);
app.use('/admin/employees/performance', performanceRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  if (req.path.startsWith('/admin/') || req.path.startsWith('/employee/')) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    return res.status(status).json({
      status: 'error',
      message: message,
      ...(req.app.get('env') === 'development' && { stack: err.stack })
    });
  }

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = { app, server };