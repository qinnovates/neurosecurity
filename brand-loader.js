/**
 * QBrand — Lightweight brand token loader for qinnovate.com
 *
 * Fetches brands.json, caches it, and injects CSS custom properties.
 * Pages should keep hardcoded :root CSS as fallback (no FOUC).
 *
 * Usage:
 *   <script src="/brand-loader.js"></script>
 *   <script>
 *     QBrand.load(function(err, brands) {
 *       if (!err) QBrand.injectCSS(brands);
 *     });
 *   </script>
 */
var QBrand = (function () {
  var _cache = null;

  function load(callback) {
    if (_cache) return callback(null, _cache);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/brands.json", true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status === 200) {
        try {
          _cache = JSON.parse(xhr.responseText);
          callback(null, _cache);
        } catch (e) {
          callback(e, null);
        }
      } else {
        callback(new Error("Failed to load brands.json: " + xhr.status), null);
      }
    };
    xhr.send();
  }

  function injectCSS(brands) {
    var colors = brands && brands.theme && brands.theme.colors;
    if (!colors) return;
    var root = document.documentElement.style;
    var keys = Object.keys(colors);
    for (var i = 0; i < keys.length; i++) {
      root.setProperty("--brand-" + keys[i].replace(/_/g, "-"), colors[keys[i]]);
    }
  }

  function get(path) {
    if (!_cache) return undefined;
    var parts = path.split(".");
    var obj = _cache;
    for (var i = 0; i < parts.length; i++) {
      if (obj == null) return undefined;
      obj = obj[parts[i]];
    }
    return obj;
  }

  return { load: load, injectCSS: injectCSS, get: get };
})();
