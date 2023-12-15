import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_DIR } from '~/constants/direction'
import { getNmaeFromFullname, handleUploadSingleImage } from '~/utils/file'
import fs from 'fs'
import { isProduction } from '~/constants/config'

class MediasService {
  async handleUploadSingleImageService(req: Request) {
    const file = await handleUploadSingleImage(req)
    const newName = getNmaeFromFullname(file.newFilename)
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
    await sharp(file.filepath).jpeg({}).toFile(newPath)
    // await fs.unlinkSync(file.filepath)
    return isProduction
      ? `${process.env.HOST}/uploads/${newName}.jpg`
      : `http://localhost:${process.env.PORT}/uploads/${newName}.jpg`
  }
}

const mediasServices = new MediasService()
export default mediasServices
