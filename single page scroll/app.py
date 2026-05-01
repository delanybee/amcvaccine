import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st


# -------------------------------
# Page setup and global constants
# -------------------------------
st.set_page_config(
    page_title="AMC Vaccine Scenario Dashboard",
    page_icon="AMC",
    layout="wide",
)

st.markdown(
    """
    <style>
    .block-container {
        padding-top: 1.4rem;
        padding-bottom: 1.2rem;
    }
    .badge {
        display: inline-block;
        padding: 0.25rem 0.6rem;
        margin-right: 0.4rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 600;
        border: 1px solid #d7dce2;
        background: #f4f7fa;
        color: #1f2937;
    }
    .doc {
        background: #e8f1fb;
        border-color: #9ec5eb;
    }
    .stress {
        background: #fff4e5;
        border-color: #f0b36f;
    }
    .exploratory {
        background: #eef8ef;
        border-color: #9fd7a4;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Inputs directly taken from the source document / reviewer comments.
DOC_INPUTS = {
    "baseline_amc_m": 534.2,
    "baseline_bcr": 14.41,
    "baseline_npv_b": 10.95,
    "baseline_benefits_b": 11.4842,
    "baseline_total_social_cost_b": 0.797,
    "baseline_non_amc_cost_b": 0.2628,
    "annual_amc_m": 832.3,
    "annual_bcr": 7.21,
    "annual_total_social_cost_b": 1.593,
    "annual_non_amc_cost_b": 0.7607,
    "theta": 2 / 3,
    "k": 15,
    "baseline_eta": 0.90,
    "baseline_adoption": 0.50,
    "social_value_low": 22.0,
    "social_value_high": 38.0,
    "baseline_social_value": 30.0,
}

# Dosing scenarios. Prime + booster is intentionally flagged as a stress-test approximation.
DOSING_SCENARIOS = {
    "Baseline / infrequent": {
        "amc_m": 534.2,
        "non_amc_cost_b": 0.2628,
        "label": "Document-derived baseline scenario",
        "is_stress_test": False,
    },
    "Annual": {
        "amc_m": 832.3,
        "non_amc_cost_b": 0.7607,
        "label": "Document-derived annual dosing scenario",
        "is_stress_test": False,
    },
    "Prime + booster": {
        "amc_m": 1068.4,
        "non_amc_cost_b": 0.5256,
        "label": "Stress-test linear approximation (not sponsor estimate)",
        "is_stress_test": True,
    },
}


def required_firm_success_probability(eta: float, theta: float, k: int) -> float | None:
    """Compute p = 1 - (1 - theta/eta)^(1/k), only valid when eta > theta."""
    if eta <= theta:
        return None
    return 1 - (1 - theta / eta) ** (1 / k)


def compute_model_outputs(
    scenario_name: str,
    eta: float,
    adoption_rate: float,
    social_value: float,
    apply_eta_proxy: bool,
) -> dict:
    """Compute AMC-adjusted economics using the user-selected scenario and assumptions."""
    scenario = DOSING_SCENARIOS[scenario_name]
    base_amc_m = scenario["amc_m"]
    non_amc_cost_b = scenario["non_amc_cost_b"]

    theta = DOC_INPUTS["theta"]
    k = DOC_INPUTS["k"]

    p_eta = required_firm_success_probability(eta, theta, k)
    p_baseline_eta = required_firm_success_probability(DOC_INPUTS["baseline_eta"], theta, k)

    # Optional exploratory AMC sensitivity proxy tied to eta.
    if apply_eta_proxy and p_eta is not None and p_baseline_eta is not None:
        adjusted_amc_m = base_amc_m * (p_eta / p_baseline_eta)
    else:
        adjusted_amc_m = base_amc_m

    adjusted_benefits_b = DOC_INPUTS["baseline_benefits_b"] * (
        adoption_rate / DOC_INPUTS["baseline_adoption"]
    ) * (social_value / DOC_INPUTS["baseline_social_value"])

    total_social_cost_b = (adjusted_amc_m / 1000.0) + non_amc_cost_b
    bcr = adjusted_benefits_b / total_social_cost_b
    npv_b = adjusted_benefits_b - (adjusted_amc_m / 1000.0)

    return {
        "adjusted_amc_m": adjusted_amc_m,
        "adjusted_benefits_b": adjusted_benefits_b,
        "total_social_cost_b": total_social_cost_b,
        "bcr": bcr,
        "npv_b": npv_b,
        "required_firm_success_p": p_eta,
        "base_amc_m": base_amc_m,
        "non_amc_cost_b": non_amc_cost_b,
    }


def fmt_delta(curr: float, base: float, suffix: str = "") -> str:
    """Return a signed delta string for KPI cards."""
    d = curr - base
    return f"{d:+.2f}{suffix}"


# -------------------------------
# Header and overview
# -------------------------------
st.title("AMC Scenario Cockpit: Enteric Methane Vaccine")
st.markdown(
    """
Interactive scenario analysis for policy and economics discussion.
This dashboard explicitly separates **document-derived values** from **stress-test approximations** and **exploratory proxies**.
"""
)

st.markdown(
    """
    <span class="badge doc">Document-derived inputs</span>
    <span class="badge stress">Stress-test approximations</span>
    <span class="badge exploratory">Exploratory sensitivity proxy</span>
    """,
    unsafe_allow_html=True,
)

st.caption("All currency values are shown in USD. M = millions, B = billions.")


# -------------------------------
# Sidebar controls
# -------------------------------
st.sidebar.header("Scenario Controls")

selected_scenario = st.sidebar.selectbox(
    "Dosing frequency",
    options=list(DOSING_SCENARIOS.keys()),
    index=0,
)

eta = st.sidebar.slider(
    "Scientific feasibility (eta)",
    min_value=0.70,
    max_value=0.95,
    value=DOC_INPUTS["baseline_eta"],
    step=0.01,
)

adoption_rate = st.sidebar.slider(
    "Adoption rate",
    min_value=0.10,
    max_value=0.80,
    value=DOC_INPUTS["baseline_adoption"],
    step=0.01,
)

social_value = st.sidebar.slider(
    "Social value per animal-year (USD)",
    min_value=22.0,
    max_value=38.0,
    value=DOC_INPUTS["baseline_social_value"],
    step=0.5,
)

apply_eta_proxy = st.sidebar.toggle(
    "Apply eta-based AMC sensitivity proxy",
    value=False,
    help=(
        "Exploratory proxy only: adjusted_amc = scenario_amc * p(eta)/p(0.90). "
        "This is not the original sponsor model."
    ),
)

st.sidebar.markdown("---")
st.sidebar.caption("Model constants: theta = 2/3, k = 15")


# -------------------------------
# Core model calculations
# -------------------------------
results = compute_model_outputs(
    scenario_name=selected_scenario,
    eta=eta,
    adoption_rate=adoption_rate,
    social_value=social_value,
    apply_eta_proxy=apply_eta_proxy,
)

baseline_reference = compute_model_outputs(
    scenario_name="Baseline / infrequent",
    eta=DOC_INPUTS["baseline_eta"],
    adoption_rate=DOC_INPUTS["baseline_adoption"],
    social_value=DOC_INPUTS["baseline_social_value"],
    apply_eta_proxy=False,
)

scenario_info = DOSING_SCENARIOS[selected_scenario]

if scenario_info["is_stress_test"]:
    st.warning(
        "Prime + booster uses a stress-test linear approximation for AMC and non-AMC costs; "
        "it is not an exact sponsor estimate.",
        icon="⚠️",
    )

if apply_eta_proxy:
    st.info(
        "Eta-based AMC adjustment is enabled as an exploratory sensitivity proxy, not a sponsor-calibrated method.",
        icon="ℹ️",
    )

if results["required_firm_success_p"] is None:
    st.warning(
        "Required firm-level success probability is undefined for eta <= theta (2/3). "
        "Increase eta above 0.667 to compute this metric.",
        icon="⚠️",
    )


# -------------------------------
# Cockpit layout
# -------------------------------
st.subheader("Scenario Summary")

scenario_col, assumption_col = st.columns([1.2, 1.8])
scenario_col.markdown(f"**Selected dosing scenario:** {selected_scenario}")
scenario_col.caption(scenario_info["label"])

assumption_col.markdown(
    f"**Live assumptions:** eta = {eta:.2f}, adoption = {adoption_rate:.0%}, social value = ${social_value:.1f}"
)
assumption_col.caption(
    "Eta-based AMC proxy is "
    + ("ON (exploratory)" if apply_eta_proxy else "OFF (scenario AMC used directly)")
)


# -------------------------------
# Top-line metric cards
# -------------------------------
row1 = st.columns(3)
row1[0].metric(
    "Adjusted AMC",
    f"${results['adjusted_amc_m']:.1f}M",
    delta=fmt_delta(results["adjusted_amc_m"], baseline_reference["adjusted_amc_m"], "M"),
)
row1[1].metric(
    "Adjusted Benefits",
    f"${results['adjusted_benefits_b']:.3f}B",
    delta=fmt_delta(results["adjusted_benefits_b"], baseline_reference["adjusted_benefits_b"], "B"),
)
row1[2].metric(
    "Total Social Cost",
    f"${results['total_social_cost_b']:.3f}B",
    delta=fmt_delta(results["total_social_cost_b"], baseline_reference["total_social_cost_b"], "B"),
)

row2 = st.columns(3)
row2[0].metric(
    "Benefit-Cost Ratio (BCR)",
    f"{results['bcr']:.2f}",
    delta=fmt_delta(results["bcr"], baseline_reference["bcr"]),
)
row2[1].metric(
    "Net Present Value (NPV)",
    f"${results['npv_b']:.3f}B",
    delta=fmt_delta(results["npv_b"], baseline_reference["npv_b"], "B"),
)
if results["required_firm_success_p"] is not None:
    row2[2].metric(
        "Required Firm-Level Success Probability (p)",
        f"{results['required_firm_success_p']:.3%}",
        delta=fmt_delta(
            results["required_firm_success_p"],
            baseline_reference["required_firm_success_p"],
            "%",
        ),
    )
else:
    row2[2].metric("Required Firm-Level Success Probability (p)", "Undefined")


# -------------------------------
# Evidence table: document values vs stress assumptions
# -------------------------------
st.subheader("Evidence Transparency")

evidence_df = pd.DataFrame(
    [
        [
            "Baseline / infrequent AMC",
            "$534.2M",
            "Document / reviewer-derived",
            "Used directly",
        ],
        [
            "Annual AMC",
            "$832.3M",
            "Document / reviewer-derived",
            "Used directly",
        ],
        [
            "Prime + booster AMC",
            "$1,068.4M",
            "Stress-test approximation",
            "Linear stress-test proxy, not sponsor estimate",
        ],
        [
            "Benefit scaling",
            "11.4842 * (adoption / 0.50) * (social value / 30)",
            "Modeling assumption",
            "Sensitivity structure for presentation",
        ],
        [
            "Eta-based AMC sensitivity",
            "AMC * p(eta)/p(0.90)",
            "Exploratory proxy",
            "Optional and not in sponsor baseline model",
        ],
    ],
    columns=["Item", "Value", "Source Type", "Interpretation"],
)
st.dataframe(evidence_df, use_container_width=True, hide_index=True)


# -------------------------------
# Charts
# -------------------------------
st.subheader("Scenario and Sensitivity Charts")

chart_col1, chart_col2 = st.columns(2)

# (a) Bar chart comparing AMC by dosing scenario
amc_comp_df = pd.DataFrame(
    {
        "Dosing scenario": list(DOSING_SCENARIOS.keys()),
        "AMC (M USD)": [
            DOSING_SCENARIOS[s]["amc_m"] for s in DOSING_SCENARIOS
        ],
        "Type": [
            "Stress-test"
            if DOSING_SCENARIOS[s]["is_stress_test"]
            else "Document-derived"
            for s in DOSING_SCENARIOS
        ],
    }
)

fig_amc = px.bar(
    amc_comp_df,
    x="Dosing scenario",
    y="AMC (M USD)",
    color="Type",
    title="AMC Size by Dosing Scenario",
    text="AMC (M USD)",
    color_discrete_map={
        "Document-derived": "#1f77b4",
        "Stress-test": "#ff7f0e",
    },
)
fig_amc.update_traces(texttemplate="%{text:.1f}", textposition="outside")
fig_amc.add_hline(
    y=results["adjusted_amc_m"],
    line_dash="dot",
    line_color="#2a9d8f",
    annotation_text="Current adjusted AMC",
)
fig_amc.update_layout(height=420, legend_title_text="Input class")
chart_col1.plotly_chart(fig_amc, use_container_width=True)


# (b) Line chart of required firm-level success probability vs eta
eta_grid = np.linspace(0.70, 0.95, 120)
p_grid = [
    required_firm_success_probability(x, DOC_INPUTS["theta"], DOC_INPUTS["k"])
    for x in eta_grid
]

p_df = pd.DataFrame({"eta": eta_grid, "required_p": p_grid})

fig_p = px.line(
    p_df,
    x="eta",
    y="required_p",
    title="Required Firm-Level Success Probability vs Scientific Feasibility (eta)",
)
fig_p.update_layout(height=420, yaxis_tickformat=".1%")
fig_p.add_vline(
    x=DOC_INPUTS["theta"],
    line_dash="dash",
    line_color="red",
    annotation_text="theta = 2/3",
)
if results["required_firm_success_p"] is not None:
    fig_p.add_scatter(
        x=[eta],
        y=[results["required_firm_success_p"]],
        mode="markers",
        marker=dict(size=10, color="#2a9d8f"),
        name="Current setting",
    )
chart_col2.plotly_chart(fig_p, use_container_width=True)

# (c) BCR vs adoption rate under selected scenario
adoption_grid = np.linspace(0.10, 0.80, 71)
bcr_rows = []
for a in adoption_grid:
    out = compute_model_outputs(
        scenario_name=selected_scenario,
        eta=eta,
        adoption_rate=float(a),
        social_value=social_value,
        apply_eta_proxy=apply_eta_proxy,
    )
    bcr_rows.append({"adoption": a, "bcr": out["bcr"]})

bcr_df = pd.DataFrame(bcr_rows)

fig_bcr = px.line(
    bcr_df,
    x="adoption",
    y="bcr",
    title=f"BCR Sensitivity to Adoption Rate ({selected_scenario})",
)
fig_bcr.update_layout(height=420)
fig_bcr.update_xaxes(tickformat=".0%")
fig_bcr.add_vline(
    x=DOC_INPUTS["baseline_adoption"],
    line_dash="dash",
    line_color="gray",
    annotation_text="Baseline adoption = 50%",
)
current_bcr_point = compute_model_outputs(
    scenario_name=selected_scenario,
    eta=eta,
    adoption_rate=adoption_rate,
    social_value=social_value,
    apply_eta_proxy=apply_eta_proxy,
)
fig_bcr.add_scatter(
    x=[adoption_rate],
    y=[current_bcr_point["bcr"]],
    mode="markers",
    marker=dict(size=10, color="#2a9d8f"),
    name="Current setting",
)
st.plotly_chart(fig_bcr, use_container_width=True)


# -------------------------------
# Assumptions and caveats section
# -------------------------------
st.subheader("Assumptions and Caveats")
st.markdown(
    """
- Baseline and annual AMC/cost parameters are entered from the supplied baseline figures.
- Prime + booster values are **explicit stress-test approximations** for sensitivity exploration.
- Benefit scaling with adoption and social value is a proportional approximation, not a structural welfare model.
- NPV here is computed as `adjusted_benefits - adjusted_amc` (AMC component only), matching the requested simplified logic.
- Optional eta-based AMC scaling is exploratory (`AMC * p(eta)/p(0.90)`) and should not be interpreted as sponsor-estimated pricing behavior.
- Results should be interpreted as scenario analysis for policy discussion, not as a definitive forecast.
"""
)


# -------------------------------
# Footnote with baseline references
# -------------------------------
st.caption(
    "Reference baselines: BCR = 14.41 (baseline), BCR = 7.21 (annual), "
    "baseline implied benefits = $11.4842B, baseline implied total social cost = $0.797B."
)
