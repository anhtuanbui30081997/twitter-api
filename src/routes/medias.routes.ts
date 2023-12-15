import { Router } from 'express'
import mediasController from '~/controllers/medias.controllers'
import { wrapRequestHandler } from '~/utils/handlers'
const mediasRouter = Router()

mediasRouter.post('/upload-image', wrapRequestHandler(mediasController.uploadSingleImageController))

export default mediasRouter
