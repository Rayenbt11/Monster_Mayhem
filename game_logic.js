var board = document.getElementById("board");
var thisplayername = prompt("Enter your name:");
document.querySelector("#player_name").innerHTML = "Logged as: " + thisplayername;
var connection = new WebSocket("ws://localhost:3000?name=" + thisplayername);
var game;
var thisplayerturn = false;
class Monster
{
	constructor(player, monsterclass, pos)
	{
		this.player = player;
		this.monsterclass = monsterclass;
		this.pos = [];
	}
}
