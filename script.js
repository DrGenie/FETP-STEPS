```javascript
/* Advanced FETP Decision Aid Tool
 * - Tab switching and accordion toggling
 * - DCE model for uptake prediction
 * - Chart rendering for adoption and cost-benefit analysis
 * - Scenario saving and PDF export
 * - Optimization for maximum uptake
 */

/* Global variables */
let probChartFETP = null;
let costBenefitChart = null;

/* DCE Coefficients */
const mainCoefficients = {
  base: -0.1,
  delivery_inperson: 0.3,
  delivery_hybrid: 0.5,
  delivery_online: 0,
  capacity_100: 0,
  capacity_500: 0.2,
  capacity_1000: 0.4,
  capacity_2000: 0.6,
  stipend_75000: 0,
  stipend_100000: 0.2,
  stipend_150000: 0.4,
  trainingModel_parttime: 0,
  trainingModel_fulltime: 0.3,
  career_government: 0,
  career_international: 0.3,
  career_academic: 0.2,
  career_private: 0.1,
  geographic_centralized: 0,
  geographic_regional: 0.2,
  geographic_nationwide: 0.4,
  accreditation_unaccredited: -0.5,
  accreditation_national: 0.2,
  accreditation_international: 0.5,
  cost_low: 0.5,
  cost_medium: 0,
  cost_high: -0.5
};

/* Options for each attribute */
const attributeOptions = {
  deliveryMethod: ['inperson', 'hybrid', 'online'],
  trainingModel: ['parttime', 'fulltime'],
  annualCapacity: ['100', '500', '1000', '2000'],
  stipendSupport: ['75000', '100000', '150000'],
  careerPathway: ['government', 'international', 'academic', 'private'],
  geographicDistribution: ['centralized', 'regional', 'nationwide'],
  accreditation: ['unaccredited', 'national', 'international'],
  totalCost: ['low', 'medium', 'high']
};

/* Tab Switching */
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tablink");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => openTab(tab.getAttribute("data-tab"), tab));
  });
  openTab("introTab", tabs[0]);

  // Accordions
  const accordions = document.querySelectorAll(".accordion-item h3");
  accordions.forEach(acc => {
    acc.addEventListener("click", () => {
      const content = acc.nextElementSibling;
      content.style.display = content.style.display === "block" ? "none" : "block";
    });
  });
});

/* Open Tab */
function openTab(tabId, clickedBtn) {
  document.querySelectorAll(".tabcontent").forEach(content => content.style.display = "none");
  document.querySelectorAll(".tablink").forEach(btn => {
    btn.classList.remove("active");
    btn.setAttribute("aria-selected", "false");
  });
  document.getElementById(tabId).style.display = "block";
  clickedBtn.classList.add("active");
  clickedBtn.setAttribute("aria-selected", "true");
}

/* Build Scenario */
function buildFETPScenario() {
  const scenario = {};
  const selects = document.querySelectorAll('select[name]');
  let allSelected = true;
  selects.forEach(select => {
    scenario[select.name] = select.value;
    if (!select.value) allSelected = false;
  });
  return allSelected ? scenario : null;
}

/* Compute Uptake */
function computeFETPUptake(sc) {
  let U = mainCoefficients.base;
  U += mainCoefficients[`delivery_${sc.deliveryMethod}`] || 0;
  U += mainCoefficients[`trainingModel_${sc.trainingModel}`] || 0;
  U += mainCoefficients[`capacity_${sc.annualCapacity}`] || 0;
  U += mainCoefficients[`stipend_${sc.stipendSupport}`] || 0;
  U += mainCoefficients[`career_${sc.careerPathway}`] || 0;
  U += mainCoefficients[`geographic_${sc.geographicDistribution}`] || 0;
  U += mainCoefficients[`accreditation_${sc.accreditation}`] || 0;
  U += mainCoefficients[`cost_${sc.totalCost}`] || 0;
  return Math.exp(U) / (Math.exp(U) + 1);
}

/* Open Results Modal */
function openFETPScenario() {
  const scenario = buildFETPScenario();
  if (!scenario) {
    alert("Please select all required fields before calculating.");
    return;
  }
  const fraction = computeFETPUptake(scenario);
  const pct = fraction * 100;
  const recommendation = pct < 30 ? "Uptake is low. Consider revising features." :
                        pct < 70 ? "Uptake is moderate. Some adjustments may boost support." :
                                   "Uptake is high. This configuration is promising.";
  document.getElementById("modalResults").innerHTML = `
    <p><strong>Predicted Uptake:</strong> ${pct.toFixed(2)}%</p>
    <p><strong>Recommendation:</strong> ${recommendation}</p>
  `;
  document.getElementById("resultModal").style.display = "block";
  renderFETPProbChart();
  renderFETPCostsBenefits();
  renderCostBenefitChart();
}

/* Close Modal */
function closeModal() {
  document.getElementById("resultModal").style.display = "none";
}

/* Render Adoption Likelihood Chart */
function renderFETPProbChart() {
  const scenario = buildFETPScenario();
  if (!scenario) {
    alert("Please select all required fields first.");
    return;
  }
  const fraction = computeFETPUptake(scenario);
  const pct = fraction * 100;
  const ctx = document.getElementById("probChartFETP").getContext("2d");
  if (probChartFETP) probChartFETP.destroy();
  probChartFETP = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Adoption", "Non-adoption"],
      datasets: [{ data: [pct, 100 - pct], backgroundColor: ["#22c55e", "#ef4444"] }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: `Adoption Likelihood: ${pct.toFixed(2)}%`, font: { size: 16 } }
      }
    }
  });
}

/* Render Cost-Benefit Analysis */
function renderFETPCostsBenefits() {
  const scenario = buildFETPScenario();
  if (!scenario) {
    document.getElementById("costsFETPResults").innerHTML = "<p>Please select all inputs before computing costs.</p>";
    return;
  }
  const trainees = parseInt(scenario.annualCapacity, 10);
  const uptake = computeFETPUptake(scenario);
  const effectiveEnrollment = trainees * uptake;
  const costMapping = { low: 27000, medium: 55000, high: 83000 };
  const totalCost = costMapping[scenario.totalCost];
  const qVal = document.getElementById("qalyFETPSelect").value === "low" ? 0.01 :
               document.getElementById("qalyFETPSelect").value === "high" ? 0.08 : 0.05;
  const monetizedBenefits = effectiveEnrollment * qVal * 50000;
  const netBenefit = monetizedBenefits - totalCost;
  document.getElementById("estimatedCostDisplay").innerHTML = `₹${totalCost.toLocaleString()}`;
  document.getElementById("costsFETPResults").innerHTML = `
    <div class="calculation-info">
      <p><strong>Predicted Uptake:</strong> ${(uptake * 100).toFixed(2)}%</p>
      <p><strong>Number of Trainees:</strong> ${trainees}</p>
      <p><strong>Effective Enrollment:</strong> ${Math.round(effectiveEnrollment)}</p>
      <p><strong>Total Cost:</strong> ₹${totalCost.toLocaleString()} per month</p>
      <p><strong>Monetized Benefits:</strong> ₹${monetizedBenefits.toLocaleString()}</p>
      <p><strong>Net Benefit:</strong> ₹${netBenefit.toLocaleString()}</p>
      <p><strong>Policy Recommendation:</strong> ${netBenefit < 0 ? "The program may not be cost-effective. Consider revising features." :
        netBenefit < 50000 ? "Modest benefits. Some improvements could enhance cost-effectiveness." :
        "This configuration appears highly cost-effective."}</p>
    </div>
  `;
}

/* Render Cost-Benefit Chart */
function renderCostBenefitChart() {
  const scenario = buildFETPScenario();
  if (!scenario) return;
  const trainees = parseInt(scenario.annualCapacity, 10);
  const uptake = computeFETPUptake(scenario);
  const effectiveEnrollment = trainees * uptake;
  const costMapping = { low: 27000, medium: 55000, high: 83000 };
  const totalCost = costMapping[scenario.totalCost];
  const qVal = document.getElementById("qalyFETPSelect").value === "low" ? 0.01 :
               document.getElementById("qalyFETPSelect").value === "high" ? 0.08 : 0.05;
  const monetizedBenefits = effectiveEnrollment * qVal * 50000;
  const netBenefit = monetizedBenefits - totalCost;
  const ctx = document.getElementById("costBenefitChart").getContext("2d");
  if (costBenefitChart) costBenefitChart.destroy();
  costBenefitChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Total Cost", "Monetized Benefits", "Net Benefit"],
      datasets: [{
        label: "₹",
        data: [totalCost, monetizedBenefits, netBenefit],
        backgroundColor: ["#ef4444", "#22c55e", "#f59e0b"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: "Cost-Benefit Analysis", font: { size: 16 } },
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Amount (₹)" } }
      }
    }
  });
}

/* Scenario Saving & PDF Export */
let savedFETPScenarios = [];
function saveFETPScenario() {
  const sc = buildFETPScenario();
  if (!sc) {
    alert("Please select all inputs before saving a scenario.");
    return;
  }
  const uptake = computeFETPUptake(sc);
  const pct = uptake * 100;
  const qVal = 0.05; // Default to moderate for saving
  const trainees = parseInt(sc.annualCapacity, 10);
  const effectiveEnrollment = trainees * uptake;
  const costMapping = { low: 27000, medium: 55000, high: 83000 };
  const totalCost = costMapping[sc.totalCost];
  const monetizedBenefits = effectiveEnrollment * qVal * 50000;
  const netBenefit = monetizedBenefits - totalCost;
  sc.uptake = pct.toFixed(2);
  sc.netBenefit = netBenefit.toFixed(2);
  sc.name = `Scenario ${savedFETPScenarios.length + 1}`;
  savedFETPScenarios.push(sc);
  const tb = document.querySelector("#FETPScenarioTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${sc.name}</td>
    <td>${sc.deliveryMethod}</td>
    <td>${sc.trainingModel}</td>
    <td>${sc.annualCapacity}</td>
    <td>₹${sc.stipendSupport}</td>
    <td>${sc.careerPathway}</td>
    <td>${sc.geographicDistribution}</td>
    <td>${sc.accreditation}</td>
    <td>${sc.totalCost}</td>
    <td>${sc.uptake}%</td>
    <td>₹${sc.netBenefit}</td>
  `;
  tb.appendChild(row);
  alert(`"${sc.name}" saved successfully.`);
}

