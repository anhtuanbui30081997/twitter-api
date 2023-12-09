import express from 'express'
import userRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'

databaseService.connect()
const app = express()
app.use(express.json())
app.use('/users', userRouter)
app.use(defaultErrorHandler)
app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})
