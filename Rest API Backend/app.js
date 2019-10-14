const express = require('express');

const path = require('path');

const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const mongoose = require('mongoose');

const multer = require('multer');

const app = express();

const fileStorage = multer.diskStorage({ //multer file config
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => { //multer filetype filter
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(bodyParser.json()); // parses json data from incoming request

app.use(multer({ //multer middleware
    storage: fileStorage,
    fileFilter: fileFilter
}).single('image')); //informing multer that we'll extract a single file stored in a filed named 'image' in incoming request

app.use('/images', express.static(path.join(__dirname, 'images'))); //Creating an absoulte path to /images

app.use((req, res, next) => { //CORS Error Handling Middleware
    res.setHeader('Access-Control-Allow-Origin', '*'); //List of clients to be allowed to access server
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE'); //List of methods of client to be allowed to access server
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); //List of headers of client to be allowed to access server
    next();
})

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => { //error handling middleware
    console.log(error);
    const status = error.statusCode;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
})

mongoose.connect('***', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(8080);
    })
    .catch(err => console.log(err))