import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import usersServices from '~/services/users.services'
import { RegisterReqBody } from '~/models/requests/User.requests'
import { threadId } from 'worker_threads'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'buituananh@gmail.com' && password === '123456') {
    return res.json({
      message: 'Login success'
    })
  }
  return res.status(400).json({
    message: 'Login fail'
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await usersServices.regiser(req.body)
    return res.status(200).json({
      message: 'Register successfully',
      result
    })
  } catch (error) {
    next(error)
  }
}
