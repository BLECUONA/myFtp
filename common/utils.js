import chalk from 'chalk'


export function argv(){
    return process.argv.splice(2)
}

export function log(string, color='magenta', withNewLine=true){
    let toReturn = chalk[color](string);
    if(withNewLine){
        console.log(toReturn);
    } else {
        process.stdout.write(toReturn);
    }
}

const unloggedCommands = [
    'USER',
    'PASS',
    'HELP',
    'QUIT'
]

const loggedCommands = [
    'PWD',
    'LIST',
    'CWD',
    'RETR',
    'STOR'
]

export function isAllowedCommand(cmd){
    return unloggedCommands.includes(cmd.toUpperCase());
}

export function isAllowLoggedCommands(cmd){
    return loggedCommands.includes(cmd.toUpperCase()) || unloggedCommands.includes(cmd.toUpperCase());
}