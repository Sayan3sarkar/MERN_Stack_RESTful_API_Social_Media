const express = require('express');

const { body } = require('express-validator');

const router = express.Router();

const feedController = require('../controllers/feed');

const isAuth = require('../middleware/is-auth');

router.get('/posts', isAuth, feedController.getPosts); //GET feed/posts

router.post('/post', [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 })
    ],
    isAuth,
    feedController.createPost); //POST feed/posts

router.get('/post/:postId', isAuth, feedController.getPost); //GET Single Post

router.put('/post/:postId', [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 })
    ],
    isAuth,
    feedController.updatePost); //Update Single Post

router.delete('/post/:postId', isAuth, feedController.deletePost); //Delete Single Post

module.exports = router;