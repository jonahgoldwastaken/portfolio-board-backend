let pastMovements = []

const init = (firebase, fbConfig, socket) => {
    initialiseSocket(socket, firebase)
    firebase.initializeApp(fbConfig)
    firebase.database().ref('/').on('value', snapshot => resetLists(socket, snapshot))
}

const resetLists = (io, snapshot) => {
    const dragDropContent = snapshot.val()
    io.emit('initApp', dragDropContent)
    io.emit('serverMessage', 'Lijsten gereset!')
}

const sendDBData = (socket, firebase) => {
    firebase.database().ref('/').once('value').then(snapshot => {
        const dragDropContent = snapshot.val()
        socket.emit('initApp', dragDropContent)
        for (let movement of pastMovements) {
            socket.emit('moveItem', movement)
        }
    })
}

const initialiseSocket = (io, firebase) => {
    io.on('connection', socket => {
        sendDBData(socket, firebase)
        socket.on('moveItem', positions => {
            pastMovements.push(positions)
            socket.broadcast.emit('moveItem', positions)
        })

        socket.on('reset', () => {
            firebase.database().ref('/').once('value').then(snapshot => resetLists(io, snapshot))
        })
    })
}

module.exports = init