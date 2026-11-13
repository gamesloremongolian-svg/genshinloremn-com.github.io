// Games Lore Mongolian// Games Lore Mongolian
(function () {
  'use strict';

  // ---- Mobile menu ----
  var toggle = document.getElementById('menuToggle');
  var menu = document.getElementById('navMenu');

  function setMenu(open) {
    menu.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '✕' : '☰';
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(!menu.classList.contains('active'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 650) setMenu(false);
    });
  }

  // ---- Search ----
  var form = document.getElementById('searchForm');
  var input = document.getElementById('searchInput');
  var message = document.getElementById('searchMessage');
  var noResults = document.getElementById('noResults');
  var items = Array.prototype.slice.call(document.querySelectorAll('.searchable'));

  function runSearch(shouldScroll) {
    var q = input.value.trim().toLocaleLowerCase('mn');
    var found = 0;
    var firstMatch = null;

    items.forEach(function (el) {
      var text = ((el.getAttribute('data-search') || '') + ' ' + el.textContent)
        .toLocaleLowerCase('mn');
      var match = !q || text.indexOf(q) !== -1;
      el.hidden = !match;
      if (match) {
        found++;
        if (!firstMatch) firstMatch = el;
      }
    });

    if (!q) {
      message.textContent = '';
      noResults.hidden = true;
    } else if (found === 0) {
      message.textContent = '0 илэрц олдлоо';
      noResults.hidden = false;
    } else {
      message.textContent = found + ' илэрц олдлоо';
      noResults.hidden = true;
    }

    if (shouldScroll && q) {
      var target = firstMatch || noResults;
      if (target) {
        window.setTimeout(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    }
  }

  if (form && input) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      runSearch(true);
    });
    input.addEventListener('input', function () {
      runSearch(false);
    });
  }

  // ---- Footer year ----
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

