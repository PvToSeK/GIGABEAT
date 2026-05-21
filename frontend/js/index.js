import { bpm_value } from './api.js';

const bpm_display = document.getElementById('bpm')

setInterval(() => {
    if (bpm_value <= 0)
        bpm_value = '--'
    console.log(bpm_value)
    bpm_display.textContent = bpm_value
}, 2000)
