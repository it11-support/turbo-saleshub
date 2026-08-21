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
console.log("Client", process.env.CLIENT_URL)
const app = express()
app.set('trust proxy', 2);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tunnel-Skip-AntiPhishing']
}));

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


app.use(
  fileUpload({
    createParentPath: true,
    useTempFiles: false,
    limits: {
      fileSize: 5 * 1024 * 1024, // max 5MB
    },
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
