const router = require('express').Router()
const Todo  = require('../models/todo')
const Session = require('../models/session')
const User = require('../models/user')


/**
 *	Todos: Get todos
 *
 *  {GET} '/' - Get all the todos of the users and redirect on the todos page (index)
 */

router.get('/', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Todos (GET)')

	/* Get params or set them as default */
	let limit = parseInt(req.query.limit) || 20
	let offset = parseInt(req.query.offset) || 0

	if (limit < 1) limit = 1
	else if (limit > 100) limit = 100

	if (offset < 0) offset = 0

	Session.getCurrentSession(req.cookies.accessToken).then((currentSession) =>{

		if(!currentSession) {
			res.format({
				html: () => {

					res.redirect(301, '/sessions' )
				},
				json: () => {
					res.send({
						status: 'error',
						data: null
					})
				}
			})
		}
		else {

			User.get(currentSession.userId).then((currentUser) => {
				Promise.all([
					Todo.getAll(currentSession.userId, limit, offset),
					Todo.getAllTeamTodos( currentUser.teamId, limit, offset),
					Todo.count(),
					Todo.countTeamTodos(currentUser.teamId),
					User.getAll(limit, offset)
				]).then((result) => {
					res.format({
						html: () => {
							res.render('todos/index', {
								title: 'Todos list',
								todos: result[0],
								teamTodos: result[1],
								countUserTodos: result[2],
								countTeamTodos: result[3],
								users: result[4],
								limit: limit,
								offset: offset,
								token: req.cookies.accessToken
							})
						},
						json: () => {
							res.send({
								data: {
									userTodos: result[0],
									teamTodos: result[1]
								},
								meta: {
									count: result[1].count,
									offset: offset,
									limit: limit
								}
							})
						}
					})
				}).catch(next)
			}).catch(next)
		}
	}).catch(next)
})


/**
 *	Todos: Get todos
 *
 *  {GET} '/id' - Get a todo by id and redirect on the todo page (show)
 */

router.get('/:id(\\d+)', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Get todo by id')

	Promise.all([
		Todo.get(req.params.id),
		User.getAll(1000,0)
	]).then((result) => {
        if(!result) return next()

        res.format({
            html: () => {
                res.render('todos/show', {
                    title: 'Todo informations',
                    todo: result[0],
										users: result[1],
                    token: req.cookies.accessToken
                })
            },
            json: () => {
                res.send({
                    status: 'success',
                    data: result[0],
                    message: null
                })
            }
        })
	}).catch(next)
})


/**
 *	Todos: Get edit
 *
 *  {GET} '/id/edit' - Redirect on the form for edit a todo by id (edit)
 */

router.get('/:id(\\d+)/edit', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Edit user by id')
    res.format({
        html: () => {
					Promise.all([
            Todo.get(req.params.id),
						User.getAll(1000,0)
					]).then((result) => {
                var sess = req.session
                res.render('todos/edit', {
                    title: "Edition of the todo n°" + result[0].id ,
                    path: "/todos/"+req.params.id+"/?_method=PUT",
                    todo: result[0],
										users: result[1],
                    flash: sess.flash,
                    token: req.cookies.accessToken
                })
                sess.flash = {}
            }).catch(next)
        },
        json: () => {
            let err = new Error('Bad Request')
            err.status = 400
            next(err)
        }
    })
})


/**
 *	Todos: Post todo
 *
 *  {POST} '/' - Insert a todo in the database & redirect the todos page (index).
 */

router.post('/', Session.isAuthenticated, (req, res, next) => {
  console.log('- Route => Todos (POST)')

  Session.getCurrentSession(req.cookies.accessToken).then((currentSession) =>{
    if(!currentSession) {

      res.format({
          html: () => {

              res.redirect(301, '/sessions' )
          },
          json: () => {
              res.send({
                  status: 'error',
                  data: null,
                  message: errorList
              })
          }
      })
    }
    else {

      Todo.insert(currentSession.userId).then((result) => {
          res.format({
              html: () => {
                  res.redirect(301, '/todos')
              },
              json: () => {
                  res.send({
                      status: 'success',
                      data: result,
                      message: null
                  })
              }
          })
      }).catch(next)
    }
  }).catch(next)
})


/**
 *	Todos: Post team's todo
 *
 *  {POST} '/team' - Insert a todo in the database & redirect the todos page (index).
 */

router.post('/team', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Todos team (POST)')

	Session.getCurrentSession(req.cookies.accessToken).then((currentSession) =>{
		if(!currentSession) {

			res.format({
				html: () => {

					res.redirect(301, '/sessions' )
				},
				json: () => {
					res.send({
						status: 'error',
						data: null,
						message: errorList
					})
				}
			})
		}
		else {
			User.get(currentSession.userId).then((currentUser) => {
				Todo.insert(currentSession.userId, currentUser.teamId ).then((result) => {
					res.format({
						html: () => {
							res.redirect(301, '/todos')
						},
						json: () => {
							res.send({
								status: 'success',
								data: result,
								message: null
							})
						}
					})
				}).catch(next)
			}).catch(next)
		}
	}).catch(next)
})


/**
 *	Todos: Update todo checked
 *
 *  {PUT} '/id/checked/completedAt' - Close a todo & redirect the todos page (index).
 */

router.put('/:id(\\d+)/checked/:completedAt', Session.isAuthenticated, (req, res, next) => {
	console.log(`- Route => Update checked todos by id`)

  Todo.check(req.params.id, req.params.completedAt).then((result) => {
      res.format({
          html: () => {

              res.redirect(301, '/todos')
          },
          json: () => {
              res.send({
                  status: 'success',

                  data: result,
                  message: null
              })
          }
      })
  }).catch(next)
})


/**
 *	Todos: Update todo
 *
 *  {PUT} '/id' - Update a todo & redirect the todos page (index).
 */

router.put('/:id', Session.isAuthenticated, (req, res, next) => {
	console.log(`- Route => Update todo by id`)

  Todo.update(req.params.id, req.body).then((result) => {
      res.format({
          html: () => {
              res.redirect(301, '/todos')
          },
          json: () => {
              res.send({
                  status: 'success',
                  data: result,
                  message: null
              })
          }
      })
  }).catch(next)
})


/**
 *	Todos : Delete todo
 *
 *  {DELETE} '/id' - Delete a todo by id and redirect on todos page (index)
 */

router.delete('/:id(\\d+)', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Delete todo by id')

	Todo.remove(req.params.id).then((result) => {
        res.format({
            html: () => {
                res.redirect(301, '/todos')
            },
            json: () => {
                res.set(`Content-Type`, 'application/json')
                res.send({
                    status: 'success',
                    data: result,
                    message: null
                })
            }
        })
	}).catch(next)
})

module.exports = router
