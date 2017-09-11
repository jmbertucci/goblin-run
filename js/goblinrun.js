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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var GoblinRun;
(function (GoblinRun) {
    var Game = (function (_super) {
        __extends(Game, _super);
        // -------------------------------------------------------------------------
        function Game() {
            var _this = 
            // init game
            _super.call(this, GoblinRun.Global.GAME_WIDTH, GoblinRun.Global.GAME_HEIGHT, Phaser.AUTO, "content") || this;
            // states
            _this.state.add("Boot", GoblinRun.Boot);
            _this.state.add("Preload", GoblinRun.Preload);
            _this.state.add("Play", GoblinRun.Play);
            // start
            _this.state.start("Boot");
            return _this;
        }
        return Game;
    }(Phaser.Game));
    GoblinRun.Game = Game;
})(GoblinRun || (GoblinRun = {}));
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
        /**
         * all height samples
         */
        JumpTables.prototype.calculateJumpVelocities = function () {
            for (var step = 0; step <= Generator.Parameters.HEIGHT_STEPS; step++) {
                var height = this.getMaxHeightForStep(step);
                this._jumpVelocities[step] = this.getJumpVelocity(height);
            }
        };
        // -------------------------------------------------------------------------
        JumpTables.prototype.calculateJumpTables = function () {
            // all jump velocities
            for (var height = 0; height <= Generator.Parameters.HEIGHT_STEPS; height++) {
                this._jumpDefs[height] = [];
                // step from left to right on cell
                for (var step = 0; step < Generator.Parameters.CELL_STEPS; step++) {
                    this.calculateJumpCurve(step, height);
                }
            }
            // analyze created jump tables
            this.analyzeJumpTables();
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
                    // console.log("LEVEL: " + jump.offsetY + " - jump from " + this.minOffsetX(jump.offsetY));
                }
                // get only last startX, because it has biggest x offset
                jumps = this._jumpDefs[velocity][this._jumpDefs[velocity].length - 1];
                for (var j = 0; j < jumps.length; j++) {
                    var jump = jumps[j];
                    var currentMax = this._jumpOffsetXMaxs[jump.offsetY];
                    this._jumpOffsetXMaxs[jump.offsetY] = (typeof currentMax !== "undefined") ?
                        Math.max(currentMax, jump.offsetX) : jump.offsetX;
                    // console.log("LEVEL: " + jump.offsetY + " - jump to " + this.maxOffsetX(jump.offsetY));
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
        JumpTables.prototype.calculateJumpCurve = function (step, jumpIndex) {
            // simulation timestep
            var timeStep = 1 / 60;
            // take jump velocity we calculated previously
            var velocity = this._jumpVelocities[jumpIndex];
            // start at middle of first step to spread samples better over cell
            // x and y positions are in pixels
            var x = step * Generator.Parameters.CELL_SIZE / Generator.Parameters.CELL_STEPS + Generator.Parameters.CELL_SIZE / Generator.Parameters.CELL_STEPS / 2;
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
                                console.log(jump.toString());
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
        /**
         * maximum height of jump for this step.
         * HEIGHT_MIN + (HEIGHT_MAX - HEIGHT_MIN) / HEIGHT_STEPS * step;
         * @param step
         */
        JumpTables.prototype.getMaxHeightForStep = function (step) {
            return Generator.Parameters.HEIGHT_MIN + (Generator.Parameters.HEIGHT_MAX - Generator.Parameters.HEIGHT_MIN) / Generator.Parameters.HEIGHT_STEPS * step;
        };
        /**
         * // v = sqrt(-(2 * s * g))
         * @param height
         */
        JumpTables.prototype.getJumpVelocity = function (height) {
            return -Math.sqrt(2 * height * Generator.Parameters.GRAVITY);
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
    }()); // export class JumpTables
    Generator.JumpTables = JumpTables;
})(Generator || (Generator = {})); // namespace Generator
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
        Parameters.HEIGHT_DELTA = Parameters.HEIGHT_MAX - Parameters.HEIGHT_MIN;
        Parameters.HEIGHT_STEPS = 4;
        // horizontal speed
        Parameters.VELOCITY_X = 300;
        return Parameters;
    }());
    Generator.Parameters = Parameters;
})(Generator || (Generator = {}));
var GoblinRun;
(function (GoblinRun) {
    var Boot = (function (_super) {
        __extends(Boot, _super);
        function Boot() {
            return _super !== null && _super.apply(this, arguments) || this;
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
    var Play = (function (_super) {
        __extends(Play, _super);
        function Play() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        // -------------------------------------------------------------------------
        Play.prototype.create = function () {
            this.stage.backgroundColor = 0x80FF80;
            Generator.JumpTables.setDebug(true, GoblinRun.Global);
            Generator.JumpTables.instance;
            this.game.add.sprite(0, 0, Generator.JumpTables.debugBitmapData);
        };
        // -------------------------------------------------------------------------
        Play.prototype.update = function () {
        };
        return Play;
    }(Phaser.State));
    GoblinRun.Play = Play;
})(GoblinRun || (GoblinRun = {}));
var GoblinRun;
(function (GoblinRun) {
    var Preload = (function (_super) {
        __extends(Preload, _super);
        function Preload() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            // music decoded, ready for game
            _this._ready = false;
            return _this;
        }
        // -------------------------------------------------------------------------
        Preload.prototype.preload = function () {
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
//# sourceMappingURL=goblinrun.js.map