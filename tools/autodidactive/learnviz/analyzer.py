"""
LearnViz Concept Analyzer

Classifies concepts and determines optimal visualization strategy.
Uses pattern matching first, falls back to LLM for complex cases.
"""

import re
import json
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from enum import Enum


class ConceptType(Enum):
    MATHEMATICAL = "mathematical"
    PHYSICS = "physics"
    ALGORITHM = "algorithm"
    DATA_STRUCTURE = "data_structure"
    STATISTICS = "statistics"
    TIMELINE = "timeline"
    NETWORK = "network"
    SYSTEM = "system"
    BIOLOGY = "biology"
    GENERAL = "general"


class Engine(Enum):
    MANIM = "manim"
    REMOTION = "remotion"
    D3 = "d3"
    MERMAID = "mermaid"


@dataclass
class Scene:
    id: int
    name: str
    description: str
    duration: float  # seconds
    elements: List[str]
    animation_type: str  # "create", "transform", "highlight", "fade"


@dataclass
class VisualizationPlan:
    title: str
    concept_type: ConceptType
    engine: Engine
    complexity: str  # "simple", "moderate", "complex"
    scenes: List[Scene]
    total_duration: float
    template: Optional[str]
    notes: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "concept_type": self.concept_type.value,
            "engine": self.engine.value,
            "complexity": self.complexity,
            "scenes": [asdict(s) for s in self.scenes],
            "total_duration": self.total_duration,
            "template": self.template,
            "notes": self.notes
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# Pattern-based classification rules
CONCEPT_PATTERNS = {
    ConceptType.MATHEMATICAL: [
        r"\b(theorem|proof|equation|formula|calculus|derivative|integral|matrix|vector|geometry|triangle|circle|angle|pythagor|fibonacci|prime|factorial)\b",
        r"\b(algebra|polynomial|quadratic|linear|exponential|logarithm|trigonometry|sin|cos|tan)\b",
        r"\b(limit|series|sequence|summation|convergence|infinity)\b",
    ],
    ConceptType.PHYSICS: [
        r"\b(force|gravity|momentum|velocity|acceleration|mass|energy|wave|particle|quantum|electron|photon)\b",
        r"\b(newton|einstein|magnetic|electric|field|circuit|resistance|voltage|current)\b",
        r"\b(thermodynamics|entropy|heat|temperature|pressure|fluid|optics|light|reflection|refraction)\b",
    ],
    ConceptType.ALGORITHM: [
        r"\b(algorithm|sort|search|binary search|linear search|bubble sort|merge sort|quick sort|insertion sort)\b",
        r"\b(recursion|iteration|loop|complexity|big o|O\(n\)|O\(log n\)|O\(n\^2\))\b",
        r"\b(dynamic programming|greedy|backtrack|divide and conquer|memoization)\b",
        r"\b(bfs|dfs|dijkstra|a\*|shortest path|traversal)\b",
    ],
    ConceptType.DATA_STRUCTURE: [
        r"\b(array|list|stack|queue|tree|graph|heap|hash|linked list|binary tree)\b",
        r"\b(node|edge|vertex|pointer|reference|index|root|leaf|parent|child)\b",
        r"\b(insert|delete|lookup|traverse|balance|rotation)\b",
    ],
    ConceptType.STATISTICS: [
        r"\b(statistics|probability|distribution|mean|median|mode|variance|standard deviation)\b",
        r"\b(regression|correlation|hypothesis|sample|population|confidence|p-value)\b",
        r"\b(histogram|scatter|bar chart|pie chart|box plot|normal distribution|bell curve)\b",
    ],
    ConceptType.TIMELINE: [
        r"\b(timeline|history|evolution|progression|sequence of events|chronological)\b",
        r"\b(before|after|then|next|finally|first|last|during|century|decade|year)\b",
        r"\b(process|workflow|pipeline|stages|phases|steps in order)\b",
    ],
    ConceptType.NETWORK: [
        r"\b(network|graph|connection|relationship|link|node|edge|social network)\b",
        r"\b(internet|protocol|packet|routing|topology|mesh|star|ring)\b",
        r"\b(flow|path|centrality|clustering|community|degree)\b",
    ],
    ConceptType.SYSTEM: [
        r"\b(system|architecture|component|module|layer|service|api|interface)\b",
        r"\b(client|server|database|frontend|backend|microservice|monolith)\b",
        r"\b(diagram|flowchart|sequence|state machine|uml)\b",
    ],
    ConceptType.BIOLOGY: [
        r"\b(cell|dna|rna|protein|gene|chromosome|mitosis|meiosis|evolution)\b",
        r"\b(neuron|synapse|brain|heart|muscle|organ|tissue|organism)\b",
        r"\b(photosynthesis|respiration|metabolism|enzyme|hormone|antibody)\b",
        # Neuroscience-specific patterns
        r"\b(action potential|membrane potential|resting potential|depolarization|repolarization|hyperpolarization)\b",
        r"\b(axon|dendrite|soma|myelin|node of ranvier|saltatory|conduction)\b",
        r"\b(neurotransmitter|dopamine|serotonin|glutamate|gaba|acetylcholine)\b",
        r"\b(ion channel|sodium|potassium|calcium|Na\+|K\+|Ca2\+|voltage.gated)\b",
        r"\b(synaptic|presynaptic|postsynaptic|vesicle|cleft|receptor)\b",
        r"\b(hodgkin|huxley|nernst|goldman|cable equation)\b",
        r"\b(cortex|hippocampus|amygdala|thalamus|cerebellum|brainstem)\b",
        r"\b(spike|firing rate|neural signal|neural coding|LFP|EEG|ECoG)\b",
        r"\b(BCI|brain.computer|neural interface|electrode|implant)\b",
    ],
}

