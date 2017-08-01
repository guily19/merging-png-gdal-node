'use strict'
const fs = require('fs')
const config = require('./config')
import { Merger } from './merger'
// Get a reference to the Pub/Sub component
const pubsub = require('@google-cloud/pubsub')()
// Get a reference to the Cloud Storage component
const storage = require('@google-cloud/storage')()
const Buffer = require('safe-buffer').Buffer
const TEMPDIR = '/tmp/'

/**
 * Publishes the result to the given pubsub topic and returns a Promise.
 *
 * @param {string} topicName Name of the topic on which to publish.
 * @param {object} data The message data to publish.
 * @returns {Promise}
 */
function publishResult (topicName, data) {
  let options = {
    'raw': true
  }
  return pubsub.topic(topicName).publish(data,options)
}

/**
 * Translates text using the Google Translate API. Triggered from a message on
 * a Pub/Sub topic.
 *
 * @param {object} event The Cloud Functions event.
 * @param {object} event.data The Cloud Pub/Sub Message object.
 * @param {string} event.data.data The "data" property of the Cloud Pub/Sub
 * Message. This property will be a base64-encoded string that you must decode.
 */
exports.sentinel1AmpMerger = function merger (event) {
  console.log('> sentinel1AmpTiler')
  console.log('> event:')
  console.log(event)
  const pubsubMessageAtributtes = event.data.attributes
  console.log(pubsubMessageAtributtes)


  const srcName = pubsubMessageAtributtes.name
  const srcBucket = pubsubMessageAtributtes.bucket
  const timestamp = pubsubMessageAtributtes.timestamp
  const xCoordinate = pubsubMessageAtributtes.x
  const yCoordinate = pubsubMessageAtributtes.y
  const zCoordinate = pubsubMessageAtributtes.z
  const maxEast = pubsubMessageAtributtes.maxEast
  const minEast = pubsubMessageAtributtes.minEast
  const maxNorth = pubsubMessageAtributtes.maxNorth
  const minNorth = pubsubMessageAtributtes.minNorth
  
  // const tmpTileName = timestamp + 'z' + zCoordinate + 'x' + xCoordinate + 'y' + yCoordinate + '.png'
  const tileName = 'z' + zCoordinate + 'x' + xCoordinate + 'y' + yCoordinate + '.png'
  const tmpTifName = 'z' + zCoordinate + 'x' + xCoordinate + 'y' + yCoordinate + '.tif'

  return Promise.resolve()
    .then(() => {
      if (!srcBucket) {
        throw new Error('Bucket not provided. Make sure you have a "bucket" property in your request')
      }
      if (!srcName) {
        throw new Error('Name not provided. Make sure you have a "name" property in your request')
      }
      let file = storage.bucket(srcBucket).file(srcName)
      // console.log('srcBucket:',srcBucket,'srcName:',srcName)      
      return new Promise((resolve, reject) => {
        file.download({destination: '/tmp/' + tmpTifName})
          .then(() => {
            console.log('Tif downloaded')
            resolve('/tmp/' + tmpTifName)
          })
          .catch(() => {
            console.log('Error Downloading the image')
            reject('Error Downloading the image')
          })
      })
    })
    .then(srcTif => {
      console.log('> processFile')
      return new Promise((resolve, reject) => {
        let tmpTileName = TEMPDIR + tileName
        let tile = new Tiler()
        tile.sentinel1AmpTiler(srcTif, tmpTileName)
        resolve(tmpTileName)
      })
    })
    .then(tmpTileName => {
      const dstBucketName = config.RESULT_BUCKET
      const storeTileName = srcName.replace('tif','png')
      const tile = storage.bucket(dstBucketName).file(storeTileName)
      fs.createReadStream(tmpTileName)
        .pipe(tile.createWriteStream())
        .on('error', function (err) {
          console.log('Failed to save ' + storeTileName + ' to the Storage')
        })
        .on('finish', function () {
          console.log('Saved ' + storeTileName + ' to the Storage')
          const messageData = {
            name: storeTileName,
            timestamp: timestamp,
            dstBucketName: pubsubMessageAtributtes.bucket,
            x: pubsubMessageAtributtes.x,
            y: pubsubMessageAtributtes.y,
            z: pubsubMessageAtributtes.z,
            maxEast: pubsubMessageAtributtes.maxEast,
            minEast: pubsubMessageAtributtes.minEast,
            maxNorth: pubsubMessageAtributtes.maxNorth,
            minNorth: pubsubMessageAtributtes.minNorth
          }
        })
      let file = storage.bucket(srcBucket).file(srcName)    
      return new Promise((resolve, reject) => {
        file.delete()
          .then(() => {
            console.log(`gs://${srcBucket}/${srcName} deleted.`);
          })
          .catch(() => {
            console.log('Error delting the image')
            reject('Error delting the image')
          })
      })
    })
    .catch (err => {
      console.log('Err:',err)
    })
}
