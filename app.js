// State Management
let currentKeyword = "";
let currentRules = [...RULES_DATA];

// DOM elements
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const ruleList = document.getElementById("ruleList");
const noResults = document.getElementById("noResults");
const resultCountBadge = document.getElementById("resultCountBadge");
const searchKeywordLabel = document.getElementById("searchKeywordLabel");
const aisDirectAnswer = document.getElementById("aisDirectAnswer");

// Initialize on Load
document.addEventListener("DOMContentLoaded", () => {
  renderRules(currentRules);
  lucide.createIcons();
});

// Search handling
function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  currentKeyword = query;

  if (query === "") {
    clearBtn.classList.add("hidden");
    currentRules = [...RULES_DATA];
    searchKeywordLabel.textContent = "전체 규정 목록";
    aisDirectAnswer.classList.add("hidden");
  } else {
    clearBtn.classList.remove("hidden");
    searchKeywordLabel.innerHTML = `'<span class="text-blue-600">${escapeHtml(query)}</span>' 검색 결과`;
    
    // Check if query is related to '심사' or '수당' for AIS Direct Answer Banner
    if (query.includes("심사") || query.includes("수당") || query.includes("2시간") || query.includes("10만")) {
      aisDirectAnswer.classList.remove("hidden");
    } else {
      aisDirectAnswer.classList.add("hidden");
    }

    currentRules = RULES_DATA.filter(item => {
      const matchLaw = item.lawName.toLowerCase().includes(query);
      const matchArticle = item.article.toLowerCase().includes(query);
      const matchSummary = item.summary.toLowerCase().includes(query);
      const matchContent = item.content.toLowerCase().includes(query);
      const matchCategory = item.category.toLowerCase().includes(query);
      
      const matchCases = item.practicalExamples && item.practicalExamples.some(ex => 
        ex.caseTitle.toLowerCase().includes(query) ||
        ex.condition.toLowerCase().includes(query) ||
        ex.result.toLowerCase().includes(query)
      );

      return matchLaw || matchArticle || matchSummary || matchContent || matchCategory || matchCases;
    });
  }

  renderRules(currentRules);
}

// Quick Search from tags
function quickSearch(keyword) {
  searchInput.value = keyword;
  handleSearch();
}

// Clear Search
function clearSearch() {
  searchInput.value = "";
  handleSearch();
  searchInput.focus();
}

// Reset Search to all
function resetSearch() {
  searchInput.value = "";
  handleSearch();
}

