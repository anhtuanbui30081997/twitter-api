import { Request } from 'express'
import User from './models/schemas/User.schema'
// Extend type for module
declare module 'express' {
  interface Request {
    user?: User
  }
}
