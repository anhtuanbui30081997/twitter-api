import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { LIKE_MESSAGES, TWEET_MESSAGES } from '~/constants/messages'
import { LikeReqBody } from '~/models/requests/Like.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import likeServices from '~/services/like.services'

class LikeControllers {
  async likeTweetController(req: Request<ParamsDictionary, any, LikeReqBody>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await likeServices.likeTweetService(user_id, req.body.tweet_id)
    return res.json({
      message: LIKE_MESSAGES.LIKE_SUCCESSFULLY,
      result: result
    })
  }
  async unLikeTweetController(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await likeServices.unLikeTweetService(user_id, req.params.tweet_id)
    return res.json({
      message: LIKE_MESSAGES.UNLIKE_SUCCESSFULLY,
      result: result
    })
  }
}

const likeControllers = new LikeControllers()
export default likeControllers
