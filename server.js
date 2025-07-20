const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

const authRoutes = require('./project/routes/api/auth');
const jobRoutes = require('./project/routes/api/jobs');           // <-- Correct import here
const jobseekerRoutes = require('./project/routes/api/jobseeker');
const companyRoutes = require('./project/routes/api/company');
const adminRoutes = require('./project/routes/api/admin');
const pageRoutes = require('./project/routes/pages');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from 'project/public'
app.use(express.static(path.join(__dirname, 'project', 'public')));

// Set EJS as templating engine
app.set('view engine', 'ejs');

// Point views folder to 'project/views'
app.set('views', path.join(__dirname, 'project', 'views'));

// Routes
app.use('/', pageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);             // <-- Use jobRoutes here
app.use('/api/jobseeker', jobseekerRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: 'Something went wrong!',
    user: req.user 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: '404 - Page Not Found',
    user: req.user 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
