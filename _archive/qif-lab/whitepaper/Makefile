# QIF Whitepaper — Build Pipeline
# One command: make whitepaper
#
# Steps:
#   1. Render .qmd → HTML via Quarto
#   2. Generate per-section audio via Kokoro TTS
#   3. Convert WAV → MP3 via ffmpeg
#   4. Re-render to embed updated JS (audio player reads manifest)
#
# Requirements:
#   pip install kokoro soundfile beautifulsoup4
#   brew install ffmpeg quarto

VOICE       ?= af_heart
AUDIO_DIR   := audio
OUTPUT_DIR  := _output
OUTPUT_HTML := $(OUTPUT_DIR)/qif-whitepaper.html
DEPLOY_DIR  := /Users/mac/Documents/PROJECTS/qinnovates/qinnovate/docs/whitepaper

.PHONY: whitepaper render audio mp3 deploy clean help

## whitepaper : Full pipeline — render, generate audio, deploy
whitepaper: render audio mp3
	@echo ""
	@echo "✓ Whitepaper built with audio narration"
	@echo "  HTML: $(OUTPUT_HTML)"
	@echo "  Audio: $(AUDIO_DIR)/*.mp3"
	@echo ""
	@echo "Run 'make deploy' to push to GitHub Pages"

## render : Render .qmd → HTML via Quarto
render:
	@echo "→ Rendering whitepaper..."
	quarto render qif-whitepaper.qmd --to html

## audio : Generate per-section narration via Kokoro TTS
audio: render
	@echo "→ Generating audio (voice: $(VOICE))..."
	python3 generate_audio.py --voice $(VOICE) --output $(AUDIO_DIR)/

## mp3 : Convert WAV → MP3, update manifest
mp3:
	@echo "→ Converting to MP3..."
	@cd $(AUDIO_DIR) && \
	for f in *.wav; do \
		[ -f "$$f" ] || continue; \
		ffmpeg -y -i "$$f" -b:a 128k "$${f%.wav}.mp3" 2>/dev/null && rm "$$f"; \
	done
	@python3 -c "\
import json; \
f=open('$(AUDIO_DIR)/manifest.json'); data=json.load(f); f.close(); \
[s.__setitem__('file', s['file'].replace('.wav','.mp3')) for s in data['sections'] if '.wav' in s['file']]; \
data['format']='mp3'; \
f=open('$(AUDIO_DIR)/manifest.json','w'); json.dump(data,f,indent=2); f.close(); \
print('  Manifest updated to MP3')"

## deploy : Copy output + audio to GitHub Pages (main repo)
deploy: whitepaper
	@echo "→ Deploying to GitHub Pages..."
	cp $(OUTPUT_HTML) $(DEPLOY_DIR)/index.html
	mkdir -p $(DEPLOY_DIR)/audio
	cp $(AUDIO_DIR)/*.mp3 $(DEPLOY_DIR)/audio/
	cp $(AUDIO_DIR)/manifest.json $(DEPLOY_DIR)/audio/
	@echo "  Deployed to $(DEPLOY_DIR)"
	@echo "  Remember to commit + push the main repo"

## clean : Remove generated files
clean:
	rm -rf $(AUDIO_DIR)/*.wav $(AUDIO_DIR)/*.mp3 $(AUDIO_DIR)/manifest.json
	rm -rf $(OUTPUT_DIR)
	@echo "  Cleaned output and audio"

## help : Show available targets
help:
	@echo "QIF Whitepaper Build Pipeline"
	@echo ""
	@echo "  make whitepaper   Full build: render + audio + mp3"
	@echo "  make deploy       Build + copy to GitHub Pages"
	@echo "  make render       Render HTML only (no audio)"
	@echo "  make audio        Generate audio from rendered HTML"
	@echo "  make mp3          Convert WAV to MP3"
	@echo "  make clean        Remove generated files"
	@echo ""
	@echo "Options:"
	@echo "  VOICE=af_bella    Change Kokoro voice (default: af_heart)"
	@echo ""
	@echo "Available voices:"
	@echo "  af_heart af_bella af_nicole af_sarah af_sky"
	@echo "  am_adam am_michael"
	@echo "  bf_emma bf_isabella bm_george bm_lewis"
