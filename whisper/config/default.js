'use strict';

module.exports = {
  server: {
    listener: {
      port: 4001
    },
    queries: {
      limit: 25
    }
  },
  mongo: {
    uri: process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/radish34",
    bufferMaxEntries: 8,
    firstConnectRetryDelaySecs: 5
  }
};