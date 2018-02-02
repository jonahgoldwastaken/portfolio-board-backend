let pastMovements = []

const init = (firebase, fbConfig, io) => {
    initialiseSocket(io, firebase)
    firebase.initializeApp(fbConfig)
    firebase.database().ref('/').on('value', snapshot => updateData(io, snapshot))
}

const resetLists = io => {
    pastMovements = []
    io.emit('resetApp')
    io.emit('serverMessage', 'Lijsten gereset!')
}

const updateData = (io, snapshot) => {
    const appContent = snapshot.val()
    io.emit('updateApp', appContent)
    io.emit('serverMessage', 'Nieuwe content ingeladen')
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

        socket.on('reset', () => resetLists(io))
    })
}

module.exports = init