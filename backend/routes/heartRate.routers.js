const express = require('express');
const router = express.Router();
const { getAllHeartRates, getLatestHeartRate, addHeartRate } = require('../controllers/heartRate.controller');

router.get('/all', getAllHeartRates);
router.get('/latest', getLatestHeartRate);
router.post('/', addHeartRate);

module.exports = router;