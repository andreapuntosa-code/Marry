# -*- coding: utf-8 -*-
"""Voice synthesis with Kokoro (narrator + AI characters), one clip per segment."""
import os, sys, json, time
import numpy as np, soundfile as sf

MODELS = os.environ.get("MODELS_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/models")
OUT = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice365")

# voice, speed, language
VOICES = {
    "narr":  ("am_puck", 1.0, "en-us"),
    "wren":  ("af_sky", 0.98, "en-us"),
    "oak":   ("am_michael", 0.92, "en-us"),
    "fern":  ("af_nicole", 0.92, "en-us"),
    "bram":  ("bm_lewis", 0.95, "en-gb"),
    "moss":  ("bm_george", 0.85, "en-gb"),
    "ivy":   ("bf_emma", 0.95, "en-gb"),
    "thorn": ("am_onyx", 0.92, "en-us"),
    "sol":   ("am_adam", 0.92, "en-us"),
    "dune":  ("am_liam", 1.0, "en-us"),
    "ash":   ("bm_daniel", 0.95, "en-gb"),
    "kesh":  ("am_fenrir", 0.9, "en-us"),
    "lark":  ("bf_isabella", 0.92, "en-gb"),
    "reed":  ("am_eric", 1.0, "en-us"),
    "mara":  ("af_jessica", 0.97, "en-us"),
}


def trim(x, sr, thr_db=-52, pad_start=0.02, pad_end=0.14):
    env = np.abs(x)
    win = int(sr * 0.01)
    e = np.convolve(env, np.ones(win) / win, mode="same")
    thr = 10 ** (thr_db / 20) * max(1e-6, e.max())
    idx = np.where(e > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad_start * sr)); b = min(len(x), idx[-1] + int(pad_end * sr))
    return x[a:b]


def main(only=None):
    from kokoro_onnx import Kokoro
    import script_en
    os.makedirs(OUT, exist_ok=True)
    k = Kokoro(f"{MODELS}/kokoro-v1.0.onnx", f"{MODELS}/voices-v1.0.bin")
    path = f"{OUT}/durations.json"
    info = json.load(open(path)) if (only and os.path.exists(path)) else {}
    for seg in script_en.SEGMENTS:
        sid = seg["id"]
        if only and sid not in only:
            continue
        voice, speed, lang = VOICES[seg["voice"]]
        t0 = time.time()
        s, sr = k.create(seg["tts"], voice=voice, speed=speed, lang=lang)
        s = trim(np.asarray(s, dtype=np.float32), sr)
        sf.write(f"{OUT}/{sid}.wav", s, sr)
        info[sid] = {"dur": len(s) / sr, "sr": sr, "voice": seg["voice"]}
        print(sid, round(len(s) / sr, 2), "s", round(time.time() - t0, 1), flush=True)
        json.dump(info, open(path, "w"), indent=1)
    print("TOTAL speech:", round(sum(v["dur"] for v in info.values()), 1))


if __name__ == "__main__":
    main(sys.argv[1:] or None)
