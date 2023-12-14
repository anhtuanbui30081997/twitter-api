import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import HTTP_STATUS from '~/constants/httpStatus'
import USERS_MESSAGES from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersServices from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
import { capitalize } from 'lodash'
import { NextFunction, Request, Response } from 'express'
import { LoginReqBody, TokenPayload } from '~/models/requests/User.requests'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'
import { REGEX_USERNAME } from '~/constants/regex'

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minNumbers: 1,
      minUppercase: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}

const confirmPasswordSchema = (key: string) => {
  const schema: ParamSchema = {
    notEmpty: {
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
    },
    isString: {
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
    },
    isLength: {
      options: {
        min: 6,
        max: 50
      },
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
    },
    isStrongPassword: {
      options: {
        minLength: 6,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 1,
        minSymbols: 1
      },
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
    },
    custom: {
      options: (value, { req }) => {
        if (value !== req.body[key]) {
          throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
        }
        return true
      }
    }
  }
  return schema
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value, { req }) => {
      try {
        if (!value) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.FORGOT_PASSWORD_IS_REQUIRED,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        })
        ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
        return true
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize(error.message),
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        throw error
      }
    }
  }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRE
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  },
  trim: true
}

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH
  }
}

const userIdSchema: ParamSchema = {
  // trim: true,
  custom: {
    options: async (value, { req }) => {
      if (!ObjectId.isValid(value as string)) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: USERS_MESSAGES.INVALID_USER_ID
        })
      }
      const follower_user = await databaseService.users.findOne({
        _id: new ObjectId(value)
      })
      if (follower_user === null) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: USERS_MESSAGES.USER_NOT_FOUND
        })
      }
      return true
    }
  }
}

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const password = (req as Request<ParamsDictionary, any, LoginReqBody>).body.password
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(password)
            })
            if (!user) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }
            req.user = user
            return true
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value) => {
            const isExistEmail = await usersServices.checkEmailExistService(value)
            if (isExistEmail) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
            }
            return isExistEmail
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema('password'),
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_authorization = await verifyToken({
                token: access_token,
                secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              })
              ;(req as Request).decoded_authorization = decoded_authorization
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            try {
              if (!value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              // Verify if refresh_token is correct and Check if refresh_token in db.collection('refresh_token')
              // Because the two actions are unrelated so we can perform these actions in parallel by using Promise.all([])
              // const decoded_refresh_token = await verifyToken({ token: value })
              // await databaseService.refreshTokens.findOne({ token: value })
              const [decoded_refresh_token, refreshTokenObject] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string }),
                databaseService.refreshTokens.findOne({ token: value })
              ])
              if (refreshTokenObject === null) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXISTS,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              ;(req as Request).decoded_refresh_token = decoded_refresh_token
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            try {
              if (!value) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              })
              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
              return true
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        trim: true,
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })
            if (!user) {
              throw new Error(USERS_MESSAGES.USER_NOT_FOUND)
            }
            ;(req as Request).user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordTokenValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema('password'),
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

// Middleware đồng bộ thì throw express validator tự động next error
export const verifiedUserValidator = async (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    // Neu dung Middleware bất đồng bộ phải dùng next
    next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_VERIFY,
        status: HTTP_STATUS.FORBIDDEN
      })
    )
    // Neu dung Middleware đồng bộ thì khi throw một error, express validator tự động next error
    // C2 là dùng next(dùng đc cả đồng bộ và bất đồng bộ)
    // throw new ErrorWithStatus({
    //   message: USERS_MESSAGES.USER_NOT_VERIFY,
    //   status: HTTP_STATUS.FORBIDDEN
    // })
  }
  next()
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.BIO_LENGTH
        }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.WEBSITE_LENGTH
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (REGEX_USERNAME.test(value) === false) {
              throw new Error(USERS_MESSAGES.USERNAME_INVALID)
            }
            const user = await databaseService.users.findOne({ username: value })
            if (user) {
              throw new Error(USERS_MESSAGES.USERNAME_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const verifiedFollowUserValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['body']
  )
)

export const verifiedUnFollowUserValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value: string, { req }) => {
            const { user_id } = (req as Request).decoded_authorization as TokenPayload
            const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
            if (!user) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: USERS_MESSAGES.USER_NOT_FOUND
              })
            }
            if (user.password !== hashPassword(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.UNAUTHORIZED,
                message: USERS_MESSAGES.OLD_PASSWORD_IS_NOT_MATCH
              })
            }
            return true
          }
        }
      },
      new_password: passwordSchema,
      confirm_new_password: confirmPasswordSchema('new_password')
    },
    ['body']
  )
)
