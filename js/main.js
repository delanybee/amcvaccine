(function () {
  function animateCountUp(target, toValue, suffix) {
    let start = null;
    const duration = 900;
    function tick(ts) {
      if (start == null) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const val = Math.round(t * toValue);
      target.textContent = `${val}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function activateScene(scrolly, sceneId) {
    scrolly.querySelectorAll(".visual-scene").forEach((s) => s.classList.toggle("active", s.id === sceneId));
  }

  function activateStep(stepEl) {
    const scrolly = stepEl.closest(".scrolly");
    scrolly.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
    stepEl.classList.add("active");
  }

  function updateStudioLabels() {
    document.getElementById("studioEtaValue").textContent = Number(document.getElementById("studioEta").value).toFixed(2);
    document.getElementById("studioAdoptionValue").textContent = `${document.getElementById("studioAdoption").value}%`;
    document.getElementById("studioSocialValue").textContent = `$${document.getElementById("studioSocial").value}`;
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
    const deadlockAmc = window.AmcDiagrams.setupDeadlock("deadlockDiagramAmc");

    const scroller = scrollama();
    scroller
      .setup({ step: ".step", offset: 0.58, progress: false })
      .onStepEnter((res) => {
        const stepEl = res.element;
        const stepId = stepEl.dataset.stepId;
        const sceneId = stepEl.dataset.scene;
        const scrolly = stepEl.closest(".scrolly");

        console.log("Scroll step", stepId);
        activateStep(stepEl);
        activateScene(scrolly, sceneId);

        if (stepId === "s1") {
          const methane = document.getElementById("methanePower");
          const card = document.querySelector("#scene1 .methane-card");
          animateCountUp(methane, 84, "x");
          card.classList.add("enter");
        }

        if (["s2a", "s2b", "s2c", "s2d"].includes(stepId)) {
          window.AmcDiagrams.updateDeadlockState(deadlockBase, stepId);
        }

        if (["s3a", "s3b", "s3c"].includes(stepId)) {
          window.AmcDiagrams.updateDeadlockState(deadlockAmc, stepId);
          const chartWrap = document.getElementById("feasibilityChart").closest(".canvas-wrap");
          chartWrap.style.opacity = stepId === "s3c" ? "1" : "0.35";
          chartWrap.style.transition = "opacity 600ms ease";
        }

        if (stepId === "s4") {
          document.getElementById("phaseTextCards").classList.add("enter");
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

  function initStudio() {
    const controls = ["dosingScenario", "studioEta", "studioAdoption", "studioSocial"];
    controls.forEach((id) => {
      document.getElementById(id).addEventListener("input", () => {
        updateStudioLabels();
        window.AmcCharts.updateStudioCharts();
      });
    });

    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.AmcCharts.applyStudioPreset(btn.dataset.preset);
        updateStudioLabels();
        window.AmcCharts.updateStudioCharts();
      });
    });

    updateStudioLabels();
  }

  function initLenis() {
    if (typeof Lenis === "undefined") return;
    const lenis = new Lenis({ smoothWheel: true, lerp: 0.09 });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  function initAboutModal() {
    const modal = document.getElementById("aboutModal");
    const openBtn = document.getElementById("aboutStoryBtn");
    const closeBtn = document.getElementById("aboutCloseBtn");
    if (!modal || !openBtn || !closeBtn) return;

    function openModal() {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      openBtn.focus();
    }

    openBtn.addEventListener("click", openModal);
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

  function init() {
    buildPathwayCards();
    window.AmcDiagrams.createFundingFlow("fundingFlowDiagram");
    window.AmcDiagrams.createStakeholderMatrix("stakeholderMatrix");

    window.AmcCharts.initSectionCharts();
    window.AmcCharts.initStudioCharts();

    initChapterAdoption();
    initStudio();
    initScroll();
    initLenis();
    initAboutModal();

    const firstStep = document.querySelector(".step");
    if (firstStep) {
      firstStep.classList.add("active");
      animateCountUp(document.getElementById("methanePower"), 84, "x");
      document.querySelector("#scene1 .methane-card").classList.add("enter");
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
