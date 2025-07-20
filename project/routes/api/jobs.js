const express = require('express');
const { getJobs, getJobById } = require('../../controllers/jobController');

const router = express.Router();

router.get('/', getJobs);
router.get('/:id', getJobById);

module.exports = router;