(function () {
  function animateCountUp(target, toValue, suffix, prefix) {
    let start = null;
    const duration = 900;
    const pre = prefix || "";
    function tick(ts) {
      if (start == null) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const val = Math.round(t * toValue);
      target.textContent = `${pre}${val}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function activateScene(scrolly, sceneId) {
    scrolly.querySelectorAll(".visual-scene").forEach((s) => s.classList.toggle("is-visible", s.id === sceneId));
  }

  function activateStep(stepEl) {
    document.querySelectorAll(".step.is-active").forEach((s) => s.classList.remove("is-active"));
    stepEl.classList.add("is-active");
  }

  function buildPathwayCards() {
    const data = [
      {
        title: "Vaccines",
        subtitle: "Low-touch, high-scale potential",
        values: { scalability: 85, timeline: 35, cost: 70, regulation: 40 },
      },
      {
        title: "Breeding / genetics",
        subtitle: "Durable gains, slow progress",
        values: { scalability: 55, timeline: 25, cost: 80, regulation: 70 },
      },
      {
        title: "Feed additives / bolus",
        subtitle: "Proven reductions, delivery friction",
        values: { scalability: 45, timeline: 80, cost: 45, regulation: 55 },
      },
    ];

    const rows = [
      { key: "scalability", label: "Scalability", color: "teal" },
      { key: "timeline", label: "Timeline certainty", color: "blue" },
      { key: "cost", label: "Cost efficiency", color: "amber" },
      { key: "regulation", label: "Regulatory readiness", color: "purple" },
    ];

    const host = document.getElementById("pathwayGrid");
    host.innerHTML = data.map((card) => {
      const bars = rows.map((r) => `
        <div class="bar-row">
          <label><span>${r.label}</span><span>${card.values[r.key]}%</span></label>
          <div class="track"><div class="fill ${r.color}" style="--target:${card.values[r.key]}%"></div></div>
        </div>
      `).join("");

      return `
        <article class="pathway-card">
          <h5>${card.title}</h5>
          <p class="pathway-sub">${card.subtitle}</p>
          ${bars}
        </article>
      `;
    }).join("");
  }

  function revealRoleRows() {
    const rows = document.querySelectorAll("#stakeholderMatrix .role-row");
    rows.forEach((r, idx) => {
      setTimeout(() => r.classList.add("visible"), idx * 200);
    });
  }

  function initScroll() {
    const deadlockBase = window.AmcDiagrams.setupDeadlock("deadlockDiagramBase");
    window.AmcDiagrams.createAmcPathway("amcPathwayFlow");
    window.AmcDiagrams.createEmissionsFunnel("emissionsFunnel");

    const scroller = scrollama();
    scroller
      .setup({ step: ".step", offset: 0.5, threshold: 4, debug: false })
      .onStepEnter((res) => {
        const stepEl = res.element;
        const stepId = stepEl.dataset.stepId;
        const sceneId = stepEl.dataset.scene;
        const scrolly = stepEl.closest(".scrolly");

        console.log("Scroll step", stepId);
        activateStep(stepEl);
        activateScene(scrolly, sceneId);

        if (stepId === "s0") {
          window.AmcDiagrams.animateFunnel();
        }

        if (stepId === "s1") {
          const methane = document.getElementById("methanePower");
          const socialCost = document.getElementById("socialCostStat");
          const card = document.querySelector("#scene1 .methane-card");
          animateCountUp(methane, 84, "x");
          animateCountUp(socialCost, 10, "B", "$");
          card.classList.add("enter");
        }

        if (["s2a", "s2b"].includes(stepId)) {
          window.AmcDiagrams.updateDeadlockState(deadlockBase, stepId);
        }

        if (["s3a", "s3b", "s3c"].includes(stepId)) {
          window.AmcDiagrams.updateAmcPathway(stepId);
          const chartWrap = document.getElementById("methaneWarmingChart").closest(".canvas-wrap");
          chartWrap.style.opacity = stepId === "s3c" ? "1" : "0.35";
          chartWrap.style.transition = "opacity 600ms ease";
        }

        if (stepId === "s5") {
          document.getElementById("pathwayGrid").classList.add("enter");
        }

        if (stepId === "s8") {
          revealRoleRows();
        }

        if (stepId === "s9") {
          document.getElementById("confidenceStack").classList.add("enter");
          document.getElementById("ctaCard").classList.add("enter");
        }
      });

    window.addEventListener("resize", () => scroller.resize());
  }

  function initChapterAdoption() {
    const slider = document.getElementById("chapterAdoption");
    const val = document.getElementById("chapterAdoptionValue");
    const callout = document.getElementById("chapterBcrCallout");

    function refresh() {
      const adoptionPct = Number(slider.value);
      val.textContent = `${adoptionPct}%`;
      window.AmcCharts.updateChapterAdoption(adoptionPct);
      const out = window.AmcCharts.modelOutputs({ eta: 0.9, adoptionPct, socialValue: 30, dosing: "baseline" });
      callout.textContent = `Benefit-cost ratio at ${adoptionPct}% adoption: ${out.bcr.toFixed(2)}`;
    }

    slider.addEventListener("input", refresh);
    refresh();
  }

  /* Lenis removed -- it conflicts with Scrollama and CSS scroll-snap */

  function initAboutModal() {
    const modal = document.getElementById("aboutModal");
    const navOpenBtn = document.getElementById("navAboutBtn");
    const bottomOpenBtn = document.getElementById("bottomAboutBtn");
    const closeBtn = document.getElementById("aboutCloseBtn");
    if (!modal || !closeBtn) return;

    function openModal() {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (navOpenBtn) navOpenBtn.focus();
    }

    if (navOpenBtn) navOpenBtn.addEventListener("click", openModal);
    if (bottomOpenBtn) bottomOpenBtn.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target && event.target.dataset.closeModal === "true") {
        closeModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  function updateProgress() {
    const bar = document.getElementById("progressBar");
    if (!bar) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
    bar.style.width = pct + "%";
  }

  function initClickToNavigate() {
    document.querySelectorAll(".step").forEach((step) => {
      step.addEventListener("click", () => {
        step.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      step.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          step.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
  }

  function initProgress() {
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  function init() {
    buildPathwayCards();
    window.AmcDiagrams.createFundingFlow("fundingFlowDiagram");
    window.AmcDiagrams.createStakeholderMatrix("stakeholderMatrix");

    window.AmcCharts.initSectionCharts();

    initChapterAdoption();
    initScroll();
    initClickToNavigate();
    initProgress();
    initAboutModal();

    const firstStep = document.querySelector(".step");
    if (firstStep) {
      firstStep.classList.add("is-active");
      window.AmcDiagrams.animateFunnel();
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
