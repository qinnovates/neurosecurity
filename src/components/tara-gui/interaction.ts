export function initTaraExplorers() {
  document.querySelectorAll<HTMLElement>('[data-tara-gui]').forEach(root => {
    if (root.dataset.ready) return;
    root.dataset.ready = 'true';
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tab]'));
    const options = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-region]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-region-panel]'));
    let region = options.find(option => option.getAttribute('aria-selected') === 'true')?.dataset.region;
    let lens = 'band';
    function render() {
      options.forEach(option => {
        const selected = option.dataset.region === region;
        option.setAttribute('aria-selected', String(selected));
        option.tabIndex = selected ? 0 : -1;
      });
      tabs.forEach(tab => {
        const selected = tab.dataset.tab === lens;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        tab.setAttribute('aria-controls', `tara-${tab.dataset.tab}-${region}`);
      });
      panels.forEach(panel => {
        panel.hidden = panel.dataset.regionPanel !== region;
        panel.querySelectorAll<HTMLElement>('[data-lens]').forEach(view => {
          view.hidden = view.dataset.lens !== lens;
        });
      });
    }
    // Manual activation: arrows move focus; native button Enter/Space activates.
    function navigation(items: HTMLButtonElement[], horizontal: boolean) {
      items.forEach((item, index) => item.addEventListener('keydown', event => {
        let next: number;
        if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = items.length - 1;
        else if (event.key === 'ArrowDown' || (horizontal && event.key === 'ArrowRight')) next = (index + 1) % items.length;
        else if (event.key === 'ArrowUp' || (horizontal && event.key === 'ArrowLeft')) next = (index - 1 + items.length) % items.length;
        else return;
        event.preventDefault();
        items.forEach((button, i) => { button.tabIndex = i === next ? 0 : -1; });
        items[next].focus();
      }));
    }
    tabs.forEach(tab => tab.addEventListener('click', () => { lens = tab.dataset.tab!; render(); }));
    options.forEach(option => option.addEventListener('click', () => { region = option.dataset.region; render(); }));
    navigation(tabs, true);
    navigation(options, false);
    root.querySelector('[data-library-link]')?.addEventListener('click', event => {
      const library = root.nextElementSibling?.querySelector<HTMLElement>('.mt-8');
      if (library) {
        event.preventDefault();
        library.tabIndex = -1;
        library.focus({ preventScroll: true });
        library.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
    render();
  });
}
