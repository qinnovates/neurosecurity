"""Lead rows of the device geometry file: sizes with their sources, and nothing else. Standard library only."""
import json

from atlas_pipeline import sources

GEOMETRY = json.loads((sources.REPO_ROOT / "datalake" / "qif-anatomy-device-geometry.json").read_text(encoding="utf-8"))
LEADS = {lead["id"]: lead for lead in GEOMETRY["leads"]}
DIMENSIONS = ("contacts", "contact_length_mm", "contact_spacing_mm", "spacing_measure", "diameter_mm")
FDA_HOST = "https://www.accessdata.fda.gov/"


def contact_span_mm(lead: dict) -> float:
    """From the first contact's far edge to the last contact's far edge, along the lead."""
    gap = lead["contact_spacing_mm"] - (lead["contact_length_mm"] if lead["spacing_measure"] == "centre_to_centre" else 0.0)
    return lead["contacts"] * lead["contact_length_mm"] + (lead["contacts"] - 1) * gap


def test_every_dimension_of_every_lead_has_a_quoted_source_of_a_stated_kind() -> None:
    assert len(LEADS) == 3
    for lead in LEADS.values():
        for field in DIMENSIONS:
            assert any(field in source["supports"] for source in lead["sources"]), (lead["id"], field)
        for source in lead["sources"]:
            assert source["kind"] in ("fda_document", "review_paper") and source["quote"].strip() and source["supports"]
            assert (source["kind"] == "fda_document") == source["url"].startswith(FDA_HOST), source["url"]


def test_a_number_quoted_from_a_document_appears_in_the_quote() -> None:
    for lead in LEADS.values():
        for source in lead["sources"]:
            for field in source["supports"]:
                if field != "spacing_measure":
                    assert f"{lead[field]:g}" in source["quote"], (lead["id"], field, source["quote"])


def test_the_one_lead_whose_span_the_regulator_states_adds_up_to_it() -> None:
    # FDA SSED P150031, Table 2: "Contact Span 15.5 mm" for the DB-2201 lead.
    assert contact_span_mm(LEADS["boston_scientific_db_2201"]) == 15.5
    assert contact_span_mm(LEADS["medtronic_3387"]) == 10.5 and contact_span_mm(LEADS["medtronic_3389"]) == 7.5
    assert contact_span_mm({**LEADS["boston_scientific_db_2201"], "spacing_measure": "edge_to_edge"}) != 15.5


def test_review_paper_numbers_are_marked_as_such() -> None:
    kinds = {(lead_id, field): source["kind"] for lead_id, lead in LEADS.items() for source in lead["sources"] for field in source["supports"]}
    assert kinds[("medtronic_3387", "diameter_mm")] == kinds[("medtronic_3389", "diameter_mm")] == "review_paper"
    assert {kind for (lead_id, _), kind in kinds.items() if lead_id == "boston_scientific_db_2201"} == {"fda_document"}


def test_the_variability_figure_is_a_fact_in_words_never_a_shape() -> None:
    fact = next(row for row in GEOMETRY["facts"] if row["id"] == "electrode_to_cortex_variability")
    assert fact["drawable"] is False and fact["read_depth"] == "abstract_only"
    assert fact["quote"] in "a grand standard deviation of 4.6 mm in x, 7.1 mm in y and 7.8 mm in z"
    assert "In one study, the brain" in fact["statement"] and "not this template" in fact["statement"]
