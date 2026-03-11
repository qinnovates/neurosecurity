// Neuroanatomy Hourglass Renderer — Interactive QIF band explorer
import { QIF_BANDS, HOURGLASS_EXPLAINER } from './data/neuroanatomy.js';

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

export function renderNeuroanatomy(container) {
  const explainer = HOURGLASS_EXPLAINER;

  container.innerHTML = `
    <div class="neuro-section">
      <div class="neuro-explainer">
        <h3 class="neuro-explainer-title">${esc(explainer.title)}</h3>
        <p class="neuro-explainer-desc">${esc(explainer.description)}</p>
        <div class="neuro-explainer-status">${esc(explainer.status)}</div>
        <p class="neuro-explainer-principle">${esc(explainer.keyPrinciple)}</p>
        <div class="neuro-zones">
          ${explainer.zones.map(z => `
            <div class="neuro-zone" style="--zone-color: ${z.color}">
              <div class="neuro-zone-dot"></div>
              <div>
                <div class="neuro-zone-name">${esc(z.name)}</div>
                <div class="neuro-zone-desc">${esc(z.description)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="neuro-bands">
        ${QIF_BANDS.map(band => `
          <div class="neuro-band" style="--band-color: ${band.color}" data-band="${band.id}">
            <div class="neuro-band-header">
              <span class="neuro-band-emoji">${band.emoji}</span>
              <div class="neuro-band-title">
                <span class="neuro-band-id">${band.id}</span>
                <span class="neuro-band-name">${esc(band.name)}</span>
              </div>
              <span class="neuro-band-zone neuro-band-zone--${band.zone}">${band.zone}</span>
            </div>
            <div class="neuro-band-body" style="display:none;">
              <div class="neuro-band-row">
                <span class="neuro-band-label">Function</span>
                <p>${esc(band.function)}</p>
              </div>
              <div class="neuro-band-row">
                <span class="neuro-band-label">Structures</span>
                <div class="neuro-band-tags">
                  ${band.structures.map(s => `<span class="neuro-tag">${esc(s)}</span>`).join('')}
                </div>
              </div>
              <div class="neuro-band-row">
                <span class="neuro-band-label">Why QIF maps here</span>
                <p>${esc(band.qifRationale)}</p>
              </div>
              <div class="neuro-band-row">
                <span class="neuro-band-label">Determinacy</span>
                <p>${esc(band.determinacy)}</p>
              </div>
              <div class="neuro-band-row">
                <span class="neuro-band-label">If compromised</span>
                <p class="neuro-band-severity">${esc(band.severity)}</p>
              </div>
              <div class="neuro-band-row neuro-band-fact">
                <p>${esc(band.keyFact)}</p>
              </div>
              ${band.oscillations.length ? `
              <div class="neuro-band-row">
                <span class="neuro-band-label">Oscillations</span>
                <div class="neuro-band-tags">
                  ${band.oscillations.map(o => `<span class="neuro-tag neuro-tag--osc">${esc(o)}</span>`).join('')}
                </div>
              </div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Accordion toggle
  container.querySelectorAll('.neuro-band').forEach(band => {
    band.querySelector('.neuro-band-header').addEventListener('click', () => {
      const body = band.querySelector('.neuro-band-body');
      const isOpen = body.style.display !== 'none';
      // Close all
      container.querySelectorAll('.neuro-band-body').forEach(b => b.style.display = 'none');
      container.querySelectorAll('.neuro-band').forEach(b => b.classList.remove('neuro-band--open'));
      // Toggle clicked
      if (!isOpen) {
        body.style.display = 'block';
        band.classList.add('neuro-band--open');
      }
    });
  });
}
