const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')


const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectorypath = path.join(__dirname,'../public')

app.use(express.static(publicDirectorypath))

let count = 0
io.on('connection', (socket)=> {
    console.log('new web socket connection')
    
    socket.on('join', (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options})
        if(error) {
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData',{ room: user.room, users: getUsersInRoom(user.room)})
        callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(msg)) {
            return callback('Profanity not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username, msg))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message',generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData',{ room: user.room, users: getUsersInRoom(user.room)})
        }
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationmessage', generateLocationMessage(user.username, location))
        callback()
    })
})

server.listen(3000, () => {
    console.log(`Server is listeing on port ${port}!`)
})
