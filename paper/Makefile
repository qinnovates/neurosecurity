TEX      = pdflatex
BIB      = bibtex
MAIN     = main
FIGDIR   = figures
SCRIPTDIR= scripts
DEPLOY   = ../docs/papers/qif-bci-security-2026.pdf

.PHONY: pdf clean figures deploy

pdf: figures $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex $(wildcard sections/*.tex) references.bib
	$(TEX) $(MAIN)
	$(BIB) $(MAIN)
	$(TEX) $(MAIN)
	$(TEX) $(MAIN)

deploy: pdf
	@mkdir -p ../docs/papers
	cp $(MAIN).pdf $(DEPLOY)
	@echo "Deployed to $(DEPLOY)"

figures:
	@mkdir -p $(FIGDIR)
	cd $(SCRIPTDIR) && python3 generate_figures.py

clean:
	rm -f $(MAIN).aux $(MAIN).bbl $(MAIN).blg $(MAIN).log $(MAIN).out \
	      $(MAIN).toc $(MAIN).pdf $(MAIN).fdb_latexmk $(MAIN).fls \
	      $(MAIN).synctex.gz
	rm -f $(FIGDIR)/*.pdf
