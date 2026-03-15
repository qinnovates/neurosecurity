import pytest
from qtara.core import TaraLoader
from qtara.stix import StixExporter

def test_stix_bundle_generation():
    loader = TaraLoader()
    loader.load()
    techniques = loader.list_techniques()

    bundle = StixExporter.to_bundle(techniques)

    assert bundle["type"] == "bundle"
    assert "objects" in bundle

    # Check for Identity object
    identities = [obj for obj in bundle["objects"] if obj["type"] == "identity"]
    assert len(identities) > 0
    assert identities[0]["name"] == "Qinnovate Interface Framework (QIF)"

    # Check for Attack Pattern objects (default: excludes pending techniques)
    patterns = [obj for obj in bundle["objects"] if obj["type"] == "attack-pattern"]
    enriched = [t for t in techniques if not t.tara_enrichment_pending]
    assert len(patterns) == len(enriched)
    assert len(patterns) > 0
    assert patterns[0]["name"] == enriched[0].attack

def test_stix_bundle_include_pending():
    """When include_pending=True, all techniques should be in the bundle."""
    loader = TaraLoader()
    loader.load()
    techniques = loader.list_techniques()

    bundle = StixExporter.to_bundle(techniques, include_pending=True)
    patterns = [obj for obj in bundle["objects"] if obj["type"] == "attack-pattern"]
    assert len(patterns) == len(techniques)
