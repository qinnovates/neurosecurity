"""Tests for the layers module."""

import pytest

from oni.layers import ONIStack, Layer, Domain, get_stack, layer_info


class TestLayer:
    """Tests for the Layer dataclass."""

    def test_layer_creation(self):
        """Should create a layer with required fields."""
        layer = Layer(
            number=1,
            name="Test",
            domain=Domain.SILICON,
            zone_label="Physical",
            function="Test function",
        )
        assert layer.number == 1
        assert layer.name == "Test"
        assert layer.domain == Domain.SILICON
        assert layer.zone_label == "Physical"

    def test_is_silicon(self):
        """Should correctly identify silicon layers."""
        layer = Layer(number=1, name="Test", domain=Domain.SILICON, zone_label="Physical", function="")
        assert layer.is_silicon
        assert not layer.is_biology
        assert not layer.is_bridge

    def test_is_biology(self):
        """Should correctly identify biology layers."""
        layer = Layer(number=9, name="Test", domain=Domain.BIOLOGY, zone_label="Filtering", function="")
        assert layer.is_biology
        assert not layer.is_silicon
        assert not layer.is_bridge

    def test_is_bridge(self):
        """Should correctly identify bridge layer."""
        layer = Layer(number=8, name="Test", domain=Domain.BRIDGE, zone_label="Firewall", function="")
        assert layer.is_bridge
        assert not layer.is_biology
        assert not layer.is_silicon

    def test_is_firewall(self):
        """Should correctly identify firewall layer."""
        layer = Layer(number=8, name="Test", domain=Domain.BRIDGE, zone_label="Firewall", function="")
        assert layer.is_firewall
        layer2 = Layer(number=9, name="Test", domain=Domain.BIOLOGY, zone_label="Filtering", function="")
        assert not layer2.is_firewall


class TestONIStack:
    """Tests for the ONIStack class."""

    def test_has_14_layers(self):
        """Stack should have exactly 14 layers."""
        stack = ONIStack()
        assert len(stack) == 14

    def test_layer_access_by_number(self):
        """Should access layers by number."""
        stack = ONIStack()
        layer8 = stack.layer(8)
        assert layer8.number == 8
        assert layer8.name == "Neural Gateway"

    def test_layer_access_by_index(self):
        """Should access layers via indexing."""
        stack = ONIStack()
        assert stack[1].number == 1
        assert stack[14].number == 14

    def test_invalid_layer_raises(self):
        """Should raise KeyError for invalid layer numbers."""
        stack = ONIStack()
        with pytest.raises(KeyError):
            stack.layer(0)
        with pytest.raises(KeyError):
            stack.layer(15)

    def test_iteration(self):
        """Should iterate through all layers in order."""
        stack = ONIStack()
        layers = list(stack)
        assert len(layers) == 14
        assert [l.number for l in layers] == list(range(1, 15))

    def test_silicon_layers(self):
        """Should return layers 1-7 as silicon (OSI)."""
        stack = ONIStack()
        sil = stack.silicon_layers()
        assert len(sil) == 7
        assert all(l.is_silicon for l in sil)
        assert [l.number for l in sil] == list(range(1, 8))

    def test_biology_layers(self):
        """Should return layers 9-14 as biology (cognitive)."""
        stack = ONIStack()
        bio = stack.biology_layers()
        assert len(bio) == 6
        assert all(l.is_biology for l in bio)
        assert [l.number for l in bio] == list(range(9, 15))

    def test_biological_layers_alias(self):
        """biological_layers() should be alias for biology_layers()."""
        stack = ONIStack()
        assert stack.biological_layers() == stack.biology_layers()

    def test_bridge_layer(self):
        """Should return layer 8 as bridge."""
        stack = ONIStack()
        bridge = stack.bridge_layer()
        assert bridge.number == 8
        assert bridge.is_bridge

    def test_firewall_layer(self):
        """Firewall layer should be layer 8."""
        stack = ONIStack()
        fw = stack.firewall_layer()
        assert fw.number == 8
        assert fw.metadata.get("firewall_layer") is True

    def test_layer_names_v3(self):
        """Should have expected layer names (v3.0 model)."""
        stack = ONIStack()
        expected_names = [
            # Silicon (L1-L7)
            "Physical Carrier", "Signal Processing", "Protocol", "Transport",
            "Session", "Presentation", "Application Interface",
            # Bridge (L8)
            "Neural Gateway",
            # Biology (L9-L14)
            "Signal Processing", "Neural Protocol", "Cognitive Transport",
            "Cognitive Session", "Semantic Layer", "Identity Layer"
        ]
        actual_names = [stack[i].name for i in range(1, 15)]
        assert actual_names == expected_names

    def test_zone_labels(self):
        """Should have expected zone labels."""
        stack = ONIStack()
        assert stack[1].zone_label == "Physical"
        assert stack[8].zone_label == "Firewall"
        assert stack[14].zone_label == "Self"

    def test_get_attack_surfaces(self):
        """Should return attack surfaces for layers."""
        stack = ONIStack()
        surfaces = stack.get_attack_surfaces((8, 8))
        assert 8 in surfaces
        assert len(surfaces[8]) > 0
        assert "Signal injection" in surfaces[8]

    def test_get_defenses(self):
        """Should return defenses for layers."""
        stack = ONIStack()
        defenses = stack.get_defenses((8, 8))
        assert 8 in defenses
        assert len(defenses[8]) > 0
        assert any("Coherence" in d for d in defenses[8])

    def test_ascii_diagram(self):
        """Should generate ASCII diagram."""
        stack = ONIStack()
        diagram = stack.ascii_diagram()
        assert "ONI FRAMEWORK" in diagram
        assert "NEURAL GATEWAY" in diagram
        assert "BIOLOGY" in diagram
        assert "SILICON" in diagram

    def test_summary(self):
        """Should generate summary text."""
        stack = ONIStack()
        summary = stack.summary()
        assert "14" in summary
        assert "Silicon" in summary
        assert "Biology" in summary
        assert "3.0" in summary  # Version check

    def test_layer_table(self):
        """Should generate formatted layer table."""
        stack = ONIStack()
        table = stack.layer_table()
        assert "Layer" in table
        assert "L08" in table or "L 8" in table
        assert "Neural Gateway" in table

    def test_version(self):
        """Should have version string."""
        stack = ONIStack()
        assert stack.VERSION == "3.0"


