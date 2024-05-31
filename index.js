const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
var serverclass;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
server.listen(3000, () => {
    console.log("Server running on port 3000");
    serverclass = new Server();
});
//shuffle function used for turn order between players
function shuffle(array) {
    var newarray = array;
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [newarray[currentIndex], newarray[randomIndex]] = [
            newarray[randomIndex], newarray[currentIndex]];
    }
    return newarray;
}
const PLAYER_LIMIT = 4;
class Server {
    constructor() {
        this.games = {};
    }
}
//class for managing each game
class Game {
    constructor(gameid, player) {
        this.gameid = gameid;
        this.players = [player];
        this.monsters = [];
        this.gamestarted = false;
        this.round = 1;
        this.whosturn = 0;
        this.turnqueue = [];
        this.eliminated = [];
        this.monsterplacedthisturn = false;
        this.lifesleft = [1, 1, 1, 1];
    }

    //method for adding a player to the game
    PlayerJoin(player) {
        var thisgame = this;
        wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "playerjoined", playername: player })); });
        this.players.push(player);
        if (this.players.length == PLAYER_LIMIT) {
            this.StartGame();
        }
    }
    //method for starting the game
    StartGame() {
        var thisgame = this;
        this.gamestarted = true;
        this.turnqueue = shuffle([...this.players]);
        wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "startgame", turnqueue: thisgame.turnqueue, whosturn: thisgame.whosturn })); });
    }
    //method for ending the turn
    EndTurn() {
        console.log("end turn!");
        if (this.whosturn == this.turnqueue.length - 1) {
            console.log("round end!!!");
            this.EndRound();
            return;
        }
        this.whosturn++;
        if (this.eliminated.includes(this.turnqueue[this.whosturn])) {
            this.EndTurn();
            return;
        }
        var thisgame = this;
        this.monsterplacedthisturn = false;
        wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "nextturn", whosturn: thisgame.whosturn })); });
    }
    //method for ending the round
    EndRound() {
        this.monsterplacedthisturn = false;
        var thisgame = this;
        this.monsters.forEach(monster => monster.isactive = true);
        this.round++;
        var laststand = thisgame.players.filter(n => !thisgame.eliminated.includes(n))
        this.turnqueue = shuffle(laststand);
        this.whosturn = 0;
        wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "nextround", turnqueue: thisgame.turnqueue })); });
    }
}

//monster class for managing each monster
class Monster {
    constructor(gameid, player, pos, type) {
        this.gameid = gameid;
        this.player = player;
        this.pos = pos;
        this.isactive = false;
        this.monstertype = type;
        serverclass.games[gameid].monsterplacedthisturn = true;
    }
    //method for moving the monster to new position depending on the monsters
    Move(topos) {
        console.log("move");
        var thisgame = serverclass.games[this.gameid];
        var thismonster = this;
        this.isactive = false;
        if (thisgame.monsters.find(monster => monster.pos[0] == topos[0] && monster.pos[1] == topos[1])) {
            var interaction = thisgame.monsters.find(monster => monster.pos[0] == topos[0] && monster.pos[1] == topos[1]);
            if (interaction.monstertype == this.monstertype) {
                wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "remove", monsterpos: thismonster.pos })); });
                wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "remove", monsterpos: interaction.pos })); });
                thisgame.monsters.splice(thisgame.monsters.indexOf(thismonster), 1);
                thisgame.monsters.splice(thisgame.monsters.indexOf(interaction), 1);
                thisgame.lifesleft[thisgame.players.indexOf(interaction.player)]--;
                thisgame.lifesleft[thisgame.players.indexOf(thismonster.player)]--;
                CheckEliminations();
                return;
            }
            if (interaction.monstertype == "V" && this.monstertype == "W") {
                wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "remove", monsterpos: thismonster.pos })); });
                thisgame.monsters.splice(thisgame.monsters.indexOf(thismonster), 1);
                thisgame.lifesleft[thisgame.players.indexOf(thismonster.player)]--;
                CheckEliminations();
                return;
            }
            if (interaction.monstertype == "W" && this.monstertype == "V") {
                wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "remove", monsterpos: interaction.pos })); });
                thisgame.monsters.splice(thisgame.monsters.indexOf(interaction), 1);
                thisgame.lifesleft[thisgame.players.indexOf(interaction.player)]--;
            }
            if (interaction.monstertype == "W" && this.monstertype == "G") {
                wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "remove", monsterpos: thismonster.pos })); });
                thisgame.monsters.splice(thisgame.monsters.indexOf(thismonster), 1);
                thisgame.lifesleft[thisgame.players.indexOf(thismonster.player)]--;
                CheckEliminations();
                return;
            }
            if (interaction.monstertype == "G" && this.monstertype == "W") {
                wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "remove", monsterpos: interaction.pos })); });
                thisgame.monsters.splice(thisgame.monsters.indexOf(interaction), 1);
                thisgame.lifesleft[thisgame.players.indexOf(interaction.player)]--;
            }
            if (interaction.monstertype == "V" && this.monstertype == "G") {
                wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "remove", monsterpos: interaction.pos })); });
                thisgame.monsters.splice(thisgame.monsters.indexOf(interaction), 1);
                thisgame.lifesleft[thisgame.players.indexOf(interaction.player)]--;
            }
            if (interaction.monstertype == "G" && this.monstertype == "V") {
                wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "remove", monsterpos: thismonster.pos })); });
                thisgame.monsters.splice(thisgame.monsters.indexOf(thismonster), 1);
                thisgame.lifesleft[thisgame.players.indexOf(thismonster.player)]--;
                CheckEliminations();
                return;
            }
        }
