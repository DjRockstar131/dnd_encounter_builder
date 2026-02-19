console.log("D&D Encounter Builder loaded");

const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// nav highlight
const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
document.querySelectorAll("nav a").forEach((a) => {
  const href = (a.getAttribute("href") || "").split("/").pop()?.toLowerCase();
  if (href === current) a.setAttribute("aria-current", "page");
});
