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

            // sound fx
            // iterate through all audiosprites
            //for (let property in Sounds.AUDIO_JSON.spritemap) {
            //    let audioSprite = Sounds.AUDIO_JSON.spritemap[property];
            //    console.log("name: " + property + ", value: " + JSON.stringify(audioSprite));
            //}
            this.load.audiosprite("Sfx", Sounds.AUDIO_JSON.resources, null, Sounds.AUDIO_JSON);

            // music
            this.load.audio("MusicGame", ["assets/MusicGame.ogg", "assets/MusicGame.m4a"]);
            this.load.audio("MusicMenu", ["assets/MusicMenu.ogg", "assets/MusicMenu.m4a"]);
        }

        // -------------------------------------------------------------------------
        public create() {
            // sound
            Sounds.sfx = this.add.audioSprite("Sfx");

            // music
            Sounds.musicGame = this.add.audio("MusicGame");
            Sounds.musicGame.loop = true;
            Sounds.musicMenu = this.add.audio("MusicMenu");
            Sounds.musicMenu.loop = true;
        }

        // -------------------------------------------------------------------------
        public update() {
            // run only once
            if (this._ready === false &&
                this.cache.isSoundDecoded("Sfx") &&
                this.cache.isSoundDecoded("MusicGame") &&
                this.cache.isSoundDecoded("MusicMenu")) {

                this._ready = true;

                this.game.state.start("Play");
            }
        }
    }
}
