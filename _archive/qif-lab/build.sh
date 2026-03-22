#!/bin/bash
# QIF Whitepaper Build Script
# Usage:
#   ./build.sh            # Build HTML + generate figures
#   ./build.sh pdf        # Build PDF
#   ./build.sh figures    # Only regenerate figures
#   ./build.sh test       # Run equation tests
#   ./build.sh all        # Everything: test + figures + HTML + PDF

set -e
cd "$(dirname "$0")"

case "${1:-html}" in
  test)
    echo "=== Running equation tests ==="
    python3 test_equations.py
    ;;
  figures)
    echo "=== Generating figures ==="
    python3 -m src.figures
    ;;
  html)
    echo "=== Generating figures ==="
    python3 -m src.figures
    echo "=== Building HTML whitepaper ==="
    cd whitepaper && quarto render --to html
    echo "=== Done: whitepaper/_output/index.html ==="
    ;;
  pdf)
    echo "=== Generating figures ==="
    python3 -m src.figures
    echo "=== Building PDF whitepaper ==="
    cd whitepaper && quarto render --to pdf
    echo "=== Done: whitepaper/_output/*.pdf ==="
    ;;
  all)
    echo "=== Full build: test + figures + HTML + PDF ==="
    python3 test_equations.py
    python3 -m src.figures
    cd whitepaper
    quarto render --to html
    quarto render --to pdf
    echo "=== All done ==="
    ;;
  *)
    echo "Usage: ./build.sh [test|figures|html|pdf|all]"
    ;;
esac
