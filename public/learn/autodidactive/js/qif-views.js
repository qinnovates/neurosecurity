// Autodidactive — QIF Content Renderers
// Renders TARA, NISS, Neurowall, NSP, Guardrails, Governance, BCI Devices, Brain Atlas, DSM-5 views

import { GUARDRAILS, DSM5_CLUSTERS, NEURORIGHTS } from './data/guardrails.js';
import { NEUROWALL, NSP_OVERVIEW, RUNEMATE_OVERVIEW } from './data/neurowall.js';
import { GOVERNANCE_DOCS, REGULATORY_LANDSCAPE } from './data/governance.js';

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── TARA Threat Atlas ──────────────────────────────────────────────────────
export function renderTARA(container, TARA_TECHNIQUES, TARA_STATS) {
  const byStatus = { CONFIRMED: 0, DEMONSTRATED: 0, EMERGING: 0, THEORETICAL: 0 };
  TARA_TECHNIQUES.forEach(t => { if (byStatus[t.status] !== undefined) byStatus[t.status]++; });

  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  TARA_TECHNIQUES.forEach(t => { if (bySeverity[t.severity] !== undefined) bySeverity[t.severity]++; });

  const sevColor = { critical: '#dc2626', high: '#ea580c', medium: '#ca8a04', low: '#16a34a' };
  const statusLabel = { CONFIRMED: 'Confirmed in literature', DEMONSTRATED: 'Demonstrated in lab', EMERGING: 'Emerging capability', THEORETICAL: 'Theoretical/projected' };

  container.innerHTML = `
    <div class="vision-section">
      <div class="vision-intro">
        <p>TARA (Threat Atlas for Risk Assessment) catalogs ${TARA_TECHNIQUES.length} attack techniques mapped across the QIF hourglass. Each technique is classified by status, severity, affected bands, and dual-use potential.</p>
        <p class="vision-qualifier"><em>TARA is a proposed threat catalog by Qinnovate. Techniques marked CONFIRMED are documented in published literature. Others are theoretical projections for defensive planning. This catalog exists to inform defense, not enable attack.</em></p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Threat Landscape</h4>
        <div class="vision-stats">
          <div class="vision-stat"><span class="vision-stat-num">${TARA_TECHNIQUES.length}</span><span>Total Techniques</span></div>
          <div class="vision-stat"><span class="vision-stat-num">${byStatus.CONFIRMED}</span><span>Confirmed</span></div>
          <div class="vision-stat"><span class="vision-stat-num">${byStatus.DEMONSTRATED}</span><span>Demonstrated</span></div>
          <div class="vision-stat"><span class="vision-stat-num">${byStatus.EMERGING}</span><span>Emerging</span></div>
          <div class="vision-stat"><span class="vision-stat-num">${byStatus.THEORETICAL}</span><span>Theoretical</span></div>
        </div>
        <div class="vision-stats" style="margin-top:12px;">
          <div class="vision-stat"><span class="vision-stat-num" style="color:${sevColor.critical}">${bySeverity.critical}</span><span>Critical</span></div>
          <div class="vision-stat"><span class="vision-stat-num" style="color:${sevColor.high}">${bySeverity.high}</span><span>High</span></div>
          <div class="vision-stat"><span class="vision-stat-num" style="color:${sevColor.medium}">${bySeverity.medium}</span><span>Medium</span></div>
          <div class="vision-stat"><span class="vision-stat-num" style="color:${sevColor.low}">${bySeverity.low}</span><span>Low</span></div>
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Dual-Use Reality</h4>
        <p>77 of ${TARA_TECHNIQUES.length} techniques have clinical analogs -- the same mechanism used therapeutically (e.g., DBS for Parkinson's) can be used as an attack. The boundary between therapy and threat is consent, dosage, and oversight.</p>
        <div class="vision-stats">
          <div class="vision-stat"><span class="vision-stat-num">52</span><span>Confirmed dual-use</span></div>
          <div class="vision-stat"><span class="vision-stat-num">16</span><span>Probable</span></div>
          <div class="vision-stat"><span class="vision-stat-num">9</span><span>Possible</span></div>
          <div class="vision-stat"><span class="vision-stat-num">25</span><span>Silicon-only (no clinical analog)</span></div>
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Techniques by Severity</h4>
        <div class="tara-list">
          ${TARA_TECHNIQUES.slice(0, 40).map(t => `
            <div class="tara-technique">
              <div class="tara-technique-header">
                <span class="tara-id">${esc(t.id)}</span>
                <span class="tara-severity" style="background:${sevColor[t.severity] || '#666'}">${esc(t.severity)}</span>
                <span class="tara-status">${esc(t.status)}</span>
              </div>
              <div class="tara-technique-name">${esc(t.name)}</div>
              <div class="tara-technique-desc">${esc(t.description)}</div>
              <div class="tara-technique-bands">${(t.bands || []).map(b => `<span class="tara-band">${esc(b)}</span>`).join('')}</div>
            </div>
          `).join('')}
          ${TARA_TECHNIQUES.length > 40 ? `<p class="tara-more">Showing 40 of ${TARA_TECHNIQUES.length} techniques. <a href="https://github.com/qinnovates/qinnovate/blob/main/shared/qtara-registrar.json" target="_blank" rel="noopener noreferrer">View full catalog on GitHub</a></p>` : ''}
        </div>
      </div>
    </div>
  `;
}

