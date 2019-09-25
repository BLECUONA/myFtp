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

    prompt() {
        log(">>> ", "white", false)
        const rl = readLine.createInterface({
            input: process.stdin
        })
        rl.on('line', (input) => {
            this.socket.write(input)

            let [cmd, ...args] = input.split(" ");
            if (cmd == "RETR") this.retrieveData({filename: args[0]});

            rl.close();
        })
    }


    // retrieveData(filename) {
    retrieveData({filename}) {
        let remote_server;

        let dataSocket = remote_server ? net.connect(8000, remote_server) : net.connect(8000);

        let dirname = "client/receivedFiles/";
        if (!fs.existsSync(dirname)) fs.mkdirSync(dirname);

        let ostream = fs.createWriteStream(`client/receivedFiles/${filename}`);

        let date = new Date(), size = 0, elapsed;

        dataSocket.on('data', chunk => {
            size += chunk.length;
            elapsed = new Date() - date;
            dataSocket.write(`${(size / (1024 * 1024)).toFixed(2)} MB of data was sent. Total elapsed time is ${elapsed / 1000} s\n`)
            process.stdout.write(`${(size / (1024 * 1024)).toFixed(2)} MB of data was sent. Total elapsed time is ${elapsed / 1000} s\n`);
            ostream.write(chunk);
        });

        dataSocket.on("end", () => {
            console.log(`\nFinished getting file. speed was: ${((size / (1024 * 1024)) / (elapsed / 1000)).toFixed(2)} MB/s`);
            ostream.close();
            process.exit();
        });
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
