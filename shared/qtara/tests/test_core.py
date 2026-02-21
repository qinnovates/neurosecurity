import pytest
from qtara.core import TaraLoader, NissCalculator

def test_loader_load():
    loader = TaraLoader()
    loader.load()
    assert len(loader.registry.techniques) > 0
    assert loader.registry.techniques[0].id.startswith("QIF-T")

def test_loader_list_techniques():
    loader = TaraLoader()
    loader.load()
    
    # Test all
    all_techs = loader.list_techniques()
    assert len(all_techs) > 0
    
    # Test band filter
    n1_techs = loader.list_techniques(band="N1")
    for t in n1_techs:
        assert "N1" in t.band_ids

def test_loader_get_technique():
    loader = TaraLoader()
    loader.load()
    
    t = loader.get_technique("QIF-T0001")
    assert t is not None
    assert t.id == "QIF-T0001"
    
    none_t = loader.get_technique("INVALID-ID")
    assert none_t is None

def test_niss_calculator():
    vector = "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H/BI:H/CG:H/CV:V/RV:H/NP:H"
    result = NissCalculator.parse_vector(vector)
    assert result["BI"] == "H"
    assert result["CV"] == "V"
