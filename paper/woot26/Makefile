PDF = main.pdf

all: $(PDF)

$(PDF): main.tex references.bib sections/*.tex
	tectonic main.tex

clean:
	rm -f *.aux *.bbl *.blg *.log *.out *.pdf

.PHONY: all clean
