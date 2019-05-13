const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');


const users = require('./app/users');


const app = express();

app.use(cors);
app.use(express.json());


const port = 8000;

mongoose.connect('mongodb://localhost/chat', {useNewUrlParser: true, useCreateIndex: true}).then(() => {
    app.use('/users', users);

    app.listen(port, () => {
        console.log(`Server started on ${port} port`);
    })
})