(function () {
  const COLORS = {
    teal: "#1D9E75",
    coral: "#D85A30",
    amber: "#EF9F27",
    red: "#C64533",
    blue: "#378ADD",
    purple: "#7F77DD",
    line: "#E5E5E5",
  };

  function deadlockSvgMarkup() {
    return `
<svg viewBox="0 0 520 280" width="100%" role="img" aria-label="Innovation deadlock cycle">
  <defs>
    <marker id="arrowHead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L8,4 L0,8 z" fill="#8a8a8a"></path>
    </marker>
    <marker id="arrowHeadTeal" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L8,4 L0,8 z" fill="${COLORS.teal}"></path>
    </marker>
  </defs>

  <g id="node1" opacity="0">
    <rect x="20" y="20" width="190" height="52" rx="6" fill="#D85A30" fill-opacity="0.14" stroke="#D85A30" stroke-opacity="0.5" />
    <text x="30" y="42" font-size="11" font-weight="600" fill="#1A1A1A">Buyers</text>
    <text x="30" y="58" font-size="10" fill="#4A4A4A">"How can I buy what doesn't exist?"</text>
  </g>

  <g id="node2" opacity="0">
    <rect x="310" y="20" width="190" height="52" rx="6" fill="#EF9F27" fill-opacity="0.16" stroke="#EF9F27" stroke-opacity="0.5" />
    <text x="320" y="42" font-size="11" font-weight="600" fill="#1A1A1A">Innovators</text>
    <text x="320" y="58" font-size="10" fill="#4A4A4A">"Why build what no one is buying?"</text>
  </g>

  <g id="node3" opacity="0">
    <rect x="165" y="100" width="190" height="44" rx="6" fill="#C64533" fill-opacity="0.14" stroke="#C64533" stroke-opacity="0.5" />
    <text x="197" y="126" font-size="11" font-weight="600" fill="#1A1A1A">Underinvestment</text>
  </g>

  <path id="a12" d="M 210 46 L 308 46" stroke="#8a8a8a" stroke-width="1.5" fill="none" marker-end="url(#arrowHead)" opacity="0"/>
  <path id="a23" d="M 380 72 C 370 88, 350 100, 335 108" stroke="#8a8a8a" stroke-width="1.5" fill="none" marker-end="url(#arrowHead)" opacity="0"/>
  <path id="a31" d="M 185 100 C 160 88, 140 72, 130 66" stroke="#8a8a8a" stroke-width="1.5" fill="none" marker-end="url(#arrowHead)" opacity="0"/>
  <text id="cycleLabel" x="222" y="88" font-size="10" fill="#8a8a8a" opacity="0" text-anchor="middle">cycle reinforces</text>

  <g id="amcNode" opacity="0">
    <rect x="130" y="170" width="260" height="52" rx="6" fill="#1D9E75" fill-opacity="0.14" stroke="#1D9E75" stroke-opacity="0.6" />
    <text x="180" y="193" font-size="12" font-weight="600" fill="${COLORS.teal}">AMC: credible demand signal</text>
    <text x="186" y="210" font-size="10" fill="#4A4A4A">Forward commitment breaks the deadlock</text>
  </g>

  <path id="amcArrow" d="M 260 170 L 260 148" stroke="${COLORS.teal}" stroke-width="2" fill="none" marker-end="url(#arrowHeadTeal)" opacity="0"/>
  <text id="breakLoop" x="275" y="162" font-size="10" fill="${COLORS.teal}" opacity="0">disrupts</text>

  <g id="earlyNode" opacity="0">
    <rect x="130" y="236" width="260" height="36" rx="6" fill="#1D9E75" fill-opacity="0.08" stroke="${COLORS.teal}" stroke-opacity="0.3" />
    <text x="182" y="259" font-size="11" fill="${COLORS.teal}" font-weight="500">Risk falls, capital moves earlier</text>
  </g>
</svg>`;
  }

  function setOpacity(el, value) {
    if (el) el.style.opacity = String(value);
  }

  function setupDeadlock(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return null;
    root.innerHTML = deadlockSvgMarkup();
    const svg = root.querySelector("svg");
    return {
      node1: svg.getElementById("node1"),
      node2: svg.getElementById("node2"),
      node3: svg.getElementById("node3"),
      a12: svg.getElementById("a12"),
      a23: svg.getElementById("a23"),
      a31: svg.getElementById("a31"),
      cycleLabel: svg.getElementById("cycleLabel"),
      amcNode: svg.getElementById("amcNode"),
      amcArrow: svg.getElementById("amcArrow"),
      breakLoop: svg.getElementById("breakLoop"),
      earlyNode: svg.getElementById("earlyNode"),
    };
  }

  function updateDeadlockState(nodes, stepId) {
    if (!nodes) return;

    const showCycle = ["s2a", "s2b"].includes(stepId);
    if (!showCycle) {
      Object.values(nodes).forEach((el) => setOpacity(el, 0));
      return;
    }

    // s2a: show the three deadlock nodes + arrows (full cycle)
    // s2b: dim the cycle arrows, show AMC breaking in + earlier investment
    var isBreak = stepId === "s2b";

    setOpacity(nodes.node1, 1);
    setOpacity(nodes.node2, 1);
    setOpacity(nodes.node3, 1);

    var arrowDim = isBreak ? 0.2 : 1;
    setOpacity(nodes.a12, arrowDim);
    setOpacity(nodes.a23, arrowDim);
    setOpacity(nodes.a31, arrowDim);
    setOpacity(nodes.cycleLabel, isBreak ? 0 : 1);

    setOpacity(nodes.amcNode, isBreak ? 1 : 0);
    setOpacity(nodes.amcArrow, isBreak ? 1 : 0);
    setOpacity(nodes.breakLoop, isBreak ? 1 : 0);
    setOpacity(nodes.earlyNode, isBreak ? 1 : 0);
  }

  function createFundingFlow(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;
    root.innerHTML = `
<svg viewBox="0 0 860 360" width="100%" role="img" aria-label="Funding flow sources mechanisms outcomes">
  <g font-family="DM Sans, sans-serif" font-size="12" fill="#1A1A1A">
    <rect x="16" y="28" width="170" height="44" rx="8" fill="${COLORS.blue}" fill-opacity="0.18" stroke="${COLORS.blue}"/><text x="28" y="54">Corporates</text>
    <rect x="16" y="84" width="170" height="44" rx="8" fill="${COLORS.purple}" fill-opacity="0.18" stroke="${COLORS.purple}"/><text x="28" y="110">Philanthropy</text>
    <rect x="16" y="140" width="170" height="44" rx="8" fill="${COLORS.teal}" fill-opacity="0.18" stroke="${COLORS.teal}"/><text x="28" y="166">Governments</text>
    <rect x="16" y="196" width="170" height="44" rx="8" fill="${COLORS.coral}" fill-opacity="0.18" stroke="${COLORS.coral}"/><text x="28" y="222">Investors</text>

    <rect x="340" y="50" width="180" height="52" rx="8" fill="${COLORS.amber}" fill-opacity="0.2" stroke="${COLORS.amber}"/><text x="352" y="76">Offtake premium</text><text x="352" y="94" fill="#4A4A4A">Pay for low-CH4 beef</text>
    <rect x="340" y="126" width="180" height="52" rx="8" fill="${COLORS.amber}" fill-opacity="0.2" stroke="${COLORS.amber}"/><text x="352" y="152">Intervention subsidy</text><text x="352" y="170" fill="#4A4A4A">Per-dose support</text>
    <rect x="340" y="202" width="180" height="52" rx="8" fill="${COLORS.amber}" fill-opacity="0.2" stroke="${COLORS.amber}"/><text x="352" y="228">Carbon payments</text><text x="352" y="246" fill="#4A4A4A">Verified CO2e credits</text>

    <rect x="660" y="88" width="182" height="58" rx="8" fill="${COLORS.teal}" fill-opacity="0.18" stroke="${COLORS.teal}"/><text x="672" y="116">Producer adoption</text><text x="672" y="134" fill="#4A4A4A">Herd-level change</text>
    <rect x="660" y="176" width="182" height="58" rx="8" fill="${COLORS.teal}" fill-opacity="0.18" stroke="${COLORS.teal}"/><text x="672" y="204">Methane reduction</text><text x="672" y="222" fill="#4A4A4A">Measurable impact</text>
  </g>

  <g fill="none" stroke-linecap="round">
    <path d="M188 50 C 250 60, 280 58, 338 74" stroke="#378ADD" stroke-opacity="0.5" stroke-width="6"/>
    <path d="M188 104 C 250 110, 280 130, 338 150" stroke="#7F77DD" stroke-opacity="0.45" stroke-width="5"/>
    <path d="M188 160 C 250 168, 280 170, 338 176" stroke="#1D9E75" stroke-opacity="0.5" stroke-width="6"/>
    <path d="M188 216 C 250 220, 280 218, 338 228" stroke="#D85A30" stroke-opacity="0.35" stroke-width="4"/>

    <path d="M522 76 C 582 84, 606 94, 658 116" stroke="#EF9F27" stroke-opacity="0.5" stroke-width="7"/>
    <path d="M522 154 C 582 160, 606 170, 658 116" stroke="#EF9F27" stroke-opacity="0.45" stroke-width="6"/>
    <path d="M522 228 C 582 220, 606 214, 658 204" stroke="#EF9F27" stroke-opacity="0.5" stroke-width="7"/>
    <path d="M522 154 C 582 176, 606 194, 658 204" stroke="#EF9F27" stroke-opacity="0.35" stroke-width="4"/>
  </g>
</svg>`;
  }

  function dots(n, color) {
    return '<span class="role-dot" style="background:' + color + '"></span>'.repeat(n);
  }

  function createStakeholderMatrix(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const rows = [
      { cls: "role-row--coral", color: "#D85A30", name: "Innovators", cells: [[3, "Build"], [2, "Validate"], [1, "Compete"]] },
      { cls: "role-row--blue",  color: "#378ADD", name: "Corporates", cells: [[1, "Signal"], [2, "Commit"], [3, "Absorb"]] },
      { cls: "role-row--purple", color: "#7F77DD", name: "Philanthropy", cells: [[3, "Catalyze"], [2, "Bridge"], [1, "Exit"]] },
      { cls: "role-row--teal",  color: "#1D9E75", name: "Governments", cells: [[2, "Fund R&D"], [2, "Policy"], [3, "Enable"]] },
    ];

    const tbody = rows.map((r) => {
      const tds = r.cells.map((c) => `<td>${dots(c[0], r.color)} ${c[1]}</td>`).join("");
      return `<tr class="role-row ${r.cls}"><th style="color:${r.color}">${r.name}</th>${tds}</tr>`;
    }).join("\n    ");

    root.innerHTML = `
<table class="role-table" aria-label="Stakeholder contribution matrix">
  <thead>
    <tr><th>Stakeholder</th><th>R&amp;D</th><th>Scale-up</th><th>Competition</th></tr>
  </thead>
  <tbody>
    ${tbody}
  </tbody>
</table>`;
  }

  function createAmcPathway(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;

    const steps = [
      { id: "pw1", label: "Market failure", sub: "No buyer, no builder", color: COLORS.coral, icon: "!" },
      { id: "pw2", label: "AMC commitment", sub: "Credible demand signal", color: COLORS.teal, icon: "\u2713" },
      { id: "pw3", label: "R&D investment", sub: "Capital moves earlier", color: COLORS.blue, icon: "$" },
      { id: "pw4", label: "Innovation", sub: "Vaccines, additives, genetics", color: COLORS.purple, icon: "\u2606" },
      { id: "pw5", label: "Producer adoption", sub: "Herd-level deployment", color: COLORS.amber, icon: "\u2191" },
      { id: "pw6", label: "Methane reduction", sub: "Measurable climate impact", color: COLORS.teal, icon: "\u2193" },
    ];

    const html = `
      <div class="pw-track">
        ${steps.map((s, i) => `
          <div class="pw-node" id="${s.id}" data-index="${i}">
            <div class="pw-icon" style="border-color:${s.color};color:${s.color}">${s.icon}</div>
            <div class="pw-text">
              <span class="pw-label">${s.label}</span>
              <span class="pw-sub">${s.sub}</span>
            </div>
          </div>
          ${i < steps.length - 1 ? `<div class="pw-connector" data-after="${i}"><div class="pw-connector-fill"></div></div>` : ""}
        `).join("")}
      </div>`;

    root.innerHTML = html;
  }

  function updateAmcPathway(stepId) {
    const flow = document.getElementById("amcPathwayFlow");
    if (!flow) return;

    var phase = 0;
    if (stepId === "s3a") phase = 3;
    if (stepId === "s3b") phase = 6;

    flow.querySelectorAll(".pw-node").forEach(function (node) {
      var idx = parseInt(node.dataset.index, 10);
      node.classList.toggle("pw-active", idx < phase);
    });

    flow.querySelectorAll(".pw-connector").forEach(function (conn) {
      var idx = parseInt(conn.dataset.after, 10);
      conn.classList.toggle("pw-active", idx < phase - 1);
    });
  }


  function createEmissionsFunnel(containerId) {
    var root = document.getElementById(containerId);
    if (!root) return;
    var ROWS = [
      { label: "Global GHG emissions", pct: "100%", w: 440, x: 20, color: "rgba(198,40,40,0.12)" },
      { label: "Human methane", pct: "~16%", w: 370, x: 55, color: "rgba(198,40,40,0.18)" },
      { label: "Agricultural methane", pct: "~40% of human CH\u2084", w: 300, x: 90, color: "rgba(184,134,11,0.16)" },
      { label: "Enteric fermentation", pct: "~70%", w: 230, x: 125, color: "rgba(46,125,50,0.14)" },
      { label: "Cattle", pct: "75%", w: 160, x: 160, color: "rgba(46,125,50,0.25)", accent: true }
    ];
    var rects = ROWS.map(function(r, i) {
      var y = 10 + i * 54;
      var stroke = r.accent ? ' stroke="#2E7D32" stroke-width="2"' : '';
      var fw = r.accent ? 700 : 600;
      var fill = r.accent ? '#2E7D32' : '#1B2A1C';
      var pfill = r.accent ? '#2E7D32' : '#8A7D6B';
      return '<g class="funnel-row" style="opacity:0;transform:translateY(8px)">' +
        '<rect x="' + r.x + '" y="' + y + '" width="' + r.w + '" height="42" rx="4" fill="' + r.color + '"' + stroke + ' />' +
        '<text x="' + (r.x + 10) + '" y="' + (y + 26) + '" font-size="13" font-weight="' + fw + '" fill="' + fill + '">' + r.label + '</text>' +
        '<text x="' + (r.x + r.w - 10) + '" y="' + (y + 26) + '" font-size="12" fill="' + pfill + '" text-anchor="end">' + r.pct + '</text>' +
        '</g>';
    }).join("\n");
    root.innerHTML = '<svg viewBox="0 0 480 296" width="100%" role="img" aria-label="Emissions narrowing funnel from global GHGs to cattle">' +
      rects +
      '<text x="240" y="288" font-size="11" fill="#8A7D6B" text-anchor="middle" font-style="italic">AMC intervention target &#x2191;</text>' +
      '</svg>';
  }

  function animateFunnel() {
    var rows = document.querySelectorAll('#emissionsFunnel .funnel-row');
    rows.forEach(function(r, i) {
      setTimeout(function() {
        r.style.transition = 'opacity 500ms ease, transform 500ms ease';
        r.style.opacity = '1';
        r.style.transform = 'translateY(0)';
      }, i * 180);
    });
  }
  window.AmcDiagrams = {
    setupDeadlock,
    updateDeadlockState,
    createFundingFlow,
    createStakeholderMatrix,
    createAmcPathway,
    updateAmcPathway,
  };
})();
