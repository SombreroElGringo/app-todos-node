const mongoose = require('mongoose')
    , autoIncrement = require('mongoose-auto-increment')

//_________________________________________________________ Team Schema
autoIncrement.initialize(mongoose.connection)

var teamsSchema = mongoose.Schema({
  id: Number,
  idAdmin: Number,
  teamName: String,
  description: String,
  nMembers: Number,
  createdAt: Number,
  updatedAt: Number
})

teamsSchema.plugin(autoIncrement.plugin,{
    model: 'teams',
    field: 'id',
    startAt: 1
})

var teams = mongoose.model('teams', teamsSchema)

//_________________________________________________________ Team functions

/**
 * That module export allows to manage the teams's data in mongodb
 *
 * @function {function} count - Count the number of teams
 * @function {function} getAll - Get all the data of the teams
 * @function {function} get - Get the data of a team
 * @function {function} getLast - Get the data of the last team inserted
 * @function {function} insert - Insert a team in the database
 * @function {function} update - Update a team in the database
 * @function {function} remove - Delete a team of the database
 */

module.exports = {

  count: () => {

    return teams.count()
  },

  getAll: (limit, offset) => {

    return teams.find().skip(offset).limit(limit)
  },

  get: (id) => {

    return teams.findOne({'id': id })
  },

  getLast: () => {

    return teams.findOne().sort('-LAST_MOD')
  },

  insert: (idAdmin, params) => {

    result = new teams({
      idAdmin: idAdmin,
      teamName: params.teamName,
      description: params.description,
      nMembers: 1,
      createdAt: new Date().getTime()
    })

    return result.save()
  },

  update: (id, params) => {

    const POSSIBLE_KEYS = ['teamName', 'nMembers', 'description']

    let queryArgs = {}

    for (key in params) {
      if (~POSSIBLE_KEYS.indexOf(key)) {
        queryArgs[key] = params[key]
      }
    }

    queryArgs['updatedAt'] = Date.now()

    if (!queryArgs) {
      let err = new Error('Bad request')
      err.status = 400
      return Promise.reject(err)
    }

    return teams.update({id: id}, {$set: queryArgs}).exec()
  },

  remove: (id) => {

    return teams.find({'id': id}).remove().exec()
  }
}
