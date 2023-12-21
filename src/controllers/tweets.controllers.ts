import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetType } from '~/constants/enums'
import { TweetParam, TweetQuery, TweetReqBody } from '~/models/requests/Tweet.request'
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
    const result = await tweetsServices.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
    const tweet = {
      ...req.tweet,
      guest_views: result.guest_views,
      user_views: result.user_views,
      updated_at: result.updated_at
    }
    return res.json({
      message: 'Get Tweet successfully',
      result: tweet
    })
  }

  async getTweetChildrenController(req: Request<TweetParam, any, any, TweetQuery>, res: Response) {
    const tweet_type = Number(req.query.tweet_type) as TweetType
    const limit = Number(req.query.limit)
    const page = Number(req.query.page)
    const user_id = req.decoded_authorization?.user_id
    const { tweets, total } = await tweetsServices.getTweetChildren({
      tweet_id: req.params.tweet_id,
      tweet_type,
      limit,
      page,
      user_id
    })
    return res.json({
      message: 'Get Tweet Children successfully',
      result: {
        tweets,
        tweet_type,
        limit,
        page,
        total_page: Math.ceil(total / limit)
      }
    })
  }
}

const tweetControllers = new TweetControllers()
export default tweetControllers
