const router = require('express').Router()
const User = require('../models/user')
const Session = require('../models/session')


/**
 *	Users: Get users
 *
 *  {GET} '/' - Get all users and redirect on the users page (index)
 */

router.get('/', Session.isAuthenticated, (req, res, next) => {
    console.log('- Route => Users list')
    /* Get params or set them as default */
    let limit = parseInt(req.query.limit) || 20
    let offset = parseInt(req.query.offset) || 0

    if (limit < 1) limit = 1
    else if (limit > 100) limit = 100

    if (offset < 0) offset = 0

    req.session.flash = {}

    Promise.all([
        User.getAll(limit, offset),
        User.count()
    ]).then((result) => {
        res.format({
            html: () => {
                res.render('users/index', {
                    title: 'Users list',
                    users: result[0],
                    count: result[1],
                    limit: limit,
                    offset: offset,
                    token: req.cookies.accessToken
                })
            },
            json: () => {
                res.send({
                    data: result[0],
                    meta: {
                        count: result[1].count,
                        offset: offset,
                        limit: limit
                    }
                })
            }
        })
	}).catch(next)
})


/**
 *	Users: Get edit
 *
 *  {GET} '/id/edit' - Redirect on the form for update a user by id (edit)
 */

router.get('/:id(\\d+)/edit', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Edit user by id')
    res.format({
        html: () => {
            User.get(req.params.id).then((result) => {
                var sessionFlash = req.session.flash
                req.session.flash = {}
                res.render('users/edit', {
                    title: 'Edit user n°' + result.id ,
                    path: '/users/' + result.id + '?_method=PUT',
                    user: result,
                    flash: sessionFlash,
                    token: req.cookies.accessToken
                })
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
 *	Users: Get add
 *
 *  {GET} '/add' - Redirect on the form for add a user (edit)
 */

router.get('/add', (req, res, next) => {
	console.log('- Route => Add user (GET)')
    res.format({
        html: () => {
            var sessionFlash = req.session.flash
            req.session.flash = {}
            res.render('users/edit', {
                title: 'Adding a user',
                path: '/users',
                user: {},
                flash: sessionFlash
            })
        },
        json: () => {
            let err = new Error('Bad Request')
            err.status = 400
            next(err)
        }
    })
})


/**
 *	Users: Get user
 *
 *  {GET} '/id' - Get a user by id and redirect on the user page (show)
 */

router.get('/:id(\\d+)', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Get user by id')
	User.get(req.params.id).then((result) => {
        if(!result) return next()

        res.format({
            html: () => {
                res.render('users/show', {
                    title: 'User informations',
                    user: result,
                    token: req.cookies.accessToken
                })
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
 *	Users: Post user
 *
 *  {POST} '/' - Insert a user in the database & redirect the users page (index).
 */

router.post('/', (req, res, next) => {
	console.log('- Route => Add user (POST)')
    // Check the form to catch errors
    if(
        !req.body.pseudonyme || req.body.pseudonyme == '' ||
        !req.body.email || req.body.email == '' ||
        !req.body.firstname || req.body.firstname == '' ||
        !req.body.lastname || req.body.lastname == '' ||
        !req.body.password || req.body.password == '' ||
        !req.body.password_check || req.body.password_check == '' ||
        req.body.password != req.body.password_check ||
        (req.body.password.length > 0 && req.body.password.length < 8)
    ) {

        var errorList = []
        if(!req.body.pseudonyme || req.body.pseudonyme == '') { errorList.push('You did not enter your pseudonym.') }
        if(!req.body.email || req.body.email == '') { errorList.push('You have not entered your email address.') }
        if(!req.body.firstname || req.body.firstname == '') { errorList.push('You did not enter your firstname.') }
        if(!req.body.lastname || req.body.lastname == '') { errorList.push('You did not enter your lastname.') }
        if(!req.body.password || req.body.password == '' || !req.body.password_check || req.body.password_check == '') { errorList.push('You did not enter a password.') }
        if(req.body.password != req.body.password_check) { errorList.push('The two password are different.') }
        if(req.body.password.length > 0 && req.body.password.length < 8) { errorList.push('Your password must be longer than 8 characters.') }

        res.format({
            html: () => {

                var sess = req.session
                if(sess.flah && sess.flash.errorList) {
                    for (var msg in errorList) {
                      sess.flash.errorList.push(msg)
                    }
                } else if (sess.flash) {
                    sess.flash.errorList = errorList
                } else {
                    sess.flash = {'errorList': errorList}
                }

                res.redirect(301, '/users/add' )
            },
            json: () => {
                res.send({
                    status: 'error',
                    data: null,
                    message: errorList
                })
            }
        })
    } else {
        User.insert(req.body).then((result) => {
            res.format({
                html: () => {
                    res.redirect(301, '/users')
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
 *	Users: Update user
 *
 *  {PUT} '/id' - Update a user by id & redirect the users page (index).
 */

router.put('/:id', Session.isAuthenticated, (req, res, next) => {
	console.log(`- Route => Update User by id`)
    // Check the form to catch errors
    if(
        req.body.password != req.body.password_check ||
        (req.body.password.length > 0 && req.body.password.length < 8)
    ) {
        var errorList = []
        if(req.body.password != req.body.password_check) { errorList.push('The two password are different.') }
        if(req.body.password.length > 0 && req.body.password.length < 8) { errorList.push('Your password must be longer than 8 characters.') }

        res.format({
            html: () => {

                var sess = req.session
                if(sess.flah && sess.flash.errorList) {
                    for (var msg in errorList) {
                      sess.flash.errorList.push(msg)
                    }
                } else if (sess.flash) {
                    sess.flash.errorList = errorList
                } else {
                    sess.flash = {'errorList': errorList}
                }

                res.redirect(301, '/users/' + req.params.id + '/edit' ) },
            json: () => {
                res.send({
                    status: 'error',
                    data: null,
                    message: errorList
                })
            }
        })
    } else {
        User.update(req.params.id, req.body).then((result) => {
            res.format({
                html: () => {
                    res.redirect(301, '/users') },
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
 *	Users : Delete user
 *
 *  {DELETE} '/id' - Delete a user by id and redirect on users page (index)
 */

router.delete('/:id(\\d+)', Session.isAuthenticated, (req, res, next) => {
	console.log('- Route => Delete user by id')
	User.remove(req.params.id).then((result) => {
    res.format({
        html: () => {
            res.redirect(301, '/users')
        },
        json: () => {
            res.set(`Content-Type`, 'application/json')
            res.send({
                status: 'success',
                data: result[0],
                message: null
            })
        }
    })
	}).catch(next)
})

module.exports = router
