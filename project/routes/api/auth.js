const express = require('express');
const { register, login, logout, registerValidation, loginValidation } = require('../../controllers/authController');

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);

module.exports = router;