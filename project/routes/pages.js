const express = require('express');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const db = require('../models/db');

const router = express.Router();

// Public pages
router.get('/', optionalAuth, (req, res) => {
  res.render('home', { title: 'Elevate Workforce Solutions', user: req.user });
});

router.get('/about', optionalAuth, (req, res) => {
  res.render('about', { title: 'About Us - Elevate Workforce Solutions', user: req.user });
});

router.get('/jobs', optionalAuth, (req, res) => {
  res.render('jobs', { title: 'Job Listings - Elevate Workforce Solutions', user: req.user });
});

router.get('/contact', optionalAuth, (req, res) => {
  res.render('contact', { title: 'Contact Us - Elevate Workforce Solutions', user: req.user });
});

router.get('/login', (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/dashboard');
  }
  res.render('login', { title: 'Login - Elevate Workforce Solutions', user: null });
});

router.get('/register', (req, res) => {
  if (req.cookies.token) {
    return res.redirect('/dashboard');
  }
  res.render('register', { title: 'Register - Elevate Workforce Solutions', user: null });
});

// Dashboard routes
router.get('/dashboard', authenticateToken, (req, res) => {
  const role = req.user.role;
  res.redirect(`/dashboard/${role}`);
});

router.get('/dashboard/jobseeker', authenticateToken, requireRole(['jobseeker']), async (req, res) => {
  try {
    const [jobseekerData] = await db.execute(`
      SELECT js.*, u.name, u.email 
      FROM jobseekers js 
      JOIN users u ON js.user_id = u.id 
      WHERE js.user_id = ?
    `, [req.user.id]);

    const [applications] = await db.execute(`
      SELECT a.*, j.title as job_title, c.company_name 
      FROM applications a 
      JOIN jobs j ON a.job_id = j.id 
      JOIN companies c ON j.company_id = c.id 
      WHERE a.jobseeker_id = (SELECT id FROM jobseekers WHERE user_id = ?)
      ORDER BY a.applied_at DESC
    `, [req.user.id]);

    res.render('dashboards/jobseeker', {
      title: 'Jobseeker Dashboard - Elevate Workforce Solutions',
      user: req.user,
      profile: jobseekerData[0],
      applications
    });
  } catch (error) {
    console.error('Jobseeker dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load dashboard',
      user: req.user
    });
  }
});

router.get('/dashboard/company', authenticateToken, requireRole(['company']), async (req, res) => {
  try {
    const [companyData] = await db.execute(`
      SELECT c.*, u.name, u.email 
      FROM companies c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.user_id = ?
    `, [req.user.id]);

    const [jobs] = await db.execute(`
      SELECT j.*, COUNT(a.id) as application_count
      FROM jobs j 
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.company_id = ? 
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `, [companyData[0].id]);

    res.render('dashboards/company', {
      title: 'Company Dashboard - Elevate Workforce Solutions',
      user: req.user,
      company: companyData[0],
      jobs
    });
  } catch (error) {
    console.error('Company dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load dashboard',
      user: req.user
    });
  }
});

router.get('/dashboard/admin', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [userStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'jobseeker' THEN 1 ELSE 0 END) as jobseekers,
        SUM(CASE WHEN role = 'company' THEN 1 ELSE 0 END) as companies
      FROM users
    `);

    const [jobStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs
      FROM jobs
    `);

    const [applicationStats] = await db.execute(`
      SELECT COUNT(*) as total_applications FROM applications
    `);

    res.render('dashboards/admin', {
      title: 'Admin Dashboard - Elevate Workforce Solutions',
      user: req.user,
      stats: {
        ...userStats[0],
        ...jobStats[0],
        ...applicationStats[0]
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load dashboard',
      user: req.user
    });
  }
});

module.exports = router;