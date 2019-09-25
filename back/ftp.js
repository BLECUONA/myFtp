import dbUser from '../config/db.json'
import path from 'path'
import fs from 'fs'
import { isAllowedCommand, isAllowLoggedCommands } from '../common/utils'
import { Server } from './server'
import { exec } from 'child_process'

class FtpServer extends Server {

    constructor() {
        super()
        this.port = 3000;
        this.ROOT_FTP_DIRECTORY = path.join(process.cwd(), 'share')
    }

    start() {
        super.create(this.port, (socket) => {
            console.log("Socket connected")
            socket.setEncoding('ascii')

            socket.on('close', () => {
                console.log('Socket disconnected')
            })

            socket.on('data', (data) => {

                data = data.trim()
                let [cmd, ...args] = data.split(' ')
                console.log(cmd, args)
                cmd = cmd.toLowerCase()

                if ((!socket.session || !socket.session.isConnected) && !isAllowedCommand(cmd)) {
                    socket.write(`This command is not implemented or you need to be logged to use ${cmd}`);
                    return
                }

                if (!isAllowLoggedCommands(cmd)) {
                    socket.write(`This command is not implemented: <${cmd}>`);
                    return
                }

                this[cmd](socket, ...args)
            })
        })
    }

    quit(socket) {
        socket.end()
    }

    help(socket) {
        const str = `
This server configuration let you use this command :
-  USER 
-  PASS 
-  LIST
-  CWD
-  RETR 
-  STOR 
-  PWD
-  HELP
-  QUIT
`;
        socket.write(str)
    }

    user(socket, username) {
        const user = dbUser.find(user => user.username === username)

        if (!user) {
            socket.write("Need an account to login")
        } else {
            socket.session = {
                username,
                isConnected: false
            }

            socket.write(`Username <${username}> ok -- need password`)
        }
    }

    pass(socket, password) {
        if (!socket.session) {
            socket.write("Enter user first")
            return
        }

        const user = dbUser.find(user => socket.session.username === user.username)

        if (user.password === password) {
            socket.session.isConnected = true
            this.checkDir(socket, user.username)
            socket.write("Password accepted, you're logged")
        } else {
            socket.write("Password rejected")
        }
    }

    pwd(socket) {
        socket.write(socket.session.pwd)
    }

    list(socket) {
        let root_dir = socket.session.directory.split('/')
        root_dir.pop()
        const user_current_dir = socket.session.pwd
        exec(`ls -l ${path.join(root_dir.join('/'), user_current_dir)}`, (e, stdout, stderr) => {
            socket.write(stdout)
        })
    }

    cwd(socket, directory) {
        if (directory != '..'){
            const temp_dir = path.join(socket.session.pwd, directory)
            let root_dir = socket.session.directory.split('/')
            root_dir.pop()
            const temp_dir_root = path.join(root_dir.join('/'), temp_dir)

            if(fs.existsSync(temp_dir_root)){
                socket.session.pwd = temp_dir
                socket.write(`Change directory to ${temp_dir}`)
            } else {
                socket.write(`This directory doesn't exist, please use MKDIR`)
            }
        } else {
            let temp_dir = socket.session.pwd
            if (path.join('/', socket.session.username) == temp_dir){
                socket.write("You're on the top of your directory")
            } else {
                temp_dir = temp_dir.split('/')
                temp_dir.pop()
                socket.session.pwd = temp_dir.join('/')
                socket.write(`Change directory to ${socket.session.pwd}`)
            }
        }
    }

    checkDir(socket, username) {
        const tmpPath = path.join(this.ROOT_FTP_DIRECTORY, username)
        if (!fs.existsSync(tmpPath)) {
            fs.mkdirSync(tmpPath)
        }

        socket.session.directory = tmpPath
        socket.session.pwd = `/${username}`
    }
}

let ftpServer = new FtpServer()
ftpServer.start()