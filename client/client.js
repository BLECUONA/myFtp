import net from 'net'
import { argv, log } from '../common/utils'
import readLine from 'readline'
import fs from 'fs'
import path from 'path'
import { isAllowedCommand, isAllowLoggedCommands } from '../common/utils'


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

    prompt() {
        log(">>> ", "white", false)
        const rl = readLine.createInterface({
            input: process.stdin
        })
        rl.on('line', (input) => {
            let [cmd, ...args] = input.split(" ");
            if (isAllowedCommand(cmd) || isAllowLoggedCommands(cmd)){
                this.socket.write(input)    
                if (cmd == "RETR"){
                        this.retrieveData({filename: args[0]});
                } 
            }

            rl.close();
        })
    }

    retrieveData({filename}) {
        let dirname = "client/receivedFiles/";
        if (!fs.existsSync(dirname)) fs.mkdirSync(dirname);
        
        let ostream = fs.createWriteStream(`client/receivedFiles/${filename}`);
        
        let date = new Date(), size = 0, elapsed;
        
        let dataSocket = net.connect(8000)

        dataSocket.on('data', chunk => {
            size += chunk.length;
            elapsed = new Date() - date;
            dataSocket.write(`${(size / (1024 * 1024)).toFixed(2)} MB of data was sent. Total elapsed time is ${elapsed / 1000} s\n`)
            process.stdout.write(`${(size / (1024 * 1024)).toFixed(2)} MB of data was sent. Total elapsed time is ${elapsed / 1000} s\n`);
            ostream.write(chunk);
        });

        dataSocket.on("end", () => {
            this.socket.write(`\nFinished getting file. speed was: ${((size / (1024 * 1024)) / (elapsed / 1000)).toFixed(2)} MB/s`);
            ostream.close();
        });
        dataSocket.on('error', () => {
            this.socket.write(`\nConnection failed`)
            ostream.close();
        })
    }
}

const args = argv()
if (args.length != 2) {
    log("Usage: client.js <host> <port>", "cyan");
    process.exit(0)
}

const [host, port] = args

const client = new FtpClient(host, port)
client.connect();
