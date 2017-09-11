namespace Generator {

    export class Difficulty {

        private _rnd: Phaser.RandomDataGenerator;

        // platform length
        private _platformLengthDecrease: number;
        // jump length
        private _jumpLengthDecrease: number;

        // -------------------------------------------------------------------------
        public constructor(rnd: Phaser.RandomDataGenerator) {
            this._rnd = rnd;

            // maximum length of platform
            this._platformLengthDecrease = Parameters.PLATFORM_LENGTH_DECREASER_MIN;
            // jump width decreaser to make jumps easier in game beginnig
            this._jumpLengthDecrease = Parameters.JUMP_LENGTH_DECREASER_MIN;
        }

        // -------------------------------------------------------------------------
        public get platformLengthDecrease(): number {
            return this._platformLengthDecrease;
        }

        // -------------------------------------------------------------------------
        public get jumpLengthDecrease(): number {
            return this._jumpLengthDecrease;
        }

        // -------------------------------------------------------------------------
        public mapLinear(x: number, a1: number, a2: number, b1: number, b2: number): number {
            x = Phaser.Math.clamp(x, a1, a2);
            return Phaser.Math.mapLinear(x, a1, a2, b1, b2);
        }

        // -------------------------------------------------------------------------
        public update(tileX: number): void {
            // platform length
            this._platformLengthDecrease = Math.round(this.mapLinear(tileX,
                Parameters.PLATFORM_LENGTH_DECREASER_START_TILE, Parameters.PLATFORM_LENGTH_DECREASER_END_TILE,
                Parameters.PLATFORM_LENGTH_DECREASER_MIN, Parameters.PLATFORM_LENGTH_DECREASER_MAX));

            // jump length
            this._jumpLengthDecrease = Math.round(this.mapLinear(tileX,
                Parameters.JUMP_LENGTH_DECREASER_START_TILE, Parameters.JUMP_LENGTH_DECREASER_END_TILE,
                Parameters.JUMP_LENGTH_DECREASER_MIN, Parameters.JUMP_LENGTH_DECREASER_MAX));
        }

        // -------------------------------------------------------------------------
        public toString(): string {
            return "platformLengthDecrease: " + this._platformLengthDecrease +
                ", jumpLengthDecrease: " + this.jumpLengthDecrease;
        }
    }
}
