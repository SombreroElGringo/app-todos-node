const router = require('express').Router()
const sqlite = require('sqlite')


/**
 *
 *  {GET} '/' - redirect on the main page
 */

router.get('/', function(req, res, next) {
  
  res.render('index', {
                        title: 'Post-it, do-it!',
                        token: req.cookies.accessToken
                      }
  )
})

module.exports = router
