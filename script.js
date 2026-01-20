const THEORETICAL_FINISHES = {
  
  170: ["T20", "T20", "BULL"],
  167: ["T20", "T19", "BULL"],
  164: ["T20", "T18", "BULL"],
  161: ["T20", "T17", "BULL"],
  160: ["T20", "T20", "D20"],
  158: ["T20", "T20", "D19"],
  157: ["T20", "T19", "D20"],
  156: ["T20", "T20", "D18"],
  155: ["T20", "T19", "D19"],
  154: ["T20", "T18", "D20"],
  153: ["T20", "T19", "D18"],
  152: ["T20", "T20", "D16"],
  151: ["T20", "T17", "D20"],
  150: ["T20", "T18", "D18"],
  149: ["T20", "T19", "D16"],
  148: ["T20", "T16", "D20"],
  147: ["T20", "T17", "D18"],
  146: ["T20", "T18", "D16"],
  145: ["T20", "T15", "D20"],
  144: ["T20", "T20", "D12"],
  143: ["T20", "T17", "D16"],
  142: ["T20", "T14", "D20"],
  141: ["T20", "T19", "D12"],
  140: ["T20", "T20", "D10"],
  139: ["T19", "T14", "D20"],
  138: ["T20", "T18", "D12"],
  137: ["T19", "T20", "D10"],
  136: ["T20", "T20", "D8"],
  135: ["T20", "T17", "D12"],
  134: ["T20", "T14", "D16"],
  133: ["T20", "T19", "D8"],
  132: ["T20", "T16", "D12"],
  131: ["T20", "T13", "D16"],
  130: ["T20", "T18", "D8"],
  129: ["T19", "T16", "D12"],
  128: ["T18", "T14", "D16"],
  127: ["T20", "T17", "D8"],
  126: ["T19", "T15", "D12"],
  125: ["25", "T20", "D20"],
  124: ["T20", "T16", "D8"],
  123: ["T19", "T16", "D9"],
  122: ["T18", "T20", "D4"],
  121: ["T20", "T11", "D14"],
  120: ["T20", "S20", "D20"],
  110: ["T20", "S10", "D20"],
  107: ["T19", "S10", "D20"],
  104: ["T18", "S10", "D20"],
  101: ["T17", "S10", "D20"],
  100: ["T20", "D20"],
  99: ["T19", "S10", "D16"],
  98: ["T20", "D19"],
  97: ["T19", "D20"],
  96: ["T20", "D18"],
  95: ["T19", "D19"],
  94: ["T18", "D20"],
  93: ["T19", "D18"],
  92: ["T20", "D16"],
  91: ["T17", "D20"],
  90: ["T20", "D15"],
  89: ["T19", "D16"],
  88: ["T16", "D20"],
  87: ["T17", "D18"],
  86: ["T18", "D16"],
  85: ["T15", "D20"],
  84: ["T20", "D12"],
  83: ["T17", "D16"],
  82: ["T14", "D20"],
  81: ["T19", "D12"],
  80: ["T20", "D10"],
  70: ["T18", "D8"],
  60: ["S20", "D20"],
  50: ["S10", "D20"],
  40: ["D20"],
  38: ["D19"],
  36: ["D18"],
  34: ["D17"],
  32: ["D16"],
  30: ["D15"],
  28: ["D14"],
  26: ["D13"],
  24: ["D12"],
  22: ["D11"],
  20: ["D10"],
  18: ["D9"],
  16: ["D8"],
  14: ["D7"],
  12: ["D6"],
  10: ["D5"],
  8: ["D4"],
  6: ["D3"],
  4: ["D2"],
  2: ["D1"],
};

let currentTotal = 501;
let scoreHistory = [501];
let dartsNames = [];
let dartsValues = [];

function get_dart_value(input) {
  const text = input.toUpperCase().trim();
  if (text === "0" || text === "MISS") return 0;
  if (text === "BULL" || text === "50") return 50;
  if (text === "25") return 25;

  const match = text.match(/^([TDS])?(\d+)$/);
  if (!match) return null;

  const prefix = match[1] || "S";
  const number = parseInt(match[2]);
  if (number < 1 || number > 20) return null;

  if (prefix === "T") return number * 3;
  if (prefix === "D") return number * 2;
  return number;
}

function update_stats() {
  const totalDarts = dartsValues.length;
  const scored = 501 - currentTotal;
  const avg = totalDarts > 0 ? ((scored / totalDarts) * 3).toFixed(1) : "0.0";

  document.getElementById("avg-volley").innerText = avg;
  document.getElementById("darts-count").innerText = totalDarts;
  document.getElementById("points-scored").innerText = scored;
}

function update_ui() {
  document.getElementById("current-total-score").innerText = currentTotal;

  // Historique visuel
  const count = dartsNames.length;
  const lastCount = count > 0 && count % 3 === 0 ? 3 : count % 3;
  const lastDarts = dartsNames.slice(-lastCount);
  const lastSum = dartsValues.slice(-lastCount).reduce((a, b) => a + b, 0);

  const historyDiv = document.getElementById("darts-history");
  historyDiv.innerHTML = "";
  lastDarts.forEach((d) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerText = d;
    historyDiv.appendChild(item);
  });
  document.getElementById("volley-score").innerText =
    lastSum > 0 || lastCount > 0 ? `TOUR : ${lastSum}` : "";

  // Coaching Finition
  const adviceDiv = document.getElementById("advice-display");
  const template = document.getElementById("advice-template");
  adviceDiv.innerHTML = "";

  if (THEORETICAL_FINISHES[currentTotal]) {
    const sol = THEORETICAL_FINISHES[currentTotal];
    const clone = template.content.cloneNode(true);
    const row = clone.querySelector(".dart-row");

    sol.forEach((t) => {
      const box = document.createElement("div");
      box.className = "dart-box";
      box.innerText = t;
      row.appendChild(box);
    });
    adviceDiv.appendChild(clone);
  }
  update_stats();
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("dart-input");

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const raw = input.value.trim().toUpperCase();
      const val = get_dart_value(raw);

      const potentialTotal = currentTotal - val;
      if (val !== null && potentialTotal >= 0 && potentialTotal !== 1) {
        currentTotal = potentialTotal;
        scoreHistory.push(currentTotal);
        dartsNames.push(raw === "0" ? "MISS" : raw);
        dartsValues.push(val);
        input.value = "";
        update_ui();

        if (currentTotal === 0) {
        }
      } else {
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 400);
      }
    }
  });

  document.getElementById("undo-button").onclick = () => {
    if (scoreHistory.length > 1) {
      scoreHistory.pop();
      dartsNames.pop();
      dartsValues.pop();
      currentTotal = scoreHistory[scoreHistory.length - 1];
      update_ui();
    }
  };

  document.getElementById("reset-button").onclick = () => {
    if (confirm("Réinitialiser la partie ?")) {
      currentTotal = 501;
      scoreHistory = [501];
      dartsNames = [];
      dartsValues = [];
      update_ui();
    }
  };

  update_ui();
});
