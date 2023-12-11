import { Router } from 'express'
import userControllers from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordTokenValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const usersRouter = Router()

/**
 * Description. Login a user
 * Path: /login
 * Method: POST
 * Header: None
 * Body: {name: string, email: string}
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(userControllers.loginController))

/**
 * Description. Register a new user
 * Path: /regiser
 * Method: POST
 * Header: None
 * Body: {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(userControllers.registerController))

/**
 * Description. Logout a user
 * Path: /logout
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {refresh_token: string}
 */
usersRouter.post(
  '/logout',
  accessTokenValidator,
  refreshTokenValidator,
  wrapRequestHandler(userControllers.logoutController)
)

/**
 * Description. Refresh token when access_token expired
 * Path: /refresh-token
 * Method: POST
 * Header: None
 * Body: {refresh_token: string}
 */
usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(userControllers.refreshTokenController))

/**
 * Description. Verify email when user client click on the link in email
 * Path: /verify-email
 * Method: POST
 * Header: None
 * Body: {email_verify_token: string}
 */
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(userControllers.verifyEmailController))

/**
 * Description. Resend verify email when user client click on the link in email
 * Path: /resend-verify-email
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {}
 */
usersRouter.post(
  '/resend-verify-email',
  accessTokenValidator,
  wrapRequestHandler(userControllers.resendVerifyEmailController)
)

/**
 * Description. User submit a email to server to notify user has forgotten password. Server verify email
 *              and create a forgot_password_token and send forgot_password_token to User
 * Path: /forgot-password
 * Method: POST
 * Header: None
 * Body: {email: string}
 */
usersRouter.post(
  '/forgot-password',
  forgotPasswordValidator,
  wrapRequestHandler(userControllers.forgotPasswordController)
)

/**
 * Description. When user click to link verify email, send forgot_password_token to server.
 *              Server verify forgot_password_token
 * Path: /verify-forgot-password-token
 * Method: POST
 * Header: None
 * Body: {forgot_password_token: string}
 */
usersRouter.post(
  '/verify-forgot-password-token',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(userControllers.verifyForgotPasswordController)
)

/**
 * Description. After user verify forgot_password_token successfully. User submit new_password and confirm_password to server to reset password
 * Path: /reset-password
 * Method: POST
 * Header: None
 * Body: {forgot_password_token: string, password: string, confirm_password: string}
 */
usersRouter.post(
  '/reset-password',
  resetPasswordTokenValidator,
  wrapRequestHandler(userControllers.resetPasswordController)
)

/**
 * Description. Get profile
 * Path: /me
 * Method: GET
 * Header: {Authorization: Bearer <access_token>}
 * Body: None
 */
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(userControllers.getMeController))

export default usersRouter
