namespace GoblinRun {

    export class Play extends Phaser.State {

        private _mainLayer: MainLayer;

        // player
        private _player: Player;
        private _jumpTimer: number = 0;

        // status
        private _gameOver: boolean = false;

        // input
        private _jumpKey: Phaser.Key;
        private _justDown: boolean = false;
        private _justUp: boolean = false;

        // -------------------------------------------------------------------------
        public render() {
            this._mainLayer.render();
        }

        // -------------------------------------------------------------------------
        public create() {
            this.stage.backgroundColor = 0xC0C0C0;

            // camera
            this.camera.bounds = null;

            // physics
            this.physics.arcade.gravity.y = Generator.Parameters.GRAVITY;


            //Generator.JumpTables.setDebug(true, GoblinRun.Global);
            Generator.JumpTables.instance;

            // this.game.add.sprite(0, 0, Generator.JumpTables.debugBitmapData);

            this._mainLayer = new MainLayer(this.game, this.world);


            // set player
            this._player = new Player(this.game);
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
        }

        // -------------------------------------------------------------------------
        public update() {
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
        }

        // -------------------------------------------------------------------------
        private updatePhysics(): void {
            let body = <Phaser.Physics.Arcade.Body>this._player.body;

            // collision with walls
            let wallCollision = this.physics.arcade.collide(this._player, this._mainLayer.walls);


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

            let jumpTable = Generator.JumpTables.instance;

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
        }
    }
}
