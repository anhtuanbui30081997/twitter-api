import { Router } from 'express'
import bookmarksControllers from '~/controllers/bookmarks.controllers'
import { tweetIdValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarksRoute = Router()

/**
 * Description. Bookmark Tweet
 * Path: /
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {tweet_id: string}
 */
bookmarksRoute.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarksControllers.bookmarkTweetController)
)

/**
 * Description. Unbookmark Tweet
 * Path: /:tweet_id
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: None
 */
bookmarksRoute.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarksControllers.unBookmarkTweetController)
)
/**
 * Description. Unbookmark tweet by bookmark id
 * Path: /:bookmark_id
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: None
 */
bookmarksRoute.delete(
  '/:bookmark_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarksControllers.unBookmarkTweetByIdController)
)

export default bookmarksRoute
