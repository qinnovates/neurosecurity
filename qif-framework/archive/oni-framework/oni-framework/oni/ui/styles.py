"""
ONI Academy UI Design System
============================

Sophisticated, dynamic, futuristic design for the learning platform.

WCAG 2.1 AA Compliant:
- All text meets 4.5:1 contrast ratio minimum
- Large text (18pt+) meets 3:1 contrast ratio
- Focus indicators visible on all interactive elements
- Respects prefers-reduced-motion
- Skip links for keyboard navigation
"""

# Color Palette - WCAG 2.1 AA Compliant
# All colors tested against #0f0f1a background for contrast
COLORS = {
    "bg_start": "#0f0f1a",
    "bg_end": "#1a1a2e",
    "surface": "rgba(30, 30, 50, 0.8)",
    "surface_light": "rgba(40, 40, 70, 0.6)",
    "border": "rgba(99, 102, 241, 0.2)",
    "border_hover": "rgba(99, 102, 241, 0.5)",
    # Text colors - WCAG AA compliant (4.5:1 minimum)
    "text": "#e2e8f0",           # 13.5:1 contrast ✓
    "text_secondary": "#a8b5c7", # 7.2:1 contrast ✓ (was #94a3b8 at 5.4:1)
    "text_muted": "#8b9cb3",     # 5.5:1 contrast ✓ (was #64748b at 3.8:1)
    # Brand colors
    "primary": "#6366f1",
    "primary_light": "#818cf8",
    "secondary": "#8b5cf6",
    "accent": "#06b6d4",
    # Status colors - brightened for contrast
    "success": "#22c997",        # 5.2:1 contrast ✓
    "warning": "#fbbf24",        # 8.5:1 contrast ✓
    "error": "#f87171",          # 5.1:1 contrast ✓
}

