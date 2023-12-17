import { Router } from 'express'
import mediasController from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
const staticRouter = Router()

staticRouter.get('/image/:name', mediasController.serveImageController)
staticRouter.get('/video-stream/:id', mediasController.serveVideoStreamController)
staticRouter.get('/video-hls/:id/master.m3u8', mediasController.serveM3u8Controller)
staticRouter.get('/video-hls/:id/:v/:segment', mediasController.serveSegmentController)

export default staticRouter
