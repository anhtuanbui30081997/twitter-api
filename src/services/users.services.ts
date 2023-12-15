import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import USERS_MESSAGES from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follower.schema'
import axios from 'axios'

class UsersService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }
  private signRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }
  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN
      }
    })
  }
  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }
  private signAccessTokenAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private async getOAuthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
  }

  async checkEmailExistService(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async regiserService(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        date_of_birth: new Date(payload.date_of_birth),
        username: `user${user_id.toString()}`,
        password: hashPassword(payload.password),
        email_verify_token: email_verify_token
      })
    )
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.refreshTokens.insertOne(new RefreshToken({ token: refresh_token, user_id: user_id }))
    console.log('email_verify_token:', email_verify_token)
    return {
      access_token,
      refresh_token
    }
  }

  async loginService({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
      user_id,
      verify
    })
    await databaseService.refreshTokens.updateOne(
      { user_id: new ObjectId(user_id) },
      {
        $set: {
          token: refresh_token
        }
      }
    )
    return {
      access_token,
      refresh_token
    }
  }

  async oauthService(code: string) {
    const { id_token, access_token } = await this.getOAuthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED
      })
    }
    // Check email is registered
    const user = await databaseService.users.findOne({ email: userInfo.email })
    // if exist => login
    if (user) {
      const [access_token, refresh_token] = await this.signAccessTokenAndRefreshToken({
        user_id: user._id.toString(),
        verify: user.verify
      })
      // update refresh_token vao database
      await databaseService.refreshTokens.deleteOne({ user_id: user._id })
      await databaseService.refreshTokens.insertOne(
        new RefreshToken({
          user_id: user._id,
          token: refresh_token
        })
      )
      return {
        access_token,
        refresh_token,
        newUser: 0,
        verify: user.verify
      }
    } else {
      // random string password
      const password = Math.random().toString(36).substring(2, 15)
      //  Register
      const data = await this.regiserService({
        email: userInfo.email,
        name: userInfo.name,
        password: password,
        confirm_password: password,
        date_of_birth: new Date().toISOString()
      })
      return { ...data, newUser: 1, verify: UserVerifyStatus.Unverified }
    }
  }

  async logoutService(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }

  async refreshTokenService({ user_id, refresh_token }: { user_id: string; refresh_token: string }) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    const verify = (user as User).verify
    const [token] = await Promise.all([
      this.signAccessTokenAndRefreshToken({ user_id, verify }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])
    const [access_token, new_refresh_token] = token
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ token: new_refresh_token, user_id: new ObjectId(user_id) })
    )
    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }

  async verifyEmailService(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessTokenAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: { email_verify_token: '', verify: UserVerifyStatus.Verified },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])
    const [access_token, refresh_token] = token
    await databaseService.refreshTokens.updateOne(
      { user_id: new ObjectId(user_id) },
      {
        $set: {
          token: refresh_token
        }
      }
    )
    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmailService(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    // Fake send email
    console.log('New email verify token:', email_verify_token)

    // Update email_verify_token in User document
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token: email_verify_token,
          updated_at: '$$NOW'
        }
      }
    ])

    return {
      message: 'Resend verify email successfully'
    }
  }

  async verifyForgotPasswordService(user_id: string) {
    const user = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    return user
  }

  async forgotPasswordService({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    // Send email and the link to user https://twitter.com/forgot-password?token=token
    console.log('forgot_password_token:', forgot_password_token)
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
  async resetPasswordService({ user_id, password }: { user_id: string; password: string }) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESSFULLY
    }
  }

  async getMeService(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return {
      user
    }
  }

  async updateMeService(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return {
      user
    }
  }

  async getProfileService(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    return {
      user
    }
  }

  async followService(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    if (follower === null) {
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(user_id),
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESSFULLY
      }
    }
    return {
      message: USERS_MESSAGES.FOLLOWED
    }
  }

  async unFollowService(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    // user_id not follow follower_user_id
    if (follower === null) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOW
      }
    }
    // Already follow => unfollow
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESSFULLY
    }
  }

  async changePasswordService(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(new_password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESSFULLY
    }
  }
}

const usersServices = new UsersService()
export default usersServices
