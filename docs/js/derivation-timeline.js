(function(){
  var el = document.getElementById('derivation-timeline');
  if (!el) return;

  fetch('/data/derivation-timeline.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var cats = data.categories;
      var ms = data.milestones;

      // Group by date
      var groups = [];
      var last = null;
      ms.forEach(function(m) {
        if (m.date !== last) { groups.push({ date: m.date, items: [] }); last = m.date; }
        groups[groups.length - 1].items.push(m);
      });

      // Container
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:flex-start;gap:0;position:relative;min-width:max-content;padding:1rem 0';

      // Horizontal line
      var line = document.createElement('div');
      line.style.cssText = 'position:absolute;top:38px;left:0;right:0;height:2px;background:linear-gradient(90deg,#64748b,#06b6d4,#8b5cf6,#f59e0b,#10b981);z-index:0';
      wrap.appendChild(line);

      groups.forEach(function(g, gi) {
        var col = document.createElement('div');
        col.style.cssText = 'display:flex;flex-direction:column;align-items:center;min-width:140px;max-width:180px;position:relative;z-index:1';

        // Date label
        var d = new Date(g.date + 'T12:00:00');
        var dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        var dateEl = document.createElement('div');
        dateEl.textContent = dateStr;
        dateEl.style.cssText = 'font-size:11px;color:#94a3b8;margin-bottom:6px;font-family:monospace';
        col.appendChild(dateEl);

        // Node
        var topItem = g.items[0];
        var nodeColor = (cats[topItem.category] && cats[topItem.category].color) || '#06b6d4';
        var node = document.createElement('div');
        var isAha = g.items.some(function(i) { return i.type === 'aha'; });
        var size = g.items.length > 1 ? '16px' : '12px';
        node.style.cssText = 'width:' + size + ';height:' + size + ';border-radius:' + (isAha ? '2px' : '50%') + ';background:' + nodeColor + ';border:2px solid ' + nodeColor + ';box-shadow:0 0 8px ' + nodeColor + '44;margin-bottom:8px;transform:' + (isAha ? 'rotate(45deg)' : 'none');
        col.appendChild(node);

        // Technique count (if available)
        var techItem = g.items.find(function(i) { return i.metrics && i.metrics.techniques; });
        if (techItem && techItem.metrics.techniques) {
          var tech = document.createElement('div');
          tech.textContent = techItem.metrics.techniques + ' threats';
          tech.style.cssText = 'font-size:10px;color:#f59e0b;font-weight:700;font-family:monospace;margin-bottom:4px';
          col.appendChild(tech);
        }

        // Title(s)
        g.items.forEach(function(item) {
          var title = document.createElement('div');
          title.textContent = item.title;
          title.style.cssText = 'font-size:12px;font-weight:700;color:#e2e8f0;text-align:center;line-height:1.3';
          col.appendChild(title);

          var desc = document.createElement('div');
          desc.textContent = item.short;
          desc.style.cssText = 'font-size:10px;color:#94a3b8;text-align:center;line-height:1.3;margin-bottom:4px;padding:0 4px';
          col.appendChild(desc);
        });

        // Connector spacing
        if (gi < groups.length - 1) {
          var spacer = document.createElement('div');
          spacer.style.cssText = 'min-width:20px';
          wrap.appendChild(col);
          wrap.appendChild(spacer);
        } else {
          wrap.appendChild(col);
        }
      });

      // Summary bar
      var summary = document.createElement('div');
      var last_m = ms[ms.length - 1];
      var stats = [
        last_m.metrics && last_m.metrics.log_entries ? last_m.metrics.log_entries + ' entries' : null,
        last_m.metrics && last_m.metrics.days_of_derivation ? last_m.metrics.days_of_derivation + ' days' : null,
        last_m.metrics && last_m.metrics.framework_versions ? last_m.metrics.framework_versions + ' versions' : null,
        '1 protocol', '1 scoring system', '1 atlas'
      ].filter(Boolean);
      summary.textContent = stats.join('  \u00b7  ');
      summary.style.cssText = 'text-align:center;font-size:12px;color:#64748b;font-family:monospace;margin-top:1.5rem;padding-top:1rem;border-top:1px solid #1e293b';

      el.innerHTML = '';
      el.appendChild(wrap);
      el.appendChild(summary);
    })
    .catch(function() {});
})();
