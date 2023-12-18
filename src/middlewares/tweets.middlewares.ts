import { body, checkSchema } from 'express-validator'
import { Mediatype, TweetAudience, TweetType } from '~/constants/enums'
import { TWEET_MESSAGE } from '~/constants/messages'
import { numberEnumToArray } from '~/utils/common'
import { validate } from '~/utils/validation'
import { Request } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { TweetReqBody } from '~/models/requests/Tweet.request'
import { ObjectId } from 'mongodb'
import { isEmpty } from 'lodash'
import databaseService from '~/services/database.services'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaType = numberEnumToArray(Mediatype)

export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEET_MESSAGE.INVALID_TYPE
        }
      },
      audience: {
        isIn: {
          options: [tweetAudience],
          errorMessage: TWEET_MESSAGE.INVALID_AUDIENCE
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = (req as Request<ParamsDictionary, any, TweetReqBody>).body.type
            // Nếu 'type' là retweet, comment, quotetweet thi 'parent_id' phai là 'tweet_id' của tweet cha
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Retweet].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
            }
            // Neu type la tweet thi parent_id phai la null
            if (type === TweetType.Tweet && value !== null) {
              throw new Error(TWEET_MESSAGE.PARENT_ID_MUST_BE_NULL)
            }
            return true
          }
        }
      },
      content: {
        isString: {
          errorMessage: TWEET_MESSAGE.PARENT_ID_MUST_BE_A_VALID_TWEET_ID
        },
        custom: {
          options: (value, { req }) => {
            const type = (req as Request<ParamsDictionary, any, TweetReqBody>).body.type
            const hashtags = (req as Request<ParamsDictionary, any, TweetReqBody>).body.hashtags
            const mentions = (req as Request<ParamsDictionary, any, TweetReqBody>).body.mentions
            /**
             * Nếu `type` là retweet thì `content` phải là `''`.
             * Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng
             */
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
              isEmpty(hashtags) &&
              isEmpty(mentions) &&
              value === ''
            ) {
              throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
            }
            // Neu type la tweet thi parent_id phai la null
            if (type === TweetType.Retweet && value !== '') {
              throw new Error(TWEET_MESSAGE.CONTENT_MUST_BE_A_EMPTY_STRING)
            }
            return true
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          options: (value: any[], { req }) => {
            // Yeu cau moi phan tu trong array la string
            if (value.some((item) => typeof item !== 'string')) {
              throw new Error(TWEET_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
            }
            return true
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: (value: any[], { req }) => {
            // Yeu cau moi phan tu trong array la user_id
            if (value.some((item) => !ObjectId.isValid(item))) {
              throw new Error(TWEET_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID)
            }
            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value: any[], { req }) => {
            // Yeu cau moi phan tu trong array la Media Object
            if (
              value.some((item) => {
                return typeof item.url !== 'string' || !mediaType.includes(item.type)
              })
            ) {
              throw new Error(TWEET_MESSAGE.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: TWEET_MESSAGE.INVALID_TWEET_ID
              })
            }
            const tweet = await databaseService.tweets.findOne({
              _id: new ObjectId(value)
            })
            if (!tweet) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: TWEET_MESSAGE.TWEET_NOT_FOUND
              })
            }
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)
