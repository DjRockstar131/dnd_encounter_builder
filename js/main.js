// js/main.js
// Entry point for the D&D Encounter Builder

console.log("D&D Encounter Builder loaded");

// Update footer year if present
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// Highlight active nav link
const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll("nav a").forEach((link) => {
  const href = link.getAttribute("href");

  if (href === currentPage || (href === "index.html" && currentPage === "")) {
    link.setAttribute("aria-current", "page");
  }
});
