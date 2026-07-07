import { CUSTOMER_INSIGHT_PERIODS } from '@/constants/index.js'
import { calculateRFM } from '@/services/index.js'
import cron from 'node-cron'


export const startRfmScheduler = async () => {

  if (process.env.NODE_ENV !== 'production') {
    console.log('[RFM-Local Test] Running immediate test...')
    try {
      await Promise.all(
        CUSTOMER_INSIGHT_PERIODS.map((period) => calculateRFM(period))
      )
      console.log('[RFM-Local Test] Finished immediate test')
    } catch (err) {
      console.error('[RFM-Local Test] Error:', err)
    }
  }

  // Jalan tiap hari jam 02:00 pagi
  cron.schedule('0 2 * * *', async () => {
    console.log('[RFM] Start calculating...')
    try {
      await Promise.all(
        CUSTOMER_INSIGHT_PERIODS.map((period) => calculateRFM(period))
      )
      console.log('[RFM] Finished')
    } catch (err) {
      console.error('[RFM] Error:', err)
    }
  })

}
