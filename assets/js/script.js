// G'use strict';

// Mobile navigation
const navbar = document.querySelector('[data-navbar]');
const navTogglers = document.querySelectorAll('[data-nav-toggler]');

navTogglers.forEach(button => {
  button.addEventListener('click', () => {
    navbar?.classList.toggle('active');
    button.classList.toggle('active');
  });
});

// Header scroll effect
const header = document.querySelector('[data-header]');

window.addEventListener('scroll', () => {
  header?.classList.toggle('active', window.scrollY > 100);
});amics JavaScript
