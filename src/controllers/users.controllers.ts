import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import usersServices from '~/services/users.services'
import { RegisterReqBody } from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schema'
import USERS_MESSAGES from '~/constants/messages'

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = (user._id as ObjectId).toString()
  // Fake throw Error to catch(error) and send error to Error handler
  // throw new Error('Not Implemented')
  const result = await usersServices.login(user_id)
  return res.status(200).json({
    message: USERS_MESSAGES.LOGIN_SUCCESSFULLY,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await usersServices.regiser(req.body)
  return res.status(200).json({
    message: USERS_MESSAGES.REGISTER_SUCCESSFULLY,
    result
  })
}
