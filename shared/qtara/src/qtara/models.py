from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class DSM5Primary(BaseModel):
    code: str
    name: str

class DSM5(BaseModel):
    cluster: str
    primary: List[DSM5Primary]

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
    dual_use: str = "unknown"
    clinical: Optional[ClinicalEnrichment] = None
    governance: Optional[GovernanceEnrichment] = None
    engineering: Optional[EngineeringEnrichment] = None

class NissData(BaseModel):
    version: str = "1.0"
    vector: str
    score: float
    severity: str
    pins: bool = False

class PhysicsFeasibility(BaseModel):
    tier: Union[int, str]
    tier_label: str
    timeline: str
    gate_reason: Optional[str] = None
    constraint_system_ref: Optional[str] = None
    analysis_date: Optional[str] = None

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

class CrossReferences(BaseModel):
    related_ids: List[str] = []

class ThreatTechnique(BaseModel):
    id: str
    attack: str # This is the 'name' in the JSON
    tactic: str
    bands: str # String representation like "I0-N1"
    band_ids: List[str] = Field(default_factory=list)
    coupling: Optional[str] = None
    access: Optional[str] = None
    classical: Optional[str] = None
    quantum: Optional[str] = None
    sources: List[str] = []
    status: str
    severity: str
    ui_category: Optional[str] = None
    notes: Optional[str] = None
    legacy_ids: List[str] = []
    legacy_technique_id: Optional[str] = None
    niss: Optional[NissData] = None
    tara: Optional[TARAEnrichment] = None
    dsm5: Optional[DSM5] = None
    physics_feasibility: Optional[PhysicsFeasibility] = None
    cvss: Optional[CvssData] = None
    neurorights: Optional[NeurorightsMapped] = None
    regulatory: Optional[RegulatoryData] = None
    cross_references: Optional[CrossReferences] = None

class TaraRegistry(BaseModel):
    version: str
    framework: str
    techniques: List[ThreatTechnique] = []