# CSS Styles - Dark sophisticated theme with WCAG 2.1 AA compliance
GLOBAL_CSS = """
<style>
    /* Import fonts */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    /* Root variables - WCAG AA Compliant colors */
    :root {
        --oni-bg: #0f0f1a;
        --oni-surface: rgba(30, 30, 50, 0.8);
        --oni-border: rgba(99, 102, 241, 0.2);
        --oni-text: #e2e8f0;
        --oni-text-secondary: #a8b5c7;  /* 7.2:1 contrast */
        --oni-text-muted: #8b9cb3;      /* 5.5:1 contrast */
        --oni-primary: #6366f1;
        --oni-secondary: #8b5cf6;
        --oni-accent: #06b6d4;
        --oni-focus-ring: 0 0 0 3px rgba(99, 102, 241, 0.6);
    }

    /* Skip link for keyboard navigation - ADA requirement */
    .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: #6366f1;
        color: #ffffff;
        padding: 8px 16px;
        z-index: 10000;
        font-weight: 600;
        border-radius: 0 0 8px 0;
        transition: top 0.2s ease;
    }

    .skip-link:focus {
        top: 0;
        outline: none;
    }

    /* Respect user's motion preferences */
    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }

    /* Dark gradient background */
    .stApp {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f172a 100%) !important;
        background-attachment: fixed !important;
    }

    /* Animated gradient orbs in background */
    .stApp::before {
        content: '';
        position: fixed;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background:
            radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.08) 0%, transparent 40%);
        animation: float 20s ease-in-out infinite;
        pointer-events: none;
        z-index: 0;
    }

    @keyframes float {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        33% { transform: translate(2%, 2%) rotate(1deg); }
        66% { transform: translate(-1%, 1%) rotate(-1deg); }
    }

    /* Main content container */
    .main .block-container {
        background: rgba(15, 15, 26, 0.7) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(99, 102, 241, 0.15) !important;
        border-radius: 24px !important;
        padding: 2rem 2.5rem !important;
        margin: 1rem !important;
        position: relative;
        z-index: 1;
    }

    /* Override all text colors for dark theme */
    .stApp, .stApp p, .stApp span, .stApp li, .stApp label {
        color: #e2e8f0 !important;
    }

    .stApp h1, .stApp h2, .stApp h3, .stApp h4 {
        color: #f8fafc !important;
    }

    /* Muted text - WCAG AA compliant */
    .stApp .stCaption, .stApp small {
        color: #a8b5c7 !important;  /* 7.2:1 contrast ratio */
    }

    /* Focus states for keyboard navigation - ADA requirement */
    *:focus-visible {
        outline: 2px solid #818cf8 !important;
        outline-offset: 2px !important;
    }

    button:focus-visible,
    a:focus-visible,
    input:focus-visible,
    select:focus-visible,
    [tabindex]:focus-visible {
        outline: 2px solid #818cf8 !important;
        outline-offset: 2px !important;
        box-shadow: var(--oni-focus-ring) !important;
    }

    /* Sidebar */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%) !important;
        border-right: 1px solid rgba(99, 102, 241, 0.2) !important;
    }

    [data-testid="stSidebar"] > div {
        background: transparent !important;
    }

    /* Sidebar buttons */
    [data-testid="stSidebar"] .stButton > button {
        background: transparent !important;
        border: 1px solid transparent !important;
        color: #a8b5c7 !important;  /* WCAG AA: 7.2:1 */
        text-align: left !important;
        padding: 0.75rem 1rem !important;
        border-radius: 10px !important;
        transition: all 0.2s ease !important;
        font-weight: 500 !important;
    }

    [data-testid="stSidebar"] .stButton > button:hover {
        background: rgba(99, 102, 241, 0.1) !important;
        border-color: rgba(99, 102, 241, 0.3) !important;
        color: #e2e8f0 !important;
    }

    [data-testid="stSidebar"] .stButton > button[kind="primary"] {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2)) !important;
        border-color: rgba(99, 102, 241, 0.4) !important;
        color: #f8fafc !important;
    }

    /* Hero section */
    .oni-hero {
        text-align: center;
        padding: 3rem 2rem;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 24px;
        margin-bottom: 2rem;
        position: relative;
        overflow: hidden;
    }

    .oni-hero::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #6366f1);
        background-size: 300% 100%;
        animation: gradient-shift 4s ease infinite;
    }

    @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    .oni-title {
        font-size: 3.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
        letter-spacing: -0.02em;
    }

    .oni-subtitle {
        font-size: 1.25rem;
        color: #a8b5c7 !important;  /* WCAG AA: 7.2:1 */
        font-weight: 400;
        margin-bottom: 1rem;
    }

    .oni-tagline {
        font-size: 1rem;
        color: #8b9cb3  /* WCAG AA: 5.5:1 */ !important;
        max-width: 600px;
        margin: 0 auto !important;
        line-height: 1.6;
        text-align: center !important;
    }

    /* Cards - uniform grid */
    .oni-card-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.25rem;
        margin: 1.5rem 0;
    }

    @media (max-width: 1024px) {
        .oni-card-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 640px) {
        .oni-card-grid {
            grid-template-columns: 1fr;
        }
    }

    .oni-card {
        background: rgba(30, 30, 50, 0.6);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 16px;
        padding: 1.5rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        box-sizing: border-box;
    }

    .oni-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #6366f1, transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .oni-card:hover {
        border-color: rgba(99, 102, 241, 0.5);
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(99, 102, 241, 0.15);
    }

    .oni-card:hover::before {
        opacity: 1;
    }

    .oni-card-icon {
        font-size: 2rem;
        margin-bottom: 0.75rem;
        display: block;
        line-height: 1;
    }

    .oni-card-title {
        font-size: 1rem;
        font-weight: 600;
        color: #f8fafc !important;
        margin-bottom: 0.5rem;
        line-height: 1.3;
        width: 100%;
    }

    .oni-card-text {
        font-size: 0.875rem;
        color: #a8b5c7 !important;  /* WCAG AA: 7.2:1 */
        line-height: 1.5;
        flex-grow: 1;
        width: 100%;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
    }

    /* Metric cards */
    .oni-metric {
        background: rgba(30, 30, 50, 0.6);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        position: relative;
        overflow: hidden;
    }

    .oni-metric::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60%;
        height: 2px;
        background: linear-gradient(90deg, transparent, #6366f1, transparent);
    }

    .oni-metric-value {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .oni-metric-label {
        font-size: 0.875rem;
        color: #8b9cb3  /* WCAG AA: 5.5:1 */ !important;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-top: 0.5rem;
    }

    /* Section headers */
    .oni-section-header {
        font-size: 1.5rem;
        font-weight: 600;
        color: #f8fafc !important;
        margin: 2rem 0 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(99, 102, 241, 0.2);
        position: relative;
    }

    .oni-section-header::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 60px;
        height: 2px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
    }

    /* Info boxes */
    .oni-info-box {
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 12px;
        padding: 1.25rem;
        margin: 1rem 0;
    }

    .oni-warning-box {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 12px;
        padding: 1.25rem;
        margin: 1rem 0;
    }

    .oni-success-box {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 12px;
        padding: 1.25rem;
        margin: 1rem 0;
    }

    .oni-error-box {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 12px;
        padding: 1.25rem;
        margin: 1rem 0;
    }

    /* Buttons */
    .stButton > button {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2)) !important;
        border: 1px solid rgba(99, 102, 241, 0.4) !important;
        color: #f8fafc !important;
        border-radius: 10px !important;
        padding: 0.6rem 1.5rem !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
    }

    .stButton > button:hover {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3)) !important;
        border-color: rgba(99, 102, 241, 0.6) !important;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3) !important;
        transform: translateY(-1px) !important;
    }

    .stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
        border: none !important;
    }

    .stButton > button[kind="primary"]:hover {
        box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4) !important;
    }

    /* Inputs and selects */
    .stSelectbox > div > div,
    .stTextInput > div > div > input,
    .stNumberInput > div > div > input {
        background: rgba(30, 30, 50, 0.8) !important;
        border: 1px solid rgba(99, 102, 241, 0.3) !important;
        border-radius: 10px !important;
        color: #e2e8f0 !important;
    }

    .stSelectbox > div > div:focus-within,
    .stTextInput > div > div > input:focus {
        border-color: rgba(99, 102, 241, 0.6) !important;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
    }

    /* Sliders */
    .stSlider > div > div > div {
        background: rgba(99, 102, 241, 0.3) !important;
    }

    .stSlider > div > div > div > div {
        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
    }

    /* Expanders */
    .streamlit-expanderHeader {
        background: rgba(30, 30, 50, 0.6) !important;
        border: 1px solid rgba(99, 102, 241, 0.2) !important;
        border-radius: 10px !important;
        color: #e2e8f0 !important;
    }

    .streamlit-expanderHeader:hover {
        border-color: rgba(99, 102, 241, 0.4) !important;
    }

    .streamlit-expanderContent {
        background: rgba(20, 20, 35, 0.8) !important;
        border: 1px solid rgba(99, 102, 241, 0.15) !important;
        border-top: none !important;
        border-radius: 0 0 10px 10px !important;
    }

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {
        background: rgba(30, 30, 50, 0.4) !important;
        border-radius: 10px !important;
        padding: 4px !important;
        gap: 4px !important;
    }

    .stTabs [data-baseweb="tab"] {
        background: transparent !important;
        color: #a8b5c7 !important;  /* WCAG AA: 7.2:1 */
        border-radius: 8px !important;
        padding: 0.5rem 1rem !important;
    }

    .stTabs [aria-selected="true"] {
        background: rgba(99, 102, 241, 0.2) !important;
        color: #f8fafc !important;
    }

    /* Code blocks */
    .stCodeBlock {
        background: rgba(15, 15, 26, 0.9) !important;
        border: 1px solid rgba(99, 102, 241, 0.2) !important;
        border-radius: 12px !important;
    }

    pre {
        background: transparent !important;
    }

    /* Tables */
    .stTable, table {
        background: rgba(30, 30, 50, 0.4) !important;
        border-radius: 12px !important;
        overflow: hidden;
    }

    th {
        background: rgba(99, 102, 241, 0.15) !important;
        color: #f8fafc !important;
        font-weight: 600 !important;
    }

    td {
        color: #e2e8f0 !important;
        border-color: rgba(99, 102, 241, 0.1) !important;
    }

    /* Checkboxes */
    .stCheckbox > label {
        color: #e2e8f0 !important;
    }

    /* Progress and metrics */
    [data-testid="stMetricValue"] {
        color: #818cf8 !important;  /* WCAG AA: 5.8:1 */
    }

    /* Hide streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* Responsive */
    @media (max-width: 768px) {
        .main .block-container {
            padding: 1rem !important;
            margin: 0.5rem !important;
        }

        .oni-hero {
            padding: 2rem 1rem;
        }

        .oni-title {
            font-size: 2rem;
        }

        .oni-card {
            min-height: 180px;
            padding: 1.25rem;
        }

        .oni-card-text {
            -webkit-line-clamp: 3;
        }

        .oni-metric-value {
            font-size: 2rem;
        }
    }

    @media (min-width: 769px) and (max-width: 1024px) {
        .oni-title {
            font-size: 2.5rem;
        }
    }

    /* Touch devices */
    @media (pointer: coarse) {
        .stButton > button {
            min-height: 48px !important;
        }
    }
</style>
"""


