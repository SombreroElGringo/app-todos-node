const router = require('express').Router()


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
