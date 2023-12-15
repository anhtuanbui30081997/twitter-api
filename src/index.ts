import express from 'express'
import userRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'

databaseService.connect()
const port = process.env.PORT || 4000
const app = express()
app.use(express.json())

// Create folder upload
initFolder()

app.use('/users', userRouter)
app.use('/medias', mediasRouter)
app.use(defaultErrorHandler)
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
