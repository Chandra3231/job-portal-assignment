const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { uploadResume, deleteFile } = require('../../controllers/resumeController');
const { body, validationResult } = require('express-validator');
const db = require('../../models/db');
const path = require('path');

const router = express.Router();

// Apply middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['jobseeker']));

// Get profile
router.get('/profile', async (req, res) => {
  try {
    const [profile] = await db.execute(`
      SELECT js.*, u.name, u.email 
      FROM jobseekers js 
      JOIN users u ON js.user_id = u.id 
      WHERE js.user_id = ?
    `, [req.user.id]);

    res.json(profile[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').optional().isMobilePhone(),
  body('experience').optional(),
  body('skills').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, experience, skills } = req.body;

    // Update user name
    await db.execute('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);

    // Update jobseeker profile
    await db.execute(`
      UPDATE jobseekers 
      SET phone = ?, experience = ?, skills = ? 
      WHERE user_id = ?
    `, [phone, experience, skills, req.user.id]);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Upload resume
router.post('/resume', (req, res) => {
  uploadResume(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      // Get current resume path to delete old file
      const [current] = await db.execute('SELECT resume_path FROM jobseekers WHERE user_id = ?', [req.user.id]);
      
      if (current[0]?.resume_path) {
        const oldPath = path.join(__dirname, '../../public/uploads/', path.basename(current[0].resume_path));
        deleteFile(oldPath);
      }

      const resumePath = `/uploads/${req.file.filename}`;
      
      await db.execute('UPDATE jobseekers SET resume_path = ? WHERE user_id = ?', [resumePath, req.user.id]);

      res.json({ message: 'Resume uploaded successfully', resumePath });
    } catch (error) {
      console.error('Resume upload error:', error);
      res.status(500).json({ message: 'Failed to upload resume' });
    }
  });
});

// Apply to job
router.post('/apply/:jobId', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional(),
  body('experience').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { jobId } = req.params;
    const { name, email, phone, experience } = req.body;

    // Get jobseeker ID and resume
    const [jobseeker] = await db.execute('SELECT id, resume_path FROM jobseekers WHERE user_id = ?', [req.user.id]);
    
    if (jobseeker.length === 0) {
      return res.status(400).json({ message: 'Jobseeker profile not found' });
    }

    // Check if already applied
    const [existing] = await db.execute(`
      SELECT id FROM applications WHERE job_id = ? AND jobseeker_id = ?
    `, [jobId, jobseeker[0].id]);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }

    // Insert application
    await db.execute(`
      INSERT INTO applications (job_id, jobseeker_id, name, email, phone, experience, resume_path) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [jobId, jobseeker[0].id, name, email, phone, experience, jobseeker[0].resume_path]);

    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ message: 'Failed to submit application' });
  }
});

// Get applications
router.get('/applications', async (req, res) => {
  try {
    const [applications] = await db.execute(`
      SELECT a.*, j.title as job_title, j.location, c.company_name 
      FROM applications a 
      JOIN jobs j ON a.job_id = j.id 
      JOIN companies c ON j.company_id = c.id 
      WHERE a.jobseeker_id = (SELECT id FROM jobseekers WHERE user_id = ?)
      ORDER BY a.applied_at DESC
    `, [req.user.id]);

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

module.exports = router;