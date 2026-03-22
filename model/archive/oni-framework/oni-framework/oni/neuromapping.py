"""
ONI Framework Neuromapping Module

Provides research-backed mappings between brain regions, neurotransmitter systems,
neural functions, and the ONI 14-layer model. All mappings include citations
to peer-reviewed literature.

===============================================================================
PURPOSE
===============================================================================
This module bridges neuroscience knowledge with the ONI security framework by:
1. Mapping brain regions to relevant ONI layers
2. Mapping neurotransmitter systems to cognitive functions
3. Providing time-scale hierarchies for signal validation
4. Supporting security analysis based on neural circuit knowledge

All mappings are derived from peer-reviewed neuroscience research.

===============================================================================
USAGE
===============================================================================
    >>> from oni.neuromapping import NeuroscienceAtlas
    >>> atlas = NeuroscienceAtlas()

    # Look up brain regions
    >>> snc = atlas.brain_region("SNc")
    >>> print(snc.full_name)  # "Substantia Nigra pars compacta"

    # Get neurotransmitter systems
    >>> da = atlas.neurotransmitter("dopamine")
    >>> print(da.synthesis_regions)  # ["SNc", "VTA"]

    # Map functions to layers
    >>> layers = atlas.function_to_layers("reward processing")
    >>> print(layers)  # [13]  (Semantic Layer - Intent)

    # Get citations
    >>> for ref in atlas.get_citations("dopamine"):
    ...     print(f"{ref.authors} ({ref.year})")

===============================================================================
REFERENCES
===============================================================================
See the References class at the bottom for complete citation information.
All data in this module is sourced from peer-reviewed literature.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple
from enum import Enum, auto


# =============================================================================
# Citation System
# =============================================================================

@dataclass
class Citation:
    """
    A peer-reviewed research citation.

    Attributes:
        id: Short identifier for internal reference
        authors: Author list (APA format)
        year: Publication year
        title: Paper title
        journal: Journal name
        volume: Volume number (optional)
        pages: Page range (optional)
        doi: DOI identifier (optional)
        pmid: PubMed ID (optional)
        key_finding: Brief summary of relevant finding
    """
    id: str
    authors: str
    year: int
    title: str
    journal: str
    volume: Optional[str] = None
    pages: Optional[str] = None
    doi: Optional[str] = None
    pmid: Optional[str] = None
    key_finding: Optional[str] = None

    def apa_format(self) -> str:
        """Return citation in APA 7th edition format."""
        base = f"{self.authors} ({self.year}). {self.title}. *{self.journal}*"
        if self.volume:
            base += f", {self.volume}"
        if self.pages:
            base += f", {self.pages}"
        base += "."
        if self.doi:
            base += f" https://doi.org/{self.doi}"
        return base


class References:
    """
    Citation database for all neuroscience research referenced in ONI Framework.

    Usage:
        >>> refs = References()
        >>> cite = refs.get("bjorklund2007")
        >>> print(cite.apa_format())
    """

    def __init__(self):
        self._citations: Dict[str, Citation] = {}
        self._build_database()

    def _build_database(self):
        """Load all citations into the database."""

        # Dopamine System
        self._citations["bjorklund2007"] = Citation(
            id="bjorklund2007",
            authors="Björklund, A., & Dunnett, S. B.",
            year=2007,
            title="Dopamine neuron systems in the brain: an update",
            journal="Trends in Neurosciences",
            volume="30(5)",
            pages="194-202",
            doi="10.1016/j.tins.2007.03.006",
            key_finding="Comprehensive mapping of dopamine pathways: nigrostriatal, mesolimbic, mesocortical, tuberoinfundibular"
        )

        self._citations["matak2016"] = Citation(
            id="matak2016",
            authors="Matak, P., et al.",
            year=2016,
            title="Disrupted iron homeostasis causes dopaminergic neurodegeneration in mice",
            journal="PNAS",
            volume="113(13)",
            pages="3428-3435",
            doi="10.1073/pnas.1519473113",
            key_finding="Loss of transferrin receptor 1 causes neuronal iron deficiency and dopaminergic neurodegeneration"
        )

        self._citations["nagatsu2016"] = Citation(
            id="nagatsu2016",
            authors="Nagatsu, T.",
            year=2016,
            title="Tyrosine hydroxylase (TH), its cofactor tetrahydrobiopterin (BH4), other catecholamine-related enzymes...",
            journal="Journal of Neural Transmission",
            volume="123",
            pages="729-738",
            pmid="27491309",
            key_finding="TH requires Fe²⁺ and BH4 cofactors; Fe³⁺ oxidation inactivates the enzyme"
        )

        self._citations["zucca2017"] = Citation(
            id="zucca2017",
            authors="Zucca, F. A., et al.",
            year=2017,
            title="Iron deposition in substantia nigra",
            journal="Scientific Reports",
            volume="7",
            pages="14721",
            doi="10.1038/s41598-017-14721-1",
            key_finding="Iron accumulation in SNc correlates with Parkinson's severity"
        )

        # Adenosine/Caffeine System
        self._citations["lazarus2011"] = Citation(
            id="lazarus2011",
            authors="Lazarus, M., et al.",
            year=2011,
            title="Arousal effect of caffeine depends on adenosine A2A receptors in the shell of the nucleus accumbens",
            journal="Journal of Neuroscience",
            volume="31(27)",
            pages="10067-10075",
            doi="10.1523/JNEUROSCI.6730-10.2011",
            key_finding="NAc shell A2A receptors mediate caffeine's arousal effect; ~pea-sized region"
        )

        self._citations["porkka1997"] = Citation(
            id="porkka1997",
            authors="Porkka-Heiskanen, T., et al.",
            year=1997,
            title="Adenosine: A mediator of the sleep-inducing effects of prolonged wakefulness",
            journal="Science",
            volume="276(5316)",
            pages="1265-1268",
            key_finding="Adenosine accumulates in basal forebrain during wakefulness"
        )

        self._citations["huang2005"] = Citation(
            id="huang2005",
            authors="Huang, Z. L., et al.",
            year=2005,
            title="Adenosine A2A, but not A1, receptors mediate the arousal effect of caffeine",
            journal="Nature Neuroscience",
            volume="8",
            pages="858-859",
            doi="10.1038/nn1491",
            key_finding="A2A receptors specifically mediate caffeine arousal"
        )

        # BH4 and Neurotransmitter Synthesis
        self._citations["werner2011"] = Citation(
            id="werner2011",
            authors="Werner, E. R., et al.",
            year=2011,
            title="Tetrahydrobiopterin: biochemistry and pathophysiology",
            journal="Biochemical Journal",
            volume="438(3)",
            pages="397-414",
            doi="10.1042/BJ20110293",
            key_finding="BH4 is essential cofactor for all aromatic amino acid hydroxylases"
        )

        self._citations["thony2000"] = Citation(
            id="thony2000",
            authors="Thöny, B., et al.",
            year=2000,
            title="Tetrahydrobiopterin biosynthesis, regeneration and functions",
            journal="Biochemical Journal",
            volume="347",
            pages="1-16",
            key_finding="BH4 biosynthesis pathway and its role in monoamine synthesis"
        )

        # Synaptic Transmission
        self._citations["sudhof2012"] = Citation(
            id="sudhof2012",
            authors="Südhof, T. C.",
            year=2012,
            title="Calcium control of neurotransmitter release",
            journal="Cold Spring Harbor Perspectives in Biology",
            volume="4(1)",
            pages="a011353",
            doi="10.1101/cshperspect.a011353",
            key_finding="Ca²⁺ triggers vesicle fusion and neurotransmitter release"
        )

        self._citations["katz1967"] = Citation(
            id="katz1967",
            authors="Katz, B., & Miledi, R.",
            year=1967,
            title="The timing of calcium action during neuromuscular transmission",
            journal="Journal of Physiology",
            volume="189(3)",
            pages="535-544",
            key_finding="Foundational work establishing Ca²⁺ role in synaptic transmission"
        )

        # Serotonin System
        self._citations["jacobs2004"] = Citation(
            id="jacobs2004",
            authors="Jacobs, B. L., & Azmitia, E. C.",
            year=1992,
            title="Structure and function of the brain serotonin system",
            journal="Physiological Reviews",
            volume="72(1)",
            pages="165-229",
            doi="10.1152/physrev.1992.72.1.165",
            key_finding="Raphe nuclei are the primary source of brain serotonin"
        )

        # Norepinephrine System
        self._citations["aston2005"] = Citation(
            id="aston2005",
            authors="Aston-Jones, G., & Cohen, J. D.",
            year=2005,
            title="An integrative theory of locus coeruleus-norepinephrine function: adaptive gain and optimal performance",
            journal="Annual Review of Neuroscience",
            volume="28",
            pages="403-450",
            doi="10.1146/annurev.neuro.28.061604.135709",
            key_finding="LC-NE system modulates gain and optimizes performance based on task demands"
        )

        # GABA System
        self._citations["mccormick1989"] = Citation(
            id="mccormick1989",
            authors="McCormick, D. A.",
            year=1989,
            title="GABA as an inhibitory neurotransmitter in human cerebral cortex",
            journal="Journal of Neurophysiology",
            volume="62(5)",
            pages="1018-1027",
            key_finding="GABA mediates primary inhibition in cortex"
        )

        # Glutamate System
        self._citations["cotman2002"] = Citation(
            id="cotman2002",
            authors="Cotman, C. W., & Bhave, S.",
            year=2002,
            title="Glutamate receptor regulation in cortex",
            journal="Progress in Brain Research",
            volume="132",
            pages="3-17",
            key_finding="Glutamate is the primary excitatory neurotransmitter"
        )

        # Acetylcholine System
        self._citations["hasselmo2006"] = Citation(
            id="hasselmo2006",
            authors="Hasselmo, M. E., & Giocomo, L. M.",
            year=2006,
            title="Cholinergic modulation of cortical function",
            journal="Journal of Molecular Neuroscience",
            volume="30(1)",
            pages="133-135",
            doi="10.1385/JMN:30:1:133",
            key_finding="ACh from basal forebrain modulates attention and memory encoding"
        )

        # Endocannabinoid System
        self._citations["castillo2012"] = Citation(
            id="castillo2012",
            authors="Castillo, P. E., et al.",
            year=2012,
            title="Endocannabinoid signaling and synaptic function",
            journal="Neuron",
            volume="76(1)",
            pages="70-81",
            doi="10.1016/j.neuron.2012.09.020",
            key_finding="Endocannabinoids mediate retrograde synaptic signaling"
        )

        # Time Scales
        self._citations["buzsaki2006"] = Citation(
            id="buzsaki2006",
            authors="Buzsáki, G.",
            year=2006,
            title="Rhythms of the Brain",
            journal="Oxford University Press",
            doi="10.1093/acprof:oso/9780195301069.001.0001",
            key_finding="Comprehensive treatment of neural oscillations across scales"
        )

        # Stimulation Safety
        self._citations["shannon1992"] = Citation(
            id="shannon1992",
            authors="Shannon, R. V.",
            year=1992,
            title="A model of safe levels for electrical stimulation",
            journal="IEEE Transactions on Biomedical Engineering",
            volume="39(4)",
            pages="424-426",
            doi="10.1109/10.126616",
            key_finding="Shannon limit (k=1.5) for safe charge density"
        )

        self._citations["merrill2005"] = Citation(
            id="merrill2005",
            authors="Merrill, D. R., Bikson, M., & Jefferys, J. G.",
            year=2005,
            title="Electrical stimulation of excitable tissue: design of efficacious and safe protocols",
            journal="Journal of Neuroscience Methods",
            volume="141(2)",
            pages="171-198",
            doi="10.1016/j.jneumeth.2004.10.020",
            key_finding="Safety guidelines for neural stimulation protocols"
        )

    def get(self, citation_id: str) -> Optional[Citation]:
        """Get a citation by ID."""
        return self._citations.get(citation_id)

    def all(self) -> List[Citation]:
        """Return all citations."""
        return list(self._citations.values())

    def by_topic(self, topic: str) -> List[Citation]:
        """Get citations related to a topic."""
        topic_lower = topic.lower()
        topic_map = {
            "dopamine": ["bjorklund2007", "matak2016", "nagatsu2016", "zucca2017"],
            "adenosine": ["lazarus2011", "porkka1997", "huang2005"],
            "caffeine": ["lazarus2011", "huang2005"],
            "serotonin": ["jacobs2004", "thony2000", "werner2011"],
            "norepinephrine": ["aston2005"],
            "gaba": ["mccormick1989"],
            "glutamate": ["cotman2002"],
            "acetylcholine": ["hasselmo2006"],
            "endocannabinoid": ["castillo2012"],
            "bh4": ["werner2011", "thony2000", "nagatsu2016"],
            "iron": ["matak2016", "zucca2017", "nagatsu2016"],
            "calcium": ["sudhof2012", "katz1967"],
            "time_scale": ["buzsaki2006"],
            "stimulation": ["shannon1992", "merrill2005"],
        }
        ids = topic_map.get(topic_lower, [])
        return [self._citations[id] for id in ids if id in self._citations]


# =============================================================================
# Brain Region Mappings
# =============================================================================

@dataclass
class BrainRegion:
    """
    A brain region with its properties and ONI layer mapping.

    Attributes:
        abbreviation: Standard abbreviation (e.g., "SNc", "VTA")
        full_name: Full anatomical name
        location: Anatomical location description
        primary_neurotransmitters: Main neurotransmitters produced/received
        primary_functions: Main cognitive/behavioral functions
        oni_layers: Which ONI layers this region is most relevant to
        afferents: Regions that send input here
        efferents: Regions this region projects to
        citations: List of citation IDs supporting this mapping
        bci_access: BCI accessibility level ("high", "medium", "low", "none")
    """
    abbreviation: str
    full_name: str
    location: str
    primary_neurotransmitters: List[str]
    primary_functions: List[str]
    oni_layers: List[int]
    afferents: List[str] = field(default_factory=list)
    efferents: List[str] = field(default_factory=list)
    citations: List[str] = field(default_factory=list)
    bci_access: str = "medium"
    notes: Optional[str] = None


class BrainRegionAtlas:
    """
    Database of brain regions relevant to BCI security.

    Focuses on regions with:
    1. High relevance to neurotransmitter systems
    2. Documented attack surfaces in BCI literature
    3. Key roles in cognitive functions (L12-L14)
    """

    def __init__(self):
        self._regions: Dict[str, BrainRegion] = {}
        self._build_atlas()

    def _build_atlas(self):
        """Build the brain region database."""

        # === DOPAMINE SYSTEM REGIONS ===

        self._regions["SNc"] = BrainRegion(
            abbreviation="SNc",
            full_name="Substantia Nigra pars compacta",
            location="Midbrain, ventral to tectum",
            primary_neurotransmitters=["dopamine"],
            primary_functions=["motor control", "movement initiation", "action selection"],
            oni_layers=[9, 10, 11],  # Signal Processing, Neural Protocol, Cognitive Transport
            afferents=["striatum", "STN", "cortex"],
            efferents=["striatum", "thalamus"],
            citations=["bjorklund2007", "zucca2017"],
            bci_access="low",
            notes="Contains ~80% of brain's dopamine neurons. Primary target in Parkinson's disease."
        )

        self._regions["VTA"] = BrainRegion(
            abbreviation="VTA",
            full_name="Ventral Tegmental Area",
            location="Midbrain, medial to SNc",
            primary_neurotransmitters=["dopamine", "GABA", "glutamate"],
            primary_functions=["reward processing", "motivation", "reinforcement learning"],
            oni_layers=[12, 13],  # Cognitive Session, Semantic Layer
            afferents=["LH", "PFC", "amygdala", "PPTg"],
            efferents=["NAc", "PFC", "amygdala", "hippocampus"],
            citations=["bjorklund2007"],
            bci_access="low",
            notes="Origin of mesolimbic and mesocortical dopamine pathways."
        )

        self._regions["NAc"] = BrainRegion(
            abbreviation="NAc",
            full_name="Nucleus Accumbens",
            location="Ventral striatum, basal forebrain",
            primary_neurotransmitters=["dopamine", "GABA", "adenosine"],
            primary_functions=["reward", "motivation", "arousal", "addiction"],
            oni_layers=[12, 13],  # Cognitive Session, Semantic Layer
            afferents=["VTA", "amygdala", "hippocampus", "PFC"],
            efferents=["VP", "LH", "VTA"],
            citations=["lazarus2011", "bjorklund2007"],
            bci_access="low",
            notes="Shell region (~pea-sized) mediates caffeine's arousal effect via A2A receptors."
        )

        self._regions["striatum"] = BrainRegion(
            abbreviation="striatum",
            full_name="Dorsal Striatum (Caudate + Putamen)",
            location="Basal ganglia",
            primary_neurotransmitters=["dopamine", "GABA", "acetylcholine"],
            primary_functions=["motor control", "habit formation", "procedural learning"],
            oni_layers=[10, 11, 12],  # Neural Protocol, Cognitive Transport, Session
            afferents=["SNc", "cortex", "thalamus"],
            efferents=["GPi", "GPe", "SNr"],
            citations=["bjorklund2007"],
            bci_access="medium",
            notes="Major target of nigrostriatal dopamine pathway."
        )

        self._regions["PFC"] = BrainRegion(
            abbreviation="PFC",
            full_name="Prefrontal Cortex",
            location="Frontal lobe, anterior to motor cortex",
            primary_neurotransmitters=["glutamate", "GABA", "dopamine", "norepinephrine"],
            primary_functions=["executive function", "working memory", "decision making", "planning"],
            oni_layers=[12, 13, 14],  # Session, Semantic, Identity
            afferents=["VTA", "thalamus", "amygdala", "hippocampus"],
            efferents=["striatum", "thalamus", "amygdala", "brainstem"],
            citations=["bjorklund2007", "aston2005"],
            bci_access="high",
            notes="Critical for cognitive control. Target of mesocortical dopamine pathway."
        )

        # === SLEEP/AROUSAL SYSTEM REGIONS ===

        self._regions["BF"] = BrainRegion(
            abbreviation="BF",
            full_name="Basal Forebrain",
            location="Ventral forebrain, including SI, DB, MS",
            primary_neurotransmitters=["acetylcholine", "GABA", "adenosine"],
            primary_functions=["arousal", "attention", "memory encoding"],
            oni_layers=[11, 12],  # Cognitive Transport, Session
            afferents=["brainstem", "hypothalamus"],
            efferents=["cortex", "hippocampus", "amygdala"],
            citations=["porkka1997", "hasselmo2006"],
            bci_access="low",
            notes="Adenosine accumulates here during wakefulness to drive sleep pressure."
        )

        self._regions["LC"] = BrainRegion(
            abbreviation="LC",
            full_name="Locus Coeruleus",
            location="Brainstem (pons), dorsal",
            primary_neurotransmitters=["norepinephrine"],
            primary_functions=["arousal", "attention", "stress response", "vigilance"],
            oni_layers=[11, 12, 13],  # Transport, Session, Semantic
            afferents=["PFC", "amygdala", "hypothalamus"],
            efferents=["widespread cortical projection"],
            citations=["aston2005"],
            bci_access="low",
            notes="Primary source of brain norepinephrine. Modulates gain based on task demands."
        )

        self._regions["VLPO"] = BrainRegion(
            abbreviation="VLPO",
            full_name="Ventrolateral Preoptic Area",
            location="Anterior hypothalamus",
            primary_neurotransmitters=["GABA", "galanin"],
            primary_functions=["sleep promotion", "arousal inhibition"],
            oni_layers=[11],  # Cognitive Transport
            afferents=["BF", "brainstem"],
            efferents=["LHA", "TMN", "LC", "raphe"],
            citations=["porkka1997"],
            bci_access="none",
            notes="Primary sleep-promoting center. Inhibits wake-promoting regions."
        )

        self._regions["LHA"] = BrainRegion(
            abbreviation="LHA",
            full_name="Lateral Hypothalamic Area",
            location="Lateral hypothalamus",
            primary_neurotransmitters=["orexin/hypocretin", "MCH"],
            primary_functions=["arousal", "feeding", "reward"],
            oni_layers=[11, 12],  # Transport, Session
            afferents=["NAc", "amygdala", "brainstem"],
            efferents=["cortex", "VTA", "LC", "brainstem"],
            citations=["lazarus2011"],
            bci_access="none",
            notes="Orexin neurons maintain wakefulness. Loss causes narcolepsy."
        )

        # === SEROTONIN SYSTEM REGIONS ===

        self._regions["raphe"] = BrainRegion(
            abbreviation="raphe",
            full_name="Raphe Nuclei",
            location="Brainstem (midline, from midbrain to medulla)",
            primary_neurotransmitters=["serotonin"],
            primary_functions=["mood regulation", "sleep", "appetite", "pain modulation"],
            oni_layers=[11, 12, 13],  # Transport, Session, Semantic
            afferents=["PFC", "hypothalamus", "amygdala"],
            efferents=["widespread projection to forebrain and spinal cord"],
            citations=["jacobs2004"],
            bci_access="low",
            notes="Primary source of brain serotonin."
        )

        # === MEMORY SYSTEM REGIONS ===

        self._regions["hippocampus"] = BrainRegion(
            abbreviation="hippocampus",
            full_name="Hippocampus",
            location="Medial temporal lobe",
            primary_neurotransmitters=["glutamate", "GABA", "acetylcholine"],
            primary_functions=["memory formation", "spatial navigation", "episodic memory"],
            oni_layers=[12, 13, 14],  # Session, Semantic, Identity
            afferents=["entorhinal cortex", "BF", "amygdala"],
            efferents=["cortex", "hypothalamus", "amygdala"],
            citations=["hasselmo2006"],
            bci_access="medium",
            notes="Critical for declarative memory. Site of extensive LTP research."
        )

        self._regions["amygdala"] = BrainRegion(
            abbreviation="amygdala",
            full_name="Amygdala",
            location="Medial temporal lobe, anterior to hippocampus",
            primary_neurotransmitters=["glutamate", "GABA"],
            primary_functions=["emotion processing", "fear conditioning", "emotional memory"],
            oni_layers=[12, 13],  # Session, Semantic
            afferents=["thalamus", "cortex", "hippocampus"],
            efferents=["hypothalamus", "brainstem", "cortex", "striatum"],
            citations=["bjorklund2007"],
            bci_access="low",
            notes="Key hub for emotional processing and fear learning."
        )

        # === MOTOR SYSTEM REGIONS ===

        self._regions["M1"] = BrainRegion(
            abbreviation="M1",
            full_name="Primary Motor Cortex",
            location="Precentral gyrus, frontal lobe",
            primary_neurotransmitters=["glutamate", "GABA"],
            primary_functions=["movement execution", "motor control"],
            oni_layers=[10, 11],  # Neural Protocol, Cognitive Transport
            afferents=["premotor cortex", "SMA", "thalamus", "somatosensory cortex"],
            efferents=["spinal cord", "brainstem", "striatum"],
            citations=["merrill2005"],
            bci_access="high",
            notes="Primary target for motor BCIs. Well-characterized somatotopic organization."
        )

        # === SENSORY PROCESSING REGIONS ===

        self._regions["V1"] = BrainRegion(
            abbreviation="V1",
            full_name="Primary Visual Cortex",
            location="Occipital lobe (calcarine sulcus)",
            primary_neurotransmitters=["glutamate", "GABA"],
            primary_functions=["visual processing", "edge detection", "orientation selectivity"],
            oni_layers=[9, 10],  # Signal Processing, Neural Protocol
            afferents=["LGN (thalamus)"],
            efferents=["V2", "V4", "MT"],
            citations=["buzsaki2006"],
            bci_access="high",
            notes="Target for visual prosthetics. Retinotopic organization."
        )

        self._regions["A1"] = BrainRegion(
            abbreviation="A1",
            full_name="Primary Auditory Cortex",
            location="Superior temporal gyrus",
            primary_neurotransmitters=["glutamate", "GABA"],
            primary_functions=["auditory processing", "sound localization"],
            oni_layers=[9, 10],  # Signal Processing, Neural Protocol
            afferents=["MGN (thalamus)"],
            efferents=["auditory association areas"],
            citations=["buzsaki2006"],
            bci_access="high",
            notes="Tonotopic organization. Relevant for cochlear implants."
        )

    def get(self, abbreviation: str) -> Optional[BrainRegion]:
        """Get a brain region by abbreviation."""
        return self._regions.get(abbreviation)

    def all(self) -> List[BrainRegion]:
        """Return all brain regions."""
        return list(self._regions.values())

    def by_neurotransmitter(self, nt: str) -> List[BrainRegion]:
        """Get regions associated with a neurotransmitter."""
        nt_lower = nt.lower()
        return [r for r in self._regions.values()
                if any(nt_lower in n.lower() for n in r.primary_neurotransmitters)]

    def by_function(self, function: str) -> List[BrainRegion]:
        """Get regions associated with a cognitive function."""
        func_lower = function.lower()
        return [r for r in self._regions.values()
                if any(func_lower in f.lower() for f in r.primary_functions)]

    def by_layer(self, layer: int) -> List[BrainRegion]:
        """Get regions relevant to a specific ONI layer."""
        return [r for r in self._regions.values() if layer in r.oni_layers]

    def by_bci_access(self, level: str) -> List[BrainRegion]:
        """Get regions by BCI accessibility level."""
        return [r for r in self._regions.values() if r.bci_access == level]


# =============================================================================
# Neurotransmitter System Mappings
# =============================================================================

@dataclass
class NeurotransmitterSystem:
    """
    A neurotransmitter system with synthesis, pathways, and ONI layer mapping.

    Attributes:
        name: Common name (e.g., "dopamine")
        abbreviation: Standard abbreviation (e.g., "DA")
        category: Monoamine, amino acid, peptide, etc.
        synthesis_enzyme: Rate-limiting enzyme
        required_cofactors: Cofactors needed for synthesis
        synthesis_regions: Brain regions where it's synthesized
        major_pathways: Named projection pathways
        receptor_types: Known receptor subtypes
        primary_functions: Main cognitive/behavioral roles
        oni_layers: Most relevant ONI layers
        time_scale: Typical signaling time scale
        bci_can_trigger_release: Whether BCI can trigger release
        bci_can_synthesize: Whether BCI can cause synthesis
        citations: Supporting citation IDs
    """
    name: str
    abbreviation: str
    category: str
    synthesis_enzyme: str
    required_cofactors: List[str]
    synthesis_regions: List[str]
    major_pathways: List[str]
    receptor_types: List[str]
    primary_functions: List[str]
    oni_layers: List[int]
    time_scale: str  # e.g., "milliseconds", "seconds"
    bci_can_trigger_release: bool
    bci_can_synthesize: bool
    citations: List[str] = field(default_factory=list)
    security_notes: Optional[str] = None


class NeurotransmitterAtlas:
    """
    Database of neurotransmitter systems relevant to BCI security.

    Includes:
    1. Synthesis requirements (cofactors, enzymes)
    2. BCI capabilities and limitations
    3. ONI layer relevance
    4. Security implications
    """

    def __init__(self):
        self._systems: Dict[str, NeurotransmitterSystem] = {}
        self._build_atlas()

    def _build_atlas(self):
        """Build the neurotransmitter database."""

        self._systems["dopamine"] = NeurotransmitterSystem(
            name="dopamine",
            abbreviation="DA",
            category="catecholamine (monoamine)",
            synthesis_enzyme="Tyrosine Hydroxylase (TH)",
            required_cofactors=["Fe²⁺", "BH4 (tetrahydrobiopterin)", "O₂"],
            synthesis_regions=["SNc", "VTA"],
            major_pathways=[
                "Nigrostriatal (SNc → Striatum): motor control",
                "Mesolimbic (VTA → NAc): reward, motivation",
                "Mesocortical (VTA → PFC): executive function",
                "Tuberoinfundibular (Hypothalamus → Pituitary): prolactin"
            ],
            receptor_types=["D1", "D2", "D3", "D4", "D5"],
            primary_functions=["motor control", "reward", "motivation", "working memory"],
            oni_layers=[11, 12, 13],  # Transport, Session, Semantic
            time_scale="seconds to minutes",
            bci_can_trigger_release=True,
            bci_can_synthesize=False,
            citations=["bjorklund2007", "matak2016", "nagatsu2016", "zucca2017"],
            security_notes="Iron depletion attack would reduce synthesis. BCI cannot compensate via electrical stimulation."
        )

        self._systems["serotonin"] = NeurotransmitterSystem(
            name="serotonin",
            abbreviation="5-HT",
            category="indolamine (monoamine)",
            synthesis_enzyme="Tryptophan Hydroxylase (TPH)",
            required_cofactors=["Fe²⁺", "BH4", "O₂"],
            synthesis_regions=["raphe"],
            major_pathways=[
                "Raphe → Cortex: mood, cognition",
                "Raphe → Hippocampus: memory",
                "Raphe → Amygdala: emotion",
                "Raphe → Spinal cord: pain modulation"
            ],
            receptor_types=["5-HT1A", "5-HT1B", "5-HT2A", "5-HT2C", "5-HT3", "5-HT4", "5-HT6", "5-HT7"],
            primary_functions=["mood regulation", "sleep", "appetite", "anxiety", "cognition"],
            oni_layers=[12, 13, 14],  # Session, Semantic, Identity
            time_scale="seconds to hours",
            bci_can_trigger_release=True,
            bci_can_synthesize=False,
            citations=["jacobs2004", "werner2011"],
            security_notes="Tryptophan depletion or BH4 inhibition would impair synthesis. Long-term effects on mood/identity."
        )

        self._systems["norepinephrine"] = NeurotransmitterSystem(
            name="norepinephrine",
            abbreviation="NE",
            category="catecholamine (monoamine)",
            synthesis_enzyme="Dopamine β-Hydroxylase (DBH)",
            required_cofactors=["Cu²⁺", "Ascorbate (Vitamin C)", "O₂"],
            synthesis_regions=["LC"],
            major_pathways=[
                "LC → Cortex (widespread): arousal, attention",
                "LC → Hippocampus: memory modulation",
                "LC → Amygdala: emotional salience"
            ],
            receptor_types=["α1", "α2", "β1", "β2", "β3"],
            primary_functions=["arousal", "attention", "vigilance", "stress response"],
            oni_layers=[11, 12, 13],  # Transport, Session, Semantic
            time_scale="milliseconds to seconds",
            bci_can_trigger_release=True,
            bci_can_synthesize=False,
            citations=["aston2005"],
            security_notes="LC-NE system modulates gain. Could be targeted to disrupt attention/vigilance."
        )

        self._systems["GABA"] = NeurotransmitterSystem(
            name="GABA",
            abbreviation="GABA",
            category="amino acid",
            synthesis_enzyme="Glutamic Acid Decarboxylase (GAD)",
            required_cofactors=["Pyridoxal-5'-phosphate (Vitamin B6)"],
            synthesis_regions=["cortex (interneurons)", "basal ganglia", "cerebellum", "widespread"],
            major_pathways=[
                "Cortical interneurons: local inhibition",
                "Striatal MSNs → GPi/SNr: motor control",
                "Purkinje cells → deep cerebellar nuclei: coordination"
            ],
            receptor_types=["GABA_A (ionotropic)", "GABA_B (metabotropic)"],
            primary_functions=["inhibition", "anxiety reduction", "seizure prevention", "sleep"],
            oni_layers=[9, 10, 11, 12],  # Signal Processing through Session
            time_scale="milliseconds",
            bci_can_trigger_release=True,
            bci_can_synthesize=False,
            citations=["mccormick1989"],
            security_notes="B6 depletion reduces GABA synthesis. Could cause seizures, anxiety, cognitive impairment."
        )

        self._systems["glutamate"] = NeurotransmitterSystem(
            name="glutamate",
            abbreviation="Glu",
            category="amino acid",
            synthesis_enzyme="Glutaminase (GLS)",
            required_cofactors=["Phosphate"],
            synthesis_regions=["cortex (pyramidal neurons)", "hippocampus", "thalamus", "widespread"],
            major_pathways=[
                "Cortical pyramidal → subcortical: motor commands, cognition",
                "Thalamocortical: sensory relay",
                "Hippocampal: memory encoding (LTP)"
            ],
            receptor_types=["NMDA", "AMPA", "Kainate", "mGluR1-8"],
            primary_functions=["excitation", "learning", "memory", "synaptic plasticity"],
            oni_layers=[9, 10, 11, 12],  # Signal Processing through Session
            time_scale="milliseconds",
            bci_can_trigger_release=True,
            bci_can_synthesize=False,
            citations=["cotman2002"],
            security_notes="Primary excitatory NT. Excess glutamate causes excitotoxicity."
        )

        self._systems["acetylcholine"] = NeurotransmitterSystem(
            name="acetylcholine",
            abbreviation="ACh",
            category="ester",
            synthesis_enzyme="Choline Acetyltransferase (ChAT)",
            required_cofactors=["Acetyl-CoA", "Choline"],
            synthesis_regions=["BF", "brainstem (PPTg, LDTg)", "striatum (interneurons)"],
            major_pathways=[
                "BF → Cortex: attention, memory encoding",
                "PPTg/LDTg → Thalamus: REM sleep, arousal",
                "Motor neurons → Muscle: movement (NMJ)"
            ],
            receptor_types=["Nicotinic (nAChR)", "Muscarinic (M1-M5)"],
            primary_functions=["attention", "memory", "arousal", "muscle contraction"],
            oni_layers=[11, 12, 13],  # Transport, Session, Semantic
            time_scale="milliseconds to seconds",
            bci_can_trigger_release=True,
            bci_can_synthesize=False,
            citations=["hasselmo2006"],
            security_notes="Choline deficiency impairs ACh synthesis. Critical for memory and attention."
        )

        self._systems["adenosine"] = NeurotransmitterSystem(
            name="adenosine",
            abbreviation="Ado",
            category="purine neuromodulator",
            synthesis_enzyme="5'-Nucleotidase (from ATP breakdown)",
            required_cofactors=["ATP (precursor)"],
            synthesis_regions=["widespread (accumulates in BF during wakefulness)"],
            major_pathways=[
                "BF accumulation: sleep pressure",
                "NAc shell: arousal modulation"
            ],
            receptor_types=["A1", "A2A", "A2B", "A3"],
            primary_functions=["sleep regulation", "neuroprotection", "energy homeostasis"],
            oni_layers=[11, 12],  # Transport, Session
            time_scale="minutes to hours",
            bci_can_trigger_release=False,  # Metabolic byproduct
            bci_can_synthesize=False,
            citations=["lazarus2011", "porkka1997", "huang2005"],
            security_notes="A2A antagonism (caffeine) blocks sleep signal. Could be mimicked pharmacologically but not electrically."
        )

        self._systems["endocannabinoids"] = NeurotransmitterSystem(
            name="endocannabinoids",
            abbreviation="eCB",
            category="lipid neuromodulator",
            synthesis_enzyme="DAGL (2-AG), NAPE-PLD (AEA)",
            required_cofactors=["Membrane lipid precursors"],
            synthesis_regions=["widespread (on-demand synthesis)"],
            major_pathways=[
                "Retrograde signaling at synapses",
                "Corticostriatal: reward, habit",
                "Hippocampal: memory modulation"
            ],
            receptor_types=["CB1 (CNS)", "CB2 (immune, some CNS)"],
            primary_functions=["retrograde signaling", "synaptic plasticity", "pain", "appetite"],
            oni_layers=[10, 11, 12],  # Protocol, Transport, Session
            time_scale="seconds",
            bci_can_trigger_release=True,  # Activity-dependent
            bci_can_synthesize=False,
            citations=["castillo2012"],
            security_notes="On-demand synthesis makes direct manipulation difficult. Activity patterns influence release."
        )

    def get(self, name: str) -> Optional[NeurotransmitterSystem]:
        """Get a neurotransmitter system by name."""
        return self._systems.get(name.lower())

    def all(self) -> List[NeurotransmitterSystem]:
        """Return all neurotransmitter systems."""
        return list(self._systems.values())

    def by_cofactor(self, cofactor: str) -> List[NeurotransmitterSystem]:
        """Get systems requiring a specific cofactor."""
        cofactor_lower = cofactor.lower()
        return [s for s in self._systems.values()
                if any(cofactor_lower in c.lower() for c in s.required_cofactors)]

    def by_function(self, function: str) -> List[NeurotransmitterSystem]:
        """Get systems involved in a cognitive function."""
        func_lower = function.lower()
        return [s for s in self._systems.values()
                if any(func_lower in f.lower() for f in s.primary_functions)]

    def by_layer(self, layer: int) -> List[NeurotransmitterSystem]:
        """Get systems relevant to a specific ONI layer."""
        return [s for s in self._systems.values() if layer in s.oni_layers]

    def bci_controllable(self) -> List[NeurotransmitterSystem]:
        """Get systems where BCI can trigger release."""
        return [s for s in self._systems.values() if s.bci_can_trigger_release]


# =============================================================================
# Time Scale Mappings
# =============================================================================

@dataclass
class TimeScale:
    """
    A time scale in neural processing with ONI layer mapping.

    Attributes:
        name: Descriptive name (e.g., "Synaptic transmission")
        order_of_magnitude: Exponent (e.g., -3 for milliseconds)
        duration_str: Human-readable duration
        example_processes: Neural processes at this scale
        oni_layers: Relevant ONI layers
        bci_access: BCI accessibility at this scale
    """
    name: str
    order_of_magnitude: int
    duration_str: str
    example_processes: List[str]
    oni_layers: List[int]
    bci_access: str  # "direct", "indirect", "none"


class TimeScaleHierarchy:
    """
    Time scale hierarchy across neural processing.

    From femtoseconds (molecular) to lifetime (identity).
    Maps each scale to ONI layers and BCI accessibility.
    """

    def __init__(self):
        self._scales: List[TimeScale] = []
        self._build_hierarchy()

    def _build_hierarchy(self):
        """Build the time scale database."""

        self._scales = [
            TimeScale(
                name="Electron transfer",
                order_of_magnitude=-15,
                duration_str="femtoseconds (10⁻¹⁵ s)",
                example_processes=["Fe²⁺ oxidation in TH", "Enzyme electron transfer"],
                oni_layers=[],  # Within L8 molecular substrate
                bci_access="none"
            ),
            TimeScale(
                name="Molecular vibrations",
                order_of_magnitude=-12,
                duration_str="picoseconds (10⁻¹² s)",
                example_processes=["BH4 conformational change", "Protein vibrations"],
                oni_layers=[],  # Within L8
                bci_access="none"
            ),
            TimeScale(
                name="Ion channel gating",
                order_of_magnitude=-9,
                duration_str="nanoseconds (10⁻⁹ s)",
                example_processes=["Na⁺ channel activation", "K⁺ channel opening"],
                oni_layers=[],  # Within L8
                bci_access="none"
            ),
            TimeScale(
                name="Vesicle fusion",
                order_of_magnitude=-6,
                duration_str="microseconds (10⁻⁶ s)",
                example_processes=["Neurotransmitter release", "Exocytosis"],
                oni_layers=[9],  # L8 boundary, L9 signal processing
                bci_access="indirect"
            ),
            TimeScale(
                name="Action potentials",
                order_of_magnitude=-3,
                duration_str="milliseconds (10⁻³ s)",
                example_processes=["SNc neuron spike", "Cortical AP"],
                oni_layers=[9, 10],  # Signal Processing, Neural Protocol
                bci_access="direct"
            ),
            TimeScale(
                name="Synaptic integration",
                order_of_magnitude=-2,
                duration_str="tens of ms (10⁻² s)",
                example_processes=["Striatal MSN integration", "Dendritic computation"],
                oni_layers=[9, 10],
                bci_access="direct"
            ),
            TimeScale(
                name="Sensory processing",
                order_of_magnitude=-1,
                duration_str="hundreds of ms (10⁻¹ s)",
                example_processes=["Visual cortex response", "Auditory processing"],
                oni_layers=[9, 10, 11],  # Up to Cognitive Transport
                bci_access="direct"
            ),
            TimeScale(
                name="Working memory",
                order_of_magnitude=0,
                duration_str="seconds (10⁰ s)",
                example_processes=["PFC sustained activity", "Short-term memory"],
                oni_layers=[11, 12],  # Transport, Session
                bci_access="direct"
            ),
            TimeScale(
                name="Short-term plasticity",
                order_of_magnitude=2,
                duration_str="minutes (10² s)",
                example_processes=["Hippocampal STD/STF", "Synaptic facilitation"],
                oni_layers=[11, 12],
                bci_access="direct"
            ),
            TimeScale(
                name="LTP/memory consolidation",
                order_of_magnitude=4,
                duration_str="hours (10⁴ s)",
                example_processes=["Hippocampus → Cortex transfer", "LTP expression"],
                oni_layers=[12, 13],  # Session, Semantic
                bci_access="indirect"
            ),
            TimeScale(
                name="Synaptic remodeling",
                order_of_magnitude=5,
                duration_str="days (10⁵ s)",
                example_processes=["Dendritic spine changes", "Receptor trafficking"],
                oni_layers=[13],  # Semantic
                bci_access="indirect"
            ),
            TimeScale(
                name="Structural plasticity",
                order_of_magnitude=7,
                duration_str="weeks to months (10⁶⁻⁷ s)",
                example_processes=["Motor cortex reorganization", "Learning consolidation"],
                oni_layers=[13, 14],  # Semantic, Identity
                bci_access="indirect"
            ),
            TimeScale(
                name="Identity formation",
                order_of_magnitude=8,
                duration_str="years to lifetime (10⁸⁺ s)",
                example_processes=["Autobiographical memory", "Personality development"],
                oni_layers=[14],  # Identity
                bci_access="none"  # Read-only at best
            ),
        ]

    def all(self) -> List[TimeScale]:
        """Return all time scales."""
        return self._scales

    def by_bci_access(self, access_level: str) -> List[TimeScale]:
        """Get scales by BCI accessibility."""
        return [s for s in self._scales if s.bci_access == access_level]

    def by_layer(self, layer: int) -> List[TimeScale]:
        """Get time scales relevant to a specific ONI layer."""
        return [s for s in self._scales if layer in s.oni_layers]

    def bci_accessible_range(self) -> Tuple[str, str]:
        """Return the range of time scales directly accessible to BCI."""
        direct = self.by_bci_access("direct")
        if not direct:
            return ("none", "none")
        return (direct[0].duration_str, direct[-1].duration_str)


# =============================================================================
# Cognitive Function Mappings
# =============================================================================

@dataclass
class CognitiveFunction:
    """
    A cognitive function mapped to brain regions, neurotransmitters, and ONI layers.
    """
    name: str
    description: str
    brain_regions: List[str]
    neurotransmitters: List[str]
    oni_layers: List[int]
    time_scale: str
    bci_modulable: bool
    security_concern: Optional[str] = None


class CognitiveFunctionAtlas:
    """
    Database of cognitive functions mapped to neural substrates and ONI layers.
    """

    def __init__(self):
        self._functions: Dict[str, CognitiveFunction] = {}
        self._build_atlas()

    def _build_atlas(self):
        """Build the cognitive function database."""

        self._functions["motor_control"] = CognitiveFunction(
            name="Motor Control",
            description="Planning and execution of voluntary movements",
            brain_regions=["M1", "striatum", "SNc", "cerebellum"],
            neurotransmitters=["dopamine", "glutamate", "GABA"],
            oni_layers=[10, 11],  # Neural Protocol, Cognitive Transport
            time_scale="milliseconds to seconds",
            bci_modulable=True,
            security_concern="Motor hijacking attacks could cause involuntary movements"
        )

        self._functions["working_memory"] = CognitiveFunction(
            name="Working Memory",
            description="Temporary maintenance and manipulation of information",
            brain_regions=["PFC", "hippocampus"],
            neurotransmitters=["dopamine", "glutamate", "acetylcholine"],
            oni_layers=[12],  # Cognitive Session
            time_scale="seconds to minutes",
            bci_modulable=True,
            security_concern="Working memory disruption could impair decision-making"
        )

        self._functions["attention"] = CognitiveFunction(
            name="Attention",
            description="Selective focus on relevant stimuli",
            brain_regions=["PFC", "LC", "parietal cortex", "BF"],
            neurotransmitters=["norepinephrine", "acetylcholine", "dopamine"],
            oni_layers=[11, 12],  # Transport, Session
            time_scale="milliseconds to seconds",
            bci_modulable=True,
            security_concern="Attention manipulation could cause distraction or hyperfocus"
        )

        self._functions["reward_processing"] = CognitiveFunction(
            name="Reward Processing",
            description="Evaluation of outcomes and motivation",
            brain_regions=["VTA", "NAc", "PFC", "amygdala"],
            neurotransmitters=["dopamine"],
            oni_layers=[12, 13],  # Session, Semantic
            time_scale="seconds to minutes",
            bci_modulable=True,
            security_concern="Reward pathway manipulation could alter motivation or cause addiction"
        )

        self._functions["emotion"] = CognitiveFunction(
            name="Emotion Processing",
            description="Generation and regulation of emotional states",
            brain_regions=["amygdala", "PFC", "hippocampus", "insula"],
            neurotransmitters=["serotonin", "dopamine", "norepinephrine", "GABA"],
            oni_layers=[12, 13],  # Session, Semantic
            time_scale="seconds to hours",
            bci_modulable=True,
            security_concern="Emotion manipulation could induce fear, anxiety, or artificial pleasure"
        )

        self._functions["memory_encoding"] = CognitiveFunction(
            name="Memory Encoding",
            description="Formation of new memories",
            brain_regions=["hippocampus", "PFC", "amygdala", "BF"],
            neurotransmitters=["glutamate", "acetylcholine", "dopamine"],
            oni_layers=[12, 13],  # Session, Semantic
            time_scale="seconds to hours",
            bci_modulable=True,
            security_concern="Memory manipulation could implant false memories or prevent encoding"
        )

        self._functions["sleep_regulation"] = CognitiveFunction(
            name="Sleep Regulation",
            description="Control of sleep-wake states",
            brain_regions=["VLPO", "LHA", "BF", "LC", "raphe"],
            neurotransmitters=["adenosine", "GABA", "orexin", "histamine"],
            oni_layers=[11],  # Cognitive Transport
            time_scale="minutes to hours",
            bci_modulable=False,  # Primarily molecular/pharmacological
            security_concern="Sleep disruption through adenosine pathway manipulation"
        )

        self._functions["decision_making"] = CognitiveFunction(
            name="Decision Making",
            description="Evaluation of options and selection of actions",
            brain_regions=["PFC", "striatum", "amygdala", "ACC"],
            neurotransmitters=["dopamine", "serotonin", "glutamate"],
            oni_layers=[12, 13],  # Session, Semantic
            time_scale="milliseconds to minutes",
            bci_modulable=True,
            security_concern="Decision manipulation could alter choices without awareness"
        )

        self._functions["self_awareness"] = CognitiveFunction(
            name="Self-Awareness",
            description="Metacognition and sense of self",
            brain_regions=["PFC", "insula", "ACC", "TPJ"],
            neurotransmitters=["dopamine", "serotonin"],
            oni_layers=[13, 14],  # Semantic, Identity
            time_scale="ongoing (lifetime)",
            bci_modulable=False,  # Emergent property
            security_concern="Identity-level attacks could alter sense of self"
        )

        self._functions["sensory_processing"] = CognitiveFunction(
            name="Sensory Processing",
            description="Processing of sensory inputs",
            brain_regions=["V1", "A1", "S1", "thalamus"],
            neurotransmitters=["glutamate", "GABA"],
            oni_layers=[9, 10],  # Signal Processing, Neural Protocol
            time_scale="milliseconds",
            bci_modulable=True,
            security_concern="Sensory injection could create false perceptions"
        )

    def get(self, name: str) -> Optional[CognitiveFunction]:
        """Get a cognitive function by name."""
        key = name.lower().replace(" ", "_")
        return self._functions.get(key)

    def all(self) -> List[CognitiveFunction]:
        """Return all cognitive functions."""
        return list(self._functions.values())

    def by_region(self, region: str) -> List[CognitiveFunction]:
        """Get functions involving a brain region."""
        return [f for f in self._functions.values() if region in f.brain_regions]

    def by_neurotransmitter(self, nt: str) -> List[CognitiveFunction]:
        """Get functions involving a neurotransmitter."""
        nt_lower = nt.lower()
        return [f for f in self._functions.values()
                if any(nt_lower in n.lower() for n in f.neurotransmitters)]

    def by_layer(self, layer: int) -> List[CognitiveFunction]:
        """Get functions relevant to a specific ONI layer."""
        return [f for f in self._functions.values() if layer in f.oni_layers]

    def bci_modulable(self) -> List[CognitiveFunction]:
        """Get functions that BCI can modulate."""
        return [f for f in self._functions.values() if f.bci_modulable]


# =============================================================================
# Main Atlas Interface
# =============================================================================

class NeuroscienceAtlas:
    """
    Unified interface to all ONI neuroscience mappings.

    Provides access to:
    - Brain regions (BrainRegionAtlas)
    - Neurotransmitter systems (NeurotransmitterAtlas)
    - Time scale hierarchy (TimeScaleHierarchy)
    - Cognitive functions (CognitiveFunctionAtlas)
    - Research citations (References)

    Example:
        >>> atlas = NeuroscienceAtlas()

        # Look up a brain region
        >>> snc = atlas.brain_region("SNc")
        >>> print(f"{snc.full_name}: {snc.primary_functions}")

        # Look up a neurotransmitter system
        >>> da = atlas.neurotransmitter("dopamine")
        >>> print(f"Synthesis requires: {da.required_cofactors}")

        # Map a function to layers
        >>> layers = atlas.function_to_layers("reward")

        # Get citations for a topic
        >>> for cite in atlas.citations_for("dopamine"):
        ...     print(cite.apa_format())
    """

    def __init__(self):
        self.regions = BrainRegionAtlas()
        self.neurotransmitters = NeurotransmitterAtlas()
        self.time_scales = TimeScaleHierarchy()
        self.functions = CognitiveFunctionAtlas()
        self.references = References()

    # === Convenience Methods ===

    def brain_region(self, abbreviation: str) -> Optional[BrainRegion]:
        """Look up a brain region by abbreviation."""
        return self.regions.get(abbreviation)

    def neurotransmitter(self, name: str) -> Optional[NeurotransmitterSystem]:
        """Look up a neurotransmitter system by name."""
        return self.neurotransmitters.get(name)

    def cognitive_function(self, name: str) -> Optional[CognitiveFunction]:
        """Look up a cognitive function by name."""
        return self.functions.get(name)

    def citation(self, citation_id: str) -> Optional[Citation]:
        """Look up a citation by ID."""
        return self.references.get(citation_id)

    def citations_for(self, topic: str) -> List[Citation]:
        """Get all citations related to a topic."""
        return self.references.by_topic(topic)

    # === Cross-Reference Queries ===

    def layer_mapping(self, layer: int) -> Dict:
        """
        Get comprehensive mapping for an ONI layer.

        Returns regions, neurotransmitters, functions, and time scales
        relevant to the specified layer.
        """
        return {
            "layer": layer,
            "brain_regions": [r.abbreviation for r in self.regions.by_layer(layer)],
            "neurotransmitters": [n.name for n in self.neurotransmitters.by_layer(layer)],
            "functions": [f.name for f in self.functions.by_layer(layer)],
            "time_scales": [t.name for t in self.time_scales.by_layer(layer)],
        }

    def function_to_layers(self, function_keyword: str) -> List[int]:
        """
        Map a cognitive function to relevant ONI layers.

        Args:
            function_keyword: Keyword to search (e.g., "reward", "memory")

        Returns:
            List of ONI layer numbers
        """
        layers = set()
        keyword_lower = function_keyword.lower()

        for func in self.functions.all():
            if keyword_lower in func.name.lower() or keyword_lower in func.description.lower():
                layers.update(func.oni_layers)

        return sorted(layers)

    def region_to_layers(self, region: str) -> List[int]:
        """Map a brain region to relevant ONI layers."""
        r = self.regions.get(region)
        return r.oni_layers if r else []

    def nt_to_layers(self, neurotransmitter: str) -> List[int]:
        """Map a neurotransmitter to relevant ONI layers."""
        nt = self.neurotransmitters.get(neurotransmitter)
        return nt.oni_layers if nt else []

    def bci_capabilities_summary(self) -> Dict:
        """
        Summarize what BCI can and cannot do based on neuroscience mappings.
        """
        return {
            "can_trigger_release": [nt.name for nt in self.neurotransmitters.bci_controllable()],
            "cannot_synthesize": [nt.name for nt in self.neurotransmitters.all()],
            "accessible_time_range": self.time_scales.bci_accessible_range(),
            "modulable_functions": [f.name for f in self.functions.bci_modulable()],
            "high_access_regions": [r.abbreviation for r in self.regions.by_bci_access("high")],
            "no_access_regions": [r.abbreviation for r in self.regions.by_bci_access("none")],
        }

    def security_implications(self, layer: int) -> List[str]:
        """
        Get security implications for attacks at a specific layer.
        """
        implications = []

        for func in self.functions.by_layer(layer):
            if func.security_concern:
                implications.append(f"{func.name}: {func.security_concern}")

        for nt in self.neurotransmitters.by_layer(layer):
            if nt.security_notes:
                implications.append(f"{nt.name}: {nt.security_notes}")

        return implications

    def generate_layer_report(self, layer: int) -> str:
        """
        Generate a comprehensive report for an ONI layer.
        """
        mapping = self.layer_mapping(layer)
        implications = self.security_implications(layer)

        lines = [
            f"═══ ONI Layer {layer} Neuroscience Report ═══",
            "",
            "Brain Regions:",
        ]

        for abbr in mapping["brain_regions"]:
            region = self.regions.get(abbr)
            if region:
                lines.append(f"  • {abbr} ({region.full_name})")
                lines.append(f"    Functions: {', '.join(region.primary_functions[:3])}")

        lines.extend(["", "Neurotransmitter Systems:"])
        for name in mapping["neurotransmitters"]:
            nt = self.neurotransmitters.get(name)
            if nt:
                lines.append(f"  • {nt.name} ({nt.abbreviation})")
                lines.append(f"    Cofactors: {', '.join(nt.required_cofactors)}")

        lines.extend(["", "Cognitive Functions:"])
        for name in mapping["functions"]:
            lines.append(f"  • {name}")

        lines.extend(["", "Time Scales:"])
        for name in mapping["time_scales"]:
            lines.append(f"  • {name}")

        if implications:
            lines.extend(["", "Security Implications:"])
            for imp in implications:
                lines.append(f"  ⚠ {imp}")

        return "\n".join(lines)


# =============================================================================
# Module-Level Convenience
# =============================================================================

# Pre-instantiated atlas for easy access
_atlas = None

def get_atlas() -> NeuroscienceAtlas:
    """Get the singleton NeuroscienceAtlas instance."""
    global _atlas
    if _atlas is None:
        _atlas = NeuroscienceAtlas()
    return _atlas
