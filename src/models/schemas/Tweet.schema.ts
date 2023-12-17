import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enums'
import { Media } from '../Other'

interface TweetConstructer {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string //  chỉ null khi tweet gốc
  hashtags: ObjectId[]
  mentions: string[]
  medias: Media[]
  guest_views?: number
  user_views?: number
  created_at?: Date
  updated_at?: Date
}

export default class Tweet {
  _id?: ObjectId
  user_id: ObjectId
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | ObjectId //  chỉ null khi tweet gốc
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: Media[]
  guest_views: number
  user_views: number
  created_at: Date
  updated_at: Date
  constructor({
    _id,
    audience,
    content,
    guest_views,
    hashtags,
    medias,
    mentions,
    parent_id,
    type,
    user_id,
    user_views,
    created_at,
    updated_at
  }: TweetConstructer) {
    const now = new Date()
    this._id = _id
    this.audience = audience
    this.content = content
    this.guest_views = guest_views || 0
    this.hashtags = hashtags
    this.medias = medias
    this.mentions = mentions.map((item) => new ObjectId(item))
    this.parent_id = parent_id ? new ObjectId(parent_id) : null
    this.user_id = user_id
    this.user_views = user_views || 0
    this.type = type
    this.created_at = created_at || now
    this.updated_at = updated_at || now
  }
}