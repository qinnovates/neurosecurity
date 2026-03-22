"""Tests for the ONI Framework package initialization."""

import pytest

import oni


class TestPackageMetadata:
    """Tests for package metadata."""

    def test_version_exists(self):
        """Package should have a __version__ attribute."""
        assert hasattr(oni, "__version__")
        assert isinstance(oni.__version__, str)

    def test_version_format(self):
        """Version should be in semver format."""
        version = oni.__version__
        parts = version.split(".")
        assert len(parts) >= 2
        assert all(part.isdigit() for part in parts[:2])

    def test_author_exists(self):
        """Package should have an __author__ attribute."""
        assert hasattr(oni, "__author__")
        assert isinstance(oni.__author__, str)


class TestGetVersion:
    """Tests for the get_version function."""

    def test_get_version_returns_string(self):
        """get_version should return a string."""
        version = oni.get_version()
        assert isinstance(version, str)

    def test_get_version_matches_dunder(self):
        """get_version should match __version__."""
        assert oni.get_version() == oni.__version__


class TestPrintSummary:
    """Tests for the print_summary function."""

    def test_print_summary_outputs(self, capsys):
        """print_summary should output framework information."""
        oni.print_summary()
        captured = capsys.readouterr()

        assert "ONI Framework" in captured.out
        assert oni.__version__ in captured.out
        assert "SIGNAL VALIDATION" in captured.out
        assert "ARCHITECTURE" in captured.out
        assert "THREAT DETECTION" in captured.out

    def test_print_summary_includes_modules(self, capsys):
        """print_summary should list key modules."""
        oni.print_summary()
        captured = capsys.readouterr()

        assert "CoherenceMetric" in captured.out
        assert "NeuralFirewall" in captured.out
        assert "ONIStack" in captured.out
        assert "KohnoThreatModel" in captured.out


class TestCoreImports:
    """Tests for core module imports."""

    def test_coherence_imports(self):
        """Coherence module should be importable."""
        assert hasattr(oni, "CoherenceMetric")
        assert hasattr(oni, "calculate_cs")
        assert hasattr(oni, "VarianceComponents")

    def test_firewall_imports(self):
        """Firewall module should be importable."""
        assert hasattr(oni, "NeuralFirewall")

    def test_layers_imports(self):
        """Layers module should be importable."""
        assert hasattr(oni, "ONIStack")
        assert hasattr(oni, "Layer")
        assert hasattr(oni, "Domain")

    def test_scale_freq_imports(self):
        """Scale frequency module should be importable."""
        assert hasattr(oni, "ScaleFrequencyInvariant")


class TestNeurosecurityImports:
    """Tests for neurosecurity module imports."""

    def test_threat_model_imports(self):
        """Threat model should be importable."""
        assert hasattr(oni, "ThreatType")
        assert hasattr(oni, "KohnoThreatModel")
        assert hasattr(oni, "NeurosecurityFirewall")
        assert hasattr(oni, "NeurosecurityConfig")

    def test_privacy_imports(self):
        """Privacy module should be importable."""
        assert hasattr(oni, "BCIAnonymizer")
        assert hasattr(oni, "AnonymizerConfig")
        assert hasattr(oni, "ERPType")
        assert hasattr(oni, "PrivacySensitivity")
        assert hasattr(oni, "PrivacyScoreCalculator")
        assert hasattr(oni, "PrivacyScoreResult")


class TestPublicAPI:
    """Tests for the public API (__all__)."""

    def test_all_exists(self):
        """Package should have __all__ defined."""
        assert hasattr(oni, "__all__")
        assert isinstance(oni.__all__, list)

    def test_all_items_exist(self):
        """All items in __all__ should be importable."""
        for name in oni.__all__:
            assert hasattr(oni, name), f"{name} in __all__ but not importable"

    def test_all_contains_core_exports(self):
        """__all__ should contain core exports."""
        assert "__version__" in oni.__all__
        assert "CoherenceMetric" in oni.__all__
        assert "NeuralFirewall" in oni.__all__
        assert "ONIStack" in oni.__all__


class TestConsentManager:
    """Tests for ConsentManager availability."""

    def test_consent_manager_available(self):
        """ConsentManager should be available if neurosecurity.consent is importable."""
        try:
            from oni.neurosecurity.consent import ConsentManager
            assert hasattr(oni, "ConsentManager")
            assert hasattr(oni, "ConsentScope")
            assert hasattr(oni, "ConsentState")
            assert hasattr(oni, "PediatricConsentState")
        except ImportError:
            # ConsentManager not available is acceptable
            pass


class TestModuleInstantiation:
    """Tests for creating instances of key classes."""

    def test_create_coherence_metric(self):
        """Should be able to create CoherenceMetric instance."""
        metric = oni.CoherenceMetric()
        assert metric is not None

    def test_create_neural_firewall(self):
        """Should be able to create NeuralFirewall instance."""
        firewall = oni.NeuralFirewall()
        assert firewall is not None

    def test_create_oni_stack(self):
        """Should be able to create ONIStack instance."""
        stack = oni.ONIStack()
        assert stack is not None
        assert len(stack) == 14

    def test_create_kohno_threat_model(self):
        """Should be able to create KohnoThreatModel instance."""
        model = oni.KohnoThreatModel()
        assert model is not None

    def test_create_privacy_calculator(self):
        """Should be able to create PrivacyScoreCalculator instance."""
        calculator = oni.PrivacyScoreCalculator()
        assert calculator is not None
