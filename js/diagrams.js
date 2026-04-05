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
<svg viewBox="0 0 760 420" width="100%" role="img" aria-label="Innovation deadlock cycle">
  <defs>
    <marker id="arrowHead" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L10,5 L0,10 z" fill="#8a8a8a"></path>
    </marker>
    <marker id="arrowHeadTeal" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L10,5 L0,10 z" fill="${COLORS.teal}"></path>
    </marker>
  </defs>

  <g id="node1" opacity="0">
    <rect x="280" y="42" width="200" height="68" rx="8" fill="#D85A30" fill-opacity="0.18" stroke="#D85A30" />
    <text x="292" y="71" font-size="14" font-weight="500" fill="#1A1A1A">Uncertain demand</text>
    <text x="292" y="92" font-size="12" fill="#4A4A4A">No buyer commitment</text>
  </g>

  <g id="node2" opacity="0">
    <rect x="506" y="170" width="212" height="68" rx="8" fill="#EF9F27" fill-opacity="0.20" stroke="#EF9F27" />
    <text x="518" y="199" font-size="14" font-weight="500" fill="#1A1A1A">Delayed innovation</text>
    <text x="518" y="220" font-size="12" fill="#4A4A4A">Why invest without offtake?</text>
  </g>

  <g id="node3" opacity="0">
    <rect x="280" y="292" width="212" height="68" rx="8" fill="#C64533" fill-opacity="0.18" stroke="#C64533" />
    <text x="292" y="321" font-size="14" font-weight="500" fill="#1A1A1A">Underinvestment</text>
    <text x="292" y="342" font-size="12" fill="#4A4A4A">Capital arrives too late</text>
  </g>

  <path id="a12" d="M 470 104 C 550 120, 570 150, 580 170" stroke="#8a8a8a" stroke-width="2" fill="none" marker-end="url(#arrowHead)" opacity="0"/>
  <path id="a23" d="M 540 238 C 510 270, 470 292, 430 305" stroke="#8a8a8a" stroke-width="2" fill="none" marker-end="url(#arrowHead)" opacity="0"/>
  <path id="a31" d="M 312 290 C 250 230, 240 140, 290 100" stroke="#8a8a8a" stroke-width="2" fill="none" marker-end="url(#arrowHead)" opacity="0"/>
  <text id="cycleLabel" x="188" y="175" font-size="12" fill="#4A4A4A" opacity="0">Cycle reinforces</text>

  <g id="amcNode" opacity="0">
    <rect x="40" y="314" width="208" height="68" rx="8" fill="#1D9E75" fill-opacity="0.18" stroke="#1D9E75"/>
    <text x="52" y="343" font-size="14" font-weight="500" fill="#1A1A1A">AMC: credible demand signal</text>
    <text x="52" y="364" font-size="12" fill="#4A4A4A">Forward commitment to buy</text>
  </g>

  <path id="amcArrow" d="M 248 342 C 270 340, 290 334, 304 326" stroke="${COLORS.teal}" stroke-width="2.5" fill="none" marker-end="url(#arrowHeadTeal)" opacity="0"/>
  <text id="breakLoop" x="214" y="314" font-size="12" fill="${COLORS.teal}" opacity="0">Breaks the loop</text>

  <g id="earlyNode" opacity="0">
    <rect x="518" y="294" width="200" height="68" rx="8" fill="#1D9E75" fill-opacity="0.18" stroke="#1D9E75"/>
    <text x="530" y="323" font-size="14" font-weight="500" fill="#1A1A1A">Earlier investment</text>
    <text x="530" y="344" font-size="12" fill="#4A4A4A">Risk falls, capital moves</text>
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

    const showCycle = ["s2a", "s2b", "s2c", "s2d", "s3a", "s3b", "s3c"].includes(stepId);
    if (!showCycle) {
      Object.values(nodes).forEach((el) => setOpacity(el, 0));
      return;
    }

    setOpacity(nodes.node1, 1);
    setOpacity(nodes.node2, ["s2b", "s3a", "s3b", "s3c"].includes(stepId) ? 1 : 0);
    setOpacity(nodes.node3, ["s2b", "s3a", "s3b", "s3c"].includes(stepId) ? 1 : 0);

    const arrowDim = ["s3b", "s3c"].includes(stepId) ? 0.25 : 1;
    setOpacity(nodes.a12, ["s2b", "s3a", "s3b", "s3c"].includes(stepId) ? arrowDim : 0);
    setOpacity(nodes.a23, ["s2b", "s3a", "s3b", "s3c"].includes(stepId) ? arrowDim : 0);
    setOpacity(nodes.a31, ["s2b", "s3a", "s3b", "s3c"].includes(stepId) ? arrowDim : 0);
    setOpacity(nodes.cycleLabel, ["s2b", "s3a", "s3b", "s3c"].includes(stepId) ? 1 : 0);

    setOpacity(nodes.amcNode, ["s3b", "s3c"].includes(stepId) ? 1 : 0);
    setOpacity(nodes.amcArrow, ["s3b", "s3c"].includes(stepId) ? 1 : 0);
    setOpacity(nodes.breakLoop, ["s3b", "s3c"].includes(stepId) ? 1 : 0);
    setOpacity(nodes.earlyNode, stepId === "s3c" ? 1 : 0);
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

  window.AmcDiagrams = {
    setupDeadlock,
    updateDeadlockState,
    createFundingFlow,
    createStakeholderMatrix,
  };
})();
