import express from 'express'
import logger from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@libsql/client'



//creacion de servidor web socket , se creo un servidor http utilizado
// la app de espress, al web socket se le paso el servidor http
import {Server} from 'socket.io'
import {createServer} from 'node:http'
import { Socket } from 'node:dgram'

dotenv.config()

const port = process.env.PORT ?? 3000

const app = express()
const server = createServer(app)
const io = new Server(server, {
    connectionStateRecovery: {}
})

const db = createClient({
    url: 'libsql://chat-aherrera.turso.io',
    authToken: process.env.db_token 
})

await db.execute(`
    CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT
    )
`)

io.on('connection', (socket) => {
    console.log('a user has connected!')

    socket.on('disconnect', () => {
        console.log(' an user has disconected')

    })

    socket.on('chat message', async (msg) => {
        //console.log('message: ' + msg)  // muestra en la consola el mensaje
        let result
        try {
            result = await db.execute({
                sql: 'INSERT INTO messages (content) VALUES (:msg)',
                args: { msg }
            })
        } catch (e) {
          console.error(e)
          return

        }
        io.emit('chat message', msg, result.lastInsertRowid.toString())
    })
})

app.use(logger('dev'))

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/client/index.html')
    
})


// se cambia de app.listen a server.listen, se escuchara al server no a la aplicacion
server.listen(port, () =>{
    console.log('Server Running  on port ${port}')
})