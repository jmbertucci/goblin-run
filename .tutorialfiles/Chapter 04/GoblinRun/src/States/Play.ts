namespace GoblinRun {

    export class Play extends Phaser.State {

        // -------------------------------------------------------------------------
        public create() {
            this.stage.backgroundColor = 0x80FF80;

            Generator.JumpTables.setDebug(true, GoblinRun.Global);

            Generator.JumpTables.instance;

            this.game.add.sprite(0, 0, Generator.JumpTables.debugBitmapData);
        }

        // -------------------------------------------------------------------------
        public update() {

        }
    }
}
