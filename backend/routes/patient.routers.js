const express = require('express');
const router = express.Router();

const {
    getAllPatients,
    getPatientByCF,
    addPatient
} = require('../controllers/patient.controller');

router.get('/all', getAllPatients);

router.get('/:cf', getPatientByCF);

router.post('/', addPatient);

module.exports = router;