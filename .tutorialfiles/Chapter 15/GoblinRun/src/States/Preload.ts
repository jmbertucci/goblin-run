namespace GoblinRun {

    export class Preload extends Phaser.State {

        // music decoded, ready for game
        private _ready: boolean = false;

        // -------------------------------------------------------------------------
        public preload() {
            //this.load.image("Block", "assets/Block.png");
            //this.load.image("Player", "assets/Player.png");

            // atlas
            this.load.atlas("Sprites", "assets/Sprites.png", "assets/Sprites.json");

            // spriter anim
            this.load.xml("GoblinAnim", "assets/Goblin.xml");

            // background layer sprites
            this.load.image("Mud", "assets/Mud.png");
            this.load.image("Hill", "assets/Hill.png");
            this.load.image("TreesBg", "assets/TreesBg.png");

            // font
            this.load.bitmapFont("Font", "assets/Font.png", "assets/Font.xml");
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
