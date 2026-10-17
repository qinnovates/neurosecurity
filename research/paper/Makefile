TEX      = pdflatex
BIB      = bibtex
MAIN     = main
FIGDIR   = figures
SCRIPTDIR= scripts
DEPLOY   = ../docs/papers/qif-bci-security-2026.pdf

.PHONY: pdf clean figures deploy stats check-stats lint

# lint and stats run before the build: lint catches the source defects that a
# compile would hit (duplicate BibTeX keys, unescaped percent signs), and stats
# regenerates the registry macros so no figure in the PDF can be stale.
pdf: lint stats figures $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex $(wildcard sections/*.tex) generated/registry-stats.tex references.bib
	$(TEX) $(MAIN)
	$(BIB) $(MAIN)
	$(TEX) $(MAIN)
	$(TEX) $(MAIN)

deploy: pdf
	@mkdir -p ../docs/papers
	cp $(MAIN).pdf $(DEPLOY)
	@echo "Deployed to $(DEPLOY)"

lint:
	cd $(SCRIPTDIR) && python3 lint_paper.py

stats:
	cd $(SCRIPTDIR) && python3 generate_registry_stats.py

check-stats:
	cd $(SCRIPTDIR) && python3 generate_registry_stats.py --check

figures:
	@mkdir -p $(FIGDIR)
	cd $(SCRIPTDIR) && python3 generate_figures.py

clean:
	rm -f $(MAIN).aux $(MAIN).bbl $(MAIN).blg $(MAIN).log $(MAIN).out \
	      $(MAIN).toc $(MAIN).pdf $(MAIN).fdb_latexmk $(MAIN).fls \
	      $(MAIN).synctex.gz
	rm -f $(FIGDIR)/*.pdf
