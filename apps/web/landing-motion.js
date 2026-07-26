import { animate, stagger } from "https://cdn.jsdelivr.net/npm/motion@11.13.5/+esm";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion) {
  // Keep proof and product content readable even while its entrance settles.
  animate("[data-reveal]", { y: [10, 0] }, {
    duration: 0.42,
    delay: stagger(0.1),
    easing: [0.22, 1, 0.36, 1]
  });

  const flowNodes = [...document.querySelectorAll("[data-flow-node]")];
  const runPath = async () => {
    for (const node of flowNodes) {
      await animate(node, { borderColor: ["#dde1e6", "#e30613", "#dde1e6"], y: [0, -2, 0] }, {
        duration: 0.52,
        easing: "ease-in-out"
      }).finished;
    }
  };
  window.setTimeout(() => { void runPath(); }, 700);
}
