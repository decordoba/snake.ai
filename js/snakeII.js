/*
Snake EX2 (based on the original NOKIA game)
By Daniel de Cordoba Gil
http://github.com/decordoba
My goal: something in the lines of https://www.youtube.com/watch?v=EBYIJ1GPvG8
*/

// define position constructor
function Position(x, y) {
    this.x = x;
    this.y = y;
}

// define board constructor
function Board(w, h, styleclass, id) {
    this.w = w;                     //width grid
    this.h = h;                     //height grid
    this.side = 20;                 //px, width/height of every box
    this.class = styleclass;        //class for box image
    this.id = id;                   //unique id of the box
    this.grid = [];                 //board with positions
    this.snake = [];                //boxes that make the snake
    this.tongue = [];               //boxes that make the tongue
    this.food = [];                 //boxes that make the food
    this.obstacles = [];            //boxes than make the obstacles
    this.element;                   //div element used as the board
    this.stacked_positions = {};    //when snake grows, cell position with more than one snake segment
    this.stacked_number = 0;        //number of stacked segments in stacked_positions
    
    this.initBoard = function(obstacles, num_food) {
        // initialize board with obstacles and snake
        var i;
        this.resetGrid();
        this.side = this.getBoxSide(0); //head
        this.createBoard();
        this.loadImages();
        this.addObstacles(obstacles);
        this.initSnake();
        this.initTongue();
        // this.setPosToFood(new Position(8, 2));
        // this.setPosToFood(new Position(9, 2));
        if (num_food == undefined || num_food < 2) {
            this.addRandomFood();
        } else {
            for (i=0; i<num_food; i++) {
                this.addRandomFood();
            }
        }
    }
    this.resetGrid = function() {
        // set grid to all zeros
        var row, col;
        this.grid = [];
        for (col=0; col<this.w; col++) {
            this.grid[col] = [];
            for (row=0; row<this.h; row++) {
                this.grid[col][row] = 0;
            }
        }
    }
    this.createBoard = function() {
        // create board element and give style to it
        this.element = document.getElementById(this.id);
        if (this.element === null) {
            this.element = document.createElement("div");
            this.element.id = this.id;
            document.body.appendChild(this.element);
        }
        this.element.className = this.class;
        this.element.style.width = (this.side * this.w) + "px";
        this.element.style.height = (this.side * this.h) + "px";
    }
    this.addObstacles = function(obstacles) {
        // add obstacles to grid and create (and show) obstacle elements
        var new_box, i;
        for (i=0; i<obstacles.length; i++) {
            this.addObstacleToGrid(obstacles[i]);
            new_box = this.addBox(obstacles[i], -1, 10, 2, "obstacle_" + i); //-1: direction(undefined), 10:obstacle, z-index:2
            this.obstacles.push(new_box);
        }
    }
    this.initSnake = function() {
        // set snake to initial positions, add it to grid and create (and show) snake elements
        var positions = [{x:4, y:2}, {x:3, y:2}, {x:2, y:2}],
            directions = [3, 3, 3], //0:up, 1:left, 2:down, 3:right
            snake_parts = [0, 1, 4], //0:head, 1:body, 2:turnL, 3:turnR, 4:tail
            i, new_box;
        for (i=0; i<positions.length; i++) {
            this.addSnakeBoxToGrid(positions[i]);
            new_box = this.addBox(positions[i], directions[i], snake_parts[i], 10, "snake_cell_" + i); //z-index:10
            this.snake.push(new_box);
        }
    }
    this.initTongue = function() {
        // create tongue boxes (so far to the left and up that they should not show up)
        var positions = [{x: -10000, y:-10000}, {x: -10001, y:-10000}],
            directions = [3, 3], //0:up, 1:left, 2:down, 3:right
            snake_parts = [13, 14], //13:tongue_body, 14:tongue_tip
            i, new_box;
        for (i=0; i<positions.length; i++) {
            new_box = this.addBox(positions[i], directions[i], snake_parts[i], 15, "snake_tongue_" + i); //z-index:15
            this.tongue.push(new_box);
        }
    }
    this.getBoxSide = function(box_num) {
        // get head box image, and use its side as the side for all boxes in board
        var box, container, image_src, image, side;
        if (document.defaultView && document.defaultView.getComputedStyle) {
            if (box_num == undefined) {
                box_num = 0;
            }
            container = document.createElement("div");
            container.className = this.class;
            container.id = "tmp_div";
            document.body.appendChild(container);
            box = new Box(new Position(-10000, -10000), 0, 0, box_num, 0, "tmp_box"); //z-index:0
            box.createBox(container);
            image_src = document.defaultView.getComputedStyle(box.element, null).backgroundImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
            image = new Image();
            image.src = image_src;
            side = Math.max(image.width, image.height) || 20;
            container.remove();
        } else {
            // In IE, the size will be 20 always (anyway, I don't expect many players to use IE)
            side = 20;
        }
        return side;
    }
    this.loadImages = function() {
        // use dummy box to load all images, so they are stored in cache
        var new_box, i, num_imgs = 16;
        for (i=0; i<num_imgs; i++) {
            new_box = this.addBox(new Position(-10000, -10000), 0, i, 0, "dummy_box_" + i); //z-index:0
        }
        setTimeout(function(){
            for (i=0; i<num_imgs; i++) {
                document.getElementById("dummy_box_" + i).remove();
            }
        }, 5000);
    }
    this.positionIsValid = function(pos) {
        // return whether pos is in grid
        return pos.x >= 0 && pos.x < this.w && pos.y >= 0 && pos.y < this.h;
    }
    this.setGridCellsToValue = function(cells, value) {
        // set each selected position in the grid to value
        var i;
        for (i=0; i<cells.length; i++) {
            if (this.positionIsValid(cells[i])) {
                this.grid[cells[i].x][cells[i].y] = value;
            }
        }
    }
    this.getGridValue = function(pos) {
        // warning, does not check if pos is ok
        return this.grid[pos.x][pos.y];
    }
    this.addSnakeBoxToGrid = function(pos) {
        // warning, does not check if pos is ok
        this.grid[pos.x][pos.y] = 2;
    }
    this.addObstacleToGrid = function(pos) {
        // warning, does not check if pos is ok
        this.grid[pos.x][pos.y] = 1;
    }
    this.addFoodToGrid = function(pos) {
        // warning, does not check if pos is ok
        this.grid[pos.x][pos.y] = -1;
    }
    this.removeBoxFromGrid = function(pos) {
        // warning, does not check if pos is ok
        this.grid[pos.x][pos.y] = 0;
    }
    this.addBox = function(pos, dir, element, z_index, id) {
        // creates box, gives style to it (so it is shown), and returns it
        var box = new Box(pos, this.side, dir, element, z_index, id);
        box.createBox(this.element);
        return box;
    }
    this.moveFood = function(old_food, ko_positions) {
        // move food to a new free random position, which cannot be in ko_positions
        var pos = this.findRandomFreePosition(), i, pos_ok;
        if (ko_positions === undefined) {
            while (pos.x === old_food.x && pos.y === old_food.y) {
                pos = this.findRandomFreePosition();
            }
        } else {
            pos_ok = false;
            while (!pos_ok) {
                pos_ok = true;
                for (i=0; i<ko_positions.length; i++) {
                    if (pos.x === ko_positions[i].x && pos.y === ko_positions[i].y) {
                        pos = this.findRandomFreePosition();
                        pos_ok = false;
                        break;
                    }
                }
            }
        }
        for (i=0; i<this.food.length; i++) {
            if (this.food[i].pos.x === old_food.x && this.food[i].pos.y === old_food.y) {
                break;
            }
        }
        if (this.getGridValue(old_food) < 0) {
            this.removeBoxFromGrid(old_food);
        }
        this.food[i].setPosition(pos);
        this.addFoodToGrid(pos);
    }
    this.moveSnake = function(old_head_idx, new_head_idx, direction, use_tongue, growth) {
        // move snake towards direction, save new head in old tail and move its position, so it seems that snake moves
        var eaten, death, i, tongue_pos, eaten_tongue = 0,
            new_tail_idx = (new_head_idx - 1 + this.snake.length) % this.snake.length,
            head_pos = this.getNewHeadPosition(this.snake[old_head_idx].pos, direction),
            old_tail = this.snake[new_head_idx];
        if (this.snake.length > 2) {
            //whether we eat food or not, we must erase the old head
            this.snake[old_head_idx].setToBody(direction);
        }
        if (use_tongue) {
            tongue_pos = this.useTongue(head_pos, direction);
            for (i=0; i<tongue_pos.length; i++) {
                if (this.getGridValue(tongue_pos[i]) < 0) { //food
                    eaten_tongue += 1;
                    console.log("Food eaten with tongue");
                    this.moveFood(tongue_pos[i], tongue_pos);
                }
            }
        } else {
            this.hideTongue();
        }
        [eaten, death] = this.updateSnakeInGrid(head_pos, old_tail.pos, growth);
        if (eaten) {
            this.moveFood(head_pos, tongue_pos); //if we eat while we use tongue, food will not appear in tongue
        }
        if (eaten || eaten_tongue > 0) {
            for (i=0; i<growth; i++) {
                //new_head and old_tail are the same, they point to the old tail segment
                this.addSnakeBoxAtIndex(new_head_idx, old_tail);
                new_head_idx = (new_head_idx + 1) % this.snake.length; //set new tail appendix to head
                new_tail_idx = (new_tail_idx + 1) % this.snake.length; //move tail too
                if (new_head_idx < new_tail_idx) {
                    //compensate that new_head is in position 0 in this.board.snake
                    new_tail_idx = (new_tail_idx + 1) % this.snake.length;
                }
            }
        }
        if (this.snake.length > 1) {
            // style new last segment to a tail
            this.snake[new_tail_idx].setToTail();
        }
        this.snake[new_head_idx].setToHead(direction, use_tongue);
        this.snake[new_head_idx].setPosition(head_pos);
        if (eaten || eaten_tongue > 0) {
            this.snake[new_head_idx].makeFat();
        }
        return {head: new_head_idx, tail: new_tail_idx};
    }
    this.updateSnakeInGrid = function(pos_to_add, pos_to_remove, growth) {
        // update grid after a snake move, and take appropriate actions if death or food eaten
        var stacked = false, food_eaten = false, death = false;
        if (this.getGridValue(pos_to_add) < 0) {
            //food eaten
            console.log("Food eaten");
            food_eaten = true;
            if (growth > 0) {
                this.updateStackedPos(pos_to_remove, growth);
            }
        } else if (this.getGridValue(pos_to_add) > 0) {
            //death: crash with obstacle (1) or snake (2)
            console.log("Death");
            death = true;
            this.updateStackedPos(pos_to_add, 1);
        }
        if (this.stacked_number > 0 && this.getStackedNumberInPos(pos_to_remove) > 0) {
            this.decrementStackedPos(pos_to_remove);
            stacked = true;
        }
        if (!stacked) {
            this.removeBoxFromGrid(pos_to_remove);
        }
        if (!death) {
            this.addSnakeBoxToGrid(pos_to_add);
        }
        return [food_eaten, death];
    }
    this.getNewHeadPosition = function(pos, dir) {
        // return new position after moving from pos in direction dir
        var new_pos = new Position(pos.x, pos.y);
        switch (dir) {
            case 0: //Up
                new_pos.y -= 1;
                if (new_pos.y < 0) {
                    new_pos.y = this.h - 1;
                }
                break;
            case 1: //Left
                new_pos.x -= 1;
                if (new_pos.x < 0) {
                    new_pos.x = this.w - 1;
                }
                break;
            case 2: //Down
                new_pos.y += 1;
                if (new_pos.y >= this.h) {
                    new_pos.y = 0;
                }
                break;
            case 3: //Right
                new_pos.x += 1;
                if (new_pos.x >= this.w) {
                    new_pos.x = 0;
                }
                break;
            default:
                new_pos.x += 1;
                if (new_pos.x >= this.w) {
                    new_pos.x = 0;
                }
        }
        return new_pos;
    }
    this.useTongue = function(pos, dir) {
        // use the tongue (show it and eat food in front of pos)
        var i, prev_pos = pos, all_pos = [];
        for (i=0; i<this.tongue.length; i++) {
            prev_pos = this.getNewHeadPosition(prev_pos, dir);
            this.tongue[i].setDirToValue(dir);
            this.tongue[i].setPosition(prev_pos);
            all_pos.push(prev_pos);
        }
        return all_pos;
    }
    this.hideTongue = function() {
        // hide the tongue
        var i, hidden_pos = new Position(-10000, -10000);
        for (i=0; i<this.tongue.length; i++) {
            this.tongue[i].setPosition(hidden_pos);
        }
    }
    this.findRandomFreePosition = function() {
        // find position in grid that is empty (0). Warning, keeps searching forever
        var pos = new Position(Math.floor(Math.random() * this.w), Math.floor(Math.random() * this.h));
        while (this.getGridValue(pos) !== 0) {
            pos.x = Math.floor(Math.random() * this.w);
            pos.y = Math.floor(Math.random() * this.h);
        }
        return pos;
    }
    this.addRandomFood = function() {
        // create food element and place it in an empty random position
        var new_box, pos = this.findRandomFreePosition();
        this.addFoodToGrid(pos);
        new_box = this.addBox(pos, -1, 11, 5, "snake_food"); //-1: direction(undefined), 11:food, z-index:5
        this.food.push(new_box);
    }
    this.setPosToFood = function(pos) {
        // create food element and place it in a position pos
        var new_box;
        this.addFoodToGrid(pos);
        new_box = this.addBox(pos, -1, 11, 5, "snake_food"); //-1: direction(undefined), 11:food, z-index:5
        this.food.push(new_box);
    }
    this.getSnakePosition = function(idx) {
        // get position of the snake segment at idx. warning, does not check that the index is valid
        return this.snake[idx].pos;
    }
    this.addSnakeBoxAtIndex = function(idx, box_to_clone) {
        // clones a box and puts it at idx in snake
        var new_box = box_to_clone.clone(this.element, "snake_cell_" + this.snake.length); //clone box
        this.snake.splice(idx, 0, new_box); //add box to snake
    }
    this.getManhattanDistance = function(pos1, pos2) {
        // get manhattan distance between two positions
        var dist = new Position(0, 0);
        dist.x = Math.abs(pos1.x - pos2.x);
        dist.y = Math.abs(pos1.y - pos2.y);
        dist.x = Math.min(dist.x, this.w - dist.x);
        dist.y = Math.min(dist.y, this.h - dist.y);
        return dist.x + dist.y;
    }
    this.getAllMovements = function(pos) {
        // from pos, return all directions (movements that kill you or don't') and resulting positions
        var dir, new_pos = [], ok_dir = [], ko_dir = (dir + 2) % 4;
        for (dir=0; dir<4; dir++) {
            new_pos.push(this.getNewHeadPosition(pos, dir));
            ok_dir.push(dir);
        }
        return [ok_dir, new_pos];
    }
    this.getAllAllowedMovements = function(pos, dir) {
        // from pos and dir, return all allowed directions (everywhere except 180 deg turn) and resulting positions
        var dir, new_pos = [], ok_dir = [], ko_dir = (dir + 2) % 4;
        for (dir=0; dir<4; dir++) {
            if (dir == ko_dir) {
                continue;
            }
            new_pos.push(this.getNewHeadPosition(pos, dir));
            ok_dir.push(dir);
        }
        return [ok_dir, new_pos];
    }
    this.getNoDeathMovements = function(pos) {
        // from pos, return valid directions (movements that don't kill you) and resulting positions
        var tmp_pos, dir, new_pos = [], ok_dir = [];
        for (dir=0; dir<4; dir++) {
            tmp_pos = this.getNewHeadPosition(pos, dir);
            if (this.getGridValue(tmp_pos) <= 0) {
                new_pos.push(tmp_pos);
                ok_dir.push(dir);
            }
        }
        return [ok_dir, new_pos];
    }
    this.getStackedNumberInPos = function(pos) {
        // return number of stacked segments in a position pos
        var value, key = pos.x + "_" + pos.y;
        value = this.stacked_positions[key];
        if (value == undefined) {
            value = 0;
        }
        return value;
    }
    this.decrementStackedPos = function(pos) {
        // substract one to the number of stacked segments in a position pos
        var value, key = pos.x + "_" + pos.y;
        value = this.stacked_positions[key];
        if (value == 1 || value == undefined) {
            delete this.stacked_positions[key];
        } else {
            this.stacked_positions[key] = value - 1;
        }
        if (value > 0) {
            this.stacked_number -= 1;
        }
    }
    this.updateStackedPos = function(pos, update) {
        // add update to the number of stacked segments in position pos
        var value, key = pos.x + "_" + pos.y;
        value = this.stacked_positions[key];
        if (value == undefined) {
            this.stacked_positions[key] = update;
        } else {
            this.stacked_positions[key] = value + update;
        }
        this.stacked_number += update;
    }

    // define cell constructor
    function Box(pos, side, dir, image, z_index, id) {
        this.pos = pos;                 //(x,y) position in board
        this.px_pos = new Position(pos.x * side, pos.y * side); //px position
        this.side = side;               //px, width/height of every box
        this.z_index = z_index;         //z-index property, sets what is shown in front of what
        this.image = image;             //0:head, 1:body, 2:turnL, 3:turnR, 4:tail...
        this.imageclass = "";           //class for box image
        this.dir = dir;                 //0:up, 1:left, 2:down, 3:right
        this.dirclass = "";             //class for image orientation
        this.fat = false;               //whether a snake segment is fat (has eaten food) or not
        this.id = id;                   //unique id of the box
        this.element;                   //element in the document
        
        this.createBox = function(container) {
            // give style (show) a box
            this.element = document.createElement("div");
            this.element.id = this.id;
            this.element.style.width = this.side + "px";
            this.element.style.height = this.side + "px";
            this.element.style.zIndex = this.z_index;
            this.updatePosition();
            this.updateClass();
            container.appendChild(this.element);
        }
        this.updateClass = function() {
            // class names according to this.image and this.dir
            var separator = " ";
            switch (this.dir) {
                case 0: //Up
                    this.dirclass = "snake-direction-up";
                    break;
                case 1: //Left
                    this.dirclass = "snake-direction-left";
                    break;
                case 2: //Down
                    this.dirclass = "snake-direction-down";
                    break;
                case 3: //Right
                    this.dirclass = "snake-direction-right";
                    break;
                default:
                    this.dirclass = "";
                    separator = "";
            }
            switch (this.image) {
                case 0: //Head
                    this.imageclass = "snake-snakebody-head";
                    break;
                case 1: //Body
                    this.imageclass = "snake-snakebody-vertical";
                    break;
                case 2: //Turn Left
                    this.imageclass = "snake-snakebody-turn-l";
                    break;
                case 3: //Turn Right
                    this.imageclass = "snake-snakebody-turn-r";
                    break;
                case 4: // Tail
                    this.imageclass = "snake-snakebody-tail";
                    break;
                case 5: // Snake Open Mouth
                    this.imageclass = "snake-snakebody-open-mouth";
                    break;
                case 6: // Body Eaten
                    this.imageclass = "snake-snakebody-vertical-fat";
                    break;
                case 7: // Turn Left Eaten
                    this.imageclass = "snake-snakebody-turn-l-fat";
                    break;
                case 8: // Turn Right Eaten
                    this.imageclass = "snake-snakebody-turn-r-fat";
                    break;
                case 9: // Tail Eaten
                    this.imageclass = "snake-snakebody-tail-fat";
                    break;
                case 10: // Obstacle
                    this.imageclass = "snake-snakebody-obstacle1";
                    break;
                case 11: // Food
                    this.imageclass = "snake-food-block";
                    break;
                case 12: // Head Tongue
                    this.imageclass = "snake-snakebody-head-tongue";
                    break;
                case 13: // Tongue Middle
                    this.imageclass = "snake-snakebody-tongue-body";
                    break;
                case 14: // Tongue Tip
                    this.imageclass = "snake-snakebody-tongue-tip";
                    break;
                default: //Error
                    this.imageclass = "snake-snakebody-error";
            }
            this.element.className = "snake-box " + this.imageclass + separator + this.dirclass;
        }
        this.updatePosition = function() {
            // update px_pos and the box position according to this.pos
            this.px_pos.x = pos.x * side;
            this.px_pos.y = pos.y * side;
            this.element.style.left = this.px_pos.x + "px";
            this.element.style.top = this.px_pos.y + "px";
        }
        this.makeFat = function(fat) {
            // makes snake segment fat (or unfat if set to false)
            if (fat === undefined) {
                fat = true;
            }
            this.fat = fat;
        }
        this.setImageToValue = function(value) {
            // set box image to value
            this.image = value;
            this.updateClass();
        }
        this.setDirToValue = function(value) {
            // set box dir to value
            this.dir = value;
            this.updateClass();
        }
        this.setImageAndDirToValue = function(image, dir) {
            // set box image and dir to value
            this.image = image;
            this.dir = dir;
            this.updateClass();
        }
        this.setToHead = function(dir, tongue, open_mouth) {
            // set box style to head
            this.dir = dir;
            this.image = 0; //head
            if (tongue === true) {
                this.image = 12; //head with tongue
            } else if (open_mouth === true) {
                this.image = 5; //head with open mouth
            }
            this.fat = false; //make sure a new head is not fat unless purposely set later
            this.updateClass();
        }
        this.setToBody = function(head_dir) {
            // set box to "neck" or 1st body segment after head. uses head_dir to calculate turns
            var diff = 0;
            if (head_dir == this.dir) {
                this.image = 1; //body straight
            } else {
                diff = head_dir - this.dir;
                if (diff === 1 || diff === -3) {
                    this.image = 3; //turn left
                } else {
                    this.image = 2; //turn right
                }
            }
            if (this.fat) {
                this.image += 5;
            }
            this.updateClass();
        }
        this.setToTail = function() {
            // set box to tail and correct tail direction after a turn
            if (this.image == 2 || this.image == 2 + 5) { //2nd condition considers fat
                this.dir = (this.dir + 3) % 4;
            } else if (this.image == 3 || this.image == 3 + 5) { //2nd condition considers fat
                this.dir = (this.dir + 1) % 4;
            }
            this.image = 4; //tail
            if (this.fat) {
                this.image += 5;
            }
            this.updateClass();
        }
        this.setPosition = function(new_pos) {
            // set box to position and style it (show it) accordingly 
            this.pos.x = new_pos.x;
            this.pos.y = new_pos.y;
            this.updatePosition();
        }
        this.clone = function(container, id) {
            // return a deep copy of the current box, changing only its id, and add it to the container 
            var box = new Box(new Position(this.pos.x, this.pos.y), this.side,
                              this.dir, this.image, this.z_index, id);
            box.createBox(container);
            return box;
        }
    }
}

