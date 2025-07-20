const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { createJob, updateJob, deleteJob, createJobValidation } = require('../../controllers/jobController');
const { body, validationResult } = require('express-validator');
const db = require('../../models/db');

const router = express.Router();

// Apply middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['company']));

// Get company profile
router.get('/profile', async (req, res) => {
  try {
    const [profile] = await db.execute(`
      SELECT c.*, u.name, u.email 
      FROM companies c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.user_id = ?
    `, [req.user.id]);

    res.json(profile[0]);
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update company profile
router.put('/profile', [
  body('company_name').notEmpty().withMessage('Company name is required'),
  body('industry').optional(),
  body('location').optional(),
  body('description').optional(),
  body('website').optional().isURL().withMessage('Valid website URL required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { company_name, industry, location, description, website } = req.body;

    await db.execute(`
      UPDATE companies 
      SET company_name = ?, industry = ?, location = ?, description = ?, website = ? 
      WHERE user_id = ?
    `, [company_name, industry, location, description, website, req.user.id]);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update company profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Get company jobs
router.get('/jobs', async (req, res) => {
  try {
    const [company] = await db.execute('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    
    const [jobs] = await db.execute(`
      SELECT j.*, COUNT(a.id) as application_count
      FROM jobs j 
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE j.company_id = ? 
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `, [company[0].id]);

    res.json(jobs);
  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Create job
router.post('/jobs', createJobValidation, createJob);

// Update job
router.put('/jobs/:id', updateJob);

// Delete job
router.delete('/jobs/:id', deleteJob);

// Get applications for company jobs
router.get('/applications', async (req, res) => {
  try {
    const [company] = await db.execute('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    
    const [applications] = await db.execute(`
      SELECT a.*, j.title as job_title, js.phone as jobseeker_phone, u.name as jobseeker_name, u.email as jobseeker_email
      FROM applications a 
      JOIN jobs j ON a.job_id = j.id 
      JOIN jobseekers js ON a.jobseeker_id = js.id
      JOIN users u ON js.user_id = u.id
      WHERE j.company_id = ?
      ORDER BY a.applied_at DESC
    `, [company[0].id]);

    res.json(applications);
  } catch (error) {
    console.error('Get company applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Update application status
router.put('/applications/:id', [
  body('status').isIn(['pending', 'reviewed', 'accepted', 'rejected']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Verify application belongs to company
    const [company] = await db.execute('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    
    const [application] = await db.execute(`
      SELECT a.id 
      FROM applications a 
      JOIN jobs j ON a.job_id = j.id 
      WHERE a.id = ? AND j.company_id = ?
    `, [id, company[0].id]);

    if (application.length === 0) {
      return res.status(404).json({ message: 'Application not found or access denied' });
    }

    await db.execute('UPDATE applications SET status = ? WHERE id = ?', [status, id]);

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Failed to update application status' });
  }
});

module.exports = router;