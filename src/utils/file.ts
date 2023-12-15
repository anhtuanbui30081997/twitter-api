import formidable, { File } from 'formidable'
import fs from 'fs'
import path from 'path'
import { Request } from 'express'
import { UPLOAD_TEMP_DIR } from '~/constants/direction'

export const initFolder = () => {
  if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
    fs.mkdirSync(UPLOAD_TEMP_DIR, {
      recursive: true // Create folder nested
    })
  }
}

export const handleUploadSingleImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 500 * 1024, //300KB
    filter: function ({ name, originalFilename, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })
  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve((files.image as File[])[0])
    })
  })
}

export const getNmaeFromFullname = (fullname: string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('.')
}