# Engine selection based on concept type
ENGINE_MAP = {
    ConceptType.MATHEMATICAL: Engine.MANIM,
    ConceptType.PHYSICS: Engine.MANIM,
    ConceptType.ALGORITHM: Engine.MANIM,
    ConceptType.DATA_STRUCTURE: Engine.MANIM,
    ConceptType.STATISTICS: Engine.REMOTION,  # Data-driven charts
    ConceptType.TIMELINE: Engine.REMOTION,
    ConceptType.NETWORK: Engine.D3,
    ConceptType.SYSTEM: Engine.MERMAID,
    ConceptType.BIOLOGY: Engine.MANIM,
    ConceptType.GENERAL: Engine.MANIM,
}

# Template suggestions based on keywords
TEMPLATE_PATTERNS = {
    "array_visual": [r"\barray\b", r"\blist\b", r"\bindex\b"],
    "tree_traversal": [r"\btree\b", r"\bbinary tree\b", r"\btraversal\b", r"\bbst\b"],
    "graph_algorithm": [r"\bgraph\b", r"\bbfs\b", r"\bdfs\b", r"\bshortest path\b"],
    "function_plot": [r"\bfunction\b", r"\bplot\b", r"\bgraph of\b", r"\bf\(x\)\b"],
    "proof_steps": [r"\bproof\b", r"\btheorem\b", r"\bshow that\b", r"\bprove\b"],
    "sort_visual": [r"\bsort\b", r"\bsorting\b", r"\bbubble\b", r"\bmerge\b", r"\bquick\b"],
    "search_visual": [r"\bsearch\b", r"\bbinary search\b", r"\bfind\b"],
    "bar_chart_race": [r"\branking\b", r"\bover time\b", r"\brace\b", r"\bcompare.*years\b"],
    "timeline": [r"\btimeline\b", r"\bhistory\b", r"\bevolution\b", r"\bchronological\b"],
    "network_force": [r"\bnetwork\b", r"\bconnection\b", r"\brelationship\b"],
    "flowchart": [r"\bprocess\b", r"\bworkflow\b", r"\bsteps\b", r"\bpipeline\b"],
    # Neuroscience templates
    "action_potential": [r"\baction potential\b", r"\bdepolarization\b", r"\bspike\b", r"\bfiring\b", r"\bmembrane potential\b"],
    "synapse": [r"\bsynaptic\b", r"\bsynapse\b", r"\bneurotransmitter\b", r"\bvesicle\b"],
    "neuron_structure": [r"\bneuron\b", r"\baxon\b", r"\bdendrite\b", r"\bmyelin\b"],
    # BCI and motor cortex
    "motor_cortex_bci": [r"\bmotor cortex\b", r"\bM1\b", r"\bbci\b", r"\bbrain.computer\b", r"\bneural decoding\b", r"\belectrode\b", r"\butah array\b", r"\bpopulation coding\b", r"\bpopulation vector\b"],
    # Neurotransmitter systems
    "neurotransmitter": [r"\bneurotransmitter\b", r"\bdopamine\b", r"\bserotonin\b", r"\bnorepinephrine\b", r"\bVTA\b", r"\braphe\b", r"\blocus coeruleus\b", r"\breward\b", r"\bmonoamine\b"],
}


