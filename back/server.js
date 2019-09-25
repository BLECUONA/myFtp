import net from 'net'

export class Server {

    create(port, callback) {
        let instance = net.createServer(callback)

        instance.on('error', (e) => {
            console.error(e)
        })

        instance.on('close', () => {
            console.error("Server closed")
        })

        instance.listen(port, () => {
            console.error(`This server is listening on ${port} port`)
        })
    }

}