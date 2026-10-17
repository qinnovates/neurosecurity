"""qtara: deprecated. 0.4.0 is the final release; see DEPRECATION_NOTICE."""

import warnings

__version__ = "0.4.0"

DEPRECATION_NOTICE = (
    "qtara is deprecated and no longer maintained (0.4.0, 2026-10-17, is the final release). "
    "Its bundled registry will not be updated. Use the public data instead: "
    "https://qinnovate.com/api/stix.json (STIX 2.1) or https://qinnovate.com/api/tara.json. "
    "TARA, NISS and QIF are a proposed framework that has not been independently validated."
)

# FutureWarning, not DeprecationWarning: the notice is for people using the
# package, and Python hides DeprecationWarning outside __main__ and tests.
warnings.warn(DEPRECATION_NOTICE, FutureWarning, stacklevel=2)
