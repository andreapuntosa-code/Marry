"""Voce locale gratuita (Kokoro, voci italiane if_sara / im_nicola).

Uso (lo chiama scripts/tts.mjs):  python3 scripts/tts_kokoro.py scenes.json public/audio [id_scena ...]
Requisiti: pip install kokoro-onnx soundfile numpy  +  i modelli kokoro-v1.0.onnx e voices-v1.0.bin
in una cartella indicata da KOKORO_MODELS (default: ./models).
Stampa su stdout un JSON {id: {duration, sentences: [[inizio, fine], ...]}}.
"""
import json, os, re, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

scenes_path, out_dir, *only = sys.argv[1:]
cfg = json.load(open(scenes_path, encoding="utf-8"))
kc = cfg.get("voice", {}).get("kokoro", {})
pause = cfg.get("timing", {}).get("sentencePause", 0.28)
models = os.environ.get("KOKORO_MODELS", os.path.join(os.path.dirname(scenes_path), "models"))
k = Kokoro(os.path.join(models, "kokoro-v1.0.onnx"), os.path.join(models, "voices-v1.0.bin"))
pron = {key.lower(): v for key, v in kc.get("pronunciations", {}).items()}
SR = 24000


def fix(sentence):
    """Sostituisce le parole difficili (es. inglesi) solo per la sintesi; i sottotitoli restano invariati."""
    def rep(m):
        w = m.group(0)
        return pron.get(w.lower(), w)
    return re.sub(r"[\w']+", rep, sentence)


def trim(y, thr=0.012):
    idx = np.where(np.abs(y) > thr * np.abs(y).max())[0]
    return y if len(idx) == 0 else y[max(0, idx[0] - 240): idx[-1] + 600]


result = {}
for scene in cfg["scenes"]:
    if only and scene["id"] not in only:
        continue
    sentences = [s for s in re.split(r"(?<=[.?!…])\s+", scene["narration"]) if s]
    parts, spans, t = [], [], 0.08
    parts.append(np.zeros(int(0.08 * SR), np.float32))
    for i, s in enumerate(sentences):
        y, sr = k.create(fix(s), voice=kc.get("voice", "if_sara"), speed=kc.get("speed", 1.0), lang=kc.get("lang", "it"))
        y = trim(np.asarray(y, np.float32))
        spans.append([round(t, 3), round(t + len(y) / SR, 3)])
        parts.append(y)
        t += len(y) / SR
        gap = pause * (1.6 if s.endswith("...") else 1.0) if i < len(sentences) - 1 else 0.3
        parts.append(np.zeros(int(gap * SR), np.float32))
        t += gap
    audio = np.concatenate(parts)
    audio = (audio / (np.abs(audio).max() + 1e-9) * 0.89).astype(np.float32)
    sf.write(os.path.join(out_dir, scene["id"] + ".wav"), audio, SR)
    result[scene["id"]] = {"duration": round(len(audio) / SR, 3), "sentences": spans}
    print(f"  kokoro {scene['id']}: {len(audio) / SR:.2f} s", file=sys.stderr)

print(json.dumps(result))
