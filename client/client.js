import net from 'net'
import { argv, log } from '../common/utils'
import readLine from 'readline'
import fs from 'fs'
import path from 'path'

class FtpClient {
    
    constructor(host, port) {
        this.host = host
        this.port = port
    }

    connect() {
        this.socket = net.createConnection({
            port: this.port,
            host: this.host
        }, () => {
            log('client connected', "cyan")
            this.isReady = true
            this.prompt()
        })

        this.socket.on('data', (data) => {
            log(data.toString(), "yellow")
            this.prompt()
        })

        this.socket.on('end', () => {
            log("client disconnected", "cyan")
            process.exit(0)
        })
    }

    prompt(){
        log(">>> ", "white", false)
        const rl = readLine.createInterface({
            input: process.stdin
        })
        rl.on('line', (input) => {
            this.socket.write(input)
            rl.close();
        })
    }
}

const args = argv()
if (args.length != 2){
    log("Usage: client.js <host> <port>", "cyan");
    process.exit(0)
}

const [host, port] = args

const client = new FtpClient(host, port)
client.connect()