def classify_concept(description: str) -> ConceptType:
    """
    Classify a concept description into a category using pattern matching.
    Returns the category with the most pattern matches.
    """
    description_lower = description.lower()
    scores = {}

    for concept_type, patterns in CONCEPT_PATTERNS.items():
        score = 0
        for pattern in patterns:
            matches = re.findall(pattern, description_lower, re.IGNORECASE)
            score += len(matches)
        scores[concept_type] = score

    # Return type with highest score, or GENERAL if no matches
    if max(scores.values()) == 0:
        return ConceptType.GENERAL

    return max(scores, key=scores.get)


def select_engine(concept_type: ConceptType, description: str) -> Engine:
    """
    Select the optimal rendering engine based on concept type.
    Can be overridden by specific keywords in description.
    """
    # Check for explicit engine preferences
    desc_lower = description.lower()

    if "interactive" in desc_lower or "web" in desc_lower:
        return Engine.D3
    if "chart" in desc_lower or "data" in desc_lower or "statistics" in desc_lower:
        return Engine.REMOTION
    if "diagram" in desc_lower or "architecture" in desc_lower:
        return Engine.MERMAID

    return ENGINE_MAP.get(concept_type, Engine.MANIM)


def suggest_template(description: str) -> Optional[str]:
    """
    Suggest a pre-built template based on the concept description.
    """
    description_lower = description.lower()

    for template, patterns in TEMPLATE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, description_lower, re.IGNORECASE):
                return template

    return None


def estimate_complexity(description: str) -> str:
    """
    Estimate the complexity of the visualization needed.
    """
    # Count key indicators
    word_count = len(description.split())

    # Look for complexity indicators
    complex_indicators = ["step by step", "detailed", "comprehensive", "full", "complete", "all"]
    simple_indicators = ["basic", "simple", "quick", "brief", "overview"]

    desc_lower = description.lower()

    complex_score = sum(1 for ind in complex_indicators if ind in desc_lower)
    simple_score = sum(1 for ind in simple_indicators if ind in desc_lower)

    if simple_score > complex_score or word_count < 10:
        return "simple"
    elif complex_score > simple_score or word_count > 50:
        return "complex"
    else:
        return "moderate"


