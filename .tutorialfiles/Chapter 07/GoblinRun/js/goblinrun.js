var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var GoblinRun;
(function (GoblinRun) {
    var Global = (function () {
        function Global() {
        }
        // game size
        Global.GAME_WIDTH = 1024;
        Global.GAME_HEIGHT = 640;
        return Global;
    }());
    GoblinRun.Global = Global;
})(GoblinRun || (GoblinRun = {}));
// -------------------------------------------------------------------------
window.onload = function () {
    GoblinRun.Global.game = new GoblinRun.Game();
};
var GoblinRun;
(function (GoblinRun) {
    var Game = (function (_super) {
        __extends(Game, _super);
        // -------------------------------------------------------------------------
        function Game() {
            // init game
            _super.call(this, GoblinRun.Global.GAME_WIDTH, GoblinRun.Global.GAME_HEIGHT, Phaser.AUTO, "content");
            // states
            this.state.add("Boot", GoblinRun.Boot);
            this.state.add("Preload", GoblinRun.Preload);
            this.state.add("Play", GoblinRun.Play);
            // start
            this.state.start("Boot");
        }
        return Game;
    }(Phaser.Game));
    GoblinRun.Game = Game;
})(GoblinRun || (GoblinRun = {}));
var GoblinRun;
(function (GoblinRun) {
    var MainLayer = (function (_super) {
        __extends(MainLayer, _super);
        // -------------------------------------------------------------------------
        function MainLayer(game, parent) {
            _super.call(this, game, parent);
            this._lastTile = new Phaser.Point(0, 0);
            // platforms generator
            this._generator = new Generator.Generator(game.rnd);
            // object that holds level difficulty progress
            this._difficulty = new Generator.Difficulty(game.rnd);
            // pool of walls
            this._wallsPool = new Helper.Pool(Phaser.Sprite, 32, function () {
                // add empty sprite with body
                var sprite = new Phaser.Sprite(game, 0, 0, "Block");
                game.physics.enable(sprite, Phaser.Physics.ARCADE);
                var body = sprite.body;
                body.allowGravity = false;
                body.immovable = true;
                body.moves = false;
                body.setSize(64, 64, 0, 0);
                return sprite;
            });
            // walls group
            this._walls = new Phaser.Group(game, this);
            // set initial tile for generating
            // this._piece = this._generator.setPiece(0, 5, 10);
            this._generator.setPiece(0, 5, 10);
            this._state = 0 /* PROCESS_PIECE */;
        }
        // -------------------------------------------------------------------------
        MainLayer.prototype.render = function () {
            this._walls.forEachExists(function (sprite) {
                this.game.debug.body(sprite);
            }, this);
        };
        // -------------------------------------------------------------------------
        MainLayer.prototype.generate = function (leftTile) {
            // remove tiles too far to left
            this.cleanTiles(leftTile);
            // width of screen rounded to whole tiles up
            var width = Math.ceil(this.game.width / Generator.Parameters.CELL_SIZE);
            // generate platforms until we generate platform that ends out of the screen on right
            while (this._lastTile.x < leftTile + width) {
                switch (this._state) {
                    case 0 /* PROCESS_PIECE */:
                        {
                            // check if queue not empty - should never happen
                            if (!this._generator.hasPieces) {
                                console.error("Pieces queue is empty!");
                            }
                            var piece = this._generator.getPieceFromQueue();
                            this._lastTile.copyFrom(piece.position);
                            var length_1 = piece.length;
                            // process piece
                            while (length_1 > 0) {
                                this.addBlock(this._lastTile.x, this._lastTile.y);
                                if ((--length_1) > 0) {
                                    ++this._lastTile.x;
                                }
                            }
                            // return processed piece into pool
                            this._generator.destroyPiece(piece);
                            // generate next platform
                            if (!this._generator.hasPieces) {
                                this._state = 1 /* GENERATE_PIECE */;
                            }
                            break;
                        }
                    case 1 /* GENERATE_PIECE */:
                        {
                            this._difficulty.update(leftTile);
                            this._generator.generatePieces(this._lastTile, this._difficulty);
                            this._state = 0 /* PROCESS_PIECE */;
                            break;
                        }
                }
            }
        };
        // -------------------------------------------------------------------------
        MainLayer.prototype.cleanTiles = function (leftTile) {
            leftTile *= Generator.Parameters.CELL_SIZE;
            for (var i = this._walls.length - 1; i >= 0; i--) {
                var wall = this._walls.getChildAt(i);
                if (wall.x - leftTile <= -64) {
                    this._walls.remove(wall);
                    wall.parent = null;
                    this._wallsPool.destroyItem(wall);
                }
            }
        };
        // -------------------------------------------------------------------------
        MainLayer.prototype.addBlock = function (x, y) {
            // sprite  get from pool
            var sprite = this._wallsPool.createItem();
            sprite.position.set(x * 64, y * 64);
            sprite.exists = true;
            sprite.visible = true;
            // add into walls group
            if (sprite.parent === null) {
                this._walls.add(sprite);
            }
        };
        Object.defineProperty(MainLayer.prototype, "walls", {
            // -------------------------------------------------------------------------
            get: function () {
                return this._walls;
            },
            enumerable: true,
            configurable: true
        });
        return MainLayer;
    }(Phaser.Group));
    GoblinRun.MainLayer = MainLayer;
})(GoblinRun || (GoblinRun = {}));
var GoblinRun;
(function (GoblinRun) {
    var Player = (function (_super) {
        __extends(Player, _super);
        // -------------------------------------------------------------------------
        function Player(game) {
            _super.call(this, game, 0, 0, "Player");
            // center player sprite horizontally
            this.anchor.x = 0.5;
            // enable physics for player
            game.physics.arcade.enable(this, false);
            // allow gravity
            var body = this.body;
            body.allowGravity = true;
        }
        return Player;
    }(Phaser.Sprite));
    GoblinRun.Player = Player;
})(GoblinRun || (GoblinRun = {}));
var Generator;
(function (Generator) {
    var Difficulty = (function () {
        // -------------------------------------------------------------------------
        function Difficulty(rnd) {
            this._rnd = rnd;
            // maximum length of platform
            this._platformLengthDecrease = Generator.Parameters.PLATFORM_LENGTH_DECREASER_MIN;
            // jump width decreaser to make jumps easier in game beginnig
            this._jumpLengthDecrease = Generator.Parameters.JUMP_LENGTH_DECREASER_MIN;
        }
        Object.defineProperty(Difficulty.prototype, "platformLengthDecrease", {
            // -------------------------------------------------------------------------
            get: function () {
                return this._platformLengthDecrease;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Difficulty.prototype, "jumpLengthDecrease", {
            // -------------------------------------------------------------------------
            get: function () {
                return this._jumpLengthDecrease;
            },
            enumerable: true,
            configurable: true
        });
        // -------------------------------------------------------------------------
        Difficulty.prototype.mapLinear = function (x, a1, a2, b1, b2) {
            x = Phaser.Math.clamp(x, a1, a2);
            return Phaser.Math.mapLinear(x, a1, a2, b1, b2);
        };
        // -------------------------------------------------------------------------
        Difficulty.prototype.update = function (tileX) {
            // platform length
            this._platformLengthDecrease = Math.round(this.mapLinear(tileX, Generator.Parameters.PLATFORM_LENGTH_DECREASER_START_TILE, Generator.Parameters.PLATFORM_LENGTH_DECREASER_END_TILE, Generator.Parameters.PLATFORM_LENGTH_DECREASER_MIN, Generator.Parameters.PLATFORM_LENGTH_DECREASER_MAX));
            // jump length
            this._jumpLengthDecrease = Math.round(this.mapLinear(tileX, Generator.Parameters.JUMP_LENGTH_DECREASER_START_TILE, Generator.Parameters.JUMP_LENGTH_DECREASER_END_TILE, Generator.Parameters.JUMP_LENGTH_DECREASER_MIN, Generator.Parameters.JUMP_LENGTH_DECREASER_MAX));
        };
        // -------------------------------------------------------------------------
        Difficulty.prototype.toString = function () {
            return "platformLengthDecrease: " + this._platformLengthDecrease +
                ", jumpLengthDecrease: " + this.jumpLengthDecrease;
        };
        return Difficulty;
    }());
    Generator.Difficulty = Difficulty;
})(Generator || (Generator = {}));
var Generator;
(function (Generator_1) {
    var UNDEFINED = -10000;
    var Generator = (function () {
        // -------------------------------------------------------------------------
        function Generator(rnd) {
            this._lastGeneratedPiece = null;
            // pieces queue
            this._piecesQueue = [];
            this._piecesQueueTop = 0;
            this._hlpPoint = new Phaser.Point();
            // random numbers generator
            this._rnd = rnd;
            // reference to jump tables
            this._jumpTables = Generator_1.JumpTables.instance;
            // pool of pieces
            this._piecesPool = new Helper.Pool(Generator_1.Piece, 16);
        }
        // -------------------------------------------------------------------------
        Generator.prototype.createPiece = function () {
            var piece = this._piecesPool.createItem();
            if (piece === null) {
                console.error("No free pieces in pool");
            }
            return piece;
        };
        // -------------------------------------------------------------------------
        Generator.prototype.destroyPiece = function (piece) {
            this._piecesPool.destroyItem(piece);
        };
        Object.defineProperty(Generator.prototype, "hasPieces", {
            // -------------------------------------------------------------------------
            get: function () {
                return this._piecesQueueTop > 0;
            },
            enumerable: true,
            configurable: true
        });
        // -------------------------------------------------------------------------
        Generator.prototype.addPieceIntoQueue = function (piece) {
            // put new piece into queue and increase its length
            this._piecesQueue[this._piecesQueueTop++] = piece;
        };
        // -------------------------------------------------------------------------
        Generator.prototype.getPieceFromQueue = function () {
            // if no pieces in queue then return null
            if (this._piecesQueueTop === 0) {
                return null;
            }
            // get first piece in queue
            var piece = this._piecesQueue[0];
            // shift remaining pieces left by 1
            for (var i = 0; i < this._piecesQueueTop - 1; i++) {
                this._piecesQueue[i] = this._piecesQueue[i + 1];
            }
            // clear last slot in queue and decrease queue top
            this._piecesQueue[--this._piecesQueueTop] = null;
            return piece;
        };
        // -------------------------------------------------------------------------
        Generator.prototype.setPiece = function (x, y, length, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            var piece = this.createPiece();
            piece.position.set(x, y);
            piece.offset.set(offsetX, offsetY);
            piece.length = length;
            this.addPieceIntoQueue(piece);
            return piece;
        };
        // -------------------------------------------------------------------------
        Generator.prototype.generate = function (lastPosition, difficulty, length, offsetX, offsetY, bonusJump) {
            var piece = this.createPiece();
            var ubound = Generator_1.Parameters.UBOUND;
            var lbound = Generator_1.Parameters.LBOUND;
            // Y POSITION
            // how high can jump max
            var minY = this._jumpTables.maxOffsetY();
            // how deep can fall max
            // let maxY = lbound - ubound;
            var maxY = -minY;
            // clear last y from upper bound, so it starts from 0
            var currentY = lastPosition.y - ubound;
            var shiftY = offsetY;
            if (shiftY === UNDEFINED) {
                // new random y position - each y level on screen has the same probability
                shiftY = this._rnd.integerInRange(0, lbound - ubound);
                // substract currentY from shiftY - it will split possible y levels to negative
                // (how much step up (-)) and positive (how much to step down (+))
                shiftY -= currentY;
                // clamp step to keep it inside interval given with maximum 
                // jump offset up (minY) and maximum fall down (maxX)
                shiftY = Phaser.Math.clamp(shiftY, minY, maxY);
            }
            // new level for platform
            // limit once more against game limits (2 free tiles on top, 1 water tile at bottom)
            var newY = Phaser.Math.clamp(currentY + shiftY, 0, lbound - ubound);
            // shift by upper bound to get right y level on screen
            piece.position.y = newY + ubound;
            // offset of new piece relative to last position (end position of last piece)
            piece.offset.y = piece.position.y - lastPosition.y;
            // X POSITION
            var shiftX = offsetX;
            // calculate is offsetX is not forced or offsetY was forced, but final value is different
            if (shiftX === UNDEFINED || (offsetY !== UNDEFINED && offsetY !== piece.offset.y)) {
                var minX = this._jumpTables.minOffsetX(piece.offset.y);
                var maxX = this._jumpTables.maxOffsetX(piece.offset.y);
                // decrease maximum jump distance with jump decreaser in difficulty to
                // make jumps easier in the beginning of game
                // But be sure it does not fall under minX
                maxX = Math.max(minX, maxX + difficulty.jumpLengthDecrease);
                // position of next tile in x direction
                shiftX = this._rnd.integerInRange(minX, maxX);
            }
            // new absolute x position
            piece.position.x = lastPosition.x + shiftX;
            // offset of new piece relative to last position (end position of last piece)
            piece.offset.x = shiftX;
            // LENGTH
            if (length !== UNDEFINED) {
                piece.length = length;
            }
            else {
                // decrease maximum length of platform with difficulty progress
                piece.length = this._rnd.integerInRange(Generator_1.Parameters.PLATFORM_LENGTH_MIN, Generator_1.Parameters.PLATFORM_LENGTH_MAX + difficulty.platformLengthDecrease);
            }
            console.log(difficulty.toString());
            // RESULT
            this._lastGeneratedPiece = piece;
            return piece;
        };
        // -------------------------------------------------------------------------
        Generator.prototype.generatePieces = function (lastTile, difficulty) {
            var probability = this._rnd.integerInRange(0, 99);
            if (probability < Generator_1.Parameters.GENERATE_RANDOM) {
                this.generateRandomly(lastTile, difficulty);
            }
            else {
                this.generatePattern(lastTile, difficulty);
            }
        };
        // -------------------------------------------------------------------------
        Generator.prototype.generateRandomly = function (lastTile, difficulty) {
            var piece = this.generate(lastTile, difficulty, UNDEFINED, UNDEFINED, UNDEFINED, false);
            // add to queue
            this.addPieceIntoQueue(piece);
        };
        // -------------------------------------------------------------------------
        Generator.prototype.generatePattern = function (lastTile, difficulty) {
            // save index of first new piece
            var oldQueueTop = this._piecesQueueTop;
            // where to start generating
            var hlpPos = this._hlpPoint;
            hlpPos.copyFrom(lastTile);
            // same length for all pices?
            var length = UNDEFINED;
            if (this._rnd.integerInRange(0, 99) < Generator_1.Parameters.KEEP_LENGTH_IN_PATTERN) {
                length = this._rnd.integerInRange(Generator_1.Parameters.PLATFORM_LENGTH_MIN, Generator_1.Parameters.PLATFORM_LENGTH_MAX + difficulty.platformLengthDecrease);
            }
            // how many pieces to repeat in pattern
            var basePices = 2;
            for (var i = 0; i < basePices; i++) {
                var piece = this.generate(hlpPos, difficulty, length, UNDEFINED, UNDEFINED, false);
                hlpPos.copyFrom(piece.position);
                // get last tile of piece
                hlpPos.x += piece.length - 1;
                // add to queue
                this.addPieceIntoQueue(piece);
            }
            // repeat pattern X times
            var repeat = 1;
            for (var i = 0; i < repeat; i++) {
                // repeat all pieces in pattern
                for (var p = 0; p < basePices; p++) {
                    // get first piece in pattern to repeat as template
                    var templetePiece = this._piecesQueue[oldQueueTop + p];
                    // replicate it
                    var piece = this.generate(hlpPos, difficulty, length, templetePiece.offset.x, templetePiece.offset.y, false);
                    hlpPos.copyFrom(piece.position);
                    hlpPos.x += piece.length - 1;
                    // add to stack
                    this.addPieceIntoQueue(piece);
                }
            }
        };
        return Generator;
    }());
    Generator_1.Generator = Generator;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var Jump = (function () {
        function Jump() {
            this.offsetY = 0;
            this.offsetX = 0;
        }
        // -------------------------------------------------------------------------
        Jump.prototype.toString = function () {
            return "offsetX: " + this.offsetX + ", offsetY: " + this.offsetY;
        };
        return Jump;
    }());
    Generator.Jump = Jump;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var JumpTables = (function () {
        // -------------------------------------------------------------------------
        function JumpTables() {
            // velocities
            this._jumpVelocities = [];
            // list of possible jumps for each jump velocity and position within cell
            this._jumpDefs = [];
            // results of jump table analysis
            this._jumpOffsetsY = [];
            this._jumpOffsetYMax = 0;
            this._jumpOffsetXMins = {};
            this._jumpOffsetXMaxs = {};
            this.calculateJumpVelocities();
            this.calculateJumpTables();
        }
        Object.defineProperty(JumpTables, "instance", {
            // -------------------------------------------------------------------------
            get: function () {
                if (JumpTables._instance === null) {
                    JumpTables._instance = new JumpTables();
                }
                return JumpTables._instance;
            },
            enumerable: true,
            configurable: true
        });
        // -------------------------------------------------------------------------
        JumpTables.prototype.calculateJumpVelocities = function () {
            // all height samples
            for (var i = 0; i <= Generator.Parameters.HEIGHT_STEPS; i++) {
                // maximum height of jump for this step
                var height = Generator.Parameters.HEIGHT_MIN + (Generator.Parameters.HEIGHT_MAX - Generator.Parameters.HEIGHT_MIN) / Generator.Parameters.HEIGHT_STEPS * i;
                // v = sqrt(-(2 * s * g))
                this._jumpVelocities[i] = -Math.sqrt(2 * height * Generator.Parameters.GRAVITY);
            }
        };
        Object.defineProperty(JumpTables.prototype, "minJumpVelocity", {
            // -------------------------------------------------------------------------
            get: function () {
                return this._jumpVelocities[0];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(JumpTables.prototype, "maxJumpVelocity", {
            // -------------------------------------------------------------------------
            get: function () {
                return this._jumpVelocities[this._jumpVelocities.length - 1];
            },
            enumerable: true,
            configurable: true
        });
        // -------------------------------------------------------------------------
        // ---------------------------- JUMP TABLES --------------------------------
        // -------------------------------------------------------------------------
        JumpTables.prototype.calculateJumpTables = function () {
            // all jump velocities
            for (var height = 0; height <= Generator.Parameters.HEIGHT_STEPS; height++) {
                this._jumpDefs[height] = [];
                // step from left to right on cell
                for (var step = 0; step < 1 /*Parameters.CELL_STEPS*/; step++) {
                    this.calculateJumpCurve(step, height);
                }
            }
            // analyze created jump tables
            this.analyzeJumpTables();
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype.calculateJumpCurve = function (step, jumpIndex) {
            // simulation timestep
            var timeStep = 1 / 60;
            // take jump velocity we calculated previously
            var velocity = this._jumpVelocities[jumpIndex];
            // start at middle of first step to spread samples better over cell
            // x and y positions are in pixels
            var x = step * Generator.Parameters.CELL_SIZE / Generator.Parameters.CELL_STEPS
                + Generator.Parameters.CELL_SIZE / Generator.Parameters.CELL_STEPS / 2;
            var y = 0;
            // y position in cells coordinates (row within grid)
            var cellY = 0;
            // help variables to track previous position
            var prevX, prevY;
            // array of jumps from starting position to possible destinations
            var jumpDefs = [];
            // helper object that will help us keep track of visited cells
            var visitedList = {};
            // half of player body width
            var playerWidthHalf = Generator.Parameters.PLAYER_BODY_WIDTH / 2 * 0.5;
            // debug
            var debugBitmap = (JumpTables._DEBUG) ? JumpTables.debugBitmapData : null;
            // offset drawing of curve little bit down (by 4 cells),
            // otherwise it will be cut at top as we start jump at point [x, 0]
            var yOffset = Generator.Parameters.CELL_SIZE * 4;
            // simulate physics
            while (cellY < Generator.Parameters.GRID_HEIGHT) {
                // save previous position
                prevX = x;
                prevY = y;
                // adjust velocity
                velocity += Generator.Parameters.GRAVITY * timeStep;
                // new posiiton
                y += velocity * timeStep;
                x += Generator.Parameters.VELOCITY_X * timeStep;
                // draw path - small white dot
                if (JumpTables._DEBUG) {
                    debugBitmap.rect(x, y + yOffset, 2, 2, "#FFFFFF");
                }
                // left and right bottom point based on body width.
                var leftCell = void 0, rightCell = void 0;
                cellY = Math.floor(y / Generator.Parameters.CELL_SIZE);
                // falling down
                if (velocity > 0) {
                    // crossed cell border to next vertical cell?
                    if (cellY > Math.floor(prevY / Generator.Parameters.CELL_SIZE)) {
                        // calc as intersection of line from prev. position and current position with grid horizontal line
                        var pixelBorderY = Math.floor(y / Generator.Parameters.CELL_SIZE) * Generator.Parameters.CELL_SIZE;
                        var pixelBorderX = prevX + (x - prevX) * (pixelBorderY - prevY) / (y - prevY);
                        leftCell = Math.floor((pixelBorderX - playerWidthHalf) / Generator.Parameters.CELL_SIZE);
                        rightCell = Math.floor((pixelBorderX + playerWidthHalf) / Generator.Parameters.CELL_SIZE);
                        // all cells in x direction occupied with body
                        for (var i = leftCell; i <= rightCell; i++) {
                            var visitedId = i + (cellY << 8);
                            // if not already in list, then add new jump to reach this cell
                            if (typeof visitedList[visitedId] === "undefined") {
                                var jump = new Generator.Jump();
                                jump.offsetX = i;
                                jump.offsetY = cellY;
                                jumpDefs.push(jump);
                            }
                        }
                        // debug
                        if (JumpTables._DEBUG) {
                            // debug draw
                            var py = pixelBorderY + yOffset;
                            // line with original body width
                            var color = "#4040FF";
                            var pxLeft = pixelBorderX - Generator.Parameters.PLAYER_BODY_WIDTH / 2;
                            var pxRight = pixelBorderX + Generator.Parameters.PLAYER_BODY_WIDTH / 2;
                            debugBitmap.line(pxLeft, py, pxRight, py, color);
                            color = "#0000FF";
                            pxLeft = pixelBorderX - playerWidthHalf;
                            pxRight = pixelBorderX + playerWidthHalf;
                            // line with shortened body width
                            debugBitmap.line(pxLeft, py, pxRight, py, color);
                            debugBitmap.line(pxLeft, py - 3, pxLeft, py + 3, color);
                            debugBitmap.line(pxRight, py - 3, pxRight, py + 3, color);
                        }
                    }
                }
                leftCell = Math.floor((x - playerWidthHalf) / Generator.Parameters.CELL_SIZE);
                rightCell = Math.floor((x + playerWidthHalf) / Generator.Parameters.CELL_SIZE);
                // add grid cells to visited
                for (var i = leftCell; i <= rightCell; i++) {
                    // make "id"
                    var visitedId = i + (cellY << 8);
                    if (typeof visitedList[visitedId] === "undefined") {
                        visitedList[visitedId] = visitedId;
                    }
                }
            }
            this._jumpDefs[jumpIndex][step] = jumpDefs;
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype.analyzeJumpTables = function () {
            // min y
            this._jumpOffsetYMax = 0;
            // through all jump velocities
            for (var velocity = 0; velocity < this._jumpDefs.length; velocity++) {
                // get only first x position within cell and first jump for given velocity,
                // because all have the same height
                this._jumpOffsetsY[velocity] = this._jumpDefs[velocity][0][0].offsetY;
                // check for maximum offset in y direction.
                // As it is negative number, we are looking for min in fact
                this._jumpOffsetYMax = Math.min(this._jumpOffsetYMax, this._jumpOffsetsY[velocity]);
            }
            // find minimum and maximum offset in cells to jump to at given height level
            for (var velocity = 1; velocity < this._jumpDefs.length; velocity++) {
                // get only first startX, because it has smallest x offset
                var jumps = this._jumpDefs[velocity][0];
                for (var j = 0; j < jumps.length; j++) {
                    var jump = jumps[j];
                    var currentMin = this._jumpOffsetXMins[jump.offsetY];
                    this._jumpOffsetXMins[jump.offsetY] = (typeof currentMin !== "undefined") ?
                        Math.min(currentMin, jump.offsetX) : jump.offsetX;
                }
                // get only last startX, because it has biggest x offset
                jumps = this._jumpDefs[velocity][this._jumpDefs[velocity].length - 1];
                for (var j = 0; j < jumps.length; j++) {
                    var jump = jumps[j];
                    var currentMax = this._jumpOffsetXMaxs[jump.offsetY];
                    this._jumpOffsetXMaxs[jump.offsetY] = (typeof currentMax !== "undefined") ?
                        Math.max(currentMax, jump.offsetX) : jump.offsetX;
                }
            }
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype.maxOffsetY = function (jumpIndex) {
            if (jumpIndex === void 0) { jumpIndex = -1; }
            if (jumpIndex === -1) {
                return this._jumpOffsetYMax;
            }
            else {
                return this._jumpOffsetsY[jumpIndex];
            }
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype.maxOffsetX = function (offsetY) {
            var maxX = this._jumpOffsetXMaxs[offsetY];
            if (typeof maxX === "undefined") {
                console.error("max X for offset y = " + offsetY + " does not exist");
                maxX = 0;
            }
            return maxX;
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype.minOffsetX = function (offsetY) {
            var minX = this._jumpOffsetXMins[offsetY];
            if (typeof minX === "undefined") {
                console.error("min X for offset y = " + offsetY + " does not exist");
                minX = 0;
            }
            return minX;
        };
        // -------------------------------------------------------------------------
        JumpTables.setDebug = function (debug, gameGlobals) {
            JumpTables._DEBUG = debug;
            JumpTables._globals = gameGlobals;
            if (debug) {
                if (typeof gameGlobals === "undefined" || gameGlobals === null) {
                    console.warn("No game globals provided - switching debug off");
                    JumpTables._DEBUG = false;
                }
                else {
                    JumpTables.createDebugBitmap();
                }
            }
        };
        Object.defineProperty(JumpTables, "debugBitmapData", {
            // -------------------------------------------------------------------------
            get: function () {
                return JumpTables._debugBmd;
            },
            enumerable: true,
            configurable: true
        });
        // -------------------------------------------------------------------------
        JumpTables.createDebugBitmap = function () {
            var global = JumpTables._globals;
            var bmd = new Phaser.BitmapData(global.game, "Grid", global.GAME_WIDTH, global.GAME_HEIGHT);
            bmd.fill(192, 192, 192);
            // horizontal lines
            for (var i = 0; i < global.GAME_HEIGHT; i += Generator.Parameters.CELL_SIZE) {
                bmd.line(0, i + 0.5, global.GAME_WIDTH - 1, i + 0.5);
            }
            // vertical lines
            for (var i = 0; i < global.GAME_WIDTH; i += Generator.Parameters.CELL_SIZE) {
                bmd.line(i + 0.5, 0, i + 0.5, global.GAME_HEIGHT - 1);
                // add columns header numbers
                bmd.text("" + (i / Generator.Parameters.CELL_SIZE), i + 20, 20, "24px Courier", "#FFFF00");
            }
            JumpTables._debugBmd = bmd;
        };
        JumpTables._instance = null;
        // -------------------------------------------------------------------------
        // ------------------------------ DEBUG ------------------------------------
        // -------------------------------------------------------------------------
        JumpTables._DEBUG = false;
        return JumpTables;
    }());
    Generator.JumpTables = JumpTables;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var Parameters = (function () {
        function Parameters() {
        }
        // grid
        Parameters.GRID_HEIGHT = 10;
        Parameters.CELL_SIZE = 64;
        Parameters.CELL_STEPS = 4;
        // gravity
        Parameters.GRAVITY = 2400;
        // player body dimensions
        Parameters.PLAYER_BODY_WIDTH = 30;
        Parameters.PLAYER_BODY_HEIGHT = 90;
        // jump height params
        Parameters.HEIGHT_MIN = Parameters.CELL_SIZE * 0.75;
        Parameters.HEIGHT_MAX = Parameters.CELL_SIZE * 2.90;
        Parameters.HEIGHT_STEPS = 4;
        // horizontal speed
        Parameters.VELOCITY_X = 300;
        // bounds for generating platforms
        Parameters.UBOUND = 2;
        Parameters.LBOUND = 8;
        // --- GENERATOR ---
        // probability to generate random piece in percent
        Parameters.GENERATE_RANDOM = 50;
        // keep length of all platforms in pattern the same? (in percent)
        Parameters.KEEP_LENGTH_IN_PATTERN = 75;
        // --- DIFFICULTY ---
        // platform length
        Parameters.PLATFORM_LENGTH_MIN = 2;
        Parameters.PLATFORM_LENGTH_MAX = 5;
        Parameters.PLATFORM_LENGTH_DECREASER_MIN = 0;
        Parameters.PLATFORM_LENGTH_DECREASER_MAX = -2;
        Parameters.PLATFORM_LENGTH_DECREASER_START_TILE = 100;
        Parameters.PLATFORM_LENGTH_DECREASER_END_TILE = 200;
        // jump length
        Parameters.JUMP_LENGTH_DECREASER_MIN = -1;
        Parameters.JUMP_LENGTH_DECREASER_MAX = 0;
        Parameters.JUMP_LENGTH_DECREASER_START_TILE = 0;
        Parameters.JUMP_LENGTH_DECREASER_END_TILE = 50;
        return Parameters;
    }());
    Generator.Parameters = Parameters;
})(Generator || (Generator = {}));
var Generator;
(function (Generator) {
    var Piece = (function () {
        function Piece() {
            // absolute position of left cell / tile
            this.position = new Phaser.Point(0, 0);
            // offset from end of previous piece
            this.offset = new Phaser.Point(0, 0);
        }
        return Piece;
    }());
    Generator.Piece = Piece;
})(Generator || (Generator = {}));
var Helper;
(function (Helper) {
    var Pool = (function () {
        // -------------------------------------------------------------------------
        function Pool(classType, count, newFunction) {
            if (newFunction === void 0) { newFunction = null; }
            this._newFunction = null;
            this._count = 0;
            this._pool = [];
            this._canGrow = true;
            this._poolSize = 0;
            this._classType = classType;
            this._newFunction = newFunction;
            for (var i = 0; i < count; i++) {
                // create new item
                var item = this.newItem();
                // store into stack of free items
                this._pool[this._count++] = item;
            }
        }
        // -------------------------------------------------------------------------
        Pool.prototype.createItem = function () {
            if (this._count === 0) {
                return this._canGrow ? this.newItem() : null;
            }
            else {
                return this._pool[--this._count];
            }
        };
        // -------------------------------------------------------------------------
        Pool.prototype.destroyItem = function (item) {
            this._pool[this._count++] = item;
        };
        // -------------------------------------------------------------------------
        Pool.prototype.newItem = function () {
            ++this._poolSize;
            if (this._newFunction !== null) {
                return this._newFunction();
            }
            else {
                return new this._classType;
            }
        };
        Object.defineProperty(Pool.prototype, "newFunction", {
            // -------------------------------------------------------------------------
            set: function (newFunction) {
                this._newFunction = newFunction;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Pool.prototype, "canGrow", {
            // -------------------------------------------------------------------------
            set: function (canGrow) {
                this._canGrow = canGrow;
            },
            enumerable: true,
            configurable: true
        });
        return Pool;
    }());
    Helper.Pool = Pool;
})(Helper || (Helper = {}));
var GoblinRun;
(function (GoblinRun) {
    var Boot = (function (_super) {
        __extends(Boot, _super);
        function Boot() {
            _super.apply(this, arguments);
        }
        // -------------------------------------------------------------------------
        Boot.prototype.create = function () {
            this.game.state.start("Preload");
        };
        return Boot;
    }(Phaser.State));
    GoblinRun.Boot = Boot;
})(GoblinRun || (GoblinRun = {}));
var GoblinRun;
(function (GoblinRun) {
    var Preload = (function (_super) {
        __extends(Preload, _super);
        function Preload() {
            _super.apply(this, arguments);
            // music decoded, ready for game
            this._ready = false;
        }
        // -------------------------------------------------------------------------
        Preload.prototype.preload = function () {
            this.load.image("Block", "assets/Block.png");
            this.load.image("Player", "assets/Player.png");
        };
        // -------------------------------------------------------------------------
        Preload.prototype.create = function () {
        };
        // -------------------------------------------------------------------------
        Preload.prototype.update = function () {
            // run only once
            if (this._ready === false) {
                this._ready = true;
                this.game.state.start("Play");
            }
        };
        return Preload;
    }(Phaser.State));
    GoblinRun.Preload = Preload;
})(GoblinRun || (GoblinRun = {}));
var GoblinRun;
(function (GoblinRun) {
    var Play = (function (_super) {
        __extends(Play, _super);
        function Play() {
            _super.apply(this, arguments);
            this._jumpTimer = 0;
            // status
            this._gameOver = false;
            this._justDown = false;
            this._justUp = false;
        }
        // -------------------------------------------------------------------------
        Play.prototype.render = function () {
            this._mainLayer.render();
        };
        // -------------------------------------------------------------------------
        Play.prototype.create = function () {
            this.stage.backgroundColor = 0xC0C0C0;
            // camera
            this.camera.bounds = null;
            // physics
            this.physics.arcade.gravity.y = Generator.Parameters.GRAVITY;
            //Generator.JumpTables.setDebug(true, GoblinRun.Global);
            Generator.JumpTables.instance;
            // this.game.add.sprite(0, 0, Generator.JumpTables.debugBitmapData);
            this._mainLayer = new GoblinRun.MainLayer(this.game, this.world);
            // set player
            this._player = new GoblinRun.Player(this.game);
            this._player.position.set(96, 64 * 1);
            this.world.add(this._player);
            // input
            // key
            this._jumpKey = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
            // mouse
            this.game.input.onDown.add(function () {
                this._justDown = true;
            }, this);
            this.game.input.onUp.add(function () {
                this._justUp = true;
            }, this);
        };
        // -------------------------------------------------------------------------
        Play.prototype.update = function () {
            if (!this._gameOver) {
                this.updatePhysics();
                // move camera
                this.camera.x = this._player.x - 96;
                // generate level
                this._mainLayer.generate(this.camera.x / Generator.Parameters.CELL_SIZE);
                // check if player is still on screen
                if (this._player.y > this.game.height) {
                    console.log("GAME OVER");
                    this._gameOver = true;
                }
            }
        };
        // -------------------------------------------------------------------------
        Play.prototype.updatePhysics = function () {
            var body = this._player.body;
            // collision with walls
            var wallCollision = this.physics.arcade.collide(this._player, this._mainLayer.walls);
            // move
            if (wallCollision && body.touching.right) {
                body.velocity.set(0, 0);
                this._gameOver = true;
                console.log("GAME OVER");
                return;
            }
            // set body velocity
            body.velocity.x = Generator.Parameters.VELOCITY_X;
            // read keyboard
            if (this._jumpKey.justDown) {
                this._justDown = true;
            }
            if (this._jumpKey.justUp) {
                this._justUp = true;
            }
            var jumpTable = Generator.JumpTables.instance;
            // start jump
            if (this._justDown && body.touching.down && this.game.time.now > this._jumpTimer) {
                body.velocity.y = jumpTable.maxJumpVelocity;
                this._jumpTimer = this.game.time.now + 150;
                this._justDown = false;
            }
            // stop jump
            if (this._justUp && body.velocity.y < jumpTable.minJumpVelocity) {
                body.velocity.y = jumpTable.minJumpVelocity;
            }
            // if down pressed, but player is going up, then clear it
            if (body.velocity.y <= 0) {
                this._justDown = false;
            }
            // if key is released then clear down press
            if (this._justUp) {
                this._justDown = false;
            }
            // just up was processed - clear it
            this._justUp = false;
        };
        return Play;
    }(Phaser.State));
    GoblinRun.Play = Play;
})(GoblinRun || (GoblinRun = {}));
//# sourceMappingURL=goblinrun.js.map