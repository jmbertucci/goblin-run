namespace Generator {

    export class Parameters {

        // grid
        public static GRID_HEIGHT = 10;
        public static CELL_SIZE = 64;
        public static CELL_STEPS = 4;

        // gravity
        public static GRAVITY = 2400;

        // player body dimensions
        public static PLAYER_BODY_WIDTH = 30;
        public static PLAYER_BODY_HEIGHT = 90;

        // jump height params
        public static HEIGHT_MIN = Parameters.CELL_SIZE * 0.75;
        public static HEIGHT_MAX = Parameters.CELL_SIZE * 2.90;
        public static HEIGHT_STEPS = 4;

        // horizontal speed
        public static VELOCITY_X = 300;

        // bounds for generating platforms
        public static UBOUND = 2;
        public static LBOUND = 8;


        // --- GENERATOR ---
        // probability to generate random piece in percent
        public static GENERATE_RANDOM = 50;
        // keep length of all platforms in pattern the same? (in percent)
        public static KEEP_LENGTH_IN_PATTERN = 75;


        // --- DIFFICULTY ---
        // platform length
        public static PLATFORM_LENGTH_MIN = 2;
        public static PLATFORM_LENGTH_MAX = 5;
        public static PLATFORM_LENGTH_DECREASER_MIN = 0;
        public static PLATFORM_LENGTH_DECREASER_MAX = -2;
        public static PLATFORM_LENGTH_DECREASER_START_TILE = 100;
        public static PLATFORM_LENGTH_DECREASER_END_TILE = 200;

        // jump length
        public static JUMP_LENGTH_DECREASER_MIN = -1;
        public static JUMP_LENGTH_DECREASER_MAX = 0;
        public static JUMP_LENGTH_DECREASER_START_TILE = 0;
        public static JUMP_LENGTH_DECREASER_END_TILE = 50;
    }
}
