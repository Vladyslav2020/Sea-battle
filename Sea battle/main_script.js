let cnt = document.querySelector('canvas'),
	ctx = cnt.getContext('2d');
	
window.devicePixelRatio = 1;

const square_size = 20;
let mouse_down = false,
	game_start = false,
	moving_of = 1,
	cnt_pos,
	moving_ship = {
		index: -1,
		dx: 0,
		dy: 0
	},
	last_ship_index = -1,
	sea_battle_bot = {
		status: 'find',
		checking_directions: '',
		find_direct: ''
	};

class Field{
	constructor(x, y, cntX, cntY){
		this.posX = x;
		this.posY = y;
		this.cntX = cntX;
		this.cntY = cntY;
		this.map = [];
		this.ships = new Map();
		for (let i = 0; i < cntY; i++){
			this.map.push([]);
			for (let j = 0; j < cntX; j++)
				this.map[i].push(-1);
		}
	}
	paint(){
		let x = this.posX,
			y = this.posY;
		ctx.strokeStyle = '#3352FE';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.strokeRect(x * square_size, y * square_size, this.cntX * square_size, this.cntY * square_size);
		for (let i = 1; i < 11; i++){
			ctx.beginPath();
			ctx.fillStyle = '#3352FE';
			ctx.lineWidth = 2;
			ctx.font = square_size - 2 + 'px  Arial';
			ctx.textAlign = 'center';
			ctx.fillText(String(i), (x - 1) * square_size + square_size / 2, y * square_size + i * square_size - 2);
		}
		for (let i = 'a'.charCodeAt(0); i <= 'j'.charCodeAt(0); i++){
			ctx.beginPath();
			ctx.fillStyle = '#3352FE';
			ctx.lineWidth = 2;
			ctx.font = square_size - 2 + 'px  Arial';
			ctx.textAlign = 'center';
			ctx.fillText(String.fromCodePoint(i), x * square_size + (i - 'a'.charCodeAt(0)) * square_size + square_size / 2, (y) * square_size - 5);
		}
		ctx.fillStyle = 'red';
		ctx.strokeStyle = 'red';
		for (let i = 0; i < this.cntY; i++)
			for (let j = 0; j < this.cntX; j++){
				if (this.map[i][j] === -2){
					ctx.beginPath();
					ctx.arc(this.posX * square_size + j * square_size + square_size / 2, this.posY * square_size + i * square_size + square_size / 2, 3, 0, Math.PI * 2);
					ctx.fill();
				}
				if (this.map[i][j] - Math.floor(this.map[i][j] / 10) * 10 === 1){
					ctx.beginPath();
					ctx.moveTo(this.posX * square_size + j * square_size, this.posY * square_size + i * square_size);
					ctx.lineTo(this.posX * square_size + (j + 1) * square_size, this.posY * square_size + (i + 1) * square_size);
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(this.posX * square_size + (j + 1) * square_size, this.posY * square_size + i * square_size);
					ctx.lineTo(this.posX * square_size + j * square_size, this.posY * square_size + (i + 1) * square_size);
					ctx.stroke();
				}
			}
	}
	canInstallShip(ship){
		let x = ship.coordX,
			y = ship.coordY,
			count = ship.count;
		x = Math.round(x / square_size) - this.posX; y = Math.round(y / square_size) - this.posY;
		if (x < 0 || y < 0)
			return false;
		if (ship.direct === 0 && (x + count > this.cntX || y + 1 > this.cntY))
			return false;
		if (ship.direct !== 0 && (y + count > this.cntY || x + 1 > this.cntX))
			return false
		if (ship.direct === 0){
			for (let i = 0; i < count; i++)
				if (this.hasNearFill(x + i, y))
					return false
		}
		else{
			for (let i = 0; i < count; i++)
				if (this.hasNearFill(x, y + i))
					return false
		}
		return true;
	}
	installShip(ship, index){
		let x = ship.coordX,
			y = ship.coordY,
			count = ship.count;
		ship.install = 1;
		x = Math.round(x / square_size); y = Math.round(y / square_size);
		ship.coordX = x * square_size;
		ship.coordY = y * square_size;
		ship.posX = x;
		ship.posY = y;
		x -= this.posX; y -= this.posY;
		if (ship.direct === 0){
			for (let i = 0; i < count; i++)
				this.map[y][x + i] = index * 10;
		}
		else{
			for (let i = 0; i < count; i++)
				this.map[y + i][x] = index * 10;
		}
	}
	uninstall_ship(ship, index){
		ship.install = 0;
		for (let i = 0; i < this.cntY; i++)
			for (let j = 0; j < this.cntX; j++)
				if (Math.floor(this.map[i][j] / 10) === index)
					this.map[i][j] = -1;
	}
	hasNearFill(x, y){
	if (isValid(x - 1, y - 1, this.cntX, this.cntY) && this.map[y - 1][x - 1] != -1)
		return true;
	if (isValid(x - 1, y, this.cntX, this.cntY) && this.map[y][x - 1] != -1)
		return true;
	if (isValid(x - 1, y + 1, this.cntX, this.cntY) && this.map[y + 1][x - 1] != -1)
		return true;
	if (isValid(x, y - 1, this.cntX, this.cntY) && this.map[y - 1][x] != -1)
		return true;
	if (isValid(x, y, this.cntX, this.cntY) && this.map[y][x] != -1)
		return true;
	if (isValid(x, y + 1, this.cntX, this.cntY) && this.map[y + 1][x] != -1)
		return true;
	if (isValid(x + 1, y - 1, this.cntX, this.cntY) && this.map[y - 1][x + 1] != -1)
		return true;
	if (isValid(x + 1, y, this.cntX, this.cntY) && this.map[y][x + 1] != -1)
		return true;
	if (isValid(x + 1, y + 1, this.cntX, this.cntY) && this.map[y + 1][x + 1] != -1)
		return true;
	return false;
}
	clickOn(x, y){
		if (this.map[y][x] === -1)
			this.map[y][x] = -2;
		else 
		if (this.map[y][x] - Math.floor(this.map[y][x] / 10) * 10 === 0){
			this.map[y][x]++;
			let key = Math.floor(this.map[y][x] / 10), cnt = this.ships.get(key) - 1;
			this.ships.delete(key);
			this.ships.set(key, cnt);
			if (cnt !== 0)
				return 1;
			if (cnt === 0){
				this.kill(key);
				return 2;
			}
		}
		else
			return -1;
		return 0;
	}
	kill(index){
		this.arrShips[index].killed = true;
		for (let i = 0; i < this.cntY; i++)
			for (let j = 0; j < this.cntX; j++){
				if (Math.floor(this.map[i][j] / 10) === index){
					if (isValid(j - 1, i - 1, this.cntX, this.cntY) && this.map[i - 1][j - 1] === -1)
						this.map[i - 1][j - 1] = -2;
					if (isValid(j, i - 1, this.cntX, this.cntY) && this.map[i - 1][j] === -1)
						this.map[i - 1][j] = -2;
					if (isValid(j + 1, i - 1, this.cntX, this.cntY) && this.map[i - 1][j + 1] === -1)
						this.map[i - 1][j + 1] = -2;
					if (isValid(j - 1, i, this.cntX, this.cntY) && this.map[i][j - 1] === -1)
						this.map[i][j - 1] = -2;
					if (isValid(j + 1, i, this.cntX, this.cntY) && this.map[i][j + 1] === -1)
						this.map[i][j + 1] = -2;
					if (isValid(j - 1, i + 1, this.cntX, this.cntY) && this.map[i + 1][j - 1] === -1)
						this.map[i + 1][j - 1] = -2;
					if (isValid(j, i + 1, this.cntX, this.cntY) && this.map[i + 1][j] === -1)
						this.map[i + 1][j] = -2;
					if (isValid(j + 1, i + 1, this.cntX, this.cntY) && this.map[i + 1][j + 1] === -1)
						this.map[i + 1][j + 1] = -2;
				}
			}
	}
}


