import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import Like from '~/models/schemas/Like.schema'

class LikeServices {
  async likeTweetService(user_id: string, tweet_id: string) {
    console.log('tweet_id', tweet_id)
    const result = await databaseService.likes.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id)
      },
      {
        $setOnInsert: new Like({
          user_id: new ObjectId(user_id),
          tweet_id: new ObjectId(tweet_id)
        })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )
    return result
  }

  async unLikeTweetService(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndDelete({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
    return result
  }
}

const likeServices = new LikeServices()
export default likeServices
