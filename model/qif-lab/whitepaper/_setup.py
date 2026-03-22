"""Shared setup for all Quarto chapters — adds qif-lab to Python path."""
import sys, os

# Walk up from whitepaper/ or whitepaper/chapters/ to find qif-lab/
_dir = os.path.dirname(os.path.abspath(__file__))
_lab = os.path.dirname(_dir) if os.path.basename(_dir) == 'whitepaper' else os.path.dirname(os.path.dirname(_dir))
# Also try from CWD
for candidate in [_lab, os.path.join(os.getcwd(), '..'), os.path.join(os.getcwd(), '..', '..')]:
    src_path = os.path.join(candidate, 'src')
    if os.path.isdir(src_path) and candidate not in sys.path:
        sys.path.insert(0, candidate)
