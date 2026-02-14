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
    
    # Check for Attack Pattern objects
    patterns = [obj for obj in bundle["objects"] if obj["type"] == "attack-pattern"]
    assert len(patterns) == len(techniques)
    assert patterns[0]["name"] == techniques[0].attack
