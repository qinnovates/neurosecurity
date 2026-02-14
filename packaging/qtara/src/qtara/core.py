import json
from pathlib import Path
from typing import List, Optional
from .models import ThreatTechnique, TaraRegistry

class TaraLoader:
    def __init__(self, data_path: Optional[Path] = None):
        if data_path is None:
            data_path = Path(__file__).parent / "data" / "qtara-registrar.json"
        
        self.data_path = data_path
        self._registry: Optional[TaraRegistry] = None

    def load(self) -> TaraRegistry:
        if not self.data_path.exists():
            raise FileNotFoundError(f"TARA registry file not found at {self.data_path}")
        
        with open(self.data_path, 'r') as f:
            data = json.load(f)
            
        self._registry = TaraRegistry(
            version=data.get("version", "unknown"),
            framework=data.get("framework", "unknown"),
            techniques=[ThreatTechnique(**t) for t in data.get("techniques", [])]
        )
        return self._registry

    def get_technique(self, technique_id: str) -> Optional[ThreatTechnique]:
        if not self._registry:
            self.load()
        for t in self._registry.techniques:
            if t.id == technique_id:
                return t
        return None

    def list_techniques(self, band: Optional[str] = None) -> List[ThreatTechnique]:
        if not self._registry:
            self.load()
        if band:
            return [t for t in self._registry.techniques if band in t.band_ids]
        return self._registry.techniques

class NissCalculator:
    """Utility to parse and evaluate NISS vectors."""
    @staticmethod
    def parse_vector(vector: str) -> dict:
        # Vector format: NISS:1.0/BI:H/CG:H/CV:E/RV:P/NP:T
        parts = vector.split('/')
        result = {}
        for part in parts:
            if ':' in part:
                key, val = part.split(':')
                result[key] = val
        return result
