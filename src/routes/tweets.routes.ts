import { Router } from 'express'
import tweetControllers from '~/controllers/tweets.controllers'
import { createTweetValidator, tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetsRouter = Router()

/**
 * Description. Create Tweet
 * Path: /
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: TweetReqBody
 */
tweetsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(tweetControllers.createTweetController)
)

/**
 * Description. Get Tweet detail
 * Path: /
 * Method: GET
 * Header: {Authorization?: Bearer <access_token>}
 * Body: None
 */
tweetsRouter.get(
  '/:tweet_id',
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifiedUserValidator),
  tweetIdValidator,
  wrapRequestHandler(tweetControllers.getTweetController)
)

export default tweetsRouter