class Ship{
	constructor(x, y, cnt){
		this.posX = x;
		this.posY = y;
		this.initCoordX = x * square_size;
		this.initCoordY = y * square_size;
		this.coordX = this.initCoordX;
		this.coordY = this.initCoordY;
		this.killed = false;
		this.install = 0;
		this.count = cnt;
		this.direct = 0;
	}
	mouseHover(x, y){
		if (this.direct === 0){
			if (x >= this.coordX && x <= this.coordX + this.count * square_size && y >= this.coordY && y <= this.coordY + square_size)
				return true;
			else
				return false;
		}
		else{
			if (x >= this.coordX && x <= this.coordX + square_size && y >= this.coordY && y <= this.coordY + this.count * square_size)
				return true;
			return false;
		}
	}
	paint(){
		if (!this.killed)
			ctx.strokeStyle = '#3352FE';
		else
			ctx.strokeStyle = 'red';
		ctx.lineWidth = 3;
		if (this.direct === 0)
			ctx.strokeRect(this.coordX, this.coordY, this.count * square_size, square_size);
		else
			ctx.strokeRect(this.coordX, this.coordY, square_size, this.count * square_size);
	}
	change_dir(){
		if (this.direct === 0)
			this.direct = 1;
		else
			this.direct = 0;
	}
}

