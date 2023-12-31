import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import usersServices from '~/services/users.services'
import {
  ChangePasswordReqBody,
  FollowReqBody,
  GetProfileReqParams,
  LoginReqBody,
  LogoutReqBody,
  RefreshTokenReqBody,
  RegisterReqBody,
  TokenPayload,
  UnFollowReqParams,
  UpdateMeReqBody,
  VerifyEmailReqBody,
  forgotPasswordReqBody,
  forgotPasswordTokenReqBody,
  resetPasswordReqBody
} from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import User from '~/models/schemas/User.schema'
import { USERS_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'

class UserController {
  async registerController(req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) {
    const result = await usersServices.regiserService(req.body)
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.REGISTER_SUCCESSFULLY,
      result
    })
  }

  async loginController(req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) {
    const user = req.user as User
    const user_id = (user._id as ObjectId).toString()
    const result = await usersServices.loginService({ user_id, verify: user.verify })
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.LOGIN_SUCCESSFULLY,
      result
    })
  }

  async oauthController(req: Request, res: Response) {
    const { code } = req.query
    const result = await usersServices.oauthService(code as string)
    const urlRedirect = `${process.env.CLIENT_REDIREACT_CALLBACK as string}?access_token=${
      result.access_token
    }&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`
    return res.redirect(urlRedirect)
    // return res.status(HTTP_STATUS.OK).json({
    //   mesage: result.newUser ? USERS_MESSAGES.REGISTER_SUCCESSFULLY : USERS_MESSAGES.LOGIN_SUCCESSFULLY,
    //   result: {
    //     access_token: result.access_token,
    //     refresh_token: result.refresh_token
    //   }
    // })
  }

  async logoutController(req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) {
    await usersServices.logoutService(req.body.refresh_token)
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.LOGOUT_SUCCESSFULLY
    })
  }

  async refreshTokenController(req: Request<ParamsDictionary, any, RefreshTokenReqBody>, res: Response) {
    const { user_id, exp, verify } = req.decoded_refresh_token as TokenPayload
    const result = await usersServices.refreshTokenService({
      user_id: user_id,
      refresh_token: req.body.refresh_token,
      verify,
      exp
    })
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESSFULLY,
      result
    })
  }

  async verifyEmailController(req: Request<ParamsDictionary, any, VerifyEmailReqBody>, res: Response) {
    const { user_id } = req.decoded_email_verify_token as TokenPayload
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    // If not found user, return a error
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    // If verified , return status OK with message "Email already verified before"
    if (user.email_verify_token === '') {
      return res.status(HTTP_STATUS.OK).json({
        message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
      })
    }
    // Check email_verify_token is matched with token in database
    if (user.email_verify_token !== req.body.email_verify_token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_INCORRECT
      })
    }

    const result = await usersServices.verifyEmailService(user_id)
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESSFULLY,
      result
    })
  }

  async resendVerifyEmailController(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    // If not found user, return a error
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    // If verified , return status OK with message "Email already verified before"
    if (user.verify === UserVerifyStatus.Verified) {
      return res.status(HTTP_STATUS.OK).json({
        message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
      })
    }
    const result = await usersServices.resendVerifyEmailService(user_id)
    return res.status(HTTP_STATUS.OK).json(result)
  }

  async forgotPasswordController(req: Request<ParamsDictionary, any, forgotPasswordReqBody>, res: Response) {
    const user = req.user as User
    const result = await usersServices.forgotPasswordService({
      user_id: (user._id as ObjectId).toString(),
      verify: user.verify
    })
    return res.status(HTTP_STATUS.OK).json(result)
  }

  async verifyForgotPasswordController(req: Request<ParamsDictionary, any, forgotPasswordTokenReqBody>, res: Response) {
    const { user_id } = req.decoded_forgot_password_token as TokenPayload
    const forgot_password_token = req.body.forgot_password_token
    const user = await usersServices.verifyForgotPasswordService(user_id)
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    if (user.forgot_password_token !== forgot_password_token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN
      })
    }
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_TOKEN_SUCCESSFULLY
    })
  }

  async resetPasswordController(req: Request<ParamsDictionary, any, resetPasswordReqBody>, res: Response) {
    const { user_id } = req.decoded_forgot_password_token as TokenPayload
    const password = req.body.password
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    const rerult = await usersServices.resetPasswordService({ user_id, password })
    return res.status(HTTP_STATUS.OK).json(rerult)
  }

  async getMeController(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const user = await usersServices.getMeService(user_id)
    if (user === null) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.GET_PROFILE_SUCCESSFULLY,
      result: user
    })
  }

  async updateMeController(req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const body = req.body
    console.log('body:', body)
    const user = await usersServices.updateMeService(user_id, body)
    if (user === null) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.UPDATE_PROFILE_SUCCESSFULLY,
      result: user
    })
  }

  async getProfileController(req: Request<GetProfileReqParams>, res: Response) {
    const { username } = req.params
    const user = await usersServices.getProfileService(username)
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.GET_PROFILE_SUCCESSFULLY,
      result: user
    })
  }

  async followController(req: Request<ParamsDictionary, any, FollowReqBody>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { followed_user_id } = req.body
    const result = await usersServices.followService(user_id, followed_user_id)
    return res.status(HTTP_STATUS.OK).json(result)
  }

  async unFollowController(req: Request<UnFollowReqParams>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { followed_user_id } = req.params
    const result = await usersServices.unFollowService(user_id, followed_user_id)
    return res.status(HTTP_STATUS.OK).json(result)
  }

  async changePasswordController(req: Request<ParamsDictionary, any, ChangePasswordReqBody>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { new_password } = req.body
    const result = await usersServices.changePasswordService(user_id, new_password)
    return res.status(HTTP_STATUS.OK).json(result)
  }
}

const userControllers = new UserController()
export default userControllers
