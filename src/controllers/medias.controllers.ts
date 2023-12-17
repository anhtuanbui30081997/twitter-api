import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/direction'
import HTTP_STATUS from '~/constants/httpStatus'
import USERS_MESSAGES from '~/constants/messages'
import mediasServices from '~/services/medias.services'
import fs from 'fs'

class MediasController {
  async uploadImageController(req: Request, res: Response, next: NextFunction) {
    const url = await mediasServices.uploadImageService(req)
    return res.json({
      message: USERS_MESSAGES.UPLOAD_SUCCESSFULLY,
      result: url
    })
  }

  serveImageController(req: Request, res: Response, next: NextFunction) {
    const { name } = req.params
    return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
      if (err) {
        res.status((err as any).status).send('Image not found')
      }
    })
  }

  async uploadVideoController(req: Request, res: Response, next: NextFunction) {
    const url = await mediasServices.uploadVideoService(req)
    return res.json({
      message: USERS_MESSAGES.UPLOAD_SUCCESSFULLY,
      result: url
    })
  }

  async uploadVideoHLSController(req: Request, res: Response, next: NextFunction) {
    const urls = await mediasServices.uploadVideoHLSService(req)
    return res.json({
      message: USERS_MESSAGES.UPLOAD_SUCCESSFULLY,
      result: urls
    })
  }

  async serveVideoStreamController(req: Request, res: Response, next: NextFunction) {
    const range = req.headers.range
    if (!range) {
      return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header')
    }
    // get name of video to get path on uploade folder
    const { id } = req.params
    const videoName = id + '.' + 'mp4'
    const videoPath = path.resolve(UPLOAD_VIDEO_DIR, id, videoName)

    /**
     * 1MB = 10^6 bytes (Tinh theo he 10, day la thu ma chung ta hay thay tren UI)
     * Con neu tinh tho he nhi phan thi 1MB = 2^20 bytes(1024 *1024)
     *
     * Format of header Content-Range: bytes <start>-<end>/<videoSize>
     * For examble: bytes 1048576-3145727/3145728
     * Yeu cau la `end` phai luon nho hon `videoSize`
     * 'Content-Range': 'bytes 0-100/100'
     * 'Content-Range': 'bytes 0-99/100'
     */

    // 1MB = 10^6 bytes (Tinh theo he 10, day la thu ma chung ta hay thay tren UI)
    // Con neu tinh tho he nhi phan thi 1MB = 2^20 bytes(1024 *1024)

    // dung luong video
    const videoSize = fs.statSync(videoPath).size
    // console.log('videoSize', videoSize)
    // dung luong video cho moi phan doan stream
    const chunkSize = 10 ** 6 // 1MB
    // Lay gia tri byte bat dau tu header Range(vd: bytes = 1048676-)
    const start = Number(range.replace(/\D/g, ''))
    // console.log('start', start)
    // Lay gia tri byte ket thuc, vuot qua dung luong video thi lay gia tri videoSize
    const end = Math.min(start + chunkSize, videoSize - 1)
    // console.log('end', end)

    // Dung luong thuc te cho moi doan stream
    // Thuong day se la chunkSize, ngoai tru doan cuoi cung
    const contentLength = end - start + 1
    const mime = (await import('mime')).default
    const contentType = mime.getType(videoPath) || 'video/*'
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': contentType
    }
    res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
    // eslint-disable-next-line prettier/prettier
    const videoStream = fs.createReadStream(videoPath, { start, end })
    videoStream.pipe(res)
  }

  async serveM3u8Controller(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params
    return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, 'master.m3u8'), (err) => {
      if (err) {
        res.status((err as any).status).send('File not found')
      }
    })
  }

  async serveSegmentController(req: Request, res: Response, next: NextFunction) {
    const { id, v, segment } = req.params
    //segment: 0.ts, 1.ts, 2.ts
    console.log(segment)
    return res.sendFile(path.resolve(UPLOAD_VIDEO_DIR, id, v, segment), (err) => {
      if (err) {
        res.status((err as any).status).send('File not found')
      }
    })
  }

  async videoStatusController(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params
    const reuslt = await mediasServices.getVideoStatusService(id as string)
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.GET_VIDEO_STATUS_SUCCESSFULLY,
      result: reuslt
    })
  }
}

const mediasController = new MediasController()
export default mediasController
