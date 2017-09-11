namespace GoblinRun {

    export class Player extends Phaser.Sprite {

        // -------------------------------------------------------------------------
        public constructor(game: Phaser.Game) {
            super(game, 0, 0, "Player");

            // center player sprite horizontally
            this.anchor.x = 0.5;

            // enable physics for player
            game.physics.arcade.enable(this, false);

            // allow gravity
            let body = <Phaser.Physics.Arcade.Body>this.body;
            body.allowGravity = true;
        }
    }
}
