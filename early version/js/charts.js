(function () {
  const COLORS = {
    teal: "#2E7D32",
    coral: "#8A6914",
    amber: "#B8860B",
    blue: "#378ADD",
    purple: "#7F77DD",
    gray: "#B9B9B9",
    grid: "#E0DDD4",
    text: "#4A4539",
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
    methaneWarming: null,
    phase: null,
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

    chartState.methaneWarming = new Chart(document.getElementById("methaneWarmingChart"), {
      type: "line",
      data: {
        labels: ["2024", "2026", "2028", "2030", "2032", "2034", "2036", "2038", "2040"],
        datasets: [
          {
            label: "Baseline (no intervention)",
            data: [0.19, 0.195, 0.20, 0.205, 0.21, 0.215, 0.22, 0.225, 0.23],
            borderColor: COLORS.gray,
            backgroundColor: "rgba(180,180,175,0.08)",
            borderWidth: 2.5,
            fill: false,
            pointRadius: 0,
            tension: 0.35,
          },
          {
            label: "With AMC intervention",
            data: [0.19, 0.193, 0.192, 0.186, 0.178, 0.168, 0.157, 0.146, 0.135],
            borderColor: COLORS.teal,
            backgroundColor: "rgba(46,125,50,0.08)",
            borderWidth: 2.5,
            fill: "-1",
            pointRadius: 0,
            tension: 0.35,
          },
        ],
      },
      options: {
        ...defaultOptions(),
        plugins: {
          legend: { display: true, position: "bottom", labels: { color: COLORS.text, usePointStyle: true, pointStyle: "line" } },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return ctx.dataset.label + ": " + ctx.parsed.y.toFixed(3) + " W/m2";
              }
            }
          }
        },
        scales: {
          x: { ...defaultOptions().scales.x, title: { display: true, text: "Year", color: COLORS.text } },
          y: { ...defaultOptions().scales.y, min: 0.12, max: 0.24, title: { display: true, text: "Livestock methane radiative forcing (W/m2)", color: COLORS.text } },
        },
      },
    });

    chartState.phase = new Chart(document.getElementById("phaseChart"), {
      type: "bar",
      data: {
        labels: ["R&D", "Scale-up", "Competition"],
        datasets: [
          {
            label: "Social benefit",
            data: [72, 68, 62],
            backgroundColor: "rgba(46,125,50,0.75)",
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: "Social cost",
            data: [28, 32, 38],
            backgroundColor: "rgba(185,185,185,0.85)",
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            type: "line",
            label: "AMC-funded component",
            data: [34, 20, 10],
            borderColor: COLORS.amber,
            backgroundColor: COLORS.amber,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 5,
            tension: 0.25,
            yAxisID: "y",
          },
        ],
      },
      options: {
        ...defaultOptions(),
        scales: {
          x: { ...defaultOptions().scales.x, title: { display: true, text: "Commercialization phase", color: COLORS.text } },
          y: { ...defaultOptions().scales.y, title: { display: true, text: "Relative index", color: COLORS.text }, beginAtZero: true },
        },
      },
    });
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
    if (bcr < 1) return "rgba(198,40,40,0.65)";
    if (bcr < 2) return "rgba(184,134,11,0.65)";
    return "rgba(46,125,50,0.68)";
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
    updateStudioCharts,
    applyStudioPreset,
    modelOutputs,
  };
})();
