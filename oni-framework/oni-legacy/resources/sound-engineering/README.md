# Sound Engineering Resources

Resources for audio design in ONI Framework videos and presentations.

## Contents

| Document | Purpose |
|----------|---------|
| [ONI_VIDEO_SOUND_DESIGN.md](ONI_VIDEO_SOUND_DESIGN.md) | Complete sound design documentation for ONI demo video |

## Quick Reference

### Audio Files Location
All audio files for the ONI demo video are in:
```
MAIN/legacy-core/oni-product-demo/public/audio/
```

### Key Frequencies

| Frequency | Effect | Use Case |
|-----------|--------|----------|
| 60-80Hz | Presence, power | Sub-bass pulses |
| 60 BPM | Calm, trust | Rhythmic elements |
| Perfect 5th | Wonder, openness | Harmonic content |

### ElevenLabs Sound Generation
```bash
API_KEY=$(security find-generic-password -s "elevenlabs-api" -a "oni-demo" -w)
curl -s "https://api.elevenlabs.io/v1/sound-generation" \
  -H "xi-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "description", "duration_seconds": 5, "prompt_influence": 0.5}' \
  --output sound.mp3
```

---

*Last Updated: 2026-01-29*
