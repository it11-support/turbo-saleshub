import { calculateRFM } from '@/services/index.js'
import cron from 'node-cron'


export const startRfmScheduler = () =>{

  // Jalan tiap hari jam 02:00 pagi
  cron.schedule('0 2 * * *', async () => {
    console.log('[RFM] Start calculating...')
    try {
      await calculateRFM()
      console.log('[RFM] Finished')
    } catch (err) {
      console.error('[RFM] Error:', err)
    }
  })

}
