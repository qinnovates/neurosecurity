TEX      = pdflatex
BIB      = bibtex
MAIN     = main
FIGDIR   = figures
SCRIPTDIR= scripts

.PHONY: pdf clean figures

pdf: figures $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex $(wildcard sections/*.tex) references.bib
	$(TEX) $(MAIN)
	$(BIB) $(MAIN)
	$(TEX) $(MAIN)
	$(TEX) $(MAIN)

figures:
	@mkdir -p $(FIGDIR)
	cd $(SCRIPTDIR) && python3 generate_figures.py

clean:
	rm -f $(MAIN).aux $(MAIN).bbl $(MAIN).blg $(MAIN).log $(MAIN).out \
	      $(MAIN).toc $(MAIN).pdf $(MAIN).fdb_latexmk $(MAIN).fls \
	      $(MAIN).synctex.gz
	rm -f $(FIGDIR)/*.pdf