///sending the move to all players
        wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "move", monsterpos: thismonster.pos, topos: topos })); });
        this.pos = topos;
        //function for checking the eliminations
        function CheckEliminations() {
            thisgame.players.forEach((player, index) => {
                console.log(thisgame.lifesleft[index]);
                if (thisgame.lifesleft[index] == 0) {
                    thisgame.eliminated.push(player);
                    wss.clients.forEach(function (connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "elimination", player: player })); });
                }
            });
            if (thisgame.eliminated.length > 2) {
                var laststand = thisgame.players.filter(n => !thisgame.eliminated.includes(n));
                if (laststand.length == 0) var result = "Draw";
                else var result = laststand[0] + " won!";
                wss.clients.forEach(function (connection) {
                    if (thisgame.players.includes(connection.playername)) {
                        connection.send(JSON.stringify({ type: "gameover", result: result }));
                        connection.terminate();
                    }
                });
                delete serverclass.games[thisgame.gameid];
                return;
            }
        }
    }
}
//websocket connection
wss.on('connection', (connection, info) => {
    if (Array.from(wss.clients).find(connection => connection.playername == info.url.split("?name=")[1])) {
        connection.send(JSON.stringify({ type: "usedname" }));
        connection.terminate();
        return;
    }
    connection.playername = info.url.split("?name=")[1];
    connection.playergame = Object.values(serverclass.games).find(game => game.players.includes(connection.playername));
    if (connection.playergame != null) {
        connection.send(JSON.stringify({ type: "ingame", game: connection.playergame }));
    }
    console.log(connection.playername);
    connection.on('message', (message) => {
        var parsedMessage = JSON.parse(message);
        switch (parsedMessage.type) {
            case "joingame":
                if (serverclass.games.hasOwnProperty(parsedMessage.gameid)) serverclass.games[parsedMessage.gameid].PlayerJoin(connection.playername);
                else serverclass.games[parsedMessage.gameid] = new Game(parsedMessage.gameid, connection.playername);
                connection.playergame = serverclass.games[parsedMessage.gameid];
                connection.send(JSON.stringify({ type: "ingame", game: connection.playergame }));
                break;
            case "placemonster":
                if (connection.playergame == null) break;
                var thismonster = new Monster(connection.playergame.gameid, connection.playername, parsedMessage.monsterpos, parsedMessage.monstertype);
                connection.playergame.monsters.push(thismonster);
                wss.clients.forEach(function (connection) { if (connection.playergame.players.includes(connection.playername)) connection.send(JSON.stringify({ type: "placemonster", monster: thismonster })); });
                break;
            case "makemove":
                if (connection.playergame == null) break;
                if (connection.playergame.monsters.find(monster => monster.pos[0] == parsedMessage.monsterpos[0] && monster.pos[1] == parsedMessage.monsterpos[1])) connection.playergame.monsters.find(monster => monster.pos[0] == parsedMessage.monsterpos[0] && monster.pos[1] == parsedMessage.monsterpos[1]).Move(parsedMessage.topos);
                break;
            case "endturn":
                if (connection.playergame == null) break;
                connection.playergame.EndTurn();
                break;
        }
    });
    connection.on('close', () => {
        console.log('Client disconnected');
    });
});