// Highlight text helper
function highlightText(text, keyword) {
  if (!keyword || !text) return text;
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, "gi");
  return text.replace(regex, `<mark>$1</mark>`);
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(string) {
  return string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Render rules into structured, clean accordion cards (Argos & AIS Style)
function renderRules(rules) {
  resultCountBadge.textContent = `${rules.length}건`;

  if (rules.length === 0) {
    ruleList.innerHTML = "";
    noResults.classList.remove("hidden");
    return;
  }

  noResults.classList.add("hidden");

  ruleList.innerHTML = rules.map((rule, idx) => {
    const isFirstCard = (idx === 0 && currentKeyword !== ""); // auto expand first result on search
    
    // Practical cases HTML
    const casesHtml = (rule.practicalExamples || []).map((ex, exIdx) => `
      <div class="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 space-y-1.5 transition hover:bg-blue-50">
        <div class="flex items-center justify-between flex-wrap gap-1">
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold bg-blue-600 text-white rounded-full">${exIdx + 1}</span>
            <span class="font-bold text-slate-800 text-sm">${highlightText(ex.caseTitle, currentKeyword)}</span>
          </div>
          <span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">적용 기준</span>
        </div>
        <div class="text-xs text-slate-600 pl-6 space-y-0.5">
          <p><span class="font-semibold text-slate-700">상황 조건:</span> ${highlightText(ex.condition, currentKeyword)}</p>
          <p><span class="font-semibold text-blue-700">지급/처리:</span> <strong class="text-blue-900">${highlightText(ex.result, currentKeyword)}</strong></p>
          ${ex.docs ? `<p class="text-slate-500 text-[11px]"><span class="font-semibold">구비 서류:</span> ${ex.docs}</p>` : ''}
        </div>
      </div>
    `).join("");

    return `
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200 hover:border-blue-400 hover:shadow-md" id="card-${rule.id}">
        
        <!-- CARD HEADER / SUMMARY ROW -->
        <div 
          onclick="toggleAccordion('${rule.id}')"
          class="p-5 cursor-pointer flex items-start justify-between gap-4 select-none bg-white hover:bg-slate-50/80 transition"
        >
          <div class="space-y-1.5 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                ${rule.category}
              </span>
              <span class="text-xs font-semibold text-blue-600">
                ${highlightText(rule.lawName, currentKeyword)}
              </span>
            </div>

            <!-- Article & Clause Title -->
            <div class="flex items-baseline gap-2 pt-0.5">
              <h2 class="text-lg font-extrabold text-slate-900 hover:text-blue-600 transition flex items-center gap-2">
                <span>${highlightText(rule.article, currentKeyword)}</span>
                <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">${rule.clause}</span>
              </h2>
            </div>

            <!-- One-line Summary -->
            <p class="text-xs sm:text-sm text-slate-600 leading-normal line-clamp-1">
              ${highlightText(rule.summary, currentKeyword)}
            </p>
          </div>

          <!-- Toggle Indicator Button -->
          <div class="shrink-0 flex items-center gap-2 pt-1 text-slate-400">
            <span class="text-xs font-medium text-blue-600 hidden sm:inline" id="badge-label-${rule.id}">${isFirstCard ? '원문 접기' : '원문·사례 펼치기'}</span>
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-200" id="icon-container-${rule.id}">
              <i data-lucide="${isFirstCard ? 'chevron-up' : 'chevron-down'}" class="w-4 h-4 text-slate-600" id="icon-${rule.id}"></i>
            </div>
          </div>
        </div>

        <!-- ACCORDION CONTENT -->
        <div id="content-${rule.id}" class="${isFirstCard ? 'block' : 'hidden'} border-t border-slate-100 bg-slate-50/60 p-5 sm:p-6 space-y-6">
          
          <!-- SECTION 1: AIS PRACTICAL EXAMPLES -->
          <div class="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <i data-lucide="briefcase" class="w-4 h-4"></i>
                </div>
                <h3 class="font-bold text-slate-800 text-sm sm:text-base">
                  실무 적용 가상 사례 (AIS형 해석 가이드)
                </h3>
              </div>
              <span class="text-xs text-slate-400 hidden sm:inline">현장 집행 기준</span>
            </div>

            <!-- Example Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              ${casesHtml}
            </div>
          </div>

          <!-- SECTION 2: REGULATION ORIGINAL TEXT -->
          <div class="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2">
              <div class="flex items-center gap-2">
                <div class="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                  <i data-lucide="scroll-text" class="w-4 h-4"></i>
                </div>
                <h3 class="font-bold text-slate-800 text-sm sm:text-base">
                  규정 조항 원문
                </h3>
              </div>
              <button 
                onclick="copyText('${escapeHtml(rule.content).replace(/\n/g, ' ')}')" 
                class="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium bg-slate-100 px-2 py-1 rounded transition"
              >
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>원문 복사</span>
              </button>
            </div>

            <div class="bg-slate-50 p-4 rounded-lg font-mono text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line border border-slate-200/70">
              ${highlightText(rule.content, currentKeyword)}
            </div>
          </div>

          <!-- Action Footer inside Card -->
          <div class="flex justify-between items-center text-xs text-slate-400 pt-1">
            <span>최종 개정 기준 준용</span>
            <button onclick="toggleAccordion('${rule.id}')" class="text-slate-500 hover:text-slate-800 font-medium">
              ▲ 조항 닫기
            </button>
          </div>

        </div>

      </div>
    `;
  }).join("");

  lucide.createIcons();
}

// Accordion toggle function
function toggleAccordion(id) {
  const content = document.getElementById(`content-${id}`);
  const icon = document.getElementById(`icon-${id}`);
  const badgeLabel = document.getElementById(`badge-label-${id}`);

  if (content.classList.contains("hidden")) {
    content.classList.remove("hidden");
    if (badgeLabel) badgeLabel.textContent = "원문 접기";
    if (icon) {
      icon.setAttribute("data-lucide", "chevron-up");
      lucide.createIcons();
    }
  } else {
    content.classList.add("hidden");
    if (badgeLabel) badgeLabel.textContent = "원문·사례 펼치기";
    if (icon) {
      icon.setAttribute("data-lucide", "chevron-down");
      lucide.createIcons();
    }
  }
}

// Copy to clipboard
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("규정 원문이 클립보드에 복사되었습니다.");
  }).catch(() => {
    alert("복사에 실패했습니다.");
  });
}

// Calculator modal functions
function openCalcModal() {
  document.getElementById("calcModal").classList.remove("hidden");
  setCalcHours(2);
}

function closeCalcModal() {
  document.getElementById("calcModal").classList.add("hidden");
}

function setCalcHours(hours) {
  const buttons = document.querySelectorAll(".calc-btn");
  buttons.forEach(btn => {
    if (parseInt(btn.getAttribute("data-hours")) === hours) {
      btn.classList.add("bg-blue-600", "text-white", "border-blue-600");
      btn.classList.remove("border-slate-200", "text-slate-700");
    } else {
      btn.classList.remove("bg-blue-600", "text-white", "border-blue-600");
      btn.classList.add("border-slate-200", "text-slate-700");
    }
  });

  const hoursText = document.getElementById("selectedHoursText");
  const formulaText = document.getElementById("calcFormulaText");
  const totalAmount = document.getElementById("calcTotalAmount");

  if (hours <= 2) {
    hoursText.textContent = `${hours}시간`;
    formulaText.textContent = "기본 수당 정액 적용 (2시간 이내 100,000원)";
    totalAmount.textContent = "100,000원";
  } else if (hours === 3) {
    hoursText.textContent = "3시간";
    formulaText.textContent = "기본 100,000원 + 초과 1시간(50,000원)";
    totalAmount.textContent = "150,000원";
  } else {
    hoursText.textContent = "4시간 이상";
    formulaText.textContent = "기본 100,000원 + 초과 가산 (1일 최대 한도 200,000원 적용)";
    totalAmount.textContent = "200,000원 (최대한도)";
  }
}

function applyCalcResultToSearch() {
  closeCalcModal();
  quickSearch("심사수당");
}
