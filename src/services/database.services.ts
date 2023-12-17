import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb'
import User from '~/models/schemas/User.schema'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'

config()
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter-dev.gpxotri.mongodb.net/?retryWrites=true&w=majority`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    // Create a MongoClient with a MongoClientOptions object to set the Stable API version
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    })
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await this.client.connect()
      // Send a ping to confirm a successful connection
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async indexUsers() {
    const exists = await this.users.indexExists(['email_1_password_1', 'email_1', 'username_1'])
    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }
  async indexRefreshToken() {
    const exists = await this.users.indexExists(['token_1', 'exp_1'])
    if (!exists) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex({ exp: 1 }, { expireAfterSeconds: 0 })
    }
  }
  async indexFollowers() {
    const exists = await this.users.indexExists(['user_id_1_followed_user_id_1'])
    if (!exists) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }
  }
  async indexVideoStatus() {
    const exists = await this.users.indexExists(['name_1'])
    if (!exists) {
      this.videoStatus.createIndex({ name: 1 })
    }
  }

  get users() {
    return this.db.collection<User>(process.env.DB_USERS_COLLECTION as string)
  }
  get refreshTokens() {
    return this.db.collection<RefreshToken>(process.env.DB_REFRESH_TOKEN_COLLECTION as string)
  }
  get followers() {
    return this.db.collection<Follower>(process.env.DB_FOLLOWERS_COLLECTION as string)
  }
  get videoStatus() {
    return this.db.collection<VideoStatus>(process.env.DB_VIDEO_STATUS_COLLECTION as string)
  }
  get tweets() {
    return this.db.collection<Tweet>(process.env.DB_TWEETS_COLLECTION as string)
  }
  get hashtags() {
    return this.db.collection<Hashtag>(process.env.DB_HASHTAGS_COLLECTION as string)
  }
}

// Tao object tu DatabaseService
const databaseService = new DatabaseService()
export default databaseService
