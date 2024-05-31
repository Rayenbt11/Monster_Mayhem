var board = document.getElementById("board");
var thisplayername = prompt("Enter your name:");
document.querySelector("#player_name").innerHTML = "Logged as: " + thisplayername;
var connection = new WebSocket("ws://localhost:3000?name=" + thisplayername);
var game;
var thisplayerturn = false;
class Monster {
    constructor(player, monsterclass, pos) {
        this.player = player;
        this.monsterclass = monsterclass;
        this.pos = [];
    }
}
connection.onmessage = function (evt) {
    var message = JSON.parse(evt.data);
    console.log(message);
    switch (message.type) {
        case "ingame":
            game = message.game;
            if (game.players.length != 4) document.querySelector("#game_info").innerHTML = "Waiting for players...";
            var gameplayers = document.createElement("table");
            gameplayers.className = "gameplayers";
            var gameidrow = gameplayers.insertRow();
            gameidrow.innerHTML = "Game ID: " + game.gameid;
            var legendrow = gameplayers.insertRow();
            legendrow.style.fontWeight = "bold";
            for (var cols = 0; cols < 2; cols++) {
                var column = legendrow.insertCell();
                switch (cols) {
                    case 0:
                        column.innerHTML = "Player Name";
                        break;
                    case 1:
                        column.innerHTML = "Lifes left";
                        break;
                }
            }
            for (var player = 0; player < 4; player++) {
                var playerrow = gameplayers.insertRow();
                for (var cols = 0; cols < 2; cols++) {
                    var column = playerrow.insertCell();
                    if (game.players.length < player + 1) continue;
                    switch (cols) {
                        case 0:
                            column.innerHTML = "Player " + (player + 1) + ": " + game.players[player];
                            break;
                        case 1:
                            column.innerHTML = (game.eliminated.includes(game.players[player]) ? "Eliminated" : game.lifesleft[player]);
                            break;
                    }
                }
            }
            document.body.appendChild(gameplayers);
            for (var rows = 0; rows < 10; rows++) {
                var row = board.insertRow();
                for (var cols = 0; cols < 10; cols++) {
                    var column = row.insertCell();
                    column.setAttribute("pos", cols + "," + rows);
                    if (cols == 0) column.classList.add("player4");
                    if (rows == 0) column.classList.add("player1");
                    if (cols == 9) column.classList.add("player2");
                    if (rows == 9) column.classList.add("player3");
                    console.log((game.players.indexOf(thisplayername) + 1));
                    column.addEventListener("drop", function (evt) {
                        if (this.classList.contains("droparea")) connection.send(JSON.stringify({ type: "makemove", monsterpos: evt.dataTransfer.getData("monster").split(",").map(pos => Number(pos)), topos: this.getAttribute("pos").split(",").map(pos => Number(pos)) }));
                    });
                    column.addEventListener("dragover", function (evt) {
                        evt.preventDefault();
                    });
                    if (!column.classList.contains("player" + (game.players.indexOf(thisplayername) + 1))) continue;
                    column.addEventListener("click", function (evt) {
                        if (!thisplayerturn || game.monsterplacedthisturn || game.eliminated.includes(thisplayername) || this.querySelector("monster")) return;
                        var monstertype = prompt("Place Monster:\nEnter ['V' for Vampire], ['W' for Werewolf], ['G' for Ghost]");
                        if (["V", "W", "G"].includes(monstertype)) connection.send(JSON.stringify({ type: "placemonster", monsterpos: this.getAttribute("pos").split(",").map(pos => Number(pos)), monstertype: monstertype }));
                    });
                }
            }
            if (game.gamestarted == true) {
                var roundturnsqueuetable = document.createElement("table");
                roundturnsqueuetable.className = "roundturnsqueuetable";
                var infotr = roundturnsqueuetable.insertRow();
                var infotd = infotr.insertCell();
                infotd.innerHTML = "This round (" + game.round + ") turns queue:";
                for (var player = 0; player < game.turnqueue.length; player++) {
                    var playerrow = roundturnsqueuetable.insertRow();
                    var column = playerrow.insertCell();
                    column.innerHTML = game.turnqueue[player];
                }
                document.body.appendChild(roundturnsqueuetable);
                if (game.turnqueue[game.whosturn] == thisplayername) {
                    thisplayerturn = true;
                    document.querySelector("#game_info").innerHTML = "<button onclick = 'endTurn()'>End Turn</button>";
                }
                else document.querySelector("#game_info").innerHTML = game.turnqueue[game.whosturn] + "'s turn...";
            }
            game.monsters.forEach(monster => {
                var monsterelement = document.createElement("monster");
                console.log(monster.player);
                console.log(game.players.indexOf(monster.player));
                monsterelement.className = "player" + (game.players.indexOf(monster.player) + 1);
                monsterelement.innerHTML = monster.monstertype;
                monsterelement.setAttribute("isactive", monster.isactive);
                if (monster.player == thisplayername) monsterelement.setAttribute("draggable", "true");
                document.querySelector("td[pos='" + monster.pos.join(",") + "']").appendChild(monsterelement);
                monsterelement.addEventListener("dragstart", function (evt) {
                    if (!thisplayerturn || evt.target.getAttribute("isactive") == "false" || game.eliminated.includes(thisplayername)) return;
                    document.querySelectorAll("td[pos]").forEach(td => {
                        if (td.getAttribute("pos") != evt.target.parentNode.getAttribute("pos")) {
                            var diagonalpos = [[-1, -1], [-2, -2], [-1, 1], [-2, 2], [1, 1], [2, 2], [1, -1], [2, -2]];
                            if (td.getAttribute("pos").split(",").map(pos => Number(pos))[0] == evt.target.parentNode.getAttribute("pos").split(",").map(pos => Number(pos))[0]) td.classList.add("droparea");
                            if (td.getAttribute("pos").split(",").map(pos => Number(pos))[1] == evt.target.parentNode.getAttribute("pos").split(",").map(pos => Number(pos))[1]) td.classList.add("droparea");
                            diagonalpos.forEach(pos => {
                                if (evt.target.parentNode.getAttribute("pos").split(",").map(pos => Number(pos))[0] + pos[0] == td.getAttribute("pos").split(",").map(pos => Number(pos))[0] && evt.target.parentNode.getAttribute("pos").split(",").map(pos => Number(pos))[1] + pos[1] == td.getAttribute("pos").split(",").map(pos => Number(pos))[1]) td.classList.add("droparea");
                            });
                        }
                    });
                    evt.dataTransfer.setData("monster", evt.target.parentNode.getAttribute("pos"));
                });
                monsterelement.addEventListener("dragend", function (evt) {
                    document.querySelectorAll("td.droparea").forEach(td => {
                        td.classList.remove("droparea");
                    });
                });
            });
            break;
        case "playerjoined":
            console.log(document.querySelectorAll(".gameplayers tr"));
            var playerrow = document.querySelectorAll(".gameplayers tr")[game.players.length + 2];
            game.players.push(message.playername);
            playerrow.querySelectorAll("td").forEach((td, index) => {
                switch (index) {
                    case 0:
                        td.innerHTML = "Player " + game.players.length + ": " + message.playername;
                        break;
                    case 1:
                        td.innerHTML = game.lifesleft[game.players.indexOf(message.playername)];
                        break;
                }
            });
            break;
        case "startgame":
            if (!game) break;
            game.gamestarted = true;
            game.whosturn = message.whosturn;
            game.turnqueue = message.turnqueue;
            var roundturnsqueuetable = document.createElement("table");
            roundturnsqueuetable.className = "roundturnsqueuetable";
            var infotr = roundturnsqueuetable.insertRow();
            var infotd = infotr.insertCell();
            infotd.innerHTML = "This round (" + game.round + ") turns queue:";
            for (var player = 0; player < 4; player++) {
                var playerrow = roundturnsqueuetable.insertRow();
                var column = playerrow.insertCell();
                column.innerHTML = game.turnqueue[player];
            }
            document.body.appendChild(roundturnsqueuetable);
            if (game.turnqueue[game.whosturn] == thisplayername) {
                thisplayerturn = true;
                document.querySelector("#game_info").innerHTML = "<button onclick = 'endTurn()'>End Turn</button>";
            }
            else {
                document.querySelector("#game_info").innerHTML = game.turnqueue[game.whosturn] + "'s turn...";
                thisplayerturn = false;
            }
            break;
        case "usedname":
            alert("Entered name is used by other player, reload page and enter different one.");
            break;
        case "placemonster":
            game.monsters.push(message.monster);
            game.monsterplacedthisturn = true;
            var monsterelement = document.createElement("monster");
            console.log(message.monster.player);
            console.log(game.players.indexOf(message.monster.player));
            monsterelement.className = "player" + (game.players.indexOf(message.monster.player) + 1);
            monsterelement.setAttribute("isactive", "false");
            if (message.monster.player == thisplayername) monsterelement.setAttribute("draggable", "true");
            monsterelement.innerHTML = message.monster.monstertype;
            document.querySelector("td[pos='" + message.monster.pos.join(",") + "']").appendChild(monsterelement);
            monsterelement.addEventListener("dragstart", function (evt) {
                if (!thisplayerturn || evt.target.getAttribute("isactive") == "false" || game.eliminated.includes(thisplayername)) return;
                document.querySelectorAll("td[pos]").forEach(td => {
                    if (td.getAttribute("pos") != evt.target.parentNode.getAttribute("pos")) {
                        var diagonalpos = [[-1, -1], [-2, -2], [-1, 1], [-2, 2], [1, 1], [2, 2], [1, -1], [2, -2]];
                        if (td.getAttribute("pos").split(",").map(pos => Number(pos))[0] == evt.target.parentNode.getAttribute("pos").split(",").map(pos => Number(pos))[0]) td.classList.add("droparea");
                        if (td.getAttribute("pos").split(",").map(pos => Number(pos))[1] == evt.target.parentNode.getAttribute("pos").split(",").map(pos => Number(pos))[1]) td.classList.add("droparea");
                        diagonalpos.forEach(pos => {
                            if (evt.target.parentNode.getAttribute("pos").split(",").map(pos => Number(pos))[0] + pos[0] == td.getAttribute("pos").split(",").map(pos => Number(pos))[0] && evt.target.parentNode.getAttribute("pos").split(",").map(pos => Number(pos))[1] + pos[1] == td.getAttribute("pos").split(",").map(pos => Number(pos))[1]) td.classList.add("droparea");
                        });
                    }
                });
                evt.dataTransfer.setData("monster", evt.target.parentNode.getAttribute("pos"));
            });
            monsterelement.addEventListener("dragend", function (evt) {
                document.querySelectorAll("td.droparea").forEach(td => {
                    td.classList.remove("droparea");
                });
            });
            break;
        case "nextturn":
            game.whosturn = message.whosturn;
            game.monsterplacedthisturn = false;
            if (game.turnqueue[game.whosturn] == thisplayername) {
                thisplayerturn = true;
                document.querySelector("#game_info").innerHTML = "<button onclick = 'endTurn()'>End Turn</button>";
            }
            else {
                document.querySelector("#game_info").innerHTML = game.turnqueue[game.whosturn] + "'s turn...";
                thisplayerturn = false;
            }
            break;
        case "nextround":
            game.monsterplacedthisturn = false;
            game.monsters.forEach(monster => monster.isactive = true);
            console.log(document.querySelectorAll("monster[isactive='false']"));
            document.querySelectorAll("monster[isactive='false']").forEach(monster => monster.setAttribute("isactive", "true"));
            game.round++;
            game.turnqueue = message.turnqueue;
            game.whosturn = 0;
            var roundturnsqueuetable = document.querySelector("table.roundturnsqueuetable");
            roundturnsqueuetable.innerHTML = "";
            var infotr = roundturnsqueuetable.insertRow();
            var infotd = infotr.insertCell();
            infotd.innerHTML = "This round (" + game.round + ") turns queue:";
            for (var player = 0; player < game.turnqueue.length; player++) {
                var playerrow = roundturnsqueuetable.insertRow();
                var column = playerrow.insertCell();
                column.innerHTML = game.turnqueue[player];
            }
            if (game.turnqueue[game.whosturn] == thisplayername) {
                thisplayerturn = true;
                document.querySelector("#game_info").innerHTML = "<button onclick = 'endTurn()'>End Turn</button>";
            }
            else {
                document.querySelector("#game_info").innerHTML = game.turnqueue[game.whosturn] + "'s turn...";
                thisplayerturn = false;
            }
            break;
        case "elimination":
            game.eliminated.push(message.player);
            document.querySelectorAll(".gameplayers tr")[game.players.indexOf(message.player) + 2].querySelectorAll("td")[1].innerHTML = "Eliminated";
            break;
        case "gameover":
            alert("Game over: " + message.result);
            window.location.reload();
            break;
        case "remove":
            var deletedmonster = game.monsters.find(monster => monster.pos[0] == message.monsterpos[0] && monster.pos[1] == message.monsterpos[1]);
            game.lifesleft[game.players.indexOf(deletedmonster.player)]--;
            document.querySelectorAll(".gameplayers tr")[game.players.indexOf(deletedmonster.player) + 2].querySelectorAll("td")[1].innerHTML = game.lifesleft[game.players.indexOf(deletedmonster.player)];
            game.monsters.splice(game.monsters.indexOf(deletedmonster), 1);
            document.querySelector("td[pos='" + message.monsterpos.join(",") + "'] > monster").remove();
            break;
        case "move":
            game.monsters.find(monster => monster.pos[0] == message.monsterpos[0] && monster.pos[1] == message.monsterpos[1]).pos = message.topos;
            document.querySelector("td[pos='" + message.monsterpos.join(",") + "'] > monster").setAttribute("isactive", "false");
            document.querySelector("td[pos='" + message.topos.join(",") + "']").appendChild(document.querySelector("td[pos='" + message.monsterpos.join(",") + "'] > monster"));
            break;
    }
}

