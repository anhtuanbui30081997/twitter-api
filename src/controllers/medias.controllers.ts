import { Request, Response, NextFunction } from 'express'
import mediasServices from '~/services/medias.services'

class MediasController {
  async uploadSingleImageController(req: Request, res: Response, next: NextFunction) {
    const result = await mediasServices.handleUploadSingleImageService(req)
    return res.json({ result })
  }
}

const mediasController = new MediasController()
export default mediasController
