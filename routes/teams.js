const router = require('express').Router()
const Session = require('../models/session')
const Team = require('../models/team')
const User = require('../models/user')


/**
 *	Teams: Get the list of teams
 *
 *  {GET} '/' - Get all the teams and redirect on the teams page (index)
 */

router.get('/', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Teams (GET)')

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

			Promise.all([
				Team.getAll(limit, offset),
				Team.count(),
				User.get(currentSession.userId)
			]).then((result) => {
				res.format({
					html: () => {
						res.render('teams/index', {
							title: 'Teams list',
							teams: result[0],
							count: result[1],
							user: result[2],
							limit: limit,
							offset: offset,
							token: req.cookies.accessToken
						})
					},
					json: () => {
						res.send({
							data: result[0],
							meta: {
								count: result[1],
								offset: offset,
								limit: limit
							}
						})
					}
				})
			}).catch(next)
		}
	}).catch(next)
})


/**
 *	Teams: Get by id
 *
 *  {GET} '/id' - Get a team by id and redirect on the team page (show)
 */

router.get('/:id(\\d+)', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Get team by id')
	Promise.all([
		Team.get(req.params.id),
		User.getAll(1000,0)
	]).then((result) => {
        if(!result[0]) return next()

        res.format({
            html: () => {
                res.render('teams/show', {
                    title: 'Team informations',
                    team: result[0],
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
 *	Teams: Get add
 *
 *  {GET} '/add' - Redirect on the form for add a team (edit)
 */

router.get('/add', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Add team (GET)')
    res.format({
        html: () => {
            var sess = req.session
            res.render('teams/edit', {
                title: 'Adding a team',
                path: '/teams',
                team: {},
								message: 'Warning: You can create only one team!',
                flash: sess.flash,
								token: req.cookies.accessToken
            })
            sess.flash = {}
        },
        json: () => {
            let err = new Error('Bad Request')
            err.status = 400
            next(err)
        }
    })
})


/**
 *	Teams: Get edit
 *
 *  {GET} '/id/edit' - Redirect on the form for edit a team by id (edit)
 */

router.get('/:id(\\d+)/edit', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Edit team by id')
    res.format({
        html: () => {
            Team.get(req.params.id).then((result) => {
                var sess = req.session
                res.render('teams/edit', {
                    title: 'Edit team n°' + result.id ,
                    path: '/teams/' + result.id + '?_method=PUT',
                    team: result,
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
 *	Teams: Post team
 *
 *  {POST} '/' - Insert a team in the database & redirect the teams page (index). You can only create one team by user.
 */

router.post('/', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Teams (POST)')

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
			//Check if the user doesn't have already a team
			User.get(currentSession.userId).then((rlt) => {

				if (!rlt.teamId) {

					Team.insert(currentSession.userId, req.body).then((result) => {
						Team.getLast().then((result) => {
							if(!result.id){
								var params = {"teamId": 1}
							}else {
								var params = {"teamId": result.id}
							}

							User.update(currentSession.userId, params).then((result) => {

								res.format({
									html: () => {

										res.redirect(301, '/teams')
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
					}).catch(next)
				}else{

					res.format({
						html: () => {

							res.redirect(301, '/teams' )
						},
						json: () => {
							res.send({
								status: 'error',
								data: null
							})
						}
					})
				}
			}).catch(next)
		}
	}).catch(next)
})


/**
 *	Teams: Update team
 *
 *  {PUT} '/' - Update a team in the database & redirect the teams page (index).
 */

router.put('/:id(\\d+)', Session.isAuthenticated, (req, res, next) => {
	console.log(`- Route => Update team by id`)

	if(!req.body.teamName){

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

				User.get(currentSession.userId).then((user) => {
					if (req.params.id == user.teamId ) {
						var params = {
							"teamId": null
						}
					} else{
						var params = {
							"teamId": req.params.id
						}
					}

					User.update(currentSession.userId, params).then((result) => {

						Promise.all([
							User.countUser(req.params.id),
							User.countUser(user.teamId)
						]).then((n) => {

							params = {
								"nMembers": n[0]
							}
							var old_params = {
								"nMembers": n[1]
							}
							var promise = ''
							if (user.teamId == null) {
								promise = Promise.all([	Team.update(req.params.id, params)]);
							}else {
								promise = Promise.all([	Team.update(req.params.id, params), Team.update(user.teamId, old_params) ]);
							}

							promise.then((result) => {

								res.format({
									html: () => {
										res.redirect(301, '/teams')
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
					}).catch(next)
				}).catch(next)
			}
		}).catch(next)
	}else {

		Team.update(req.params.id, req.body).then((result) => {
			res.format({
				html: () => {
					res.redirect(301, '/teams')
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
})


/**
 *	Teams : Delete team
 *
 *  {DELETE} '/id' - Delete a team by id and redirect on teams page (index)
 */

router.delete('/:id(\\d+)', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Delete team by id')
	Promise.all([
		Team.get(req.params.id),
		Session.getCurrentSession(req.cookies.accessToken)
	]).then((result) => {

		if(!result[1]) {

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
		else if (result[0].idAdmin == result[1].userId) {

			Team.remove(req.params.id).then((result) => {
				res.format({
					html: () => {
						res.redirect(301, '/teams')
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
		}
		else {

			res.format({
				html: () => {
					res.redirect(301, '/teams')
				},
				json: () => {
					res.set(`Content-Type`, 'application/json')
					res.send({
						status: 'canceled',
						message: null
					})
				}
			})
		}
	}).catch(next)
})


module.exports = router