function exportFETPComparison() {
  if (!savedFETPScenarios.length) {
    alert("No saved scenarios available.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let yPos = 15;
  doc.setFontSize(16);
  doc.text("Advanced FETP Scenarios Comparison", 105, yPos, { align: "center" });
  yPos += 10;
  savedFETPScenarios.forEach((sc, idx) => {
    if (yPos + 60 > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      yPos = 15;
    }
    doc.setFontSize(14);
    doc.text(`Scenario ${idx + 1}: ${sc.name}`, 15, yPos);
    yPos += 7;
    doc.setFontSize(12);
    doc.text(`Delivery: ${sc.deliveryMethod}`, 15, yPos); yPos += 5;
    doc.text(`Model: ${sc.trainingModel}`, 15, yPos); yPos += 5;
    doc.text(`Capacity: ${sc.annualCapacity}`, 15, yPos); yPos += 5;
    doc.text(`Stipend: ₹${sc.stipendSupport}`, 15, yPos); yPos += 5;
    doc.text(`Career: ${sc.careerPathway}`, 15, yPos); yPos += 5;
    doc.text(`Geographic: ${sc.geographicDistribution}`, 15, yPos); yPos += 5;
    doc.text(`Accreditation: ${sc.accreditation}`, 15, yPos); yPos += 5;
    doc.text(`Cost: ${sc.totalCost}`, 15, yPos); yPos += 5;
    doc.text(`Adoption: ${sc.uptake}%, Net Benefit: ₹${sc.netBenefit}`, 15, yPos);
    yPos += 10;
  });
  doc.save("AdvancedFETPScenarios_Comparison.pdf");
}

function exportIndividualScenario() {
  const input = prompt("Enter the scenario number to export:");
  const index = parseInt(input, 10);
  if (isNaN(index) || index < 1 || index > savedFETPScenarios.length) {
    alert("Invalid scenario number.");
    return;
  }
  const scenario = savedFETPScenarios[index - 1];
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text(`Scenario ${index}: ${scenario.name}`, 15, 20);
  doc.setFontSize(12);
  doc.text(`Delivery: ${scenario.deliveryMethod}`, 15, 30);
  doc.text(`Model: ${scenario.trainingModel}`, 15, 40);
  doc.text(`Capacity: ${scenario.annualCapacity}`, 15, 50);
  doc.text(`Stipend: ₹${scenario.stipendSupport}`, 15, 60);
  doc.text(`Career: ${scenario.careerPathway}`, 15, 70);
  doc.text(`Geographic: ${scenario.geographicDistribution}`, 15, 80);
  doc.text(`Accreditation: ${scenario.accreditation}`, 15, 90);
  doc.text(`Total Cost: ${scenario.totalCost}`, 15, 100);
  doc.text(`Adoption Likelihood: ${scenario.uptake}%`, 15, 110);
  doc.text(`Net Benefit: ₹${scenario.netBenefit}`, 15, 120);
  doc.save(`Scenario_${index}.pdf`);
}

/* Toggle Cost Breakdown */
function toggleCostAccordion() {
  const elem = document.getElementById("detailedCostBreakdown");
  elem.style.display = elem.style.display === "block" ? "none" : "block";
}

/* Toggle Benefits Explanation */
function toggleFETPBenefitsAnalysis() {
  const elem = document.getElementById("detailedFETPBenefitsAnalysis");
  elem.style.display = elem.style.display === "block" ? "none" : "block";
}

/* Toggle FAQ Overlay */
function toggleFAQ() {
  const overlay = document.getElementById("faqOverlay");
  overlay.style.display = overlay.style.display === "block" ? "none" : "block";
}

/* Optimize Configuration */
function optimizeConfiguration() {
  let maxUptake = 0;
  let bestScenario = null;

  const generateCombinations = (attributes, current = {}, index = 0) => {
    if (index === attributes.length) {
      const uptake = computeFETPUptake(current);
      if (uptake > maxUptake) {
        maxUptake = uptake;
        bestScenario = { ...current };
      }
      return;
    }
    const attr = attributes[index];
    attributeOptions[attr].forEach(option => {
      current[attr] = option;
      generateCombinations(attributes, current, index + 1);
    });
  };

  const attributes = Object.keys(attributeOptions);
  generateCombinations(attributes);

  if (bestScenario) {
    Object.keys(bestScenario).forEach(key => {
      const select = document.querySelector(`select[name="${key}"]`);
      if (select) select.value = bestScenario[key];
    });
    alert(`Optimized configuration set for maximum uptake: ${(maxUptake * 100).toFixed(2)}%`);
  } else {
    alert("Optimization failed.");
  }
}
