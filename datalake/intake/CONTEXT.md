# datalake/intake: research intake

Everything gathered during a data refresh lands here first, so nothing collected is lost and nothing unreviewed is mistaken for accepted data.

- `ledger.json`: one record per gathered item across all batches, with its source, the collector's verification, the independent review verdict and its disposition (`staged`, `accepted`, `rejected`, `superseded`).
- `<date>/`: the raw output of that batch, unedited: proposed additions and updates, the sources consulted, and analysis reports.

Rules:
- Files here are proposals. The sources of truth remain `datalake/*.json`. An item only changes a dataset after review, and its ledger record is then set to `accepted`.
- Items marked `UNVERIFIED` must not be cited or used as support anywhere on the site.
- This folder is not read by the build. `npm run health` only checks top-level `datalake/*.json`.
