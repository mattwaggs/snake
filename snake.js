/*
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Matt Waggoner
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


var Renderer = function(ctx, options) {

	if(!ctx || !options) {
		throw 'cannot create renderer';
	}

	var renderer = this;
	renderer.options = options;

	renderer.ctx = ctx;

	this.objects = [];
	this.textObject = {
		'text': '',
		'x': 0,
		'y': 0
	};

	this.infoText = 'Use Arrow Keys to Move';

	function clearCanvas() {
		renderer.ctx.clearRect(0,0, options._max_width, options._max_height);
	}

	function getPixelX(x) {
		return (renderer.options._square_length * x) + renderer.options._square_offset;
	}

	function getPixelY(y) {
		return (renderer.options._square_length * y) + renderer.options._square_offset;
	}


	this.render = function() {
		clearCanvas();
		for (item in renderer.objects) {
			if(renderer.objects[item].hasOwnProperty('render')) {
				var objs = renderer.objects[item].render();
				for(obj in objs) {
					var o = objs[obj];
					renderer.ctx.fillStyle = o.fillStyle;
					renderer.ctx.fillRect(getPixelX(o.x), getPixelY(o.y), o.width, o.height);
					renderer.ctx.fillStyle = renderer.options._background_color;
				}
			}
		}
		// draw any text 
		ctx.fillStyle = '#999'
		ctx.font = "42px monospace";
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
 		ctx.fillText(renderer.textObject.text, renderer.textObject.x, renderer.textObject.y);


		// draw info text 
		ctx.fillStyle = '#333'
		ctx.font = "12px monospace";
		ctx.textBaseline = "bottom";
		ctx.textAlign = "right";
 		ctx.fillText(renderer.infoText, options._max_width-6, options._max_height-6);
	}

	this.setText = function(t) {
		renderer.textObject = t;
	}

	this.setInfoText = function(t) {
		renderer.infoText = t;
	}

}


var Game = function() {

	var game_canvas = document.getElementById("game");
	var game_context = game_canvas.getContext("2d");

	var game = this;

	game._status = 0;
	game._width = 20;
	game._height = 20;

	game._score = 0;
	game._score_inc = 1;

	game._player_square_length	= 24;
	game._player_color 			= '#e2e2e2';
	game._apple_color 			= '#FFD0D0';

	game._interaction = false;

	var renderOptions = {};

	renderOptions._square_length 	= 30;
	renderOptions._square_offset	= 6;
	renderOptions._background_color	= '#fff;';

	renderOptions._max_width 	= (((game._width + 1) * renderOptions._square_length) + renderOptions._square_offset);
	renderOptions._max_height 	= (((game._height + 1) * renderOptions._square_length) + renderOptions._square_offset);

	var renderer = new Renderer(game_context, renderOptions);

	this.max_speed 		= 750;
	this.min_speed 		= 50;
	this.speed_modifier = 50;
	this.game_speed 	= this.max_speed;


	this.showText = function(text) {
		
		renderer.setText({
			'text': text,
			'x': renderOptions._max_width/2,
			'y': renderOptions._max_height/2, 
		});
	}


	this.score = function() {
		game._score += game._score_inc;
		if((game.game_speed - game.speed_modifier) >= game.min_speed) {
			game.game_speed -= game.speed_modifier;
		}
	}

	this.statuses = function() {
		return {
			'NOT_STARTED': 0,
			'STARTING': 1, 
			'RUNNING': 2, 
			'PAUSED': 3, 
			'STOPPED': 4
		};
	}

	this.status = function(s) {

		if(s != null & s!= undefined && game.statuses().hasOwnProperty(s)) {
			game._status = game.statuses()[s];

			if(s == 'PAUSED') {
				game.showText('PAUSED');
			}else if(s == 'STOPPED') {
				game.showText('GAME OVER :(');
			}else{
				game.showText('');
			}
		}
		return game._status;
	}


	game.status('STARTING');

	var Snake = function() {

		var self = this;

		var directions = {
			'up': 38, 
			'down': 40, 
			'left': 37, 
			'right':39
		}

		this.blocks = [ { x:8, y:9 }, { x:9, y:9 }, { x:10, y:9 } ]; // starter block

		this.direction = directions['left'];

		/*	
		 *	Should perform collision check here..
		 */ 
		this.move = function() {
			// create the ghost head
			var ghost = {x: null, y: null};
			ghost.x = self.blocks[0].x;
			ghost.y = self.blocks[0].y;

			if(self.direction == directions['up']) {
				ghost.y = (self.blocks[0].y-1) % (game._height+1);
			}else if(self.direction == directions['down']) {
				ghost.y = (self.blocks[0].y+1) % (game._height+1);
			}else if(self.direction == directions['left']) {
				ghost.x = (self.blocks[0].x-1) % (game._width+1);
			}else if(self.direction == directions['right']) {
				ghost.x = (self.blocks[0].x+1) % (game._width+1);
			}

			// put back in bounds..
			if(ghost.x < 0) {
				ghost.x = game._width; 
			}
			if(ghost.y < 0) {
				ghost.y = game._height; 
			}

			if(ghost.x == apple.blocks[0].x && ghost.y == apple.blocks[0].y) {
				//eat the apple.
				apple.move();
				self.grow();
				game.score();
			}

			//collision check the ghost.
			for(var i = 0; i < self.blocks.length; i++) {
				if(ghost.x == self.blocks[i].x && ghost.y == self.blocks[i].y) {
					throw 'collision!';
				}
			}

			// move all the pieces
			for(var i=self.blocks.length-1; i>=0; i--) {
				if(i == 0) {
					self.blocks[0].x = ghost.x;
					self.blocks[0].y = ghost.y;
				}else{
					self.blocks[i].x = self.blocks[i-1].x;
					self.blocks[i].y = self.blocks[i-1].y;
				}
			}

		}

		this.grow = function() {
			self.blocks.push({
				x: -100,
				y: -100
			});
		}

		this.render = function() {
			return self.blocks.map(function(item) {
				return {
					'x': item.x,
					'y': item.y,
					'width': game._player_square_length,
					'height': game._player_square_length,
					'fillStyle': game._player_color
				};
			});
		}

		this.keyListener = function() {
			document.onkeydown = function(e) {
				game._interaction = true;
				e = e || window.event;
				switch(e.which || e.keyCode) {
					case directions['left']: 
						if(game.status() == game.statuses()['RUNNING'] && self.direction != directions['right']) {
							self.direction = directions['left'];
						}
			        break;

			        case directions['up']:
						if(game.status() == game.statuses()['RUNNING'] && self.direction != directions['down']) {
							self.direction = directions['up'];
						}
			        break;

			        case directions['right']: 
						if(game.status() == game.statuses()['RUNNING'] && self.direction != directions['left']) {
							self.direction = directions['right'];
						}
			        break;

			        case directions['down']: 
						if(game.status() == game.statuses()['RUNNING'] && self.direction != directions['up']) {
							self.direction = directions['down'];
						}
			        break;

			        case 27: // esc key pressed
			        	if(game.status() == game.statuses()['RUNNING']) {
			        		game.status('PAUSED');
			        	}else if(game.status() == game.statuses()['PAUSED']) {
			        		game.status('RUNNING');
			        	}
			        break;

			        case 32: // space key pressed
			        	if(game.status() == game.statuses()['STOPPED'] || game.status() == game.statuses()['NOT_STARTED']) {
			        		player = new Snake();
			        		renderer.objects = [];
			        		apple = new Apple();
							renderer.objects.push(player);
							renderer.objects.push(apple);
							game.game_speed = game.max_speed;
							game._score = 0;
			        		game.status('RUNNING');
			        	}
			        break;

			        default: return; // exit this handler for other keys
			    }
			    e.preventDefault(); // prevent the default action (scroll / move caret)
			};
		}
		this.keyListener();

	}


	var Apple = function() {

		var self = this;

		this.blocks = [{x:16, y:16}];

		this.move = function() {
			this.blocks = [];			
			this.blocks = [{x: Math.floor((Math.random() * 20) + 1), y: Math.floor((Math.random() * 20) + 1)}];			
		}

		this.render = function() {
			return self.blocks.map(function(item) {
				return {
					'x': item.x,
					'y': item.y,
					'width': game._player_square_length,
					'height': game._player_square_length,
					'fillStyle': game._apple_color
				};
			});
		}

	}

	this._delta_time = Date.now();


	var player = new Snake();
	var apple = new Apple();
	renderer.objects.push(player);
	renderer.objects.push(apple);

	this.gameLoop = function() {

		renderer.render();

		// if the game is running
		if(game.status() == game.statuses()['RUNNING']) {

			if(game._score > 0 || game._interaction != false) {
				renderer.setInfoText('score:  ' +game._score);
			}

			if( (Date.now() - game._delta_time) >= game.game_speed) {

				try{
					player.move();
				}
				catch(e) {
					game.status('STOPPED');
				}	

				game._delta_time = Date.now();
			}

		}

		// call this game loop again
		setTimeout(function() { 
			game.gameLoop();
		}, 10);
	}

	this.start = function() {
		game.status('RUNNING');
		game.gameLoop();
	}

}

var game = new Game();
game.start();