class TestNeuroscienceIntegration:
    """Tests for neuroscience mapping integration."""

    def test_brain_regions_for_layer(self):
        """Should return brain regions for biology layers."""
        stack = ONIStack()
        regions = stack.brain_regions_for_layer(13)
        assert isinstance(regions, list)
        # L13 (Semantic) should include reward-related regions
        assert any(r in regions for r in ["VTA", "NAc", "PFC"])

    def test_neurotransmitters_for_layer(self):
        """Should return neurotransmitters for biology layers."""
        stack = ONIStack()
        nts = stack.neurotransmitters_for_layer(12)
        assert isinstance(nts, list)
        # L12 (Cognitive Session) should include memory/attention NTs
        assert "dopamine" in nts or "acetylcholine" in nts

    def test_functions_for_layer(self):
        """Should return cognitive functions for biology layers."""
        stack = ONIStack()
        funcs = stack.functions_for_layer(12)
        assert isinstance(funcs, list)
        # Should have working memory or attention
        assert any("Memory" in f or "Attention" in f for f in funcs)

    def test_security_implications_for_layer(self):
        """Should return security implications."""
        stack = ONIStack()
        implications = stack.security_implications_for_layer(13)
        assert isinstance(implications, list)
        # Should have security concerns
        if implications:
            assert all(isinstance(i, str) for i in implications)

    def test_layer_neuroscience_report(self):
        """Should generate comprehensive report."""
        stack = ONIStack()
        report = stack.layer_neuroscience_report(13)
        assert isinstance(report, str)
        assert "Layer 13" in report
        assert "Brain Regions" in report or "Neurotransmitter" in report


class TestConvenienceFunctions:
    """Tests for module-level convenience functions."""

    def test_get_stack(self):
        """Should return ONIStack instance."""
        stack = get_stack()
        assert isinstance(stack, ONIStack)
        assert len(stack) == 14

    def test_layer_info(self):
        """Should return layer info dict."""
        info = layer_info(8)
        assert info["number"] == 8
        assert info["name"] == "Neural Gateway"
        assert "attack_surfaces" in info
        assert "defenses" in info

    def test_layer_info_biology_includes_neuroscience(self):
        """Biology layer info should include neuroscience mappings."""
        info = layer_info(13)
        assert "brain_regions" in info
        assert "neurotransmitters" in info
        assert "cognitive_functions" in info

    def test_layer_info_silicon_no_neuroscience(self):
        """Silicon layer info should not include neuroscience mappings."""
        info = layer_info(1)
        assert "brain_regions" not in info
        assert "neurotransmitters" not in info
