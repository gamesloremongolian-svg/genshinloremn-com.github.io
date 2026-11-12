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

  function runSearch() {
    var q = input.value.trim().toLowerCase();
    var found = 0;

    items.forEach(function (el) {
      var text = ((el.getAttribute('data-search') || '') + ' ' + el.textContent).toLowerCase();
      var match = !q || text.indexOf(q) !== -1;
      el.hidden = !match;
      if (match) found++;
    });

    if (!q) {
      message.textContent = '';
      noResults.hidden = true;
    } else if (found === 0) {
      message.textContent = '';
      noResults.hidden = false;
    } else {
      message.textContent = found + ' илэрц олдлоо';
      noResults.hidden = true;
    }
  }

  if (form && input) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      runSearch();
      var games = document.getElementById('games');
      if (games && input.value.trim()) games.scrollIntoView({ behavior: 'smooth' });
    });
    input.addEventListener('input', runSearch);
  }

  // ---- Footer year ----
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();

