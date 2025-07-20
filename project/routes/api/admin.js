const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { deleteFile } = require('../../controllers/resumeController');
const db = require('../../models/db');
const path = require('path');

const router = express.Router();

// Apply middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT u.*, 
        CASE 
          WHEN u.role = 'jobseeker' THEN js.phone
          WHEN u.role = 'company' THEN c.company_name
          ELSE NULL 
        END as additional_info
      FROM users u 
      LEFT JOIN jobseekers js ON u.id = js.user_id 
      LEFT JOIN companies c ON u.id = c.user_id
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user info and associated files
    const [user] = await db.execute('SELECT role FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated resume files if jobseeker
    if (user[0].role === 'jobseeker') {
      const [jobseeker] = await db.execute('SELECT resume_path FROM jobseekers WHERE user_id = ?', [id]);
      if (jobseeker[0]?.resume_path) {
        const filePath = path.join(__dirname, '../../public/uploads/', path.basename(jobseeker[0].resume_path));
        deleteFile(filePath);
      }
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const [jobs] = await db.execute(`
      SELECT j.*, c.company_name, COUNT(a.id) as application_count
      FROM jobs j 
      JOIN companies c ON j.company_id = c.id 
      LEFT JOIN applications a ON j.id = a.job_id
      GROUP BY j.id
      ORDER BY j.created_at DESC
    `);

    res.json(jobs);
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Delete job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('DELETE FROM jobs WHERE id = ?', [id]);

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Failed to delete job' });
  }
});

// Get all applications
router.get('/applications', async (req, res) => {
  try {
    const [applications] = await db.execute(`
      SELECT a.*, j.title as job_title, c.company_name, u.name as jobseeker_name, u.email as jobseeker_email
      FROM applications a 
      JOIN jobs j ON a.job_id = j.id 
      JOIN companies c ON j.company_id = c.id 
      JOIN jobseekers js ON a.jobseeker_id = js.id
      JOIN users u ON js.user_id = u.id
      ORDER BY a.applied_at DESC
    `);

    res.json(applications);
  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Delete application
router.delete('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute('DELETE FROM applications WHERE id = ?', [id]);

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ message: 'Failed to delete application' });
  }
});

module.exports = router;