"""Tests for the neuromapping module."""

import pytest

from oni.neuromapping import (
    NeuroscienceAtlas,
    BrainRegion,
    BrainRegionAtlas,
    NeurotransmitterSystem,
    NeurotransmitterAtlas,
    CognitiveFunction,
    CognitiveFunctionAtlas,
    TimeScale,
    TimeScaleHierarchy,
    Citation,
    References,
    get_atlas,
)


class TestCitation:
    """Tests for the Citation dataclass."""

    def test_citation_creation(self):
        """Should create a citation with required fields."""
        cite = Citation(
            id="test2024",
            authors="Test, A., & Author, B.",
            year=2024,
            title="A Test Paper",
            journal="Journal of Testing",
        )
        assert cite.id == "test2024"
        assert cite.year == 2024
        assert cite.journal == "Journal of Testing"

    def test_apa_format(self):
        """Should generate APA format citation."""
        cite = Citation(
            id="test2024",
            authors="Test, A., & Author, B.",
            year=2024,
            title="A Test Paper",
            journal="Journal of Testing",
            volume="10(2)",
            pages="123-456",
            doi="10.1234/test",
        )
        apa = cite.apa_format()
        assert "Test, A., & Author, B." in apa
        assert "(2024)" in apa
        assert "A Test Paper" in apa
        assert "Journal of Testing" in apa
        assert "10.1234/test" in apa


class TestReferences:
    """Tests for the References database."""

    def test_has_citations(self):
        """Should have citations in database."""
        refs = References()
        assert len(refs.all()) > 0

    def test_get_citation_by_id(self):
        """Should retrieve citation by ID."""
        refs = References()
        cite = refs.get("bjorklund2007")
        assert cite is not None
        assert cite.year == 2007
        assert "dopamine" in cite.title.lower()

    def test_citations_by_topic(self):
        """Should return citations for a topic."""
        refs = References()
        dopamine_cites = refs.by_topic("dopamine")
        assert len(dopamine_cites) > 0
        assert any("dopamine" in c.title.lower() or c.key_finding and "dopamine" in c.key_finding.lower()
                   for c in dopamine_cites)

    def test_has_key_citations(self):
        """Should have key neuroscience citations."""
        refs = References()
        # Core citations that should exist
        assert refs.get("bjorklund2007") is not None  # Dopamine pathways
        assert refs.get("lazarus2011") is not None    # Caffeine/adenosine
        assert refs.get("shannon1992") is not None    # Stimulation safety


class TestBrainRegion:
    """Tests for the BrainRegion dataclass."""

    def test_brain_region_creation(self):
        """Should create a brain region."""
        region = BrainRegion(
            abbreviation="TEST",
            full_name="Test Region",
            location="Test location",
            primary_neurotransmitters=["dopamine"],
            primary_functions=["testing"],
            oni_layers=[13],
        )
        assert region.abbreviation == "TEST"
        assert "dopamine" in region.primary_neurotransmitters


class TestBrainRegionAtlas:
    """Tests for the BrainRegionAtlas."""

    def test_has_regions(self):
        """Should have brain regions."""
        atlas = BrainRegionAtlas()
        assert len(atlas.all()) > 0

    def test_get_region_by_abbreviation(self):
        """Should retrieve region by abbreviation."""
        atlas = BrainRegionAtlas()
        snc = atlas.get("SNc")
        assert snc is not None
        assert snc.full_name == "Substantia Nigra pars compacta"

    def test_regions_by_neurotransmitter(self):
        """Should return regions by neurotransmitter."""
        atlas = BrainRegionAtlas()
        da_regions = atlas.by_neurotransmitter("dopamine")
        assert len(da_regions) > 0
        # SNc and VTA should be dopamine regions
        abbrs = [r.abbreviation for r in da_regions]
        assert "SNc" in abbrs or "VTA" in abbrs

    def test_regions_by_layer(self):
        """Should return regions by ONI layer."""
        atlas = BrainRegionAtlas()
        l13_regions = atlas.by_layer(13)
        assert len(l13_regions) > 0

    def test_regions_by_bci_access(self):
        """Should return regions by BCI accessibility."""
        atlas = BrainRegionAtlas()
        high_access = atlas.by_bci_access("high")
        assert len(high_access) > 0
        # M1 and V1 should have high access
        abbrs = [r.abbreviation for r in high_access]
        assert "M1" in abbrs or "V1" in abbrs


