export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum Mediatype {
  Image,
  Video,
  HLS
}

export enum EncodingStatus {
  Pending, // Dang cho o queue
  Processing, // Dang encode
  Success, // Encode success
  Failed // Encode failed
}