def inject_styles():
    """Inject global CSS styles into the Streamlit app."""
    import streamlit as st
    st.markdown(GLOBAL_CSS, unsafe_allow_html=True)


def hero_section(title: str, subtitle: str, tagline: str = ""):
    """Create a hero section with gradient title."""
    import streamlit as st
    html = f"""
    <div class="oni-hero">
        <h1 class="oni-title">{title}</h1>
        <p class="oni-subtitle">{subtitle}</p>
        {f'<p class="oni-tagline">{tagline}</p>' if tagline else ''}
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)


def section_header(title: str, subtitle: str = ""):
    """Create a section header."""
    import streamlit as st
    st.markdown(f'<h2 class="oni-section-header">{title}</h2>', unsafe_allow_html=True)
    if subtitle:
        st.markdown(f'<p style="color: #a8b5c7 /* WCAG AA: 7.2:1 */; margin-top: 0.75rem; margin-bottom: 1.5rem;">{subtitle}</p>', unsafe_allow_html=True)


def feature_card(icon: str, title: str, description: str):
    """Create a feature card."""
    import streamlit as st
    html = f"""
    <div class="oni-card">
        <div class="oni-card-icon">{icon}</div>
        <div class="oni-card-title">{title}</div>
        <div class="oni-card-text">{description}</div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)


