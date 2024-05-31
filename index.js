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
server.listen(3000, () =>
    {
        console.log("Server running on port 3000");
        serverclass = new Server();
    });
    function shuffle(array)
    {
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
class Server
{
	constructor()
	{
		this.games = {};
	}
}
class Game
{
	constructor(gameid, player)
	{
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
	PlayerJoin(player)
	{
		var thisgame = this;
		wss.clients.forEach(function(connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({type: "playerjoined", playername: player})); });
		this.players.push(player);
		if (this.players.length == PLAYER_LIMIT)
		{
			this.StartGame();
		}
	}
	StartGame()
	{
		var thisgame = this;
		this.gamestarted = true;
		this.turnqueue = shuffle([...this.players]);
		wss.clients.forEach(function(connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({type: "startgame", turnqueue: thisgame.turnqueue, whosturn: thisgame.whosturn})); });
	}
	EndTurn()
	{
		console.log("end turn!");
		if (this.whosturn == this.turnqueue.length - 1)
		{
			console.log("round end!!!");
			this.EndRound();
			return;
		}
		this.whosturn++;
		if (this.eliminated.includes(this.turnqueue[this.whosturn]))
		{
			this.EndTurn();
			return;
		}
		var thisgame = this;
		this.monsterplacedthisturn = false;
		wss.clients.forEach(function(connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({type: "nextturn", whosturn: thisgame.whosturn})); });
	}
	EndRound()
	{
		this.monsterplacedthisturn = false;
		var thisgame = this;
		this.monsters.forEach(monster => monster.isactive = true);
		this.round++;
		var laststand = thisgame.players.filter(n => !thisgame.eliminated.includes(n))
		this.turnqueue = shuffle(laststand);
		this.whosturn = 0;
		wss.clients.forEach(function(connection) { if (thisgame.players.includes(connection.playername)) connection.send(JSON.stringify({type: "nextround", turnqueue: thisgame.turnqueue})); });
	}
}
