namespace GoblinRun {

    export class Play extends Phaser.State {

        // background
        private _bg: Background;

        // main layer with platforms
        private _mainLayer: MainLayer;

        // player
        private _player: Player;
        private _jumpTimer: number = 0;
        private _bonusJump: boolean = false;

        // status
        private _gameOver: boolean = false;

        // input
        private _jumpKey: Phaser.Key;
        private _justDown: boolean = false;
        private _justUp: boolean = false;

        // score
        private _score: number = 0;
        private _scoreUI: ScoreUI;

        // -------------------------------------------------------------------------
        public render() {
            // this._mainLayer.render();
            //this.game.debug.body(this._player, "RGBA(255, 0, 0, 0.2)");
        }

        // -------------------------------------------------------------------------
        public create() {
            this.stage.backgroundColor = 0xA0DA6F;

            // camera
            this.camera.bounds = null;

            // physics
            this.physics.arcade.gravity.y = Generator.Parameters.GRAVITY;


            //Generator.JumpTables.setDebug(true, GoblinRun.Global);
            Generator.JumpTables.instance;

            // this.game.add.sprite(0, 0, Generator.JumpTables.debugBitmapData);


            // background layers
            this._bg = new Background(this.game, this.world);

            // layer with platforms
            this._mainLayer = new MainLayer(this.game, this.world);


            // set player
            this._player = new Player(this.game);
            this._player.position.set(96, 64 * 1);
            this.world.add(this._player);


            // score UI on screen
            this._scoreUI = new ScoreUI(this.game, this.world);
            this._scoreUI.fixedToCamera = true;
            this._scoreUI.cameraOffset.set(45, 30);


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
                this.camera.x = this._player.x - 256; //192;

                // generate level
                this._mainLayer.generate(this.camera.x / Generator.Parameters.CELL_SIZE);
            }


            // check if player is still on screen
            if (this._player.y > this.game.height - 104) {
                this._player.y = this.game.height - 104;
                this._gameOver = true;

                this._player.animateDeath();
                console.log("GAME OVER - fall");
            }


            // update player animations
            let body = <Phaser.Physics.Arcade.Body>this._player.body;
            this._player.updateAnim(body.velocity.y >= 0 && body.touching.down, body.velocity.y, this._gameOver);

            // move background
            this._bg.updateLayers(this.camera.x);
        }

        // -------------------------------------------------------------------------
        private updatePhysics(): void {
            let body = <Phaser.Physics.Arcade.Body>this._player.body;

            // overlap with items - spikes, bonuses, ...
            this.physics.arcade.overlap(this._player, this._mainLayer.items, this.onOverlap, null, this);
            if (this._gameOver) {
                return;
            }


            // clear touching
            body.touching.none = true;
            body.touching.up = body.touching.down = body.touching.left = body.touching.right = false;

            // collision with walls
            let wallCollision = this.physics.arcade.collide(this._player, this._mainLayer.walls);


            // move
            if (wallCollision && body.touching.right) {
                body.velocity.set(0, 0);
                this._gameOver = true;

                this._player.animateHit();
                console.log("GAME OVER - hit");
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
            if ((this._justDown && body.touching.down && this.game.time.now > this._jumpTimer) ||
                (this._justDown && this._bonusJump)) {
                body.velocity.y = jumpTable.maxJumpVelocity;
                this._jumpTimer = this.game.time.now + 150;
                this._justDown = false;
                this._bonusJump = false;

                this._player.animateJump();
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

        // -------------------------------------------------------------------------
        private onOverlap(player: Phaser.Sprite, item: Item): void {

            if (item.itemType === eItemType.SPIKE) {
                <Phaser.Physics.Arcade.Body>this._player.body.velocity.set(0, 0);

                this._player.animateHit();
                console.log("GAME OVER - spike");

                this._gameOver = true;

            } else if (item.itemType === eItemType.BONUS_JUMP) {
                this._bonusJump = true;
                this._mainLayer.removeItem(item);

            } else if (item.itemType === eItemType.GOLD) {
                this._mainLayer.removeItem(item);

                // add score and make bounce effect of score icon
                this._score += 100;
                this._scoreUI.score = this._score;
                this._scoreUI.bounce();
            }
        }
    }
}