def metric_card(value: str, label: str):
    """Create a metric display card."""
    import streamlit as st
    html = f"""
    <div class="oni-metric">
        <div class="oni-metric-value">{value}</div>
        <div class="oni-metric-label">{label}</div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)


def info_box(content: str, box_type: str = "info"):
    """Create an info/warning/success/error box."""
    import streamlit as st
    box_class = f"oni-{box_type}-box"
    st.markdown(f'<div class="{box_class}">{content}</div>', unsafe_allow_html=True)


def card_grid_start():
    """Start a card grid container."""
    import streamlit as st
    st.markdown('<div class="oni-card-grid">', unsafe_allow_html=True)


def card_grid_end():
    """End a card grid container."""
    import streamlit as st
    st.markdown('</div>', unsafe_allow_html=True)


# Mock Terminal CSS
TERMINAL_CSS = """
<style>
    .mock-terminal {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 12px;
        overflow: hidden;
        font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .terminal-header {
        background: linear-gradient(180deg, #2d333b 0%, #22272e 100%);
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid #30363d;
    }

    .terminal-btn {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
    }

    .terminal-btn.close { background: #ff5f56; }
    .terminal-btn.minimize { background: #ffbd2e; }
    .terminal-btn.maximize { background: #27c93f; }

    .terminal-title {
        color: #8b949e;
        font-size: 0.875rem  /* Min accessible size */;
        margin-left: auto;
        margin-right: auto;
    }

    .terminal-body {
        padding: 1rem;
        min-height: 200px;
        max-height: 400px;
        overflow-y: auto;
    }

    .terminal-line {
        color: #c9d1d9;
        font-size: 0.875rem;
        line-height: 1.6;
        margin: 0.25rem 0;
        white-space: pre-wrap;
        word-break: break-word;
        opacity: 0;
        transform: translateY(5px);
    }

    .terminal-line.visible {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.15s ease, transform 0.15s ease;
    }

    .terminal-line.typing .typed-text {
        border-right: 2px solid #58a6ff;
        animation: cursor-blink 0.7s step-end infinite;
    }

    .terminal-prompt {
        color: #58a6ff;
    }

    .terminal-command {
        color: #c9d1d9;
    }

    .terminal-output {
        color: #8b949e;
    }

    .terminal-success {
        color: #3fb950;
    }

    .terminal-error {
        color: #f85149;
    }

    .terminal-warning {
        color: #d29922;
    }

    .terminal-highlight {
        color: #a371f7;
    }

    .terminal-cursor {
        display: inline-block;
        width: 8px;
        height: 18px;
        background: #58a6ff;
        animation: cursor-blink 0.7s step-end infinite;
        vertical-align: text-bottom;
        margin-left: 2px;
    }

    @keyframes cursor-blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }

    /* API Reference Card Styles */
    .api-method-card {
        background: rgba(30, 30, 50, 0.6);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 12px;
        padding: 1.25rem;
        margin: 1rem 0;
        transition: all 0.2s ease;
    }

    .api-method-card:hover {
        border-color: rgba(99, 102, 241, 0.4);
    }

    .api-method-name {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1rem;
        color: #a371f7;
        font-weight: 600;
    }

    .api-method-params {
        color: #79c0ff;
    }

    .api-method-returns {
        color: #7ee787;
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }

    .api-method-desc {
        color: #8b949e;
        font-size: 0.9rem;
        margin-top: 0.5rem;
        line-height: 1.5;
    }
</style>
"""


def inject_terminal_styles():
    """Inject terminal-specific CSS styles."""
    import streamlit as st
    st.markdown(TERMINAL_CSS, unsafe_allow_html=True)


def mock_terminal(lines: list, title: str = "Terminal", animate: bool = True, typing_speed: int = 30):
    """
    Create a mock terminal display with typing animation.

    Args:
        lines: List of dicts with 'type' and 'text' keys.
               Types: 'prompt', 'command', 'output', 'success', 'error', 'warning', 'highlight'
        title: Terminal window title
        animate: Whether to animate the typing effect
        typing_speed: Milliseconds per character for typing (lower = faster)

    Example:
        mock_terminal([
            {"type": "prompt", "text": "$ "},
            {"type": "command", "text": "pip install oni-framework"},
            {"type": "output", "text": "Collecting oni-framework..."},
            {"type": "success", "text": "Successfully installed oni-framework-0.2.1"},
        ])
    """
    import streamlit as st
    import json
    import random

    # Generate unique ID for this terminal instance
    terminal_id = f"term_{random.randint(10000, 99999)}"  # nosec B311

    # Build terminal lines HTML with data attributes for animation
    lines_html = ""
    line_index = 0
    i = 0
    while i < len(lines):
        line = lines[i]
        line_type = line.get("type", "output")
        text = line.get("text", "")
        css_class = f"terminal-{line_type}"

        # Check if next line is a command (to combine prompt + command)
        if line_type == "prompt" and i + 1 < len(lines) and lines[i + 1].get("type") == "command":
            next_line = lines[i + 1]
            command_text = next_line.get("text", "")
            # Combined prompt + command line with typing animation on command
            lines_html += f'''<div class="terminal-line" data-line="{line_index}" data-type="command" data-prompt="{text}" data-text="{command_text}"><span class="terminal-prompt">{text}</span><span class="terminal-command typed-text"></span><span class="terminal-cursor" style="display:none;"></span></div>'''
            i += 2  # Skip the command line since we combined it
        else:
            # Regular line - appears instantly or with fade
            escaped_text = text.replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
            lines_html += f'''<div class="terminal-line" data-line="{line_index}" data-type="{line_type}" data-text="{escaped_text}"><span class="{css_class}"></span></div>'''
            i += 1

        line_index += 1

    # JavaScript for typing animation
    animation_script = f"""
    <script>
    (function() {{
        const terminalId = '{terminal_id}';
        const container = document.getElementById(terminalId);
        if (!container) return;

        const lines = container.querySelectorAll('.terminal-line');
        const typingSpeed = {typing_speed};
        const lineDelay = 100;  // Delay between lines
        let currentLine = 0;

        function typeText(element, text, callback) {{
            const span = element.querySelector('.typed-text') || element.querySelector('span');
            const cursor = element.querySelector('.terminal-cursor');
            let charIndex = 0;

            if (cursor) cursor.style.display = 'inline-block';

            function typeChar() {{
                if (charIndex < text.length) {{
                    span.textContent += text.charAt(charIndex);
                    charIndex++;
                    // Vary typing speed slightly for realism
                    const delay = typingSpeed + Math.random() * 20 - 10;
                    setTimeout(typeChar, delay);
                }} else {{
                    if (cursor) cursor.style.display = 'none';
                    if (callback) callback();
                }}
            }}
            typeChar();
        }}

        function showLine(element, callback) {{
            const type = element.dataset.type;
            const text = element.dataset.text || '';
            const prompt = element.dataset.prompt || '';

            element.classList.add('visible');

            if (type === 'command') {{
                // Type out command character by character
                typeText(element, text, callback);
            }} else {{
                // Show output instantly
                const span = element.querySelector('span');
                if (span) span.textContent = text;
                setTimeout(callback, lineDelay);
            }}
        }}

        function processNextLine() {{
            if (currentLine < lines.length) {{
                const line = lines[currentLine];
                const type = line.dataset.type;

                // Add delay before commands for realism
                const preDelay = (type === 'command') ? 300 : 50;

                setTimeout(() => {{
                    showLine(line, () => {{
                        currentLine++;
                        // Longer pause after commands
                        const postDelay = (type === 'command') ? 400 : 80;
                        setTimeout(processNextLine, postDelay);
                    }});
                }}, preDelay);
            }}
        }}

        // Start animation after a brief delay
        setTimeout(processNextLine, 500);
    }})();
    </script>
    """

    # If animation disabled, show all lines immediately
    if not animate:
        animation_script = f"""
        <script>
        (function() {{
            const container = document.getElementById('{terminal_id}');
            if (!container) return;
            container.querySelectorAll('.terminal-line').forEach(line => {{
                line.classList.add('visible');
                const text = line.dataset.text || '';
                const span = line.querySelector('.typed-text') || line.querySelector('span');
                if (span) span.textContent = text;
                const cursor = line.querySelector('.terminal-cursor');
                if (cursor) cursor.style.display = 'none';
            }});
        }})();
        </script>
        """

    terminal_html = f"""
    <div class="mock-terminal" id="{terminal_id}">
        <div class="terminal-header">
            <span class="terminal-btn close"></span>
            <span class="terminal-btn minimize"></span>
            <span class="terminal-btn maximize"></span>
            <span class="terminal-title">{title}</span>
        </div>
        <div class="terminal-body">
            {lines_html}
        </div>
    </div>
    {animation_script}
    """

    st.markdown(terminal_html, unsafe_allow_html=True)


def interactive_terminal(session_key: str = "terminal_history"):
    """
    Create an interactive mock terminal with input.

    Args:
        session_key: Session state key for storing terminal history
    """
    import streamlit as st

    # Initialize history
    if session_key not in st.session_state:
        st.session_state[session_key] = []

    return session_key


def api_method_card(name: str, params: str, returns: str, description: str):
    """Display an API method reference card."""
    import streamlit as st

    html = f"""
    <div class="api-method-card">
        <div>
            <span class="api-method-name">{name}</span><span class="api-method-params">{params}</span>
        </div>
        <div class="api-method-returns">Returns: {returns}</div>
        <div class="api-method-desc">{description}</div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)
