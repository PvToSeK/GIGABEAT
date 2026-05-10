export let bpm_value = '--';

setInterval(async () => {
    const res = await fetch('https://gigabeat-production.up.railway.app/api/heartbeat/latest')
    const data = await res.json()
    bpm_value = data.bpm
    console.log(`[LOG] fetch battito: ${bpm_value}`)
}, 2000)