function isValid(x, y, maxX, maxY){
	if (x >= 0 && x < maxX && y >= 0 && y < maxY)
		return true;
	return false;
}

function chit(){
	setInterval(() => {for (let ship of enemy_ships) ship.paint();}, 1000);
}

function show_installing_ship(ship, index){
	let x = ship.coordX,
		y = ship.coordY,
		count = ship.count;
	x = Math.round(x / square_size); y = Math.round(y / square_size);
	if (gamer_field.canInstallShip(ship)){
		ctx.fillStyle = '#58D68D';
		if (ship.direct === 0){
			for (let i = 0; i < count; i++){
				ctx.beginPath();
				ctx.fillRect((x + i) * square_size, y * square_size, square_size, square_size);
			}
		}
		else{
			for (let i = 0; i < count; i++){
				ctx.beginPath();
				ctx.fillRect(x * square_size, (y + i) * square_size, square_size, square_size);
			}
		}
	}
	else{
		ctx.fillStyle = '#EC7063';
		if (ship.direct === 0){
			for (let i = 0; i < count; i++){
				if (isValid(x + i - gamer_field.posX, y - gamer_field.posY, gamer_field.cntX, gamer_field.cntY)){
					ctx.beginPath();
					ctx.fillRect((x + i) * square_size, y * square_size, square_size, square_size);
				}
				else
					break;
			}
		}
		else{
			for (let i = 0; i < count; i++){
				if (isValid(x - gamer_field.posX, y + i - gamer_field.posY, gamer_field.cntX, gamer_field.cntY)){
					ctx.beginPath();
					ctx.fillRect(x * square_size, (y + i) * square_size, square_size, square_size);
				}
				else
					break;
			}
		}
	}
	ship.paint();
}

function rotate_ship(){
	if (last_ship_index === -1)
		return;
	let ship = gamer_ships[last_ship_index];
	if (ship.install === 0)
		return;
	ship.change_dir();
	gamer_field.uninstall_ship(ship, last_ship_index);
	if (gamer_field.canInstallShip(ship)){
		gamer_field.installShip(ship, last_ship_index);
		reDraw();
	}
	else{
		show_installing_ship(ship, last_ship_index);
		ship.change_dir();
		gamer_field.installShip(ship, last_ship_index);
		setTimeout(reDraw, 200);
	}
}

function autoFill(field, ships){
	if (game_start)
		return;
	for (let i = 0; i < field.cntY; i++)
		for (let j = 0; j < field.cntX; j++)
			field.map[i][j] = -1;
	for (let i = 0; i < ships.length; i++)
		ships[i].install = 0;
	for (let i = 0; i < ships.length; i++){
		while(ships[i].install !== 1){
			let x = Math.floor(Math.random() * (field.cntX + 1)),
				y = Math.floor(Math.random() * (field.cntY + 1));
			ships[i].posX = field.posX + x;
			ships[i].posY = field.posY + y;
			ships[i].coordX = ships[i].posX * square_size;
			ships[i].coordY = ships[i].posY * square_size;
			if (field.canInstallShip(ships[i]))
				field.installShip(ships[i], i);
			else{
				ships[i].change_dir();
				if (field.canInstallShip(ships[i], i))
					field.installShip(ships[i], i);
			}
		}
	}
	reDraw();
}

function field_draw(cntX, cntY){
	cnt.width =	cntX * square_size;
	cnt.height = cntY * square_size;

	ctx.strokeStyle = '#C2CBFF';
	
	for (let i = 0; i < cntY; i++)
		for (let j = 0; j < cntX; j++){
			ctx.beginPath();
			ctx.strokeRect(j * square_size, i * square_size, square_size, square_size);
		}
	ctx.lineWidth = 2;
	ctx.strokeStyle = '#FE3333';
	ctx.beginPath();
	ctx.moveTo(0, square_size * 3 + 3);
	ctx.lineTo(cntX * square_size, square_size * 3 + 3);
	ctx.stroke();
}

