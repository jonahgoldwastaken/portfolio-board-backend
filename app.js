const app = require('express')()
const fs = require('fs')
const cors = require('cors')
const bodyParser = require('body-parser')
const firebase = require('firebase')
const firebaseConfig = require('./firebase.config.json')

const options = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.crt'),
    requestCert: false,
    rejectUnauthorized: false
}

const https = require('https').createServer(options, app)

const io = require('socket.io')(https)
const dragDrop = io.of('/drag-drop')

let pastMovements = []

const init = function () {
    firebase.initializeApp(firebaseConfig)

    this.pastMovements = []

    dragDrop.on('connection', socket => {
        sendDBData(socket)

        socket.on('moveItem', positions => {
            pastMovements.push(positions)
            socket.broadcast.emit('moveItem', positions)
        })

        socket.on('reset', () => {
            firebase.database().ref('/').once('value').then(snapshot => resetLists(snapshot))
        })

    })
    
    firebase.database().ref('/').on('value', snapshot => resetLists(snapshot))
}

const resetLists = (snapshot) => {
    const dragDropContent = snapshot.val()
    pastMovements = []

    dragDrop.emit('initLists', dragDropContent)
    dragDrop.emit('serverMessage', 'Lijsten gereset!')
}

const sendDBData = function (socket) {
    firebase.database().ref('/').once('value').then(snapshot => {
        const dragDropContent = snapshot.val()

        socket.emit('initLists', dragDropContent)

        for (let movement of pastMovements) {
            socket.emit('moveItem', movement)
        }
    })
}

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.send('Wat doe jij hier?!')
})

app.post('/signin', (req, res) => {
    const id_token = req.body.idtoken
    const credential = firebase.auth.GoogleAuthProvider.credential(id_token)

    firebase.auth().signInWithCredential(credential)
        .then((response) => {
            res.json(response.email)
        })
        .catch((error) => {
            console.log(error)
        })

})

app.get('/signout', (req, res) => {
    firebase.auth().signOut().then(function () {
        res.status(200).send({ success: true })
    }).catch(function () {
        res.status(200).send({ success: false })
    })
})

https.listen(3000, () => {
    console.log('server started at port 3000')
    init()
})
