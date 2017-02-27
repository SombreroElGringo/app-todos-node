const ioRedis = require('ioredis')
const redis = new ioRedis({host: process.env.REDIS_HOST || 'localhost'})

/**
 * That module export allows to manage the sessions's data in redis
 *
 * @function {function} isAuthenticated - Check if the current user is logged, else the user is redirected on the loggin form
 * @function {function} getCurrentSession - Get the data of the current user in the database redis
 * @function {function} insert - Insert a session in redis with expire time
 * @function {function} remove - Delete a session of redis
 */

module.exports = {
  isAuthenticated: (req, res, next) => {

    if (req.accepts(['html', 'json']) == 'html') {

      if (req.cookies.accessToken == null){

        return res.redirect('/sessions')
      } else {

        module.exports.getCurrentSession(req.cookies.accessToken).then((result) => {

          var today = new Date().getTime()

          if (!result) {

            return res.redirect('/sessions')
          }
          else if ( result.expiresAt > today ) {

            return next()
          }
        }).catch(next)
      }
    } else {
      //Mode Json
      if (req.cookies.accessToken == null){

        let err = new Error('Not logged')
        err.status = 400
        next(err)
      } else {
        return next()
      }
    }
  },

  getCurrentSession: (token) => {

    var params = []
    return redis.smembers('sessions').then((results) => {
      let pipeline = redis.pipeline()
      var onlineUsers = results
      var userId= ""
      for (var i in onlineUsers) {
          pipeline.hmget('session:'+onlineUsers[i],"userId", "accessToken", "createdAt", "expiresAt") // on get les users grâce à la methode hmget
        }
        return pipeline.exec() // execute the pipeline
    }).then((res) => {
      for (var i in res) // get the data & return it in a array
      {
        let session = {
          userId: "",
          accessToken: "",
          createdAt: "",
          expiresAt: ""
        }
        attributeArray = res[i][1]
        if(token == attributeArray[1]){

          session. userId = attributeArray[0]
          session.accessToken = attributeArray[1]
          session.createdAt = attributeArray[2]
          session.expiresAt = attributeArray[3]
          return session
        }
      }
    })
  },

  insert: (params,token) => {

    let pipeline = redis.pipeline()
    // {pseudo, email} = {pseudo: pseudo, email: email} in ES6
    pipeline.hmset(`session:${params.id}`, {userId:params.id, accessToken:token, createdAt:new Date().getTime(), expiresAt:new Date().getTime()+3600000}) // insert request
    pipeline.expire(`session:${params.id}`, 3600)
    pipeline.sadd('sessions', params.id) // added in a list
    pipeline.expire(`sessions:${params.id}`, 3600)
    return pipeline.exec()
  },

  remove: (userId) => {

    let pipeline = redis.pipeline()
    pipeline.srem('sessions', userId)
    pipeline.del('session:'+userId)
    return pipeline.exec()
  }
}