function start_game(){
	if(game_start)
		return;
	for (let ship of gamer_ships)
		if (ship.install === 0){
			autoFill(gamer_field, gamer_ships);
			break;
		}
	for (let ship of gamer_ships)
		ship.install = 2;
	for (let ship of enemy_ships)
		ship.install = 2;
	enemy_ships.push(new Ship(0, 0, 4));
	for (let i = 0; i < 2; i++)
		enemy_ships.push(new Ship(0, 0, 3));
	for (let i = 0; i < 3; i++)
		enemy_ships.push(new Ship(0, 0, 2));
	for (let i = 0; i < 4; i++)
		enemy_ships.push(new Ship(0, 0, 1));
	autoFill(enemy_field, enemy_ships);
	for (let i = 0; i < enemy_ships.length; i++)
		enemy_field.ships.set(i, enemy_ships[i].count);
	enemy_field.arrShips = enemy_ships;
	game_start = true;
	reDraw();
}

function bot_move(){
	//console.log(sea_battle_bot.status);
	if (!game_start || moving_of == 1)
		return;
	let fl = true;
	let arr = [{dir: 'top', dx: 0, dy: -1}, {dir: 'left', dx: -1, dy: 0}, {dir: 'right', dx: 1, dy: 0}, {dir: 'down', dx: 0, dy: 1}];
	if (sea_battle_bot.status === 'find'){
		sea_battle_bot.find_direct = '';
		sea_battle_bot.checking_directions = '';
		let x, y, flag;
		do{
			x = Math.floor(Math.random() * gamer_field.cntX);
			y = Math.floor(Math.random() * gamer_field.cntY);
			flag = gamer_field.clickOn(x, y);
		}
		while(flag === -1)
		if (flag === 1){
			sea_battle_bot.status = 'determination of direction';
			sea_battle_bot.x = x;
			sea_battle_bot.y = y;
		}
		if (flag === 0)
			moving_of = 1;
	}
	else 
	if (sea_battle_bot.status === 'determination of direction'){
		let {x, y} = sea_battle_bot;
		for (let item of arr){
			if (!sea_battle_bot.checking_directions.includes(item.dir)){
				if (isValid(x + item.dx, y + item.dy, gamer_field.cntX, gamer_field.cntY)){
					let flag = gamer_field.clickOn(x + item.dx, y + item.dy);
					if (flag === 2)
						sea_battle_bot.status = 'find';
					if (flag === 1){
						sea_battle_bot.find_direct = item.dir;
						sea_battle_bot.x = x + item.dx;
						sea_battle_bot.y = y + item.dy;
						sea_battle_bot.status = 'found';
					}
					if (flag === 0)
						moving_of = 1;
					if (flag !== -1)
						break;
				}
				sea_battle_bot.checking_directions = sea_battle_bot.checking_directions + item.dir + ' ';
			}
		}
	}
	else
	if (sea_battle_bot.status === 'found'){
		let {x, y} = sea_battle_bot;
		for (let item of arr)
			if (item.dir === sea_battle_bot.find_direct){
				if (!isValid(x + item.dx, y + item.dy, gamer_field.cntX, gamer_field.cntY)){
					sea_battle_bot.status = 'redirect';
					break;
				}
				let flag = gamer_field.clickOn(x + item.dx, y + item.dy);
				if (flag === 1){
					sea_battle_bot.x = x + item.dx;
					sea_battle_bot.y = y + item.dy;
				}
				if (flag === 0){
					sea_battle_bot.status = 'redirect';
					moving_of = 1;
					fl = false;
				}
				if (flag === -1)
					sea_battle_bot.status = 'redirect';
				if (flag === 2)
					sea_battle_bot.status = 'find';
			}
	}
	if (sea_battle_bot.status === 'redirect' && fl){
		if (sea_battle_bot.find_direct === 'top')
			sea_battle_bot.find_direct = 'down';
		else
		if (sea_battle_bot.find_direct === 'down')
			sea_battle_bot.find_direct = 'top';
		else
		if (sea_battle_bot.find_direct === 'left')
			sea_battle_bot.find_direct = 'right';
		else
		if (sea_battle_bot.find_direct === 'right')
			sea_battle_bot.find_direct = 'left';
		let flag, item, {x, y} = sea_battle_bot;
		for (let i = 0; i < arr.length; i++)
			if (sea_battle_bot.find_direct === arr[i].dir){
				item = arr[i];
				break;
			}
		do{
			flag = gamer_field.clickOn(x + item.dx, y + item.dy);
			x += item.dx;
			y += item.dy;
		}
		while(flag === -1)
		if (flag === 2)
			sea_battle_bot.status = 'find';
		if (flag === 1){
			sea_battle_bot.status = 'found';
			sea_battle_bot.x = x;
			sea_battle_bot.y = y;
		}
		if (flag === 0)
			moving_of = 1;
	}
	reDraw();
	check_winner();
}

