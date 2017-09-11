namespace GoblinRun {

    export class Preload extends Phaser.State {

        // music decoded, ready for game
        private _ready: boolean = false;

        // -------------------------------------------------------------------------
        public preload() {
            this.load.image("Block", "assets/Block.png");
            this.load.image("Player", "assets/Player.png");

            this.load.atlas("Sprites", "assets/Sprites.png", "assets/Sprites.json");
        }

        // -------------------------------------------------------------------------
        public create() {

        }

        // -------------------------------------------------------------------------
        public update() {
            // run only once
            if (this._ready === false) {
                this._ready = true;

                this.game.state.start("Play");
            }
        }
    }
}