class TestNeurotransmitterSystem:
    """Tests for the NeurotransmitterSystem dataclass."""

    def test_system_creation(self):
        """Should create a neurotransmitter system."""
        nt = NeurotransmitterSystem(
            name="test",
            abbreviation="TEST",
            category="test",
            synthesis_enzyme="Test Hydroxylase",
            required_cofactors=["Fe²⁺"],
            synthesis_regions=["TEST"],
            major_pathways=["Test pathway"],
            receptor_types=["T1", "T2"],
            primary_functions=["testing"],
            oni_layers=[13],
            time_scale="seconds",
            bci_can_trigger_release=True,
            bci_can_synthesize=False,
        )
        assert nt.name == "test"
        assert nt.bci_can_trigger_release is True
        assert nt.bci_can_synthesize is False


class TestNeurotransmitterAtlas:
    """Tests for the NeurotransmitterAtlas."""

    def test_has_systems(self):
        """Should have neurotransmitter systems."""
        atlas = NeurotransmitterAtlas()
        assert len(atlas.all()) > 0

    def test_get_system_by_name(self):
        """Should retrieve system by name."""
        atlas = NeurotransmitterAtlas()
        da = atlas.get("dopamine")
        assert da is not None
        assert da.abbreviation == "DA"

    def test_dopamine_cofactors(self):
        """Should have correct dopamine cofactors."""
        atlas = NeurotransmitterAtlas()
        da = atlas.get("dopamine")
        assert da is not None
        # Dopamine requires iron and BH4
        cofactors_lower = [c.lower() for c in da.required_cofactors]
        assert any("fe" in c for c in cofactors_lower)
        assert any("bh4" in c for c in cofactors_lower)

    def test_systems_by_cofactor(self):
        """Should return systems by cofactor."""
        atlas = NeurotransmitterAtlas()
        iron_dependent = atlas.by_cofactor("Fe")
        assert len(iron_dependent) > 0
        names = [nt.name for nt in iron_dependent]
        assert "dopamine" in names
        assert "serotonin" in names

    def test_bci_controllable(self):
        """Should return systems BCI can trigger."""
        atlas = NeurotransmitterAtlas()
        controllable = atlas.bci_controllable()
        assert len(controllable) > 0
        # All should have bci_can_trigger_release=True
        assert all(nt.bci_can_trigger_release for nt in controllable)

    def test_no_synthesis_capability(self):
        """No system should have BCI synthesis capability."""
        atlas = NeurotransmitterAtlas()
        for nt in atlas.all():
            assert nt.bci_can_synthesize is False


class TestTimeScaleHierarchy:
    """Tests for the TimeScaleHierarchy."""

    def test_has_scales(self):
        """Should have time scales."""
        hierarchy = TimeScaleHierarchy()
        assert len(hierarchy.all()) > 0

    def test_scales_ordered(self):
        """Scales should be in temporal order."""
        hierarchy = TimeScaleHierarchy()
        scales = hierarchy.all()
        magnitudes = [s.order_of_magnitude for s in scales]
        assert magnitudes == sorted(magnitudes)

    def test_scales_by_bci_access(self):
        """Should return scales by BCI access level."""
        hierarchy = TimeScaleHierarchy()
        direct = hierarchy.by_bci_access("direct")
        assert len(direct) > 0
        none = hierarchy.by_bci_access("none")
        assert len(none) > 0

    def test_bci_accessible_range(self):
        """Should return accessible time range."""
        hierarchy = TimeScaleHierarchy()
        range_tuple = hierarchy.bci_accessible_range()
        assert len(range_tuple) == 2
        assert "milliseconds" in range_tuple[0].lower() or "ms" in range_tuple[0].lower()


