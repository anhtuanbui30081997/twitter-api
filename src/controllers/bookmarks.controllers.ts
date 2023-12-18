import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOOKMARK_MESSAGES } from '~/constants/messages'
import { BookmarkTweetReqBody } from '~/models/requests/Bookmark.request'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarkServices from '~/services/bookmark.services'

class BookmarksControllers {
  async bookmarkTweetController(req: Request<ParamsDictionary, any, BookmarkTweetReqBody>, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await bookmarkServices.bookmarkTweetService(user_id, req.body.tweet_id)
    return res.json({
      message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESSFULLY,
      result: result
    })
  }
  async unBookmarkTweetController(req: Request, res: Response) {
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await bookmarkServices.unBookmarkTweetService(user_id, req.params.tweet_id)
    return res.json({
      message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESSFULLY,
      result: result
    })
  }
  async unBookmarkTweetByIdController(req: Request, res: Response) {
    const result = await bookmarkServices.unBookmarkTweetByIdService(req.params.bookmark_id)
    return res.json({
      message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESSFULLY,
      result: result
    })
  }
}

const bookmarksControllers = new BookmarksControllers()
export default bookmarksControllers
