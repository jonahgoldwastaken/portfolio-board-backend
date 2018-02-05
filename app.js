const app = require('express')()
const cors = require('cors')
const bodyParser = require('body-parser')

require('dotenv').config({ path: './.env' })
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const firebase = require('firebase')
const socketHandler = require('./socket')

app.use(cors({ credentials: true, origin: process.env.ORIGIN || 'https://localhost:8080' }))
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/signin', (req, res) => {
    const id_token = req.body.idtoken
    const credential = firebase.auth.GoogleAuthProvider.credential(id_token)

    firebase.auth().signInWithCredential(credential)
        .then(response => res.json(response.email))
        .catch(error => console.error(error))
})

app.get('/signout', (req, res) => {
    firebase.auth().signOut()
        .then(() => res.status(200).send({ success: true }))
        .catch(() => res.status(200).send({ success: false }))
})

socketHandler(firebase, {
    apiKey: process.env.FIREBASE_APIKEY,
    authDomain: process.env.FIREBASE_AUTHDOMAIN,
    databaseURL: process.env.FIREBASE_DBURL
}, io)

http.listen(process.env.PORT || 3000, () => {
    console.info('Server listening at port 3000')
})