class TestCognitiveFunctionAtlas:
    """Tests for the CognitiveFunctionAtlas."""

    def test_has_functions(self):
        """Should have cognitive functions."""
        atlas = CognitiveFunctionAtlas()
        assert len(atlas.all()) > 0

    def test_get_function(self):
        """Should retrieve function by name."""
        atlas = CognitiveFunctionAtlas()
        memory = atlas.get("working_memory")
        assert memory is not None
        assert "PFC" in memory.brain_regions or "hippocampus" in memory.brain_regions

    def test_functions_by_layer(self):
        """Should return functions by ONI layer."""
        atlas = CognitiveFunctionAtlas()
        l13_funcs = atlas.by_layer(13)
        assert len(l13_funcs) > 0

    def test_modulable_functions(self):
        """Should return BCI-modulable functions."""
        atlas = CognitiveFunctionAtlas()
        modulable = atlas.bci_modulable()
        assert len(modulable) > 0
        assert all(f.bci_modulable for f in modulable)


class TestNeuroscienceAtlas:
    """Tests for the unified NeuroscienceAtlas."""

    def test_atlas_creation(self):
        """Should create atlas with all sub-atlases."""
        atlas = NeuroscienceAtlas()
        assert atlas.regions is not None
        assert atlas.neurotransmitters is not None
        assert atlas.time_scales is not None
        assert atlas.functions is not None
        assert atlas.references is not None

    def test_convenience_methods(self):
        """Should have working convenience methods."""
        atlas = NeuroscienceAtlas()

        # brain_region
        snc = atlas.brain_region("SNc")
        assert snc is not None

        # neurotransmitter
        da = atlas.neurotransmitter("dopamine")
        assert da is not None

        # cognitive_function
        motor = atlas.cognitive_function("motor_control")
        assert motor is not None

        # citation
        cite = atlas.citation("bjorklund2007")
        assert cite is not None

    def test_layer_mapping(self):
        """Should return comprehensive layer mapping."""
        atlas = NeuroscienceAtlas()
        mapping = atlas.layer_mapping(13)

        assert "layer" in mapping
        assert mapping["layer"] == 13
        assert "brain_regions" in mapping
        assert "neurotransmitters" in mapping
        assert "functions" in mapping

    def test_function_to_layers(self):
        """Should map function to layers."""
        atlas = NeuroscienceAtlas()
        layers = atlas.function_to_layers("reward")
        assert isinstance(layers, list)
        assert len(layers) > 0
        # Reward should involve L12 or L13
        assert 12 in layers or 13 in layers

    def test_bci_capabilities_summary(self):
        """Should return BCI capabilities summary."""
        atlas = NeuroscienceAtlas()
        caps = atlas.bci_capabilities_summary()

        assert "can_trigger_release" in caps
        assert "cannot_synthesize" in caps
        assert "accessible_time_range" in caps
        assert "modulable_functions" in caps

    def test_security_implications(self):
        """Should return security implications for layer."""
        atlas = NeuroscienceAtlas()
        implications = atlas.security_implications(13)
        assert isinstance(implications, list)

    def test_generate_layer_report(self):
        """Should generate comprehensive report."""
        atlas = NeuroscienceAtlas()
        report = atlas.generate_layer_report(13)
        assert isinstance(report, str)
        assert "Layer 13" in report


class TestGetAtlas:
    """Tests for the get_atlas singleton function."""

    def test_returns_atlas(self):
        """Should return NeuroscienceAtlas instance."""
        atlas = get_atlas()
        assert isinstance(atlas, NeuroscienceAtlas)

    def test_singleton_pattern(self):
        """Should return same instance on repeated calls."""
        atlas1 = get_atlas()
        atlas2 = get_atlas()
        assert atlas1 is atlas2
