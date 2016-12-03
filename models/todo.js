const mongoose = require('mongoose')
    , autoIncrement = require('mongoose-auto-increment')

//_________________________________________________________ Todo Schema
autoIncrement.initialize(mongoose.connection)

var todosSchema = mongoose.Schema({
  id: Number,
  authorId: Number,
  recipientId: Number,
  teamId: Number,
  subject: String,
  message: String,
  createdAt: Number,
  updatedAt: Number,
  completedAt: Number
})

todosSchema.plugin(autoIncrement.plugin,{
  model: 'todos',
  field: 'id',
  startAt: 1
})

var todos = mongoose.model('todos', todosSchema)

//_________________________________________________________ Todo functions

/**
 * That module export allows to manage the todos's data in mongodb
 *
 * @function {function} count - Count the number of todos
 * @function {function} countTeamTodos - Count the number of todos of your team
 * @function {function} getAll - Get all the data of the todos affected to you
 * @function {function} getAllTeamTodos - Get all the data of the todos affected to your team
 * @function {function} get - Get the data of a todo
 * @function {function} insert - Insert a todo in the database
 * @function {function} update - Update a todo in the database
 * @function {function} check - Complete a todo
 * @function {function} remove - Delete a todo of the database
 */

module.exports = {

  count: () => {

    return todos.count()
  },

  countTeamTodos: (teamId) => {

    return todos.find({'teamId': teamId }).count()
  },

  get: (todoId) => {

    return todos.findOne({'id': todoId })
  },

  getAll: (recipient, limit, offset) => {

    return todos.find({'recipientId': recipient }).sort({id: -1}).skip(offset).limit(limit)
  },

  getAllTeamTodos: (teamId, limit, offset) => {

    return todos.find({'teamId': teamId }).sort({id: -1}).skip(offset).limit(limit)
  },

  insert: (authorId, teamId) => {

    result = new todos({
      authorId: authorId,
      recipientId: authorId,
      teamId: teamId,
      subject: 'Subject',
      message: 'My text...',
      createdAt: new Date().getTime(),
      updatedAt: null,
      completedAt: null
    })

    return result.save()
  },

  check: (todoId, completedAt) => {

    if (completedAt == 'null') {

      return todos.update({id: todoId}, {$set: {completedAt: new Date().getTime()}}).exec()
    }
    else {

      return todos.update({id: todoId}, {$set: {completedAt: null}}).exec()
    }
  },

  update: (todoId, params) => {
    const POSSIBLE_KEYS = ['recipientId', 'subject', 'message']

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

    return todos.update({id: todoId}, {$set: queryArgs}).exec()
  },

  remove: (id) => {

    return todos.find({'id': id}).remove().exec()
  }
}
