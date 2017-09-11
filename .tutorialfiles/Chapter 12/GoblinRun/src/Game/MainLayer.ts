namespace GoblinRun {

    const enum eGenerateState { PROCESS_PIECE, GENERATE_PIECE }

    const enum eTileType { LEFT, MIDDLE, RIGHT }

    interface IGamePiece extends Generator.Piece {
        isPlatform: boolean;
    }

    export const enum eItemType {SPIKE, BONUS_JUMP, GOLD }

    export class Item extends Phaser.Sprite {
        itemType: eItemType;
    }

    export class MainLayer extends Phaser.Group {

        private _generator: Generator.Generator;

        private _wallsPool: Helper.Pool<Phaser.Sprite>;
        private _walls: Phaser.Group;

        private _itemsPool: Helper.Pool<Item>;
        private _items: Phaser.Group;

        private _lastTile: Phaser.Point = new Phaser.Point(0, 0);
        private _state: eGenerateState;

        // piece generated with generator
        // private _piece: Generator.Piece = null;

        private _difficulty: Generator.Difficulty;

        // -------------------------------------------------------------------------
        public render(): void {
            //this._walls.forEachExists(function (sprite: Phaser.Sprite) {
            //    this.game.debug.body(sprite);
            //}, this);

            this._items.forEachExists(function (item: Phaser.Sprite) {
                this.game.debug.body(item);
            }, this);
        }

        // -------------------------------------------------------------------------
        public constructor(game: Phaser.Game, parent: PIXI.DisplayObjectContainer) {
            super(game, parent);

            // platforms generator
            this._generator = new Generator.Generator(game.rnd);
            this._generator.onRandomPlatform.add(this.onRandomPlatform, this);
            this._generator.onPatternPlatform.add(this.onPatternPlatform, this);

            // object that holds level difficulty progress
            this._difficulty = new Generator.Difficulty(game.rnd);

            // pool of walls
            this._wallsPool = new Helper.Pool<Phaser.Sprite>(Phaser.Sprite, 32, function () {
                // add empty sprite with body
                let sprite = new Phaser.Sprite(game, 0, 0, "Sprites");
                game.physics.enable(sprite, Phaser.Physics.ARCADE);

                let body = <Phaser.Physics.Arcade.Body>sprite.body;
                body.allowGravity = false;
                body.immovable = true;
                body.moves = false;
                body.setSize(64, 64, 0, 0);

                return sprite;
            });

            // walls group
            this._walls = new Phaser.Group(game, this);

            // pool of items
            this._itemsPool = new Helper.Pool<Item>(Item, 32, function () {
                // empty item
                let item = new Item(game, 0, 0, "Sprites");

                // add animations
                item.animations.add("spikes", Animations.SPIKE_ANIM, 10, true);
                item.animations.add("bonusJump", Animations.BONUS_JUMP_ANIM, 10, true);

                // enable physics
                game.physics.enable(item, Phaser.Physics.ARCADE);

                // setup physics
                let body = <Phaser.Physics.Arcade.Body>item.body;
                body.allowGravity = false;
                body.immovable = true;
                body.moves = false;

                return item;
            });

            // items group
            this._items = new Phaser.Group(game, this);

            // set initial tile for generating
            // this._piece = this._generator.setPiece(0, 5, 10);
            this._generator.setPiece(0, 5, 10);
            this._state = eGenerateState.PROCESS_PIECE;
        }

        // -------------------------------------------------------------------------
        public generate(leftTile: number): void {
            // remove tiles too far to left
            this.cleanTiles(leftTile);
            // do the same for items
            this.cleanItems(leftTile);

            // width of screen rounded to whole tiles up
            let width = Math.ceil(this.game.width / Generator.Parameters.CELL_SIZE);

            // generate platforms until we generate platform that ends out of the screen on right
            while (this._lastTile.x < leftTile + width) {

                switch (this._state) {

                    case eGenerateState.PROCESS_PIECE:
                        {
                            // check if queue not empty - should never happen
                            if (!this._generator.hasPieces) {
                                console.error("Pieces queue is empty!");
                            }

                            let piece = this._generator.getPieceFromQueue();

                            this._lastTile.copyFrom(piece.position);
                            let length = piece.length;
                            let tileType = eTileType.LEFT;

                            // process piece
                            while (length > 0) {
                                if (piece.bonusJump) {
                                    this.addBonus(this._lastTile.x, this._lastTile.y);
                                } else {
                                    this.addTiles(this._lastTile.x, this._lastTile.y,
                                        tileType, (<IGamePiece>piece).isPlatform,
                                        (piece.spikesPattern & (1 << (length - 1))) > 0);
                                }

                                if ((--length) > 0) {
                                    ++this._lastTile.x;
                                }

                                tileType = (length === 1) ? eTileType.RIGHT : eTileType.MIDDLE;
                            }

                            // return processed piece into pool
                            this._generator.destroyPiece(piece);

                            // generate next platform
                            if (!this._generator.hasPieces) {
                                this._state = eGenerateState.GENERATE_PIECE;
                            }

                            break;
                        }


                    case eGenerateState.GENERATE_PIECE:
                        {
                            this._difficulty.update(leftTile);

                            this._generator.generatePieces(this._lastTile, this._difficulty);

                            this._state = eGenerateState.PROCESS_PIECE;

                            break;
                        }
                }
            }
        }

        // -------------------------------------------------------------------------
        private cleanTiles(leftTile: number) : void {
            leftTile *= Generator.Parameters.CELL_SIZE;

            for (let i = this._walls.length - 1; i >= 0; i--) {
                let wall = <Phaser.Sprite>this._walls.getChildAt(i);

                if (wall.x - leftTile <= -64) {
                    this._walls.remove(wall);
                    wall.parent = null;
                    this._wallsPool.destroyItem(wall);
                }
            }
        }

        // -------------------------------------------------------------------------
        private cleanItems(leftTile: number): void {
            leftTile *= Generator.Parameters.CELL_SIZE;

            for (let i = this._items.length - 1; i >= 0; i--) {
                let item = <Item>this._items.getChildAt(i);

                if (item.x - leftTile <= -64) {
                    this._items.remove(item);
                    item.parent = null;
                    this._itemsPool.destroyItem(item);
                }
            }
        }

        // -------------------------------------------------------------------------
        private addTiles(x: number, y: number, type: eTileType, platform: boolean, spike: boolean): void {

            let defs: ITileDef[][];

            // find right defs
            if (platform) {
                defs = BlockDefs.PLATFORM;
            } else if (y === Generator.Parameters.LBOUND) {
                defs = BlockDefs.LOW_BLOCK;
            } else {
                defs = BlockDefs.BLOCK;
            }


            // number of vertical tiles
            let rowsCount = platform ? 1 : Generator.Parameters.LBOUND - y + 1;

            for (let r = y; r < y + rowsCount; r++) {

                // find correct block definition
                let blockDef: ITileDef;
                if (defs !== BlockDefs.BLOCK) {
                    blockDef = defs[0][type];
                } else {
                    if (r === y) {
                        blockDef = defs[0][type];
                    } else if (r < y + rowsCount - 1) {
                        blockDef = defs[1][type];
                    } else {
                        blockDef = defs[2][type];
                    }
                }

                // sprite  get from pool
                let sprite = this._wallsPool.createItem();
                sprite.position.set(x * 64, r * 64);

                sprite.exists = true;
                sprite.visible = true;

                // adjust sprite to match block definition
                sprite.frameName = blockDef.name;
                sprite.anchor.set(blockDef.anchorX, blockDef.anchorY);
                let body = <Phaser.Physics.Arcade.Body>sprite.body;
                body.setSize(blockDef.bodyWidth, blockDef.bodyHeight, blockDef.bodyOffsetX, blockDef.bodyOffsetY);

                // add into walls group
                if (sprite.parent === null) {
                    this._walls.add(sprite);
                }


                // spikes
                if (spike && r === y) {
                    let spikeSprite = this._itemsPool.createItem();
                    spikeSprite.itemType = eItemType.SPIKE;

                    spikeSprite.position.set(x * 64 + 32, r * 64 + 8);

                    spikeSprite.exists = true;
                    spikeSprite.visible = true;

                    this.setupItem(spikeSprite, BlockDefs.SPIKES, true, true);

                    if (spikeSprite.parent === null) {
                        this._items.add(spikeSprite);
                    }
                }
            }
        }

        // -------------------------------------------------------------------------
        private addBonus(x: number, y: number): void {
            let jumpBonus = this._itemsPool.createItem();
            jumpBonus.itemType = eItemType.BONUS_JUMP;

            jumpBonus.position.set(x * 64 + 32, y * 64);

            jumpBonus.exists = true;
            jumpBonus.visible = true;

            this.setupItem(jumpBonus, BlockDefs.BONUS_JUMP, true, false);

            if (jumpBonus.parent === null) {
                this._items.add(jumpBonus);
            }
        }

        // -------------------------------------------------------------------------
        public removeItem(item: Item): void {
            this._items.remove(item);
            item.parent = null;
            this._itemsPool.destroyItem(item);
        }

        // -------------------------------------------------------------------------
        private setupItem(item: Item, def: ITileDef, animated: boolean, syncAnim: boolean): void {
            // anchor
            item.anchor.set(def.anchorX, def.anchorY);
            // body dimensions and offset
            (<Phaser.Physics.Arcade.Body>item.body).setSize(
                def.bodyWidth, def.bodyHeight, def.bodyOffsetX, def.bodyOffsetY);

            if (animated) {
                item.animations.play(def.name);

                // if request to synchronize animation with other items of the same type
                if (syncAnim) {
                    let prevItem = this.getItemOfType(item.itemType);
                    if (prevItem !== null) {
                        item.animations.currentAnim["_frameIndex"] = prevItem.animations.currentAnim["_frameIndex"];
                        item.animations.currentAnim["_timeNextFrame"] = prevItem.animations.currentAnim["_timeNextFrame"];
                    }
                }
            } else {
                // stop any previous animation
                item.animations.stop();
                // set frame
                item.frameName = def.name;
            }
        }

        // -------------------------------------------------------------------------
        private getItemOfType(type: eItemType): Item {
            for (let i = 0; i < this._items.length; i++) {
                let object = <Item>this._items.getChildAt(i);
                if (object.itemType === type) {
                    return object;
                }
            }

            return null;
        }

        // -------------------------------------------------------------------------
        public get walls(): Phaser.Group {
            return this._walls;
        }

        // -------------------------------------------------------------------------
        public get items(): Phaser.Group {
            return this._items;
        }

        // -------------------------------------------------------------------------
        public onRandomPlatform(piece: IGamePiece, previous: IGamePiece): void {
            this.setPlatform(piece);
        }

        // -------------------------------------------------------------------------
        public onPatternPlatform(piece: IGamePiece, previous: IGamePiece,
            position: number, repeat: number, template: IGamePiece): void {

            // first platform in pattern?
            if (position === 0 && repeat === 0) {
                this.setPlatform(piece);
            } else if (repeat === 0) {  // still in base pieces?
                // randomly decide on whether to follow previous piece setting
                if (this.game.rnd.integerInRange(0, 99) < 50) {
                    piece.isPlatform = previous.isPlatform;
                } else {
                    this.setPlatform(piece);                    
                }
            } else {
                // high probability to follow base pices settings
                if (this.game.rnd.integerInRange(0, 99) < 90) {
                    piece.isPlatform = template.isPlatform;
                } else {
                    this.setPlatform(piece);                    
                }
            }
        }

        // -------------------------------------------------------------------------
        private setPlatform(piece: IGamePiece): void {
            // draw as block or platform?
            let platformProb = 100 - (piece.position.y - Generator.Parameters.UBOUND) * 20;
            piece.isPlatform = this.game.rnd.integerInRange(0, 99) < platformProb;
        }
    }
}
