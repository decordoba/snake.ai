/*
Snake EX2 (based on the original NOKIA game)
By Daniel de Cordoba Gil
http://github.com/decordoba
My goal: something in the lines of https://www.youtube.com/watch?v=EBYIJ1GPvG8
*/

"use strict";

// define position constructor
function Position(x, y) {
    this.x = x;
    this.y = y;

    this.add = function(pos) {
        this.x += pos.x;
        this.y += pos.y;
    }
    this.compare = function(pos) {
        return this.x === pos.x && this.y === pos.y;
    }
    this.findIndex = function(pos_array) {
        // return index of position in positions array, or -1 if not found
        var i;
        for (i=0; i<pos_array.length; i++) {
            if (this.compare(pos_array[i])) {
                break;
            }
        }
        if (i >= pos_array.length) {
            i = -1;
        }
        return i;
    }
    this.findObjectIndex = function(object_array) {
        // return index of position in objects array (where every object has attribute pos), or -1 if not found
        var i;
        for (i=0; i<object_array.length; i++) {
            if (this.compare(object_array[i].pos)) {
                break;
            }
        }
        if (i >= object_array.length) {
            i = -1;
        }
        return i;
    }
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
    this.food = [];                 //boxes that make the food (includes regular and temporary food)
    this.tmp_food = [];             //boxes that make the temporary food (food that disappear after some time)
    this.obstacles = [];            //boxes than make the obstacles
    this.element;                   //div element used as the board
    this.stacked_positions = {};    //when snake grows, cell position with more than one snake segment
    this.stacked_number = 0;        //number of stacked segments in stacked_positions
    this.max_z_increment = 0;       //monitorizes max z-index for boxes, so head is always on top
    
    // initialize constants
    const UP = 0,            LEFT = 1,
          DOWN = 2,          RIGHT = 3,
          NO_DIR = -1,

          HEAD = 0,          BODY = 1,
          TURN_L = 2,        TURN_R = 3,
          TAIL = 4,          MOUTH = 5,
          BODY_FAT = 6,      TURN_L_FAT = 7,
          TURN_R_FAT = 8,    TAIL_FAT = 9,
          FOOD = 10,         TMP_FOOD = 11,
          HEAD_TONGUE = 12,  TONGUE_BODY = 13,
          TONGUE_TIP = 14,   OBSTACLE0 = 15,
          OBSTACLE1 = 16,    OBSTACLE2STRAIGHT = 17,
          OBSTACLE3 = 18,    OBSTACLE2TURN = 19,
          OBSTACLE4 = 20,    OBSTACLE = 21,

          Z_SNAKE = 10,      Z_TONGUE = 15,
          Z_OBSTACLE = 2,    Z_FOOD = 5,

          GRID_OBSTACLE = 1, GRID_SNAKE = 2, //things that kill the snake when eaten must be greater than 0
          GRID_FOOD = -1,    GRID_TMP_FOOD = -2, //food (things that make the snake grow) must be smaller than 0
          GRID_EMPTY = 0;

    this.initBoard = function(obstacles, num_food) {
        // initialize board with obstacles and snake
        var i;
        this.resetGrid();
        this.side = this.getBoxSide(HEAD); //head
        if (this.side % 4 !== 0) {
            console.log("The theme used may not be displayed perfectly, as it is using boxes with side:", this.side, "px.");
            console.log("It is recommended to use images with a side that is a multiple of 4, like 16, 20 or 24 px.");
        }
        this.createBoard();
        this.loadImages();
        this.addObstacles(obstacles);
        this.initSnake();
        this.initTongue();
        // this.setPosToFood(new Position(8, 2), 0);
        // this.setPosToFood(new Position(9, 2), 1);
        if (num_food == undefined || num_food < 2) {
            this.addRandomFood();
        } else {
            for (i=0; i<num_food; i++) {
                this.addRandomFood(i);
            }
        }
        //this.addRandomTemporaryFood(100, new Position(1, 0), 0);
        this.setPosToTemporaryFood(new Position(0, 2), 50, new Position(-1, 0), 0);
    }
    this.resetGrid = function() {
        // create grid and set it to all zeros
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
        var new_box, i, obstacle_image, obstacle_dir;
        for (i=0; i<obstacles.length; i++) {
            this.addObstacleToGrid(obstacles[i]);
        }
        for (i=0; i<obstacles.length; i++) {
            [obstacle_dir, obstacle_image] = this.getObstacleStyleFromGrid(obstacles[i]);
            new_box = this.addBox(obstacles[i], obstacle_dir, obstacle_image, Z_OBSTACLE, "obstacle_" + i);
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
            new_box = this.addBox(positions[i], directions[i], snake_parts[i], Z_SNAKE, "snake_cell_" + i);
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
            new_box = this.addBox(positions[i], directions[i], snake_parts[i], Z_TONGUE, "snake_tongue_" + i);
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
            box = new Box(new Position(-10000, -10000), 0, NO_DIR, box_num, 0, "tmp_box"); //z-index:0
            box.createBox(container);
            image_src = document.defaultView.getComputedStyle(box.element, null).backgroundImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2').split(',')[0];
            image = new Image();
            image.src = image_src;
            side = Math.max(image.width, image.height) || 20;
            container.remove();
            console.log("Box side:", side, "px");
        } else {
            // In IE, the size will be 20 always (anyway, I don't expect many players to use IE)
            side = 20;
        }
        return side;
    }
    this.loadImages = function() {
        // use dummy box to load all images, so they are stored in cache
        var new_box, i, num_imgs = 30;
        for (i=0; i<num_imgs; i++) {
            new_box = this.addBox(new Position(-10000, -10000), NO_DIR, i, 0, "dummy_box_" + i); //z-index:0
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
    this.getObstacleStyleFromGrid = function(pos) {
        var x = pos.x, y = pos.y, neighbors = 0, num_neighbors = 0, i, dir, img,
            neighbor_coords = [new Position(-1, 0), new Position(1, 0),
                               new Position(0, -1), new Position(0, 1)];
        for (i=0; i<neighbor_coords.length; i++) {
            neighbor_coords[i].add(pos);
            if (this.grid[neighbor_coords[i].x][neighbor_coords[i].y] === GRID_OBSTACLE) {
                neighbors += 2**i;
                num_neighbors += 1;
            }
        }
        switch(num_neighbors) {
            case 0:
                dir = NO_DIR;
                img = OBSTACLE0;
                break;
            case 1:
                img = OBSTACLE1;
                switch(neighbors) {
                    case 1:
                        dir = LEFT;
                        break;
                    case 2:
                        dir = RIGHT;
                        break;
                    case 4:
                        dir = UP;
                        break;
                    case 8:
                        dir = DOWN;
                        break;
                }
                break;
            case 2:
                switch(neighbors) {
                    case 3:
                    case 12:
                        img = OBSTACLE2STRAIGHT;
                        dir = UP;
                        break;
                    default:
                        img = OBSTACLE2TURN;
                }
                switch(neighbors) {
                    case 3:
                        dir = LEFT;
                        break;
                    case 5:
                        dir = UP;
                        break;
                    case 6:
                        dir = RIGHT;
                        break;
                    case 9:
                        dir = LEFT;
                        break;
                    case 10:
                        dir = DOWN;
                        break;
                }
                break;
            case 3:
                img = OBSTACLE3;
                switch(neighbors) {
                    case 14:
                        dir = DOWN;
                        break;
                    case 13:
                        dir = UP;
                        break;
                    case 11:
                        dir = LEFT;
                        break;
                    case 7:
                        dir = RIGHT;
                        break;
                }
                break;
            case 4:
                dir = NO_DIR;
                img = OBSTACLE4;
                break;
        }
        return [dir, img];
    }
    this.getGridValue = function(pos) {
        // warning, does not check if pos is ok
        return this.grid[pos.x][pos.y];
    }
    this.isEmpty = function(pos) {
        return this.grid[pos.x][pos.y] === GRID_EMPTY;
    }
    this.isSnake = function(pos) {
        return this.grid[pos.x][pos.y] === GRID_SNAKE;
    }
    this.isFood = function(pos) {
        return this.grid[pos.x][pos.y] < 0;
    }
    this.isObstacle = function(pos) {
        return this.grid[pos.x][pos.y] === GRID_OBSTACLE;
    }
    this.addSnakeBoxToGrid = function(pos) {
        // warning, does not check if pos is ok
        this.grid[pos.x][pos.y] = GRID_SNAKE;
    }
    this.addObstacleToGrid = function(pos) {
        // warning, does not check if pos is ok
        this.grid[pos.x][pos.y] = GRID_OBSTACLE;
    }
    this.addFoodToGrid = function(pos) {
        // warning, does not check if pos is ok
        this.grid[pos.x][pos.y] = GRID_FOOD;
    }
    this.addTemporaryFoodToGrid = function(pos) {
        // warning, does not check if pos is ok
        this.grid[pos.x][pos.y] = GRID_TMP_FOOD;
    }
    this.removeFoodFromGrid = function(pos) {
        // make sure that food disappears from grid (only necessary if we eat with tongue)
        if (this.getGridValue(pos) < 0) {
            this.removeBoxFromGrid(pos);
        }
    }
    this.removeBoxFromGrid = function(pos) {
        // warning, does not check if pos is ok
        this.grid[pos.x][pos.y] = GRID_EMPTY;
    }
    this.addBox = function(pos, dir, img, z_index, id) {
        // creates box, gives style to it (so it is shown), and returns it
        var box = new Box(pos, this.side, dir, img, z_index, id);
        box.createBox(this.element);
        return box;
    }
    this.addSmartBox = function(pos, dir, img, z_index, ttl, movement, id) {
        // creates smart box, gives style to it (so it is shown), and returns it
        var box = new SmartBox(pos, this.side, dir, img, z_index, ttl, movement, this.w, this.h, id);
        box.createBox(this.element);
        return box;
    }
    this.updateTemporaryFood = function() {
        var i, idx_food;
        for (i=0; i<this.tmp_food.length; i++) {
            this.removeFoodFromGrid(this.tmp_food[i].pos);
            if (this.tmp_food[i].advancePosition()) {
                idx_food = this.tmp_food[i].pos.findObjectIndex(this.food);
                this.removeTemporaryFood(idx_food, i);
            } else {
                this.addTemporaryFoodToGrid(this.tmp_food[i].pos);
            }
        }
    }
    this.handleFoodEaten = function(food_pos, ko_pos) {
        // handle regular or temporary food when eaten. Food will only appear again if it is regular
        var idx_food = food_pos.findObjectIndex(this.food),
            idx_tmp_food = food_pos.findObjectIndex(this.tmp_food);
        this.removeFoodFromGrid(this.food[idx_food].pos);
        if (idx_tmp_food === -1) { // new food only appears if it is not temporary
            this.moveFood(idx_food, ko_pos);
        } else {
            this.removeTemporaryFood(idx_food, idx_tmp_food);
        }
    }
    this.removeTemporaryFood = function(idx_food, idx_tmp_food) {
        this.removeFoodFromGrid(this.food[idx_food].pos);
        this.tmp_food[idx_tmp_food].removeBox();
        this.food.splice(idx_food, 1);
        this.tmp_food.splice(idx_tmp_food, 1);
    }
    this.moveFood = function(idx, ko_positions) {
        // move food in this.food[idx] to a new free random position, which cannot be in ko_positions
        var pos = this.findRandomFreePosition(), i, pos_ok;
        if (ko_positions === undefined) {
            ko_positions = [this.food[idx].pos];
        } else {
            if (this.food[idx].pos.findIndex(ko_positions) === -1) {
                ko_positions.concat(this.food[idx].pos);
            }
        }
        pos_ok = false;
        while (!pos_ok) {
            pos_ok = true;
            for (i=0; i<ko_positions.length; i++) {
                if (pos.compare(ko_positions[i])) {
                    pos = this.findRandomFreePosition();
                    pos_ok = false;
                    break;
                }
            }
        }
        this.food[idx].setPosition(pos);
        this.addFoodToGrid(pos);
    }
    this.moveSnake = function(old_head_idx, new_head_idx, direction, use_tongue, growth) {
        // move snake towards direction, save new head in old tail and move its position, so it seems that snake moves
        var eaten, death, i, tongue_pos, eaten_tongue = 0, prev_z_incr,
            new_tail_idx = (new_head_idx - 1 + this.snake.length) % this.snake.length,
            head_pos = this.getNewHeadPosition(this.snake[old_head_idx].pos, direction),
            old_tail = this.snake[new_head_idx];
        if (this.snake.length > 2) {
            //whether we eat food or not, we must erase the old head
            this.snake[old_head_idx].setToBody(direction);
        }
        this.updateTemporaryFood(); //move temporary food (if necessary)
        if (use_tongue) {
            tongue_pos = this.useTongue(head_pos, direction, this.max_z_increment);
            for (i=0; i<tongue_pos.length; i++) {
                if (this.getGridValue(tongue_pos[i]) < 0) { //food
                    eaten_tongue += 1;
                    console.log("Food eaten with tongue");
                    this.handleFoodEaten(tongue_pos[i], tongue_pos);
                }
            }
        } else {
            this.hideTongue();
        }
        [eaten, death] = this.updateSnakeInGrid(head_pos, old_tail.pos, growth);
        if (eaten) {
            this.handleFoodEaten(head_pos, tongue_pos); //if we eat while we use tongue, food will not appear in tongue
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
        if (death) {
            this.max_z_increment += 1;
            this.snake[new_head_idx].setZIncrement(this.max_z_increment); //make sure head is seen over anything it collides with
        } else {
            prev_z_incr = this.snake[new_head_idx].resetZIncrement(); //set z-index of box  to its original value
            if (prev_z_incr === this.max_z_increment) {
                this.max_z_increment = 0; //If all boxes have been reset, set max_z_increment to 0
            }
        }
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
    this.useTongue = function(pos, dir, z_incr) {
        // use the tongue (show it and eat food in front of pos)
        var i, prev_pos = pos, all_pos = [];
        for (i=0; i<this.tongue.length; i++) {
            prev_pos = this.getNewHeadPosition(prev_pos, dir);
            this.tongue[i].setZIncrement(z_incr);
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
            this.tongue[i].resetZIncrement();
            this.tongue[i].setPosition(hidden_pos);
        }
    }
    this.findRandomFreePosition = function() {
        // find position in grid that is empty. Warning, keeps searching forever
        var pos = new Position(Math.floor(Math.random() * this.w), Math.floor(Math.random() * this.h));
        while (this.getGridValue(pos) !== GRID_EMPTY) {
            pos.x = Math.floor(Math.random() * this.w);
            pos.y = Math.floor(Math.random() * this.h);
        }
        return pos;
    }
    this.addRandomFood = function(idx) {
        // create food element and place it in an empty random position
        var new_box, pos = this.findRandomFreePosition();
        this.addFoodToGrid(pos);
        if (idx === undefined) { idx = 0; }
        new_box = this.addBox(pos, NO_DIR, FOOD, Z_FOOD, "snake_food_" + idx);
        this.food.push(new_box);
    }
    this.setPosToFood = function(pos, idx) {
        // create food element and place it in a position pos
        var new_box;
        this.addFoodToGrid(pos);
        if (idx === undefined) { idx = 0; }
        new_box = this.addBox(pos, NO_DIR, FOOD, Z_FOOD, "snake_food_" + idx);
        this.food.push(new_box);
    }
    this.addRandomTemporaryFood = function(ttl, movement, idx) {
        // create temporary food element and place it in an empty random position
        var new_box, pos = this.findRandomFreePosition();
        this.addTemporaryFoodToGrid(pos);
        if (idx === undefined) { idx = 0; }
        new_box = this.addSmartBox(pos, NO_DIR, TMP_FOOD, Z_FOOD, ttl, movement, "snake_tmp_food_" + idx);
        this.food.push(new_box);
        this.tmp_food.push(new_box);
    }
    this.setPosToTemporaryFood = function(pos, ttl, movement, idx) {
        // create food element and place it in a position pos
        var new_box;
        this.addTemporaryFoodToGrid(pos);
        if (idx === undefined) { idx = 0; }
        new_box = this.addSmartBox(pos, NO_DIR, TMP_FOOD, Z_FOOD, ttl, movement, "snake_tmp_food_" + idx);
        this.food.push(new_box);
        this.tmp_food.push(new_box);
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

    // define SmartBox constructor (box that moves, changes in every iteration and dies after timeout)
    function SmartBox(pos, side, dir, images, z_index, ttl, movement, w, h, id) {
        Box.call(this, pos, side, dir, images[0] || images, z_index, id);
        this.ttl = ttl;
        this.movement = movement;
        this.max_pos = new Position(w - 1, h - 1);
        this.min_pos = new Position(0, 0);

        this.advancePosition = function() {
            this.pos.x += this.movement.x;
            this.pos.y += this.movement.y;
            this.correctPosition();
            this.updatePosition();
            this.ttl -= 1;
            return this.ttl <= 0;
        }
        this.correctPosition = function() {
            if (this.pos.x > this.max_pos.x) {
                this.pos.x = this.min_pos.x;
            } else if (this.pos.x < this.min_pos.x) {
                this.pos.x = this.max_pos.x;
            }
            if (this.pos.y > this.max_pos.y) {
                this.pos.y = this.min_pos.y;
            } else if (this.pos.y < this.min_pos.y) {
                this.pos.y = this.max_pos.y;
            }
        }
    }

    // define cell constructor
    function Box(pos, side, dir, image, z_index, id) {
        this.pos = pos;                 //(x,y) position in board
        this.px_pos = new Position(pos.x * side, pos.y * side); //px position
        this.side = side;               //px, width/height of every box
        this.z_index = z_index;         //z-index property, sets what is shown in front of what
        this.z_increment = 0;           //saves how many points has the z-index been incremented
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
                case UP: //Up
                    this.dirclass = "snake-direction-up";
                    break;
                case LEFT: //Left
                    this.dirclass = "snake-direction-left";
                    break;
                case DOWN: //Down
                    this.dirclass = "snake-direction-down";
                    break;
                case RIGHT: //Right
                    this.dirclass = "snake-direction-right";
                    break;
                default:
                    this.dirclass = "";
                    separator = "";
            }
            switch (this.image) {
                case HEAD: //Head
                    this.imageclass = "snake-snakebody-head";
                    break;
                case BODY: //Body
                    this.imageclass = "snake-snakebody-vertical";
                    break;
                case TURN_L: //Turn Left
                    this.imageclass = "snake-snakebody-turn-l";
                    break;
                case TURN_R: //Turn Right
                    this.imageclass = "snake-snakebody-turn-r";
                    break;
                case TAIL: // Tail
                    this.imageclass = "snake-snakebody-tail";
                    break;
                case BODY_FAT: // Body Eaten
                    this.imageclass = "snake-snakebody-vertical-fat";
                    break;
                case TURN_L_FAT: // Turn Left Eaten
                    this.imageclass = "snake-snakebody-turn-l-fat";
                    break;
                case TURN_R_FAT: // Turn Right Eaten
                    this.imageclass = "snake-snakebody-turn-r-fat";
                    break;
                case TAIL_FAT: // Tail Eaten
                    this.imageclass = "snake-snakebody-tail-fat";
                    break;
                case MOUTH: // Snake Open Mouth
                    this.imageclass = "snake-snakebody-open-mouth";
                    break;
                case HEAD_TONGUE: // Head Tongue
                    this.imageclass = "snake-snakebody-head-tongue";
                    break;
                case TONGUE_BODY: // Tongue Middle
                    this.imageclass = "snake-snakebody-tongue-body";
                    break;
                case TONGUE_TIP: // Tongue Tip
                    this.imageclass = "snake-snakebody-tongue-tip";
                    break;
                case FOOD: // Food
                    this.imageclass = "snake-food-block";
                    break;
                case TMP_FOOD: // Temporary Food
                    this.imageclass = "snake-tmp-food-block";
                    break;
                case OBSTACLE: // Obstacle
                    this.imageclass = "snake-snakebody-obstacle";
                    break;
                case OBSTACLE0: // Obstacle
                    this.imageclass = "snake-snakebody-obstacle0";
                    break;
                case OBSTACLE1: // Obstacle
                    this.imageclass = "snake-snakebody-obstacle1";
                    break;
                case OBSTACLE2STRAIGHT: // Obstacle
                    this.imageclass = "snake-snakebody-obstacle2a";
                    break;
                case OBSTACLE2TURN: // Obstacle
                    this.imageclass = "snake-snakebody-obstacle2b";
                    break;
                case OBSTACLE3: // Obstacle
                    this.imageclass = "snake-snakebody-obstacle3";
                    break;
                case OBSTACLE4: // Obstacle
                    this.imageclass = "snake-snakebody-obstacle4";
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
        this.setZIncrement = function(incr) {
            this.z_increment = incr;
            this.element.style.zIndex = this.z_index + this.z_increment;
        }
        this.resetZIncrement = function() {
            var prev_incr = this.z_increment;
            if (this.z_increment !== 0) {
                this.z_increment = 0;
                this.element.style.zIndex = this.z_index;
            }
            return prev_incr;
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
            this.image = HEAD; //head
            if (tongue === true) {
                this.image = HEAD_TONGUE; //head with tongue
            } else if (open_mouth === true) {
                this.image = MOUTH; //head with open mouth
            }
            this.fat = false; //make sure a new head is not fat unless purposely set later
            this.updateClass();
        }
        this.setToBody = function(head_dir) {
            // set box to "neck" or 1st body segment after head. uses head_dir to calculate turns
            var diff = 0;
            if (this.fat) {
                if (head_dir == this.dir) {
                    this.image = BODY_FAT; //body straight eaten fat after eating
                } else {
                    diff = head_dir - this.dir;
                    if (diff === 1 || diff === -3) {
                        this.image = TURN_R_FAT; //turn right fat after eating
                    } else {
                        this.image = TURN_L_FAT; //turn left fat after eating
                    }
                }
            } else {
                if (head_dir == this.dir) {
                    this.image = BODY; //body straight
                } else {
                    diff = head_dir - this.dir;
                    if (diff === 1 || diff === -3) {
                        this.image = TURN_R; //turn right
                    } else {
                        this.image = TURN_L; //turn left
                    }
                }
            }
            this.updateClass();
        }
        this.setToTail = function() {
            // set box to tail and correct tail direction after a turn
            if (this.image === TURN_L || this.image === TURN_L_FAT) {
                this.dir = (this.dir + 3) % 4;
            } else if (this.image == TURN_R || this.image == TURN_R_FAT) {
                this.dir = (this.dir + 1) % 4;
            }
            if (this.fat) {
                this.image = TAIL_FAT; //tail fat after eating
            } else{
                this.image = TAIL; //tail
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
        this.removeBox = function() {
            this.element.remove();
        }
    }
}

function Snake(board, keys, speed, AI, growth, numFood) {
    this.board = board; //holds the game board
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
        if (obstacles === undefined) {
            obstacles = [];
        }
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
        var tmp, tmp_pos,
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
                console.log("Trapped, committing suicide...");
                [allowed_dirs, allowed_pos] = this.board.getAllAllowedMovements(this.board.getSnakePosition(this.head), this.direction);
                this.isPaused = true;
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
        tmp = this.board.moveSnake(this.head, this.tail, this.direction, use_tongue, this.growth);
        this.head = tmp.head;
        this.tail = tmp.tail;
        this.useTongueUpdate();
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
                    tmp_pos = new Position(j, i);
                    if (this.board.isEmpty(tmp_pos)) { //free space
                        tmp += "..";
                    } else if (this.board.isSnake(tmp_pos)) { //snake
                        tmp += "@ ";
                    } else if (this.board.isFood(tmp_pos)) { //food
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
    1. Problem when temporary food goes over another food
    2. Fix problem board loads smaller or bigger sometimes
    3. Add obstacles with shapes (so they look like walls) --> modify so they are like original (lights and shades)
    5. Make box with snake only functions inherit from box (fat, makeHead, etc.)
    6. Make nice looking snake
    7. Implement moving food
  7.5. Handle case where there is no room for new food
  7.6. Change head so that it opens mouth when about to eat sth (attention tongue)
  7.7. Change color when dying / make snake blink when death
  7.8. Make sure tongue works fine even when dying and showing tongue, mouth open and tongue, etc
    6. Handle case in which one of the positions where the snake can go is where its tail is. From grid its seems that it is not allowed but in next movement it would be because tail would not be there anymore (carefull, stacked!)
    8. Make exact copy original game (except maybe powerups... for now)
    9. Implement and test multiplayer game
   10. Create crazy game modes: sth that when you eat you put obstacle in opponent map, sth that when you eat a food you start growing from your tail and never stop,
       sth interacting with different snakes / boards (2 snakes, one food, race) (change board when eating food) (powerups (invisibility, strength, lives, speed, smaller...))
   11. Do AI: learning from seeing play, learning from trial and error, Astar, smart Astar that can complete board, rules to always win...
*/