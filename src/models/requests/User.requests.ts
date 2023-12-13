import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'

export interface TokenPayload extends JwtPayload {
  user_id: string
  verify: UserVerifyStatus
  token_type: TokenType
}
export interface RegisterReqBody {
  name: string
  email: string
  password: string
  confirm_password: string
  date_of_birth: string
}

export interface LoginReqBody {
  email: string
  password: string
}

export interface LogoutReqBody {
  refresh_token: string
}
export interface RefreshTokenReqBody {
  refresh_token: string
}

export interface VerifyEmailReqBody {
  email_verify_token: string
}
export interface forgotPasswordReqBody {
  email: string
}

export interface forgotPasswordTokenReqBody {
  forgot_password_token: string
}
export interface resetPasswordReqBody {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}
