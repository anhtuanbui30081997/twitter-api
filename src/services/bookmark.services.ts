import databaseService from './database.services'
import { ObjectId, WithId } from 'mongodb'
import Bookmark from '~/models/schemas/Bookmark.schema'

class BookmarkServices {
  async bookmarkTweetService(user_id: string, tweetId: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweetId)
      },
      {
        $setOnInsert: new Bookmark({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweetId)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return result
  }

  async unBookmarkTweetService(user_id: string, tweetId: string) {
    const result = await databaseService.bookmarks.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweetId)
    })
    return result
  }

  async unBookmarkTweetByIdService(bookmark_id: string) {
    const result = await databaseService.bookmarks.findOneAndDelete({
      _id: new ObjectId(bookmark_id)
    })
    return result
  }
}
const bookmarkServices = new BookmarkServices()
export default bookmarkServices
