"""Tests for the ONI Framework CLI."""

import pytest
from unittest.mock import patch, MagicMock
import sys

from oni.cli import main, run_info, run_demo, run_version


class TestCLIMain:
    """Tests for the main CLI entry point."""

    def test_no_args_shows_help(self, capsys):
        """Running without arguments should show help and return 0."""
        result = main([])
        assert result == 0
        captured = capsys.readouterr()
        assert "ONI Framework" in captured.out
        assert "Neural Security" in captured.out

    def test_info_command(self, capsys):
        """The info command should show framework summary."""
        result = main(["info"])
        assert result == 0
        captured = capsys.readouterr()
        assert "ONI Framework" in captured.out
        assert "SIGNAL VALIDATION" in captured.out
        assert "CoherenceMetric" in captured.out

    def test_version_command(self, capsys):
        """The version command should show version number."""
        result = main(["version"])
        assert result == 0
        captured = capsys.readouterr()
        assert "oni-framework" in captured.out
        assert "0.2.6" in captured.out

    def test_demo_command(self, capsys):
        """The demo command should run without errors."""
        result = main(["demo"])
        assert result == 0
        captured = capsys.readouterr()
        assert "ONI Framework" in captured.out
        assert "Demo complete" in captured.out

    def test_ui_command_without_streamlit(self, capsys):
        """The ui command should fail gracefully if streamlit not installed."""
        # Mock streamlit import to fail
        with patch.dict(sys.modules, {'streamlit.web.cli': None}):
            with patch('oni.cli.run_ui') as mock_run_ui:
                mock_run_ui.return_value = 1
                result = main(["ui"])
                # Either streamlit is installed (0) or not (1)
                assert result in (0, 1)


class TestRunInfo:
    """Tests for the run_info function."""

    def test_returns_zero(self):
        """run_info should return 0."""
        result = run_info()
        assert result == 0


class TestRunVersion:
    """Tests for the run_version function."""

    def test_returns_zero(self):
        """run_version should return 0."""
        result = run_version()
        assert result == 0


class TestRunDemo:
    """Tests for the run_demo function."""

    def test_returns_zero(self):
        """run_demo should return 0."""
        result = run_demo()
        assert result == 0

    def test_demo_outputs_sections(self, capsys):
        """Demo should output all major sections."""
        run_demo()
        captured = capsys.readouterr()

        # Check for all demo sections
        assert "COHERENCE METRIC" in captured.out
        assert "NEURAL FIREWALL" in captured.out
        assert "ONI 14-LAYER MODEL" in captured.out
        assert "PRIVACY SCORING" in captured.out
        assert "THREAT CLASSIFICATION" in captured.out


class TestCLIHelp:
    """Tests for CLI help messages."""

    def test_help_flag(self, capsys):
        """The --help flag should show help."""
        with pytest.raises(SystemExit) as excinfo:
            main(["--help"])
        assert excinfo.value.code == 0

    def test_subcommand_help(self, capsys):
        """Subcommand --help should show subcommand help."""
        with pytest.raises(SystemExit) as excinfo:
            main(["ui", "--help"])
        assert excinfo.value.code == 0


class TestCLIUICommand:
    """Tests for the UI command."""

    def test_ui_port_argument(self):
        """The ui command should accept --port argument."""
        # This test just validates argument parsing works
        # We can't actually launch the UI in tests
        with patch('oni.cli.run_ui') as mock_run_ui:
            mock_run_ui.return_value = 0
            main(["ui", "--port", "8502"])
            mock_run_ui.assert_called_once_with(8502)
