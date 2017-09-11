setlocal
set "PATH=%path%;d:\Utils\FFMPEG\bin"
audiosprite --output Sfx --path assets --export ogg,m4a --format jukebox --bitrate 64 --samplerate 44100 --channels 1 end.wav bonus_jump.wav gold.wav hit.wav jump.wav land.wav mud_fall.wav select.wav
