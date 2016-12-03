const bcrypt = require('bcrypt-nodejs')
    , mongoose = require('mongoose')
    , autoIncrement = require('mongoose-auto-increment')

//_________________________________________________________ User Schema
autoIncrement.initialize(mongoose.connection)

var usersSchema = mongoose.Schema({
  id: Number,
  pseudonyme: String,
  email: String,
  password: String,
  firstname: String,
  lastname: String,
  teamId: Number,
  createdAt: Number,
  updatedAt: Number
})

usersSchema.plugin(autoIncrement.plugin,{
    model: 'users',
    field: 'id',
    startAt: 1
})

var users = mongoose.model('users', usersSchema)

//_________________________________________________________ User functions

/**
 * That module export allows to manage the todos's data in mongodb
 *
 * @function {function} count - Count the number of users
 * @function {function} countUser - Count the number of users in a team
 * @function {function} getAll - Get all the data of the users
 * @function {function} get - Get the data of a user
 * @function {function} getCurrentUser - Get the data of the current user
 * @function {function} insert - Insert a user in the database
 * @function {function} update - Update a user in the database
 * @function {function} remove - Delete a user of the database
 */

module.exports = {
  get: (userId) => {

    return users.findOne({'id': userId })
  },

  getCurrentUser: (pseudonyme) => {

    return users.findOne({'pseudonyme': pseudonyme })
  },

  count: () => {

    return users.count()
  },

  countUser: (teamId) => {

    return users.find({'teamId': teamId }).count()
  },

  getAll: (limit, offset) => {

    return users.find().skip(offset).limit(limit)
  },

  insert: (params) => {

    result = new users({
      pseudonyme: params.pseudonyme,
      email: params.email,
      password: bcrypt.hashSync(params.password),
      firstname: params.firstname,
      lastname: params.lastname,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime()
    })

    return result.save()
  },

  update: (userId, params) => {
    const POSSIBLE_KEYS = ['pseudonyme', 'email', 'password', 'firstname', 'lastname', 'teamId']

    let queryArgs = {}

    for (key in params) {
      if (~POSSIBLE_KEYS.indexOf(key)) {
        if (key === 'password') queryArgs[key] = bcrypt.hashSync(params[key])
        else queryArgs[key] = params[key]
      }
    }

    queryArgs['updatedAt'] = Date.now()

    if (!queryArgs) {
      let err = new Error('Bad request')
      err.status = 400
      return Promise.reject(err)
    }

    return users.update({id: userId}, {$set: queryArgs}).exec()
  },

  remove: (userId) => {

    return users.find({'id': userId}).remove().exec()
  }
}
