from typing import List, Optional, Dict, Any
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

class TARAEnrichment(BaseModel):
    mechanism: Optional[str] = None
    dual_use: str = "unknown"
    clinical: Optional[ClinicalEnrichment] = None
    governance: Optional[GovernanceEnrichment] = None

class NissData(BaseModel):
    version: str = "1.0"
    vector: str
    score: float
    severity: str
    pins: bool = False

class ThreatTechnique(BaseModel):
    id: str
    attack: str # This is the 'name' in the JSON
    tactic: str
    bands: str # String representation like "I0–N1"
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

class TaraRegistry(BaseModel):
    version: str
    framework: str
    techniques: List[ThreatTechnique] = []
