"""Typed errors raised by the atlas pipeline. Each message says what failed and what to do."""


class PipelineError(Exception):
    """Base class for every error the pipeline raises on purpose."""


class RegistryError(PipelineError):
    """The source registry is malformed or names something that does not exist."""


class FetchError(PipelineError):
    """A download was refused, failed, or did not match its pin."""


class HeaderError(PipelineError):
    """A volume header is missing the information needed to place it in world space."""


class TransformError(PipelineError):
    """The archived registration transform is missing or does not match its pin."""


class MeshError(PipelineError):
    """A mesh could not be built or broke one of its sanity rules."""


class CheckError(PipelineError):
    """A check that gates the build did not pass."""
