import { Request } from 'express'
import path from 'path'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR } from '~/constants/direction'
import { getNameFromFullname, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import fsPromise from 'fs/promises'
import { isProduction } from '~/constants/config'
import { EncodingStatus, Mediatype } from '~/constants/enums'
import { Media } from '~/models/Other'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import { flatMap } from 'lodash'
import databaseService from './database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schema'

class Queue {
  items: string[]
  encoding: boolean
  constructor() {
    this.items = []
    this.encoding = false
  }
  async enQueue(item: string) {
    this.items.push(item)
    console.log('item', item)
    const idName = getNameFromFullname(item.split('\\').pop() as string)
    console.log('idName', idName)
    await databaseService.videoStatus.insertOne(
      new VideoStatus({
        name: idName,
        status: EncodingStatus.Pending
      })
    )
    this.processEncode()
  }
  async processEncode() {
    if (this.encoding) return
    if (this.items.length > 0) {
      this.encoding = true
      const videoPath = this.items[0]
      const idName = getNameFromFullname(videoPath.split('\\').pop() as string)
      await databaseService.videoStatus.updateOne(
        {
          name: idName
        },
        {
          $set: {
            status: EncodingStatus.Processing
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
      try {
        await encodeHLSWithMultipleVideoStreams(videoPath)
        this.items.shift()
        await fsPromise.unlink(videoPath)
        console.log(`Encode video ${videoPath} success`)
        await databaseService.videoStatus.updateOne(
          {
            name: idName
          },
          {
            $set: {
              status: EncodingStatus.Success
            },
            $currentDate: {
              updated_at: true
            }
          }
        )
        this.encoding = false
        this.processEncode()
      } catch (error) {
        console.error(`Encode video ${videoPath} error`)
        await databaseService.videoStatus
          .updateOne(
            {
              name: idName
            },
            {
              $set: {
                status: EncodingStatus.Failed
              },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((err) => {
            console.error('Update video status error', err)
          })
      }
    } else {
      console.log('Encode video queue is empty')
    }
  }
}

const queue = new Queue()

class MediasService {
  async uploadImageService(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg({}).toFile(newPath)
        await fsPromise.unlink(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/image/${newName}.jpg`,
          type: Mediatype.Image
        }
      })
    )
    return result
  }

  async uploadVideoService(req: Request) {
    const files = await handleUploadVideo(req)
    const { newFilename } = files[0]
    return {
      url: isProduction
        ? `${process.env.HOST}/static/video/${newFilename}`
        : `http://localhost:${process.env.PORT}/static/video/${newFilename}`,
      type: Mediatype.Video
    }
  }

  async uploadVideoHLSService(req: Request) {
    const files = await handleUploadVideo(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        await queue.enQueue(file.filepath)
        const newName = getNameFromFullname(file.newFilename)
        return {
          url: isProduction
            ? `${process.env.HOST}/static/video-hls/${newName}`
            : `http://localhost:${process.env.PORT}/static/video-hls/${newName}`,
          type: Mediatype.HLS
        }
      })
    )
    return result
  }
  async getVideoStatusService(id: string) {
    const videoStatus = await databaseService.videoStatus.findOne({
      name: id
    })
    return videoStatus
  }
}

const mediasServices = new MediasService()
export default mediasServices
