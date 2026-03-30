import express from 'express'
import routes from './routes/index.js'
import cors from "cors"
import fileUpload from 'express-fileupload'
import { startRfmScheduler } from './scheduler/index.js'

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
}

const PORT = Number(process.env.PORT) || 4000

const app = express()
app.use(cors())
app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
    abortOnLimit: true,
  })
)
app.use(express.json())
app.use("/api/v1", routes)

startRfmScheduler()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express running on ${PORT}`);
  console.log(`Server Time: ${new Date()}` , process.env.TZ);
})