function gamer_move(e){
	if (!game_start || moving_of == 2)
		return;
	let x = e.clientX - cnt_pos.x, 
		y = e.clientY - cnt_pos.y;
	x = Math.floor(x / square_size) - enemy_field.posX;
	y = Math.floor(y / square_size) - enemy_field.posY;
	if (!isValid(x, y, enemy_field.cntX, enemy_field.cntY))
		return;
	let flag = enemy_field.clickOn(x, y);
	if (flag !== -1){
		reDraw();
		if (flag === 0)
			moving_of = 2;
	}
	check_winner();
}

function check_winner(){
	let fl = true;
	for (let ship of gamer_ships)
		if (!ship.killed)
			fl = false;
	if (fl){
		game_start = false;
		for (let ship of enemy_ships)
			ship.paint();
		setTimeout(() => {alert('You lost');location.reload();}, 400);
	}
	fl = true;
	for (let ship of enemy_ships)
		if (!ship.killed)
			fl = false;
	if (fl){
		game_start = false;
		setTimeout(() => {alert('You win'); location.reload();}, 400);
	}
}

let gamer_field = new Field(2, 6, 10, 10);
let enemy_field = new Field(22, 6, 10, 10);
let gamer_ships = [], enemy_ships = [];



function init(){	
	gamer_ships.push(new Ship(17, 7, 4));
	gamer_ships.push(new Ship(17, 9, 3), new Ship(21, 9, 3));
	gamer_ships.push(new Ship(17, 11, 2), new Ship(20, 11, 2), new Ship(23, 11, 2));
	gamer_ships.push(new Ship(17, 13, 1), new Ship(19, 13, 1), new Ship(21, 13, 1), new Ship(23, 13, 1));
	for (let i = 0; i < gamer_ships.length; i++)
		gamer_field.ships.set(i, gamer_ships[i].count);
	gamer_field.arrShips = gamer_ships;
}

function paint(){
	field_draw(40, 20);
	gamer_field.paint();
	for (let ship of gamer_ships)
		ship.paint();
	if (game_start){
		enemy_field.paint();
		for (let ship of enemy_ships)
			if (ship.killed)
				ship.paint();
	}
}

function clear(){
	ctx.fillStyle = '#FBFBFF';
	ctx.fillRect(0, 0, cnt.width, cnt.height);
}

function reDraw(){
	clear();
	paint();
}

init();
reDraw();
cnt_pos = canvas.getBoundingClientRect()

function game_manager(){
	if (!game_start)
		return;
	if (moving_of == 2)
		setTimeout(bot_move, 500);
}

setInterval(game_manager, 600);

document.addEventListener('mousedown', (e) => {
	let x = e.clientX - cnt_pos.x,
		y = e.clientY - cnt_pos.y;
	
	for (let i = 0; i < gamer_ships.length; i++)
		if (gamer_ships[i].mouseHover(x, y) && gamer_ships[i].install !== 2){
			moving_ship.index = i;
			moving_ship.dx = gamer_ships[i].coordX - x;
			moving_ship.dy = gamer_ships[i].coordY - y;
			if (gamer_ships[i].install === 1)
				gamer_field.uninstall_ship(gamer_ships[i], i);
			break;
		}
	if (moving_ship.index !== -1){
		mouse_down = true;
		last_ship_index = moving_ship.index;
	}
});

document.addEventListener('mouseup', () => {
	if (!mouse_down)
		return;
	if (moving_ship.index === -1)
		console.log('Error');
	let ship = gamer_ships[moving_ship.index];
	if (gamer_field.canInstallShip(ship))
		gamer_field.installShip(ship, moving_ship.index);
	else{
		if (ship.install === 1)
			gamer_field.uninstall_ship(ship, moving_ship.index);
		ship.install = 0;
		ship.direct = 0;
		ship.coordX = ship.initCoordX;
		ship.coordY = ship.initCoordY;
	}
	mouse_down = false;
	moving_ship.index = -1;
	moving_ship.dx = 0;
	moving_ship.dy = 0;
	reDraw();
});

document.addEventListener('mousemove', function(e){
	if (!mouse_down)
		return;
	let x = e.clientX - cnt_pos.x, 
		y = e.clientY - cnt_pos.y;
	
	if (moving_ship.index != -1){
		gamer_ships[moving_ship.index].coordX = x + moving_ship.dx;
		gamer_ships[moving_ship.index].coordY = y + moving_ship.dy;
		reDraw();
		show_installing_ship(gamer_ships[moving_ship.index], moving_ship.index);
	}
	
});

document.addEventListener('click', (e) => gamer_move(e));


