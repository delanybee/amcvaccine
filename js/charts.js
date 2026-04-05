(function () {
  const COLORS = {
    teal: "#1D9E75",
    coral: "#D85A30",
    amber: "#EF9F27",
    blue: "#378ADD",
    purple: "#7F77DD",
    gray: "#B9B9B9",
    grid: "#E5E5E5",
    text: "#4A4A4A",
  };

  const MODEL = {
    theta: 2 / 3,
    k: 15,
    baseEta: 0.9,
    baseAdoption: 0.5,
    baseSocial: 30,
    baseBenefitsB: 11.4842,
    herdSize: 50_000_000,
    dosing: {
      baseline: { amcM: 534.2, nonAmcB: 0.2628 },
      annual: { amcM: 620, nonAmcB: 0.34 },
      booster: { amcM: 690, nonAmcB: 0.39 },
    },
  };

  const chartState = {
    lifespan: null,
    feasibility: null,
    phase: null,
    adoptionLine: null,
    radar: null,
    studioTornado: null,
    studioSurface: null,
    studioAdoption: null,
    chapterMarkerX: 50,
    studioMarkerX: 50,
  };

  function requiredFirmSuccess(eta) {
    if (eta <= MODEL.theta) return null;
    return 1 - Math.pow(1 - MODEL.theta / eta, 1 / MODEL.k);
  }

  function modelOutputs({ eta, adoptionPct, socialValue, dosing }) {
    const d = MODEL.dosing[dosing];
    const pEta = requiredFirmSuccess(eta);
    const pBase = requiredFirmSuccess(MODEL.baseEta);
    const adjustedAmcM = pEta === null ? d.amcM : d.amcM * (pEta / pBase);
    const benefitsB = MODEL.baseBenefitsB * ((adoptionPct / 100) / MODEL.baseAdoption) * (socialValue / MODEL.baseSocial);
    const totalCostB = adjustedAmcM / 1000 + d.nonAmcB;
    const bcr = benefitsB / totalCostB;
    const npvB = benefitsB - totalCostB;
    const costPerAnimalYear = (totalCostB * 1_000_000_000) / (MODEL.herdSize * Math.max(adoptionPct / 100, 0.01));
    return { adjustedAmcM, benefitsB, totalCostB, bcr, npvB, costPerAnimalYear };
  }

  const verticalMarkerPlugin = {
    id: "verticalMarker",
    afterDraw(chart, args, options) {
      if (options == null || options.xValue == null) return;
      const xScale = chart.scales.x;
      const yScale = chart.scales.y;
      if (!xScale || !yScale) return;
      const x = xScale.getPixelForValue(options.xValue);
      const ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = options.color || COLORS.coral;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x, yScale.top);
      ctx.lineTo(x, yScale.bottom);
      ctx.stroke();
      ctx.restore();
    },
  };

  function defaultOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: "easeOutCubic" },
      plugins: { legend: { labels: { color: COLORS.text } } },
      scales: {
        x: { ticks: { color: COLORS.text }, grid: { color: COLORS.grid } },
        y: { ticks: { color: COLORS.text }, grid: { color: COLORS.grid } },
      },
    };
  }

  function initSectionCharts() {
    chartState.lifespan = new Chart(document.getElementById("lifespanChart"), {
      type: "bar",
      data: {
        labels: ["Methane", "CO2"],
        datasets: [{
          data: [10, 600],
          backgroundColor: [COLORS.coral, COLORS.gray],
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        ...defaultOptions(),
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { ...defaultOptions().scales.x, title: { display: true, text: "Atmospheric lifespan (years)", color: COLORS.text } },
          y: { ...defaultOptions().scales.y },
        },
      },
    });

    chartState.feasibility = new Chart(document.getElementById("feasibilityChart"), {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Illustrative projects",
            data: [
              { x: 72, y: 46 },
              { x: 78, y: 41 },
              { x: 84, y: 36 },
              { x: 90, y: 31 },
              { x: 95, y: 27 },
            ],
            backgroundColor: COLORS.teal,
            pointRadius: 5,
          },
          {
            type: "line",
            label: "Threshold trend",
            data: [
              { x: 70, y: 48 },
              { x: 95, y: 26 },
            ],
            borderColor: COLORS.amber,
            borderDash: [6, 4],
            borderWidth: 2,
            pointRadius: 0,
          },
        ],
      },
      options: {
        ...defaultOptions(),
        plugins: { legend: { display: true, position: "bottom", labels: { color: COLORS.text } } },
        scales: {
          x: { ...defaultOptions().scales.x, min: 68, max: 96, title: { display: true, text: "Scientific feasibility (%)", color: COLORS.text } },
          y: { ...defaultOptions().scales.y, min: 24, max: 50, title: { display: true, text: "Required firm-level success (%)", color: COLORS.text } },
        },
      },
    });

    chartState.phase = new Chart(document.getElementById("phaseChart"), {
      type: "bar",
      data: {
        labels: ["R&D", "Scale-up", "Competition"],
        datasets: [
          { label: "Social benefit", data: [72, 68, 62], backgroundColor: COLORS.teal },
          { label: "Social cost", data: [28, 32, 38], backgroundColor: COLORS.gray },
          { label: "AMC-funded component", data: [34, 20, 10], backgroundColor: COLORS.amber },
        ],
      },
      options: {
        ...defaultOptions(),
        indexAxis: "y",
        scales: {
          x: { ...defaultOptions().scales.x, stacked: true },
          y: { ...defaultOptions().scales.y, stacked: true },
        },
      },
    });

    chartState.adoptionLine = new Chart(document.getElementById("adoptionLineChart"), {
      type: "line",
      data: {
        labels: Array.from({ length: 17 }, (_, i) => 10 + i * 5),
        datasets: [
          {
            label: "BCR",
            data: [],
            borderColor: COLORS.teal,
            backgroundColor: "rgba(29,158,117,0.15)",
            fill: true,
            tension: 0.25,
            pointRadius: 0,
          },
          {
            label: "Breakeven",
            data: Array.from({ length: 17 }, () => 1),
            borderColor: COLORS.amber,
            borderDash: [6, 4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        ...defaultOptions(),
        plugins: {
          legend: { display: false },
          verticalMarker: { xValue: 50, color: COLORS.coral },
        },
        scales: {
          x: { ...defaultOptions().scales.x, title: { display: true, text: "Adoption rate (%)", color: COLORS.text } },
          y: { ...defaultOptions().scales.y, title: { display: true, text: "BCR", color: COLORS.text }, min: 0, suggestedMax: 6 },
        },
      },
      plugins: [verticalMarkerPlugin],
    });

    chartState.radar = new Chart(document.getElementById("feasibilityRadar"), {
      type: "radar",
      data: {
        labels: ["Feasibility", "Cost", "Adoption", "Policy", "Scale"],
        datasets: [
          {
            label: "Optimistic",
            data: [80, 72, 78, 62, 76],
            borderColor: COLORS.teal,
            backgroundColor: "rgba(29,158,117,0.18)",
          },
          {
            label: "Baseline",
            data: [66, 58, 61, 54, 60],
            borderColor: COLORS.blue,
            backgroundColor: "rgba(55,138,221,0.16)",
          },
          {
            label: "Conservative",
            data: [52, 46, 44, 49, 43],
            borderColor: COLORS.coral,
            backgroundColor: "rgba(216,90,48,0.16)",
          },
        ],
      },
      options: {
        ...defaultOptions(),
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { color: COLORS.text, backdropColor: "transparent" },
            pointLabels: { color: COLORS.text },
            grid: { color: COLORS.grid },
            angleLines: { color: COLORS.grid },
          },
        },
      },
    });

    updateChapterAdoption(50);
  }

  function updateChapterAdoption(adoptionPct) {
    chartState.chapterMarkerX = adoptionPct;
    const labels = chartState.adoptionLine.data.labels;
    const data = labels.map((adopt) => modelOutputs({ eta: 0.9, adoptionPct: adopt, socialValue: 30, dosing: "baseline" }).bcr);
    chartState.adoptionLine.data.datasets[0].data = data;
    chartState.adoptionLine.options.plugins.verticalMarker.xValue = adoptionPct;
    chartState.adoptionLine.update();
  }

  function getStudioStateFromDom() {
    return {
      dosing: document.getElementById("dosingScenario").value,
      eta: Number(document.getElementById("studioEta").value),
      adoptionPct: Number(document.getElementById("studioAdoption").value),
      socialValue: Number(document.getElementById("studioSocial").value),
    };
  }

  function initStudioCharts() {
    chartState.studioTornado = new Chart(document.getElementById("studioTornado"), {
      type: "bar",
      data: {
        labels: ["Eta", "Adoption", "Social value"],
        datasets: [{
          label: "Delta BCR",
          data: [0, 0, 0],
          backgroundColor: [COLORS.purple, COLORS.teal, COLORS.amber],
          borderRadius: 6,
        }],
      },
      options: {
        ...defaultOptions(),
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { ...defaultOptions().scales.x, min: -3, max: 3, title: { display: true, text: "Delta BCR from baseline", color: COLORS.text } },
          y: { ...defaultOptions().scales.y },
        },
      },
    });

    chartState.studioSurface = new Chart(document.getElementById("studioSurface"), {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "BCR field",
            data: [],
            pointRadius: 4,
            pointBackgroundColor: [],
            pointBorderWidth: 0,
            showLine: false,
          },
          {
            type: "line",
            label: "BCR = 1 contour",
            data: [],
            borderColor: COLORS.coral,
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0,
            tension: 0,
          },
        ],
      },
      options: {
        ...defaultOptions(),
        plugins: { legend: { position: "bottom", labels: { color: COLORS.text } } },
        scales: {
          x: { ...defaultOptions().scales.x, min: 10, max: 90, title: { display: true, text: "Adoption rate (%)", color: COLORS.text } },
          y: { ...defaultOptions().scales.y, min: 15, max: 50, title: { display: true, text: "Social value ($)", color: COLORS.text } },
        },
      },
    });

    chartState.studioAdoption = new Chart(document.getElementById("studioAdoptionLines"), {
      type: "line",
      data: {
        labels: Array.from({ length: 17 }, (_, i) => 10 + i * 5),
        datasets: [
          { label: "Baseline/infrequent", data: [], borderColor: COLORS.teal, pointRadius: 0, tension: 0.25 },
          { label: "Annual", data: [], borderColor: COLORS.blue, pointRadius: 0, tension: 0.25 },
          { label: "Prime + booster", data: [], borderColor: COLORS.purple, pointRadius: 0, tension: 0.25 },
          { label: "Breakeven", data: Array.from({ length: 17 }, () => 1), borderColor: COLORS.amber, borderDash: [6, 4], pointRadius: 0 },
        ],
      },
      options: {
        ...defaultOptions(),
        plugins: {
          legend: { position: "bottom", labels: { color: COLORS.text } },
          verticalMarker: { xValue: 50, color: COLORS.coral },
        },
        scales: {
          x: { ...defaultOptions().scales.x, title: { display: true, text: "Adoption rate (%)", color: COLORS.text } },
          y: { ...defaultOptions().scales.y, title: { display: true, text: "BCR", color: COLORS.text }, min: 0, suggestedMax: 6 },
        },
      },
      plugins: [verticalMarkerPlugin],
    });

    updateStudioCharts();
  }

  function colorFromBcr(bcr) {
    if (bcr < 1) return "rgba(216,90,48,0.65)";
    if (bcr < 2) return "rgba(239,159,39,0.65)";
    return "rgba(29,158,117,0.68)";
  }

  function updateStudioCharts() {
    const state = getStudioStateFromDom();
    const base = modelOutputs(state);

    const etaLow = modelOutputs({ ...state, eta: 0.5 }).bcr - base.bcr;
    const etaHigh = modelOutputs({ ...state, eta: 1.0 }).bcr - base.bcr;
    const adoptionLow = modelOutputs({ ...state, adoptionPct: 10 }).bcr - base.bcr;
    const adoptionHigh = modelOutputs({ ...state, adoptionPct: 90 }).bcr - base.bcr;
    const socialLow = modelOutputs({ ...state, socialValue: 15 }).bcr - base.bcr;
    const socialHigh = modelOutputs({ ...state, socialValue: 50 }).bcr - base.bcr;
    chartState.studioTornado.data.datasets[0].data = [
      (etaLow + etaHigh) / 2,
      (adoptionLow + adoptionHigh) / 2,
      (socialLow + socialHigh) / 2,
    ];
    chartState.studioTornado.update();

    const fieldPoints = [];
    const fieldColors = [];
    for (let a = 10; a <= 90; a += 5) {
      for (let s = 15; s <= 50; s += 2.5) {
        const out = modelOutputs({ ...state, adoptionPct: a, socialValue: s });
        fieldPoints.push({ x: a, y: s });
        fieldColors.push(colorFromBcr(out.bcr));
      }
    }
    chartState.studioSurface.data.datasets[0].data = fieldPoints;
    chartState.studioSurface.data.datasets[0].pointBackgroundColor = fieldColors;

    const contour = [];
    for (let a = 10; a <= 90; a += 5) {
      const testOut = modelOutputs({ ...state, adoptionPct: a, socialValue: state.socialValue });
      const scaleNeeded = 1 / Math.max(testOut.bcr, 0.05);
      const neededSocial = Math.max(15, Math.min(50, state.socialValue * scaleNeeded));
      contour.push({ x: a, y: Number(neededSocial.toFixed(2)) });
    }
    chartState.studioSurface.data.datasets[1].data = contour;
    chartState.studioSurface.update();

    const labels = chartState.studioAdoption.data.labels;
    chartState.studioAdoption.data.datasets[0].data = labels.map((a) => modelOutputs({ ...state, dosing: "baseline", adoptionPct: a }).bcr);
    chartState.studioAdoption.data.datasets[1].data = labels.map((a) => modelOutputs({ ...state, dosing: "annual", adoptionPct: a }).bcr);
    chartState.studioAdoption.data.datasets[2].data = labels.map((a) => modelOutputs({ ...state, dosing: "booster", adoptionPct: a }).bcr);
    chartState.studioAdoption.options.plugins.verticalMarker.xValue = state.adoptionPct;
    chartState.studioAdoption.update();

    document.getElementById("metricBcr").textContent = base.bcr.toFixed(2);
    document.getElementById("metricNpv").textContent = `$${base.npvB.toFixed(2)}B`;
    document.getElementById("metricCost").textContent = `$${base.costPerAnimalYear.toFixed(2)}`;
  }

  function applyStudioPreset(preset) {
    const presets = {
      baseline: { dosing: "baseline", eta: 0.9, adoption: 50, social: 30 },
      cost: { dosing: "annual", eta: 0.85, adoption: 55, social: 24 },
      adoption: { dosing: "baseline", eta: 0.9, adoption: 30, social: 30 },
      science: { dosing: "booster", eta: 0.65, adoption: 45, social: 33 },
    };
    const p = presets[preset] || presets.baseline;
    document.getElementById("dosingScenario").value = p.dosing;
    document.getElementById("studioEta").value = p.eta;
    document.getElementById("studioAdoption").value = p.adoption;
    document.getElementById("studioSocial").value = p.social;
  }

  window.AmcCharts = {
    initSectionCharts,
    initStudioCharts,
    updateChapterAdoption,
    updateStudioCharts,
    applyStudioPreset,
    modelOutputs,
  };
})();