def generate_scene_plan(
    description: str,
    concept_type: ConceptType,
    complexity: str
) -> List[Scene]:
    """
    Generate a basic scene plan based on the concept.
    This is a heuristic version - can be enhanced with LLM.
    """
    scenes = []

    # Always start with an intro scene
    scenes.append(Scene(
        id=1,
        name="intro",
        description=f"Introduce the concept: {description[:50]}...",
        duration=3.0,
        elements=["title", "subtitle"],
        animation_type="create"
    ))

    # Add content scenes based on complexity
    if complexity == "simple":
        scenes.append(Scene(
            id=2,
            name="main",
            description="Show the main concept visualization",
            duration=5.0,
            elements=["main_visual"],
            animation_type="create"
        ))
    elif complexity == "moderate":
        scenes.extend([
            Scene(
                id=2,
                name="setup",
                description="Set up the problem/context",
                duration=4.0,
                elements=["context", "initial_state"],
                animation_type="create"
            ),
            Scene(
                id=3,
                name="demonstration",
                description="Demonstrate the concept in action",
                duration=6.0,
                elements=["animation", "highlights"],
                animation_type="transform"
            ),
            Scene(
                id=4,
                name="result",
                description="Show the final result/conclusion",
                duration=3.0,
                elements=["result", "summary"],
                animation_type="highlight"
            ),
        ])
    else:  # complex
        scenes.extend([
            Scene(
                id=2,
                name="problem_statement",
                description="Present the problem clearly",
                duration=4.0,
                elements=["problem", "question"],
                animation_type="create"
            ),
            Scene(
                id=3,
                name="setup",
                description="Set up initial conditions",
                duration=3.0,
                elements=["initial_state", "variables"],
                animation_type="create"
            ),
            Scene(
                id=4,
                name="step_1",
                description="First step of the solution",
                duration=5.0,
                elements=["step_visual", "explanation"],
                animation_type="transform"
            ),
            Scene(
                id=5,
                name="step_2",
                description="Second step of the solution",
                duration=5.0,
                elements=["step_visual", "explanation"],
                animation_type="transform"
            ),
            Scene(
                id=6,
                name="step_3",
                description="Third step of the solution",
                duration=5.0,
                elements=["step_visual", "explanation"],
                animation_type="transform"
            ),
            Scene(
                id=7,
                name="conclusion",
                description="Summarize and conclude",
                duration=4.0,
                elements=["summary", "key_points"],
                animation_type="highlight"
            ),
        ])

    # Always end with an outro
    scenes.append(Scene(
        id=len(scenes) + 1,
        name="outro",
        description="Closing summary",
        duration=2.0,
        elements=["summary_text"],
        animation_type="fade"
    ))

    return scenes


def analyze(description: str) -> VisualizationPlan:
    """
    Main analysis function. Takes a concept description and returns a full visualization plan.
    """
    # Classify the concept
    concept_type = classify_concept(description)

    # Select engine
    engine = select_engine(concept_type, description)

    # Estimate complexity
    complexity = estimate_complexity(description)

    # Generate scene plan
    scenes = generate_scene_plan(description, concept_type, complexity)

    # Calculate total duration
    total_duration = sum(scene.duration for scene in scenes)

    # Suggest template
    template = suggest_template(description)

    # Generate notes
    notes = []
    if template:
        notes.append(f"Recommended template: {template}")
    notes.append(f"Estimated render time: {int(total_duration * 2)} seconds")

    # Create title from description
    title = description.split('.')[0][:50]
    if len(description) > 50:
        title += "..."

    return VisualizationPlan(
        title=title,
        concept_type=concept_type,
        engine=engine,
        complexity=complexity,
        scenes=scenes,
        total_duration=total_duration,
        template=template,
        notes=notes
    )


# CLI interface
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python analyzer.py 'concept description'")
        print("\nExample: python analyzer.py 'Explain how binary search works step by step'")
        sys.exit(1)

    description = " ".join(sys.argv[1:])
    plan = analyze(description)

    print("\n" + "=" * 60)
    print("VISUALIZATION PLAN")
    print("=" * 60)
    print(f"\nTitle: {plan.title}")
    print(f"Type: {plan.concept_type.value}")
    print(f"Engine: {plan.engine.value}")
    print(f"Complexity: {plan.complexity}")
    print(f"Total Duration: {plan.total_duration}s")
    print(f"Template: {plan.template or 'None'}")
    print(f"\nScenes ({len(plan.scenes)}):")
    for scene in plan.scenes:
        print(f"  [{scene.id}] {scene.name}: {scene.description} ({scene.duration}s)")
    print(f"\nNotes:")
    for note in plan.notes:
        print(f"  - {note}")
    print("\n" + "=" * 60)
    print("\nJSON Output:")
    print(plan.to_json())
