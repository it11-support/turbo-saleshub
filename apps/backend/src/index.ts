import express from 'express'
import routes from './routes/index.js'
import cors from "cors"
import fileUpload from 'express-fileupload'
import { createServer } from 'http'
import { initSocket } from './libs/socket-io.js'
import { defaultLimiter } from './utils/limiter.js'
import helmet from 'helmet'

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
}

const PORT = Number(process.env.PORT) || 4000

const app = express()
app.set('trust proxy', 2);
app.use(helmet(
  {
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },
    crossOriginEmbedderPolicy: false
  }
))
app.use(defaultLimiter)

// snyk:ignore:javascript/cleartext-transmission
// Reason: SSL termination is handled by the upstream reverse proxy in production. Internal traffic is safe.
const httpServer = createServer(app)

initSocket(httpServer)

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

// startRfmScheduler()

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Express running on ${PORT}`);
  console.log(`Server Time: ${new Date()}`, process.env.TZ);
})
