from typing import List, Literal, Optional, Dict, Any, Union
from pydantic import BaseModel, ConfigDict, Field, model_validator

TECHNIQUE_ID_REGEX = r"^QIF-T\d{4}$"
VARIANT_ID_REGEX = r"^QIF-T\d{4}-V\d{2}$"

class DSM5Primary(BaseModel):
    code: str
    name: str

class DSM5(BaseModel):
    cluster: str
    primary: List[DSM5Primary]

class ICD10Entry(BaseModel):
    code: str
    name: str

class ICD10(BaseModel):
    cluster: Optional[str] = None
    primary: List[ICD10Entry] = []
    secondary: List[ICD10Entry] = []
    risk_class: Optional[str] = None

class ClinicalEnrichment(BaseModel):
    therapeutic_analog: Optional[str] = None
    conditions: List[str] = []
    fda_status: Optional[str] = None
    evidence_level: Optional[str] = None
    safe_parameters: Optional[str] = None
    sources: List[str] = []

class GovernanceEnrichment(BaseModel):
    consent_tier: Optional[str] = None
    monitoring: List[str] = []

class EngineeringEnrichment(BaseModel):
    coupling: List[str] = []
    parameters: Dict[str, Any] = {}
    hardware: List[str] = []
    detection: Optional[str] = None

class TARAEnrichment(BaseModel):
    mechanism: Optional[str] = None
    # An explicit null means the dual-use class was not assessed.
    dual_use: Optional[str] = "unknown"
    clinical: Optional[ClinicalEnrichment] = None
    governance: Optional[GovernanceEnrichment] = None
    engineering: Optional[EngineeringEnrichment] = None
    dsm5: Optional[DSM5] = None
    icd10: Optional[ICD10] = None

class NissComponents(BaseModel):
    amplitude: float = 0.0
    frequency: float = 0.0
    duration: float = 0.0
    reversibility: float = 0.0
    detectability: float = 0.0
    coverage: float = 0.0

class NissMetricEvidence(BaseModel):
    source: str
    supports: str

class NissData(BaseModel):
    version: str = "1.0"
    # "scored": all six metrics supported, vector and score stored.
    # "provisional": some metrics supported; score_min/score_max bound the formula result, no score.
    # "unscored": no peer-reviewed source, or no metric supported.
    scoring_state: Literal["scored", "provisional", "unscored"] = "scored"
    vector: Optional[str] = None
    score: Optional[float] = None
    severity: Optional[str] = None
    pins: bool = False
    # Shown beside the score; neither changes it (2026-10-16).
    harm_flag: Optional[bool] = None
    cognitive_flag: Optional[bool] = None
    np_support: Optional[str] = None
    components: Optional[NissComponents] = None
    metrics: Optional[Dict[str, str]] = None
    score_min: Optional[float] = None
    score_max: Optional[float] = None
    metric_evidence: Optional[Dict[str, NissMetricEvidence]] = None
    unscored_reason: Optional[Literal["preprint_only", "no_source", "no_metric_supported"]] = None

class PhysicsFeasibility(BaseModel):
    tier: Union[int, str]
    tier_label: str
    # Optional because QIF-T0136 to T0161 were authored without gate_reason or
    # analysis_date; timeline itself is backfilled from tier_label.
    timeline: Optional[str] = None
    gate_reason: Optional[str] = None
    constraint_system_ref: Optional[str] = None
    analysis_date: Optional[str] = None

class TechniqueEvidence(BaseModel):
    """Derived evidence tier. Prefer this over `status`, which is the legacy field."""
    tier: str
    basis: str
    neural_product_cve_count: int = 0
    adjacent_cve_count: int = 0
    population: Optional[str] = None
    legacy_status: Optional[str] = None
    derived_by: Optional[str] = None
    derived_on: Optional[str] = None

class CvssData(BaseModel):
    version: str = "4.0"
    base_vector: str
    supplemental: Optional[str] = None
    gap_group: Optional[int] = None
    gap_summary: Optional[str] = None

class NeurorightsMapped(BaseModel):
    affected: List[str] = []
    cci: Optional[float] = None

class FdoraProngs(BaseModel):
    software: bool = False
    network_connectable: bool = False
    vulnerable: bool = False

class Fdora524b(BaseModel):
    cyber_device: bool = False
    prongs: Optional[FdoraProngs] = None
    applicable_requirements: List[str] = []

class RegulatoryData(BaseModel):
    fdora_524b: Optional[Fdora524b] = None

class FeedsInto(BaseModel):
    targets: List[str] = []
    note: Optional[str] = None

class CrossReferences(BaseModel):
    related_ids: List[str] = []
    secondary_tactics: List[str] = Field(default_factory=list)

