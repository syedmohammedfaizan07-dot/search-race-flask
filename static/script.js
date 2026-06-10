const $ = (id) => document.getElementById(id);
let mode = "search";
let running = false;

const MODE_META = {
  search:     { a: { name: "Linear Search", cx: "O(n)" },     b: { name: "Binary Search", cx: "O(log n)" } },
  sort:       { a: { name: "Bubble Sort",   cx: "O(n²)" },    b: { name: "Merge Sort",    cx: "O(n log n)" } },
  membership: { a: { name: "List Membership", cx: "O(n)" },   b: { name: "Set Membership", cx: "O(1)" } },
};

document.querySelectorAll(".mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (running) return;
    document.querySelectorAll(".mode").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.dataset.mode;
    applyModeLabels();
    resetLanes();
  });
});

function applyModeLabels() {
  const m = MODE_META[mode];
  $("nameA").textContent = m.a.name; $("cxA").textContent = m.a.cx;
  $("nameB").textContent = m.b.name; $("cxB").textContent = m.b.cx;
}

function resetLanes() {
  ["A", "B"].forEach((k) => {
    $("fill" + k).style.width = "0%";
    $("dot" + k).style.left = "0%";
    $("time" + k).innerHTML = '— <span>ms</span>';
    $("steps" + k).textContent = "0 steps";
    $("lane" + k).classList.remove("winner");
  });
  $("analysis").hidden = true;
}

$("run").addEventListener("click", async () => {
  if (running) return;

  running = true;
  $("run").disabled = true;
  $("run").textContent = "⏳ RUNNING...";

  resetLanes();

  const size = parseInt($("size").value, 10);

  if (isNaN(size)) {
    alert("Please enter a valid dataset size.");
    running = false;
    $("run").disabled = false;
    $("run").textContent = "▶ START RACE";
    return;
  }

  if (size < 100) {
    alert("Dataset size must be at least 100.");
    running = false;
    $("run").disabled = false;
    $("run").textContent = "▶ START RACE";
    return;
  }

  if (size > 200000) {
    alert("Dataset size cannot exceed 200000.");
    running = false;
    $("run").disabled = false;
    $("run").textContent = "▶ START RACE";
    return;
  }

  let data;

  try {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mode, size }),
    });

    data = await res.json();
  } catch (e) {
    alert("Race failed: " + e.message);

    running = false;
    $("run").disabled = false;
    $("run").textContent = "▶ START RACE";

    return;
  }

  await animateRace(data.a, data.b);
  showAnalysis(data);

  running = false;
  $("run").disabled = false;
  $("run").textContent = "▶ START RACE";
});


function animateRace(a, b) {
  return new Promise((resolve) => {
    const max = Math.max(a.timeMs, b.timeMs, 1);
    // Scale animation duration so it's visible (min 600ms, max 3000ms)
    const animMax = Math.min(3000, Math.max(600, max * 20));
    const ratioA = a.timeMs / max;
    const ratioB = b.timeMs / max;
    const start = performance.now();

    function frame(now) {
      const t = (now - start) / animMax; // 0..1 over animMax ms
      const pA = Math.min(1, t / ratioA);
      const pB = Math.min(1, t / ratioB);
      updateLane("A", pA, a);
      updateLane("B", pB, b);
      if (pA < 1 || pB < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

function updateLane(k, progress, info) {
  const pct = (progress * 100).toFixed(2) + "%";
  $("fill" + k).style.width = pct;
  $("dot" + k).style.left = pct;
  $("time" + k).innerHTML = `${info.timeMs.toFixed(3)} <span>ms</span>`;
  $("steps" + k).textContent = `${Math.round(progress * info.steps).toLocaleString()} steps`;
  if (progress >= 1) {
    $("steps" + k).textContent = `${info.steps.toLocaleString()} steps`;
  }
}

function showAnalysis(data) {
  const { a, b } = data;
  const winner = a.timeMs <= b.timeMs ? a : b;
  const loser  = winner === a ? b : a;
  const speedup = (loser.timeMs / Math.max(winner.timeMs, 0.0001)).toFixed(2);
  const stepRatio = (loser.steps / Math.max(winner.steps, 1)).toFixed(2);

  $("lane" + (winner === a ? "A" : "B")).classList.add("winner");
  $("analysis").hidden = false;
  $("analysisText").innerHTML =
    `<strong>${winner.name}</strong> (${winner.complexity}) finished in ` +
    `<strong>${winner.timeMs.toFixed(3)} ms</strong> using ${winner.steps.toLocaleString()} steps — ` +
    `roughly <strong>${speedup}× faster</strong> than ${loser.name} ` +
    `(${loser.complexity}, ${loser.timeMs.toFixed(3)} ms, ${loser.steps.toLocaleString()} steps, ${stepRatio}× more work). ` +
    `The winner scales better because of its lower asymptotic complexity, so the gap grows as the dataset gets larger.`;
}

document.getElementById("reset").addEventListener("click", () => {
  location.reload();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !running) {
    $("run").click();
  }
});

applyModeLabels();
