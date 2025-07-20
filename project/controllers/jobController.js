const db = require('../models/db');
const { body, validationResult } = require('express-validator');

const createJobValidation = [
  body('title').notEmpty().withMessage('Job title is required'),
  body('description').notEmpty().withMessage('Job description is required'),
  body('location').notEmpty().withMessage('Location is required')
];

const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const location = req.query.location ? req.query.location.trim() : '';

    let whereClause = 'WHERE j.status = "active"';
    let filters = [];

    if (search) {
      whereClause += ' AND (j.title LIKE ? OR j.description LIKE ?)';
      filters.push(`%${search}%`, `%${search}%`);
    }

    if (location) {
      whereClause += ' AND j.location LIKE ?';
      filters.push(`%${location}%`);
    }

    console.log('Filters before LIMIT:', filters);
    console.log('LIMIT:', limit, 'OFFSET:', offset);

    // Use LIMIT and OFFSET directly in the query string, not as bound parameters
    const sql = `
      SELECT j.*, c.company_name, c.industry 
      FROM jobs j 
      JOIN companies c ON j.company_id = c.id 
      ${whereClause}
      ORDER BY j.created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [jobs] = await db.execute(sql, filters);

    // Count total matching jobs (no limit/offset here)
    const countSql = `
      SELECT COUNT(*) as total 
      FROM jobs j 
      JOIN companies c ON j.company_id = c.id 
      ${whereClause}
    `;

    const [countResult] = await db.execute(countSql, filters);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      jobs,
      currentPage: page,
      totalPages,
      total
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const [jobs] = await db.execute(`
      SELECT j.*, c.company_name, c.industry, c.location as company_location, c.description as company_description
      FROM jobs j 
      JOIN companies c ON j.company_id = c.id 
      WHERE j.id = ? AND j.status = "active"
    `, [id]);

    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(jobs[0]);
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch job' });
  }
};

const createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, requirements, location, salary_range, job_type } = req.body;

    const [companies] = await db.execute('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (companies.length === 0) {
      return res.status(400).json({ message: 'Company profile not found' });
    }

    const companyId = companies[0].id;

    const [result] = await db.execute(`
      INSERT INTO jobs (company_id, title, description, requirements, location, salary_range, job_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [companyId, title, description, requirements, location, salary_range, job_type]);

    res.json({ message: 'Job created successfully', jobId: result.insertId });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Failed to create job' });
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirements, location, salary_range, job_type, status } = req.body;

    const [companies] = await db.execute('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (companies.length === 0) {
      return res.status(400).json({ message: 'Company profile not found' });
    }

    const companyId = companies[0].id;

    const [jobs] = await db.execute('SELECT id FROM jobs WHERE id = ? AND company_id = ?', [id, companyId]);
    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    await db.execute(`
      UPDATE jobs 
      SET title = ?, description = ?, requirements = ?, location = ?, salary_range = ?, job_type = ?, status = ?
      WHERE id = ? AND company_id = ?
    `, [title, description, requirements, location, salary_range, job_type, status, id, companyId]);

    res.json({ message: 'Job updated successfully' });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ message: 'Failed to update job' });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const [companies] = await db.execute('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
    if (companies.length === 0) {
      return res.status(400).json({ message: 'Company profile not found' });
    }

    const companyId = companies[0].id;

    const [result] = await db.execute('DELETE FROM jobs WHERE id = ? AND company_id = ?', [id, companyId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found or access denied' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Failed to delete job' });
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  createJobValidation
};
