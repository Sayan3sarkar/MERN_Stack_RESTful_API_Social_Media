const { validationResult } = require('express-validator');

const fs = require('fs');

const path = require('path');

const Post = require('../models/post');

const User = require('../models/user');

exports.getPosts = async(req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;

    try {
        const totalItems = await Post.find().countDocuments();
        const posts = await Post.find()
            .populate('creator')
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        res.status(200).json({ message: 'Fetched posts successfully', posts: posts, totalItems: totalItems })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.createPost = async(req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty) {
        const error = new Error('Invalid Input');
        error.statusCode = 422;
        throw error;
        // return res.status(422).json({ message: 'Invalid Input', errors: errors.array() });
    }
    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path; //multer generated variable named 'path' which holds path to the file as stored in server
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title: title,
        content: content,
        creator: req.userId,
        imageUrl: imageUrl
    });
    try {
        await post.save();
        const user = await User.findById(req.userId); //req.userId can be obtained since we store it from the decodetoken in the isAuth middleware
        user.posts.push(post); //Pushing Newly created post to the posts property(defined in user model) of a new user
        await user.save();
        res.status(201).json({
            message: 'post created successfully',
            post: post,
            creator: { _id: user._id, name: user.name }
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getPost = async(req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId)
        if (!post) {
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Post fetched', post: post });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
}

exports.updatePost = async(req, res, next) => {
    let postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty) {
        const error = new Error('Invalid Input');
        error.statusCode = 422;
        throw error;
    }
    let title = req.body.title;
    let content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No File Picked');
        error.statusCode = 422;
        throw error;
    }
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not Authorized');
            error.statusCode = 403;
            throw error;
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.content = content;
        post.imageUrl = imageUrl;
        const result = await post.save();
        res.status(200).json({ message: 'Post successfully updated', post: result });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.deletePost = async(req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            const error = new Error('Could not find post');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not Authorized');
            error.statusCode = 403;
            throw error;
        }
        //Check logged in user
        clearImage(post.imageUrl);
        await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        user.posts.pull(postId);
        await user.save()
        res.status(200).json({ message: 'Post Deleted' });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};