class ThreatTechnique(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    attack: str # This is the 'name' in the JSON
    technique: Optional[str] = None  # v2 alias for attack; backward compat
    tactic: str
    bands: str # String representation like "I0-N1"
    band_ids: List[str] = Field(default_factory=list)
    coupling: Optional[str] = None
    access: Optional[str] = None
    classical: Optional[Union[str, bool]] = None
    quantum: Optional[Union[str, bool]] = None
    sources: List[str] = []
    # Defence-side sources. The citation gate counts only `sources`.
    defensive_sources: List[str] = Field(default_factory=list)
    # Derived from `sources`. "preprint" and "none" cap status at THEORETICAL and bar a NISS score.
    peer_review_status: Literal["peer_reviewed", "preprint", "none"] = "none"
    status: str
    severity: str
    severity_source: Optional[str] = None  # 'niss' or 'editorial'
    severity_legacy: Optional[str] = None  # hand label before the NISS-derived one
    ui_category: Optional[str] = None
    notes: Optional[str] = None
    legacy_ids: List[str] = []
    legacy_technique_id: Optional[str] = None
    niss: Optional[NissData] = None
    tara: Optional[TARAEnrichment] = None
    dsm5: Optional[DSM5] = None
    physics_feasibility: Optional[PhysicsFeasibility] = None
    evidence: Optional[TechniqueEvidence] = None
    cvss: Optional[CvssData] = None
    neurorights: Optional[NeurorightsMapped] = None
    regulatory: Optional[RegulatoryData] = None
    cross_references: Optional[CrossReferences] = None
    feeds_into: Optional[FeedsInto] = None
    # Parent technique id (QIF-Txxxx) when this entry is a sub-technique, else None.
    # A child carries its own status, NISS vector and sources.
    parent_id: Optional[str] = None
    legacy_names: List[str] = []
    rename_note: Optional[str] = None

    # v2 taxonomy fields
    tara_domain_primary: Optional[str] = None
    tara_domain_secondary: List[str] = Field(default_factory=list)
    tara_mode: Optional[str] = None  # R=Reconnaissance, M=Manipulation, D=Disruption
    tara_drift: Optional[str] = None  # A=Acute, C=Cumulative, L=Latent, P=Persistent
    tara_drift_window: Optional[str] = None
    tara_direction: Optional[str] = None
    tara_alias: Optional[str] = None
    use_context_tags: List[str] = Field(default_factory=list)
    biological_target: Optional[bool] = None
    evidence_tier: Optional[str] = None  # e.g. "peer_reviewed", "demonstrated_lab"
    operational_readiness: Optional[str] = None  # e.g. "weaponized", "proof_of_concept"
    tara_enrichment_pending: bool = False

    @property
    def canonical_name(self) -> str:
        """Return the canonical technique name, preferring v2 `technique` over legacy `attack`."""
        return self.technique or self.attack

class VariantNiss(BaseModel):
    """A variant's own scoring state. It is never inherited; only the vector may be read from the parent."""
    version: str = "1.1"
    scoring_state: Literal["scored", "unscored"]
    inherited_from: Optional[str] = Field(default=None, pattern=TECHNIQUE_ID_REGEX)
    unscored_reason: Optional[Literal[
        "preprint_only", "no_source", "no_metric_supported", "impact_dimension_differs"
    ]] = None

class Variant(BaseModel):
    """A variant of one technique: same signal-level mechanism, tactic and harm, differing in one dimension.

    Variants are not techniques and are never counted as techniques. The convention is modelled on
    MITRE ATT&CK sub-techniques but uses a different id format (QIF-Tnnnn-Vnn).
    """
    model_config = ConfigDict(extra="forbid")

    id: str = Field(pattern=VARIANT_ID_REGEX)
    alias: str
    name: str
    parent: str = Field(pattern=TECHNIQUE_ID_REGEX)
    differs_in: Literal["access_path", "delivery", "target_model", "training_setup", "sensing_site"]
    inherits_niss: bool
    description: str
    conditions: List[str] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    defensive_sources: List[str] = Field(default_factory=list)
    peer_review_status: Literal["peer_reviewed", "preprint", "none"]
    status: str
    niss: VariantNiss
    related_ids: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

    @model_validator(mode="after")
    def check_parent_and_scoring(self) -> "Variant":
        if not self.id.startswith(f"{self.parent}-V"):
            raise ValueError(f"{self.id}: the id must extend the parent id {self.parent}")
        if self.parent in self.related_ids:
            raise ValueError(f"{self.id}: the parent belongs in parent, not in related_ids")
        is_scored = self.niss.scoring_state == "scored"
        if self.inherits_niss != is_scored or is_scored != (self.niss.inherited_from == self.parent):
            raise ValueError(f"{self.id}: a variant is scored only by inheriting its parent's vector")
        if self.inherits_niss and self.peer_review_status != "peer_reviewed":
            raise ValueError(f"{self.id}: a variant without a peer-reviewed source may not inherit a NISS vector")
        return self

class TaraRegistry(BaseModel):
    version: str
    framework: str
    generated: Optional[str] = None
    techniques: List[ThreatTechnique] = []
    variants: List[Variant] = []
