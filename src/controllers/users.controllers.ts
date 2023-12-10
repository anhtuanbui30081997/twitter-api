import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import usersServices from '~/services/users.services'
import {
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  TokenPayload,
  VerifyEmailReqBody
} from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schema'
import USERS_MESSAGES from '~/constants/messages'
import databaseService from '~/services/database.services'
import { UserVerifyStatus } from '~/constants/enums'

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
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

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  await usersServices.logout(req.body.refresh_token)
  return res.status(200).json({
    message: USERS_MESSAGES.LOGOUT_SUCCESSFULLY
  })
}

export const refreshTokenController = async (
  req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_refresh_token as TokenPayload
  const result = await usersServices.refreshToken({
    user_id: user_id,
    refresh_token: req.body.refresh_token
  })
  return res.status(200).json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESSFULLY,
    result
  })
}

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailReqBody>, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  // If not found user, return a error
  if (!user) {
    return res.status(404).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  // If verified , return status OK with message "Email already verified before"
  if (user.email_verify_token === '') {
    return res.status(200).json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }

  const resutl = await usersServices.verifyEmail(user_id)
  return res.status(200).json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESSFULLY,
    resutl
  })
}

export const resendVerifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
  // If not found user, return a error
  if (!user) {
    return res.status(404).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  // If verified , return status OK with message "Email already verified before"
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(200).json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    })
  }
  const result = await usersServices.resendVerifyEmail(user_id)
  return res.status(200).json(result)
}
