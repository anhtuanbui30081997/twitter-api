import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetReqBody } from '~/models/requests/Tweet.request'
import { TokenPayload } from '~/models/requests/User.requests'
import tweetsServices from '~/services/tweets.services'

class TweetControllers {
  async createTweetController(req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await tweetsServices.createTweetService(user_id, req.body)
    return res.json({
      message: 'Create Tweet successfully',
      result: result
    })
  }
  async getTweetController(req: Request, res: Response) {
    return res.json({
      message: 'Create Tweet successfully',
      result: 'OK'
    })
  }
}

const tweetControllers = new TweetControllers()
export default tweetControllers