function Snake(board, keys, speed, AI, growth, numFood) {
    this.board = board;
    this.head = 0; //index for head in board.snake
    this.tail = 0; //index for tail in board.snake
    this.direction = 0; //0:up, 1:left, 2:down, 3:right
    this.movements = []; //movements[0]:u/d, movements[1]:l/r
    this.useTongue = 0; //0:no_tongue, 1:tongue, 2+:no_tongue (numbers prevent using tongue every move, only allowed alternating on-off)
    this.keys = keys; //keys to control movement
    this.speed = speed; //ms between movements
    this.isAI = AI; //snake responds to keys or chases food automatically (Pause key always works!)
    this.growth = growth; //# segments the snake grows when it eats a food
    this.numFood = numFood || 1; //# food dots available at any moment
    this.isPaused = true; //whether the game is paused or not
    this.showDebug = true; //show debug console, used to shows collisions
    this.debugElement; //element that holds debugConsole
    
    this.initGame = function(obstacles) {
        // start game: initialize board, and launch snake movement
        var me = this;
        this.board.initBoard(obstacles, this.numFood);
        // Assumes that snake has first_pos:head and last_pos:tail
        this.head = 0;
        this.tail = this.board.snake.length - 1;
        if (this.growth === undefined) {
            this.growth = 1;
        }
        this.direction = this.board.snake[this.head].dir;
        window.addEventListener("keydown", function(evt) {
            me.keyListener(evt);
        }, false);
        window.onload = function() {
            me.scheduleNextStep();
        }
    }

    this.keyListener = function(evt) {
        // when key is pressed, takes appropriate action
        var key, dir = -1, pause_key = false;
        if (!evt) {
            var evt = window.event;
        }
        var key = (evt.which) ? evt.which : evt.keyCode;
        switch(key) {
            case this.keys[0]: //up
                dir = 0;
                break;
            case this.keys[1]: //left
                dir = 1;
                break;
            case this.keys[2]: //down
                dir = 2;
                break;
            case this.keys[3]: //right
                dir = 3;
                break;
            case this.keys[4]: //tongue
                if (this.useTongue === 0) {
                    this.useTongue = 1;
                }
                break;
            case this.keys[5]: //pause
                pause_key = true;
                break;
        }
        if (pause_key) {
            this.isPaused = !this.isPaused;
            this.movements = [];
        }
        if (this.isPaused) {
            //no matter what keys you press when pause, nothing will happen
            return;
        }        
        //I could write this in less lines, but it is clearer like this
        if (this.movements.length == 0 || (this.movements[0] === undefined && this.movements[1] === undefined)) {
            //ignore keys that are parallel to direction
            if (this.direction % 2 !== dir % 2) {
                switch(dir) {
                    case 0: //up
                    case 2: //down
                        this.movements[0] = dir;
                        break;
                    case 1: //left
                    case 3: //right
                        this.movements[1] = dir;
                        break;
                }
            }
        } else {
            switch(dir) {
                case 0: //up
                case 2: //down
                    this.movements[0] = dir;
                    break;
                case 1: //left
                case 3: //right
                    this.movements[1] = dir;
                    break;
            }
        }
    }
    
    this.scheduleNextStep = function() {
        // schedule next advancement of time
        var me = this;
        setTimeout(function(){me.advanceTime();}, this.speed);
    }
    
    this.advanceTime = function() {
        // move time one step, so that the game advances
        var tmp,
            i, j,
            food_pos,
            allowed_dirs,
            allowed_pos,
            use_tongue = (this.useTongue === 1),
            dist,
            min_dist = this.board.w + this.board.h,
            best_dir = this.direction;
        
        if (this.isPaused) {
            //advance time will not do anything when paused
            this.scheduleNextStep();
            return;
        }
        
        if (this.isAI) {
            [allowed_dirs, allowed_pos] = this.board.getNoDeathMovements(this.board.getSnakePosition(this.head));
            if (allowed_dirs.length === 0) {
                console.log("Trapped --> I'll have to kill myself...");
                [allowed_dirs, allowed_pos] = this.board.getAllAllowedMovements(this.board.getSnakePosition(this.head), this.direction);
                //this.isPaused = true;
            }
            for (i=0; i<allowed_dirs.length; i++) {
                for (j=0; j<this.board.food.length; j++) {
                    food_pos = this.board.food[j].pos;
                    dist = this.board.getManhattanDistance(food_pos, allowed_pos[i]);
                    if (dist < min_dist) {
                        min_dist = dist;
                        best_dir = allowed_dirs[i];
                    }
                }
            }
            this.direction = best_dir;
        } else {
            //modify direction of snake if movements is not empty
            if (this.movements.length > 0 && (this.movements[0] !== undefined || this.movements[1] !== undefined)) {
                if (this.direction % 2 === 0) {
                    this.direction = this.movements[1];
                    this.movements[1] = undefined;
                } else {
                    this.direction = this.movements[0];
                    this.movements[0] = undefined;
                }
            }
        }
        // console.log("SNAKE BEFORE", this.head, this.tail);
        // for (i=0; i<this.board.snake.length; i++) {
            // var aaa = ""; if(i==this.head){aaa="HEAD";}else if(i==this.tail){aaa="TAIL";}
            // console.log(JSON.stringify(this.board.snake[i].id), aaa);
        // }
        tmp = this.board.moveSnake(this.head, this.tail, this.direction, use_tongue, this.growth);
        this.head = tmp.head;
        this.tail = tmp.tail;
        this.useTongueUpdate();
        // console.log("SNAKE AFTER", this.head, this.tail);
        // for (i=0; i<this.board.snake.length; i++) {
            // aaa = ""; if(i==this.head){aaa="HEAD";}else if(i==this.tail){aaa="TAIL";}
            // console.log(JSON.stringify(this.board.snake[i].id), aaa);
        // }
        // console.log("-------------------------------------------------");

        if (this.showDebug) {
            if (this.debugElement === undefined) {
                this.debugElement = document.createElement("div");
                this.debugElement.className = "div-debug";
                this.debugElement.style.marginTop = this.board.side * this.board.h + "px";
                this.board.element.appendChild(this.debugElement);
            }
            tmp = "";
            for (var i=0; i<this.board.h; i++) {
                for (var j=0; j<this.board.w; j++) {
                    if (this.board.grid[j][i] == 0) { //free space
                        tmp += "..";
                    } else if (this.board.grid[j][i] == 2) { //snake
                        tmp += "@ ";
                    } else if (this.board.grid[j][i] < 0) { //food
                        tmp += "X ";
                    } else {
                        tmp += "??"; //obstacles
                    }
                }
                tmp += "<br>";
            }
            this.debugElement.innerHTML = tmp;
        }
        
        this.scheduleNextStep();
    }
    this.useTongueUpdate = function() {
        // updates this.useTongue variable. Makes sure that we cannot use tongue all the time
        if (this.useTongue > 0) {
            this.useTongue += 1;
            if (this.useTongue >= 3) { //3 => User can only use tongue every 1 of 2 moves
                this.useTongue = 0;
            }
        }
    }
}

/*
TODO:
    6. Make nice looking snake
    7. Implement moving food
  7.5. Handle case where there is no room for new food
  7.6. Head should always be on top (increase z-index)
  7.7 Change color when dying
    6. Handle case in which one of the positions where the snake can go is where its tail is. From grid its seems that it is not allowed but in next movement it would be because tail would not be there anymore (carefull, stacked!)
    9. Implement and test multiplayer game
   10. Create crazy game modes: sth that when you eat you put obstacle in opponent map, sth that when you eat a food you start growing from your tail and never stop,
       sth interacting with different snakes / boards (2 snakes, one food, race) (change board when eating food) (powerups (invisibility, strength, lives, speed, smaller...))
   11. Do AI: learning from seeing play, learning from trial and error, Astar, smart Astar that can complete board, rules to always win...
*/