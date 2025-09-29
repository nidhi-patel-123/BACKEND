// app.js
require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');
const http = require('http');

const indexRouter = require('./routes/index');
const employeeRouter = require('./routes/employee');
const settingsRouter = require('./routes/settings');
const performanceRoutes = require('./routes/performanceRoutes');
const chatRoutes = require('./controllers/chatController');
const messageRoutes = require('./controllers/message'); // Fixed typo from 'meassage'

const app = express();
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

// Attach Socket.IO to app for use in controllers
app.set('io', io);

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
    if (!userId || !role) {
      console.error('Invalid join request:', { userId, role });
      return;
    }
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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true,
}));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected✔️'))
  .catch(err => console.error('MongoDB connection error:', err));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/employee', employeeRouter);
app.use('/admin/settings', settingsRouter);
app.use('/admin/employees/performance', performanceRoutes);
app.use('/chat', chatRoutes);
app.use('/msg', messageRoutes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
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