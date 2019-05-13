const express = require('express');
const cors = require('cors');
const nanoid = require('nanoid');
const app = express();
const users = require('./app/users');
const mongoose = require('mongoose');
const User = require('./models/User')
const Message = require('./models/Message')


const expressWs = require('express-ws')(app);

const port = 8000;

app.use(cors());
app.use(express.json());


mongoose.connect('mongodb://localhost/chat', { useNewUrlParser: true, useCreateIndex: true}).then(() => {
    app.use('/users', users);

    const activeConnections = {};

    app.ws('/chat', async (ws, req) => {
        if (!req.query.token) {
            return ws.close();
        }

        const user = await User.findOne({token: req.query.token});

        if (!user) {
            return ws.close();
        }

        const id = nanoid();
        console.log('client connected, id = ', id);
        activeConnections[id] = { ws, user };

        const usernames = Object.keys(activeConnections).map(connId => {
            const connection = activeConnections[connId];
            return connection.user.username;
        });

        ws.send(JSON.stringify({
            type: 'ACTIVE_USERS',
            usernames: usernames
        }));

        ws.send(JSON.stringify({
            type: 'LATEST_MESSAGES',
            messages: await Message.find().limit(30)
        }));

        let username = user.username;

        ws.on('message', msg => {
            const decodedMessage = JSON.parse(msg);
            console.log('client sent: ', decodedMessage);

            switch (decodedMessage.type) {
                case 'CREATE_MESSAGE':
                    const message = {
                        username,
                        text: decodedMessage.text
                    }
                    const messageToSend = JSON.stringify({
                        type: 'NEW_MESSAGE', message: {
                            username,
                            text: decodedMessage.text
                        }
                    });

                    const savedMessage = new Message(message);

                    savedMessage.save();

                    Object.keys(activeConnections).forEach(connId => {
                        const conn = activeConnections[connId].ws;
                        conn.send(messageToSend);
                    });

                    break;
                default:
                    console.log('Unknown message type:', decodedMessage.type);
            }
        });

        ws.on('close', msg => {
            console.log('client disconnected');
            delete activeConnections[id];
        })
    });

    app.listen(port, () => {
        console.log(`Server started on ${port} port`);
    });
});