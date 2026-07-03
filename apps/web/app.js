const stateUrl = "/api/state";

const elements = {
  cap: document.querySelector("#cap"),
  budget: document.querySelector("#budget"),
  spent: document.querySelector("#spent"),
  rules: document.querySelector("#rules"),
  timeline: document.querySelector("#timeline"),
  lastReason: document.querySelector("#last-reason"),
  runAllowed: document.querySelector("#run-allowed"),
  runBlocked: document.querySelector("#run-blocked")
};

elements.runAllowed.addEventListener("click", () => runDemo("allowed"));
elements.runBlocked.addEventListener("click", () => runDemo("blocked"));

await refresh();

async function refresh() {
  const state = await getJson(stateUrl);
  const policy = state.policies[0];
  const spent = state.spentByAgent[policy.agentId] || 0;

  elements.cap.textContent = `$${policy.maxAmountPerAction}`;
  elements.budget.textContent = `$${policy.dailyBudget}`;
  elements.spent.textContent = `$${spent}`;

  elements.rules.innerHTML = [
    `Allowed service: ${policy.allowedServiceIds.join(", ")}`,
    `Approval threshold: $${policy.approvalThreshold}`,
    `Policy hash: ${policy.policyHash}`,
    `Expires: ${new Date(policy.expiresAt).toLocaleDateString()}`
  ].map((rule) => `<li>${escapeHtml(rule)}</li>`).join("");

  renderTimeline(state.receipts);
}

async function runDemo(variant) {
  setReason("Running", "neutral");
  const result = await postJson("/api/run-demo", { variant });
  const outcome = result.outcome;
  const status = outcome.verdict === "allow" ? "success" : "destructive";
  setReason(outcome.reasonCode, status);

  if (!result.receipt) {
    prependTimeline({
      id: `blocked-${Date.now()}`,
      status: "blocked",
      actionType: outcome.action.actionType,
      amount: outcome.action.amount,
      txHash: outcome.reasonCode,
      createdAt: new Date().toISOString()
    });
  }

  await refresh();
}

function renderTimeline(receipts) {
  if (receipts.length === 0) {
    elements.timeline.innerHTML = `<div class="timeline-item"><strong>No receipts yet</strong><span>Run the allowed action to create a demo receipt.</span></div>`;
    return;
  }
  elements.timeline.innerHTML = receipts.map(renderTimelineItem).join("");
}

function prependTimeline(item) {
  elements.timeline.insertAdjacentHTML("afterbegin", renderTimelineItem(item));
}

function renderTimelineItem(item) {
  const title = item.status === "blocked" ? "Blocked before signing" : "Receipt recorded";
  return `
    <div class="timeline-item">
      <strong>${escapeHtml(title)} <span>$${escapeHtml(String(item.amount))}</span></strong>
      <span>${escapeHtml(item.actionType)} · ${escapeHtml(new Date(item.createdAt).toLocaleTimeString())}</span>
      <code>${escapeHtml(item.txHash)}</code>
    </div>
  `;
}

function setReason(text, status) {
  elements.lastReason.textContent = text;
  elements.lastReason.className = `status ${status}`;
}

async function getJson(url) {
  const response = await fetch(url);
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return response.json();
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[character];
  });
}