// ── NISS Scoring ───────────────────────────────────────────────────────────
export function renderNISS(container, NISS_DEVICES) {
  container.innerHTML = `
    <div class="vision-section">
      <div class="vision-intro">
        <p>NISS (Neural Impact Scoring System) extends CVSS to account for neural-specific harm dimensions that traditional vulnerability scoring misses: reversibility, patient awareness, and clinical impact mapping.</p>
        <p class="vision-qualifier"><em>NISS is a proposed scoring system by Qinnovate. It has not been independently validated or adopted by FIRST/CVSS SIG. The neurorights dimensions (CL, MI, MP, PC, EA) reference Ienca & Andorno (2017).</em></p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Why CVSS Is Not Enough</h4>
        <p>CVSS scores confidentiality, integrity, and availability. But a BCI attack can also affect:</p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>NISS Dimension</span><span>What CVSS Misses</span></div>
          <div class="vision-row"><span>Cognitive Liberty (CL)</span><span>Can the attack coerce or constrain the user's freedom of thought?</span></div>
          <div class="vision-row"><span>Mental Integrity (MI)</span><span>Can the attack alter or damage neural function?</span></div>
          <div class="vision-row"><span>Mental Privacy (MP)</span><span>Can the attack extract neural data the user did not consent to share?</span></div>
          <div class="vision-row"><span>Psychological Continuity (PC)</span><span>Can the attack permanently alter personality or sense of self?</span></div>
          <div class="vision-row"><span>Equal Access (EA)</span><span>Does the attack disproportionately affect vulnerable populations?</span></div>
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Device Risk Scores</h4>
        <p>NISS scores computed across all applicable TARA techniques per device:</p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Device</span><span>Type</span><span>NISS Score</span><span>Severity</span></div>
          ${(NISS_DEVICES || []).map(d => `
            <div class="vision-row">
              <span>${esc(d.device)}</span>
              <span>${esc(d.type)}</span>
              <span>${d.overall_score ? d.overall_score.toFixed(2) : 'N/A'}</span>
              <span style="color:${d.severity === 'High' ? '#ea580c' : d.severity === 'Critical' ? '#dc2626' : '#ca8a04'}">${esc(d.severity)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">CVSS vs NISS Gap</h4>
        <p>58 techniques where CVSS cannot express the neural-specific impact. 42 techniques with no FDA pathway for consumer sensor exploitation. 30 techniques where CVSS partially captures risk but neural dimensions are missing.</p>
        <p>This gap is why NISS exists: to make the invisible harm visible in a scoring framework that defenders and regulators can act on.</p>
      </div>
    </div>
  `;
}

// ── Neurowall ──────────────────────────────────────────────────────────────
export function renderNeurowall(container) {
  container.innerHTML = `
    <div class="vision-section">
      <div class="vision-intro">
        <p>Neurowall is a proposed neural firewall architecture that sits at I0 -- the interface band where biology meets silicon. It validates every signal crossing the boundary in both directions.</p>
        <p class="vision-qualifier"><em>${esc(NEUROWALL.status)}</em></p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">The Idea</h4>
        <p>${esc(NEUROWALL.concept)}</p>
        <h4 class="vision-heading" style="margin-top:16px;">Target Form Factors</h4>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Form Factor</span><span>Sensors</span></div>
          ${NEUROWALL.formFactors.map(f => `<div class="vision-row"><span>${esc(f.name)}</span><span>${esc(f.sensors)}</span></div>`).join('')}
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">${esc(NEUROWALL.inbound.label)}</h4>
        ${NEUROWALL.inbound.stages.map(s => `
          <div class="neurowall-stage">
            <strong>${esc(s.name)}</strong>
            <p>${esc(s.desc)}</p>
          </div>
        `).join('')}
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">${esc(NEUROWALL.outbound.label)}</h4>
        ${NEUROWALL.outbound.stages.map(s => `
          <div class="neurowall-stage">
            <strong>${esc(s.name)}</strong>
            <p>${esc(s.desc)}</p>
          </div>
        `).join('')}
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Hardware Constraints</h4>
        <div class="vision-stats">
          ${NEUROWALL.constraints.map(c => `
            <div class="vision-stat"><span class="vision-stat-num">${esc(c.value)}</span><span>${esc(c.metric)}: ${esc(c.why)}</span></div>
          `).join('')}
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">What It Detects (Simulation)</h4>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Attack</span><span>Detection Method</span><span>Band</span></div>
          ${NEUROWALL.detections.map(d => `<div class="vision-row"><span>${esc(d.attack)}</span><span>${esc(d.method)}</span><span>${esc(d.band)}</span></div>`).join('')}
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">NSP: Neural Sensory Protocol</h4>
        <p>${esc(NSP_OVERVIEW.purpose)}</p>
        <p><strong>Why post-quantum?</strong> ${esc(NSP_OVERVIEW.whyPostQuantum)}</p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Layer</span><span>Algorithm</span><span>Purpose</span></div>
          ${NSP_OVERVIEW.crypto.map(c => `<div class="vision-row"><span>${esc(c.layer)}</span><span>${esc(c.algorithm)}</span><span>${esc(c.purpose)}</span></div>`).join('')}
        </div>
        <p style="margin-top:8px;">${esc(NSP_OVERVIEW.merkle)}</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Runemate: On-Chip Policy Engine</h4>
        <p>${esc(RUNEMATE_OVERVIEW.purpose)}</p>
        <div class="vision-stats">
          <div class="vision-stat"><span class="vision-stat-num">${esc(RUNEMATE_OVERVIEW.footprint)}</span><span>Flash + SRAM footprint</span></div>
          <div class="vision-stat"><span class="vision-stat-num">Rust no_std</span><span>Memory-safe, zero allocation</span></div>
        </div>
        <p>${esc(RUNEMATE_OVERVIEW.update)}</p>
        <p class="vision-qualifier"><em>${esc(RUNEMATE_OVERVIEW.status)}</em></p>
      </div>
    </div>
  `;
}

// ── Guardrails ─────────────────────────────────────────────────────────────
export function renderGuardrails(container) {
  container.innerHTML = `
    <div class="vision-section">
      <div class="vision-intro">
        <p>QIF enforces 8 guardrails drawn from published neuroethics scholarship. Each guardrail pairs an ethics constraint with a neurosecurity scope limit -- what QIF tools are and are not allowed to claim.</p>
        <p class="vision-qualifier"><em>These guardrails are grounded in published scholarship (citations below each). The mapping to QIF components is Qinnovate's interpretation.</em></p>
      </div>

      ${GUARDRAILS.map(g => `
        <div class="vision-card">
          <h4 class="vision-heading">${esc(g.id)}: ${esc(g.name)}</h4>
          <p style="font-size:0.8rem;color:var(--text-dim);">${esc(g.author)}</p>
          <p>${esc(g.constraint)}</p>
          <div class="guardrail-examples">
            <div class="guardrail-wrong"><strong>Wrong:</strong> "${esc(g.violation)}"</div>
            <div class="guardrail-right"><strong>Right:</strong> "${esc(g.correct)}"</div>
          </div>
          <p style="margin-top:8px;font-size:0.85rem;"><strong>QIF scope:</strong> ${esc(g.qifScope)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Governance ─────────────────────────────────────────────────────────────
export function renderGovernance(container) {
  container.innerHTML = `
    <div class="vision-section">
      <div class="vision-intro">
        <p>Governance bridges security and ethics. These documents define the policy framework around QIF -- consent, accessibility, legislation, disclosure, and regulatory compliance.</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Neurorights</h4>
        <p>Rights proposed to protect individuals from neural technology misuse. Based on Ienca & Andorno (2017), Chile (2021), and QIF extensions.</p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Right</span><span>Description</span><span>Source</span></div>
          ${NEURORIGHTS.map(r => `<div class="vision-row"><span><strong>${esc(r.id)}</strong>: ${esc(r.name)}</span><span>${esc(r.description)}</span><span>${esc(r.source)}</span></div>`).join('')}
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Global Regulatory Landscape</h4>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Jurisdiction</span><span>Year</span><span>Law/Framework</span><span>Scope</span></div>
          ${REGULATORY_LANDSCAPE.map(r => `<div class="vision-row"><span>${esc(r.jurisdiction)}</span><span>${r.year}</span><span>${esc(r.law)}</span><span>${esc(r.scope)}</span></div>`).join('')}
        </div>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Policy Documents</h4>
        ${GOVERNANCE_DOCS.map(d => `
          <div class="governance-doc">
            <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer" class="governance-doc-title">${esc(d.title)}</a>
            <p>${esc(d.summary)}</p>
            <div class="governance-doc-topics">${d.topics.map(t => `<span class="tara-band">${esc(t)}</span>`).join('')}</div>
          </div>
        `).join('')}
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">DSM-5-TR Mapping (for threat modeling)</h4>
        <p class="vision-qualifier"><em>These are diagnostic category references, not diagnostic claims. The Neural Impact Chain is a threat modeling tool, not a clinical instrument.</em></p>
        <div class="vision-table">
          <div class="vision-row vision-row-header"><span>Cluster</span><span>Bands</span><span>Conditions</span></div>
          ${DSM5_CLUSTERS.map(c => `<div class="vision-row"><span style="color:${c.color}"><strong>${esc(c.label)}</strong></span><span>${c.bands.join(', ')}</span><span>${c.conditions.map(x => esc(x.name)).join(', ')}</span></div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// ── BCI Devices ────────────────────────────────────────────────────────────
export function renderBCIDevices(container, BCI_COMPANIES) {
  const allDevices = BCI_COMPANIES.flatMap(c => (c.devices || []).map(d => ({ ...d, company: c.name, companyType: c.type })));
  container.innerHTML = `
    <div class="vision-section">
      <div class="vision-intro">
        <p>The BCI industry landscape: ${BCI_COMPANIES.length} companies, ${allDevices.length} devices tracked. From consumer EEG headbands to implanted cortical arrays.</p>
      </div>

      <div class="vision-card">
        <h4 class="vision-heading">Industry Overview</h4>
        <div class="vision-stats">
          <div class="vision-stat"><span class="vision-stat-num">${BCI_COMPANIES.length}</span><span>Companies</span></div>
          <div class="vision-stat"><span class="vision-stat-num">${allDevices.length}</span><span>Devices</span></div>
          <div class="vision-stat"><span class="vision-stat-num">${BCI_COMPANIES.filter(c => c.type === 'invasive').length}</span><span>Invasive</span></div>
          <div class="vision-stat"><span class="vision-stat-num">${BCI_COMPANIES.filter(c => c.type === 'noninvasive').length}</span><span>Non-invasive</span></div>
        </div>
      </div>

      ${BCI_COMPANIES.map(c => `
        <div class="vision-card">
          <h4 class="vision-heading">${esc(c.name)}</h4>
          <p style="font-size:0.8rem;color:var(--text-dim);">${esc(c.type)} | ${esc(c.status)} | ${c.funding || 'Funding undisclosed'} | Security: ${esc(c.securityPosture)}</p>
          ${(c.devices || []).length > 0 ? `
            <div class="vision-table">
              <div class="vision-row vision-row-header"><span>Device</span><span>Channels</span><span>FDA</span><span>Use</span></div>
              ${(c.devices || []).map(d => `<div class="vision-row"><span>${esc(d.name)}</span><span>${d.channels || '?'}</span><span>${esc(d.fdaStatus || 'N/A')}</span><span>${esc(d.targetUse || '')}</span></div>`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// ── Brain Atlas ────────────────────────────────────────────────────────────
export function renderBrainAtlas(container, BRAIN_REGIONS) {
  const byBand = {};
  BRAIN_REGIONS.forEach(r => {
    if (!byBand[r.band]) byBand[r.band] = [];
    byBand[r.band].push(r);
  });
  const bandOrder = ['N7','N6','N5','N4','N3','N2','N1','I0','S1','S2','S3'];

  container.innerHTML = `
    <div class="vision-section">
      <div class="vision-intro">
        <p>${BRAIN_REGIONS.length} brain structures mapped across the QIF hourglass. Each region includes its function, recording methods, and clinical relevance for BCI work.</p>
      </div>

      ${bandOrder.filter(b => byBand[b]).map(band => `
        <div class="vision-card">
          <h4 class="vision-heading">${esc(band)}: ${esc(byBand[band][0]?.band === band ? getBandName(band) : band)}</h4>
          <div class="vision-table">
            <div class="vision-row vision-row-header"><span>Region</span><span>Function</span><span>Recording</span></div>
            ${byBand[band].map(r => `<div class="vision-row"><span><strong>${esc(r.name)}</strong></span><span>${esc(r.function)}</span><span>${(r.recordingMethods || []).join(', ')}</span></div>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getBandName(band) {
  const names = { N7:'Neocortex', N6:'Limbic System', N5:'Basal Ganglia', N4:'Diencephalon', N3:'Cerebellum', N2:'Brainstem', N1:'Spinal Cord', I0:'Neural Interface', S1:'Analog Front-End', S2:'Digital Processing', S3:'Application Layer' };
  return names[band] || band;
}
