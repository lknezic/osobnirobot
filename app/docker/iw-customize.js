/**
 * InstantWorker — OpenClaw Control UI Customization
 *
 * Injected at build time into OpenClaw's index.html.
 * Uses MutationObserver to handle SPA re-renders.
 *
 * Renames sidebar items, hides dangerous ones, adds descriptions.
 */
(function () {
  'use strict';

  // Sidebar item config: key = original label (lowercase), value = action
  var SIDEBAR_CONFIG = {
    'chat': { show: true, rename: null, desc: null },
    'heartbeat': { show: true, rename: 'Work Log', desc: 'Auto-pilot activity' },
    'sessions': { show: true, rename: 'Conversations', desc: 'Chat history' },
    'cron jobs': { show: true, rename: 'Scheduled Tasks', desc: 'Recurring tasks' },
    'cron': { show: true, rename: 'Scheduled Tasks', desc: 'Recurring tasks' },
    'skills': { show: true, rename: null, desc: 'Active skills' },
    'channels': { show: true, rename: 'Connections', desc: 'Telegram, Slack' },
    // Hidden items — too technical or dangerous for clients
    'config': { show: false },
    'settings': { show: false },
    'exec approvals': { show: false },
    'update': { show: false },
    'agents dashboard': { show: false },
    'agents': { show: false },
  };

  function processNavItems() {
    // Find all nav/sidebar links — try multiple selector strategies
    var selectors = [
      'aside a', 'aside button',
      'nav a', 'nav button',
      '[class*="sidebar"] a', '[class*="sidebar"] button',
      '[class*="Sidebar"] a', '[class*="Sidebar"] button',
      '[class*="nav-item"]', '[class*="NavItem"]',
      '[class*="menu-item"]', '[class*="MenuItem"]',
    ];

    var items = [];
    for (var i = 0; i < selectors.length; i++) {
      var found = document.querySelectorAll(selectors[i]);
      for (var j = 0; j < found.length; j++) {
        if (items.indexOf(found[j]) === -1) items.push(found[j]);
      }
    }

    items.forEach(function (el) {
      var text = (el.textContent || '').trim().toLowerCase();
      // Strip any existing description text we may have added
      var spanDesc = el.querySelector('.iw-desc');
      if (spanDesc) {
        text = text.replace(spanDesc.textContent.trim().toLowerCase(), '').trim();
      }

      var config = null;
      var keys = Object.keys(SIDEBAR_CONFIG);
      for (var k = 0; k < keys.length; k++) {
        if (text === keys[k] || text.indexOf(keys[k]) === 0) {
          config = SIDEBAR_CONFIG[keys[k]];
          break;
        }
      }

      if (!config) return; // Unknown item — leave as-is

      if (!config.show) {
        el.style.display = 'none';
        // Also hide parent li/div if it's a wrapper
        var parent = el.parentElement;
        if (parent && (parent.tagName === 'LI' || parent.children.length === 1)) {
          parent.style.display = 'none';
        }
        return;
      }

      // Rename
      if (config.rename && !el.getAttribute('data-iw-renamed')) {
        // Find the text node to rename (preserve icons/svgs)
        var textNodes = [];
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        var node;
        while ((node = walker.nextNode())) {
          if (node.textContent.trim()) textNodes.push(node);
        }
        if (textNodes.length > 0) {
          // Replace the first meaningful text node
          for (var t = 0; t < textNodes.length; t++) {
            var original = textNodes[t].textContent.trim().toLowerCase();
            var matchKey = Object.keys(SIDEBAR_CONFIG).find(function (k) {
              return original === k || original.indexOf(k) === 0;
            });
            if (matchKey && SIDEBAR_CONFIG[matchKey].rename) {
              textNodes[t].textContent = textNodes[t].textContent.replace(
                new RegExp(matchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
                SIDEBAR_CONFIG[matchKey].rename
              );
              break;
            }
          }
        }
        el.setAttribute('data-iw-renamed', 'true');
      }

      // Add description tooltip
      if (config.desc && !el.getAttribute('data-iw-desc')) {
        el.setAttribute('title', config.desc);
        el.setAttribute('data-iw-desc', 'true');
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processNavItems);
  } else {
    processNavItems();
  }

  // MutationObserver for SPA re-renders
  var debounceTimer = null;
  var observer = new MutationObserver(function () {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processNavItems, 200);
  });

  // Start observing once body is available
  function startObserving() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      setTimeout(startObserving, 50);
    }
  }
  startObserving();
})();
