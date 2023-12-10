import { Router } from 'express'
import {
  emailVerifyValidator,
  loginController,
  logoutController,
  refreshTokenController,
  registerController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
const usersRouter = Router()

/**
 * Description. Login a user
 * Path: /login
 * Method: POST
 * Body: {name: string, email: string}
 */
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * Description. Register a new user
 * Path: /regiser
 * Method: POST
 * Body: {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8601}
 */
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * Description. Logout a user
 * Path: /logout
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {refresh_token: string}
 */
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/**
 * Description. Refresh token when access_token expired
 * Path: /refresh-token
 * Method: POST
 * Body: {refresh_token: string}
 */
usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/**
 * Description. Verify email when user client click on the link in email
 * Path: /verify-email
 * Method: POST
 * Body: {email_verify_token: string}
 */
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyValidator))

export default usersRouter
