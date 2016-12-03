const router = require('express').Router()
const User = require('../models/user')
const Session = require('../models/session')
const bcrypt = require('bcrypt-nodejs')


/**
 *	Sessions: Authen user page
 *
 *  {GET} '/' - redirect on the sign in page
 */

router.get('/', (req, res, next) => {
	console.log('- Route => Sessions (GET)')
    res.format({
        html: () => {
            res.render('sessions/index', {
                title: 'Authentification'
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
 *	Sessions: POST route
 *
 *  {POST} '/' - Log a user, insert a access Token in the cookies of the user's browser and redirect him on the todos page
 */

router.post('/', (req, res, next) => {
  console.log('- Route => Sessions (POST)')
  if (
      !req.body.pseudonyme || req.body.pseudonyme == '' ||
      !req.body.password || req.body.password == ''
  ) {
      let err = new Error('Bad Request')
      err.status = 400
      return next(err)
  }

  User.getCurrentUser(req.body.pseudonyme).then((result) => {
		if(!result) {
	      let err = new Error('Bad Pseudonyme!')
	      err.status = 400
	      return next(err)
	  }
		bcrypt.compare(req.body.password, result.password, function(err, access) {
		  if(access == true){

				var token =''
				// Allows to generate a random accessToken
				require('crypto').randomBytes(48, function(err, buffer) {
					token = buffer.toString('hex')

					Session.insert(result, token).then(() => {

				    res.format({
				        html: () => {
									// Set a cookie 3600000 ms = 1hour
									res.cookie('accessToken', token, { maxAge: 3600000, httpOnly: true })
									res.redirect(301, '/todos')
				        },
				        json: () => {
									res.cookie('accessToken', token, { maxAge: 3600000, httpOnly: true })
									res.send({
										status: 'success',
										accessToken: token
									})
				        }
				    })
					}).catch(next)
				})
		  }else {
				let err = new Error('Bad Login!')
	      err.status = 400
	      return next(err)
		  }
		})
	}).catch(next)
})


/**
 *	Sessions: DELETE route
 *
 *  {DELETE} '/' - Delete a session
 */

router.delete('/', Session.isAuthenticated, (req, res, next) => {
	 console.log('- Route => Delete session by user\'s id (DELETE)')
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

			 var userId = currentSession.userId

			 if(!userId || userId == 0)
			 {
				 let err = new Error('Bad Request')
				 err.status = 400
				 return next(err)
			 }

			 Session.remove(userId).then((result) =>{

				 res.cookie('accessToken', '', {expires: new Date()})
				 res.format({
					 html: () => {
						 res.redirect(301, '/') },
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
		 }).catch(next)
	})

module.exports = router
