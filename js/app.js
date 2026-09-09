// Sterling Order Recon Dashboard — v6.4 · Bob intelliDash

let D = null; // full JSON data

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const r = await fetch(`data/po_data.json?v=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        D = await r.json();
        render();
    } catch (e) {
        console.error('[intelliDash] Load/render error:', e);
        banner('error', '❌', `Failed to load data: ${e.message}`);
    }
});

// ─── Main render ─────────────────────────────────────────────────────────────

function render() {
    // Guard: ensure inflight_by_sheet exists (older JSON won't have it)
    if (!D.inflight_by_sheet) {
        banner('error', '❌',
            'Data format outdated — please re-run the reconciliation pipeline to regenerate po_data.json');
        console.error('[intelliDash] D.inflight_by_sheet missing from po_data.json');
        return;
    }

    const sor  = D.inflight_by_sheet['SOR_ORDER'];
    const e850 = D.inflight_by_sheet['850'];
    const ss   = sor.summary;
    const bs   = e850.summary;
    const sm   = sor.matches;
    const bm   = e850.matches;

    // Last updated
    set('lastUpdated', ss.last_updated || bs.last_updated || '—');

    // ── Source Analyzer ───────────────────────────────────────────────────────
    const rc = D.raw_counts || {};
    // Fallback: if raw_counts keys are missing, derive from summary counts
    const sorFiltered  = rc.inflight_filtered  ?? (ss.inflight_count + bs.inflight_count);
    const wfFiltered   = rc.webforms_filtered  ?? (bs.webforms_count  ?? D.summary?.webforms_count ?? '—');
    const olfFiltered  = rc.outlook_filtered   ?? (ss.swfroutmail_count + (bs.swfroutmail_count ?? 0));
    set('raw-inflight-sor',   rc.inflight_sor_raw  ?? rc.inflight_raw ?? ss.inflight_count);
    set('raw-inflight-850',   rc.inflight_850_raw  ?? bs.inflight_count);
    set('raw-inflight-total', rc.inflight_raw      ?? (ss.inflight_count + bs.inflight_count));
    set('filtered-inflight',  sorFiltered);
    set('raw-webforms-total', rc.webforms_raw      ?? wfFiltered);
    set('filtered-webforms',  wfFiltered);
    set('raw-outlook-total',  rc.outlook_raw       ?? olfFiltered);
    set('filtered-outlook',   olfFiltered);

    // ── Ignored rows counts ────────────────────────────────────────────────────
    const ir = D.ignored_rows || {};
    const inflightIgnored = [...(ir.inflight_sor || []), ...(ir.inflight_850 || [])];
    const outlookIgnored  = ir.outlook  || [];
    const webformsIgnored = ir.webforms || [];

    set('ignored-inflight-count', inflightIgnored.length);
    set('ignored-outlook-count',  outlookIgnored.length);
    set('ignored-webforms-count', webformsIgnored.length);

    // View Data buttons always visible — no conditional hide

    // ── Totals row ────────────────────────────────────────────────────────────
    const totalInflight = ss.inflight_count + bs.inflight_count;
    const totalComplete = ss.complete_flow  + bs.complete_flow;
    const sorIssues = ss.inflight_only + ss.swfrout_only;
    const b850Issues = bs.stuck_after_webforms + bs.inflight_skipped_wf +
                       bs.inflight_only + bs.webforms_swfrout_only +
                       bs.webforms_only + bs.swfrout_only;
    const totalIssues = sorIssues + b850Issues;

    set('tot-inflight', totalInflight);
    set('tot-complete', totalComplete);
    set('tot-issues',   totalIssues);

    // ── Alert banner ──────────────────────────────────────────────────────────
    if (totalIssues > 0) {
        banner('error', '🔴',
            `${totalIssues} PO(s) across both flows need attention — see details below`);
    } else {
        banner('ok', '🟢', 'All orders delivered — no issues found');
    }

    // ── SOR_ORDER ─────────────────────────────────────────────────────────────
    set('sor-inflight', ss.inflight_count);
    set('sor-swfrout',  ss.swfroutmail_count);
    set('sor-complete', ss.complete_flow);
    set('sor-issues',   sorIssues);
    set('sor-rate',     ss.e2e_success_rate + '%');

    renderProblemBlock('sor-s2', sm.inflight_only, ss.inflight_only,
        [chk(true), chk(false)], 'Inflight ✓  SWFROUT ✗  →  Not delivered');

    renderProblemBlock('sor-s3', sm.swfrout_only, ss.swfrout_only,
        [chk(false), chk(true)], 'Inflight ✗  SWFROUT ✓  →  No Inflight record');

    renderOkList('sor-s1', sm.complete_flow,
        [chk(true), chk(true)], 'Complete ✓');

    set('sor-s1-count', ss.complete_flow);

    // ── 850 ───────────────────────────────────────────────────────────────────
    set('850-inflight', bs.inflight_count);
    set('850-webforms', bs.webforms_count);
    set('850-swfrout',  bs.swfroutmail_count);
    set('850-complete', bs.complete_flow);
    set('850-issues',   b850Issues);
    set('850-rate',     bs.e2e_success_rate + '%');

    renderProblemBlock('850-s4', bm.inflight_only, bs.inflight_only,
        [chk(true), chk(false), chk(false)], 'Inflight ✓  WF ✗  SWFROUT ✗');

    renderProblemBlock('850-s2', bm.stuck_after_webforms, bs.stuck_after_webforms,
        [chk(true), chk(true), chk(false)], 'Inflight ✓  WF ✓  SWFROUT ✗');

    renderProblemBlock('850-s3', bm.inflight_skipped_wf, bs.inflight_skipped_wf,
        [chk(true), chk(false), chk(true)], 'Inflight ✓  WF ✗  SWFROUT ✓');

    renderProblemBlock('850-s5', bm.webforms_swfrout_only, bs.webforms_swfrout_only,
        [chk(false), chk(true), chk(true)], 'Inflight ✗  WF ✓  SWFROUT ✓');

    renderProblemBlock('850-s6', bm.webforms_only, bs.webforms_only,
        [chk(false), chk(true), chk(false)], 'Inflight ✗  WF ✓  SWFROUT ✗');

    renderProblemBlock('850-s7', bm.swfrout_only, bs.swfrout_only,
        [chk(false), chk(false), chk(true)], 'Inflight ✗  WF ✗  SWFROUT ✓');

    renderOkList('850-s1', bm.complete_flow,
        [chk(true), chk(true), chk(true)], 'Complete ✓');

    set('850-s1-count', bs.complete_flow);

    // ── Charts ────────────────────────────────────────────────────────────────
    renderCharts({ ss, bs, sm, bm, totalInflight, totalComplete, totalIssues, sorIssues, b850Issues });
}

// ─── Charts ───────────────────────────────────────────────────────────────────

function renderCharts({ ss, bs, sm, bm, totalInflight, totalComplete, totalIssues, sorIssues, b850Issues }) {

    // ── Chart 1: Order Volume by Stage (horizontal bars) ─────────────────────
    const stages = [
        { label: 'Inflight (SOR)',  val: ss.inflight_count,     color: '#38bdf8' },
        { label: 'SWFROUT (SOR)',   val: ss.swfroutmail_count,  color: '#818cf8' },
        { label: 'Inflight (850)',  val: bs.inflight_count,     color: '#34d399' },
        { label: 'Webforms (850)',  val: bs.webforms_count,     color: '#4ade80' },
        { label: 'SWFROUT (850)',   val: bs.swfroutmail_count,  color: '#a78bfa' },
    ];
    const maxVol = Math.max(...stages.map(s => s.val), 1);
    document.getElementById('chart-volume').innerHTML = stages.map(s => `
        <div class="hbar-row">
            <div class="hbar-meta">
                <span class="hbar-label">${s.label}</span>
                <span class="hbar-val">${s.val}</span>
            </div>
            <div class="hbar-track">
                <div class="hbar-fill" style="--w:${(s.val/maxVol*100).toFixed(1)}%;width:var(--w);background:${s.color}"></div>
            </div>
        </div>`).join('');

    // ── Chart 2: Overall Health Donut ─────────────────────────────────────────
    const circ   = 2 * Math.PI * 40;           // circumference ≈ 251.3
    const total  = totalComplete + totalIssues;
    const okFrac = total > 0 ? totalComplete / total : 0;
    const errFrac= total > 0 ? totalIssues  / total : 0;
    const okArc  = (okFrac  * circ).toFixed(2);
    const errArc = (errFrac * circ).toFixed(2);
    const errOffset = (okFrac * circ).toFixed(2);

    // OK arc
    const donutOk  = document.getElementById('donut-ok');
    const donutErr = document.getElementById('donut-err');
    donutOk.setAttribute('stroke-dasharray',  `0 ${circ.toFixed(2)}`);
    donutErr.setAttribute('stroke-dasharray', `0 ${circ.toFixed(2)}`);
    donutOk.setAttribute('stroke-dashoffset', '0');

    // Animate after a tick so CSS transition fires
    requestAnimationFrame(() => requestAnimationFrame(() => {
        donutOk.setAttribute('stroke-dasharray',
            `${okArc} ${(circ - parseFloat(okArc)).toFixed(2)}`);
        donutErr.setAttribute('stroke-dasharray',
            `${errArc} ${(circ - parseFloat(errArc)).toFixed(2)}`);
        donutErr.setAttribute('stroke-dashoffset',
            (-errOffset).toString());
    }));

    const pct = total > 0 ? Math.round(okFrac * 100) : 0;
    document.getElementById('donut-pct').textContent = pct + '%';

    document.getElementById('chart-donut-legend').innerHTML = [
        { color:'#34d399', name:'Complete', val: totalComplete },
        { color:'#f87171', name:'Issues',   val: totalIssues   },
        { color:'#5a7caa', name:'Total',    val: total         },
    ].map(l => `
        <div class="legend-row">
            <div class="legend-dot" style="background:${l.color}"></div>
            <span class="legend-name">${l.name}</span>
            <span class="legend-pct">${l.val}</span>
        </div>`).join('');

    // ── Chart 3: 850 Scenario Breakdown (vertical SVG bars) ──────────────────
    const scenarios850 = [
        { id:'S4', label:'S4', val: bs.inflight_only,         color:'#f87171' },
        { id:'S2', label:'S2', val: bs.stuck_after_webforms,  color:'#fb923c' },
        { id:'S3', label:'S3', val: bs.inflight_skipped_wf,   color:'#fbbf24' },
        { id:'S5', label:'S5', val: bs.webforms_swfrout_only, color:'#a78bfa' },
        { id:'S6', label:'S6', val: bs.webforms_only,         color:'#818cf8' },
        { id:'S7', label:'S7', val: bs.swfrout_only,          color:'#38bdf8' },
        { id:'S1', label:'S1 ✓',val:bs.complete_flow,         color:'#34d399' },
    ];
    const maxBar = Math.max(...scenarios850.map(s => s.val), 1);
    const vW = 220, vH = 120, pad = 10, barW = 22, gap = 8;
    const chartH = vH - 30; // leave 30px for labels at bottom
    const svgBars = scenarios850.map((s, i) => {
        const x = pad + i * (barW + gap);
        const bh = Math.max((s.val / maxBar) * chartH, s.val > 0 ? 4 : 0);
        const y  = chartH - bh;
        const labelY = chartH + 10;
        const valY   = y - 4;
        return `
            <rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="3" fill="${s.color}" opacity="0.9">
                <animate attributeName="height" from="0" to="${bh}" dur="0.8s" begin="${i*0.08}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
                <animate attributeName="y" from="${chartH}" to="${y}" dur="0.8s" begin="${i*0.08}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
            </rect>
            ${s.val > 0 ? `<text x="${x + barW/2}" y="${valY}" text-anchor="middle" font-size="8" fill="#e2eaf8" font-weight="700">${s.val}</text>` : ''}
            <text x="${x + barW/2}" y="${labelY}" text-anchor="middle" font-size="7.5" fill="#5a7caa">${s.label}</text>`;
    }).join('');
    // grid lines
    const gridLines = [0.25, 0.5, 0.75, 1].map(f => {
        const gy = chartH - f * chartH;
        const gv = Math.round(f * maxBar);
        return `<line x1="${pad}" y1="${gy}" x2="${vW - pad}" y2="${gy}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
                <text x="${pad - 2}" y="${gy + 3}" text-anchor="end" font-size="7" fill="#2e4870">${gv}</text>`;
    }).join('');
    document.getElementById('chart-850-bars').innerHTML = gridLines + svgBars;

    // ── Chart 4: E2E Pipeline Funnel ─────────────────────────────────────────
    const maxFunnel = Math.max(ss.inflight_count, bs.inflight_count, 1);
    const funnelStages = [
        { name:'SOR Inflight',  val: ss.inflight_count,    cls:'b-blue',  pct: ss.inflight_count  / maxFunnel * 100 },
        { name:'SOR SWFROUT',   val: ss.swfroutmail_count, cls:'b-blue',  pct: ss.swfroutmail_count / maxFunnel * 100 },
        { name:'850 Inflight',  val: bs.inflight_count,    cls:'b-green', pct: bs.inflight_count  / maxFunnel * 100 },
        { name:'850 Webforms',  val: bs.webforms_count,    cls:'b-green', pct: bs.webforms_count  / maxFunnel * 100 },
        { name:'850 SWFROUT',   val: bs.swfroutmail_count, cls:'b-green', pct: bs.swfroutmail_count / maxFunnel * 100 },
        { name:'Complete Total',val: totalComplete,        cls:'b-amber', pct: totalComplete / (totalInflight||1) * 100 },
    ];
    document.getElementById('chart-funnel').innerHTML = funnelStages.map(f => `
        <div class="funnel-stage">
            <div class="funnel-meta">
                <span class="funnel-name">${f.name}</span>
                <span class="funnel-num">${f.val}</span>
            </div>
            <div class="funnel-track">
                <div class="funnel-bar ${f.cls}" style="--w:${f.pct.toFixed(1)}%;width:var(--w)">
                    ${f.pct >= 15 ? Math.round(f.pct) + '%' : ''}
                </div>
            </div>
        </div>`).join('');
}

// ─── Totals modal (Complete / Issues) ────────────────────────────────────────

function showTotalsModal(type) {
    if (!D) return;
    const sor  = D.inflight_by_sheet['SOR_ORDER'];
    const e850 = D.inflight_by_sheet['850'];
    const sm   = sor.matches;
    const bm   = e850.matches;

    let title, rows;

    if (type === 'complete') {
        title = '✅ Complete Flow — All POs delivered successfully';
        // Combine SOR S1 + 850 S1, label each with its flow
        rows = [
            ...( sm.complete_flow || []).map(po => ({ po, Flow: 'SOR_ORDER', Inflight: '✓', SWFROUT: '✓' })),
            ...( bm.complete_flow || []).map(po => ({ po, Flow: '850',      Inflight: '✓', Webforms: '✓', SWFROUT: '✓' })),
        ];
    } else {
        title = '🔴 Need Action — All issue POs across both flows';
        rows = [
            // SOR issues
            ...(sm.inflight_only || []).map(po => ({ po, Flow: 'SOR_ORDER', Issue: 'Not delivered to SWFROUT',          Inflight: '✓', SWFROUT: '✗' })),
            ...(sm.swfrout_only  || []).map(po => ({ po, Flow: 'SOR_ORDER', Issue: 'No Inflight record',                Inflight: '✗', SWFROUT: '✓' })),
            // 850 issues
            ...(bm.inflight_only         || []).map(po => ({ po, Flow: '850', Issue: 'Inflight only — never reached WF/SWFROUT',  Inflight: '✓', Webforms: '✗', SWFROUT: '✗' })),
            ...(bm.stuck_after_webforms  || []).map(po => ({ po, Flow: '850', Issue: 'Stuck after Webforms — not in SWFROUT',     Inflight: '✓', Webforms: '✓', SWFROUT: '✗' })),
            ...(bm.inflight_skipped_wf   || []).map(po => ({ po, Flow: '850', Issue: 'Skipped Webforms — in Inflight + SWFROUT',  Inflight: '✓', Webforms: '✗', SWFROUT: '✓' })),
            ...(bm.webforms_swfrout_only || []).map(po => ({ po, Flow: '850', Issue: 'No Inflight record — WF + SWFROUT only',    Inflight: '✗', Webforms: '✓', SWFROUT: '✓' })),
            ...(bm.webforms_only         || []).map(po => ({ po, Flow: '850', Issue: 'Webforms only — not in Inflight/SWFROUT',   Inflight: '✗', Webforms: '✓', SWFROUT: '✗' })),
            ...(bm.swfrout_only          || []).map(po => ({ po, Flow: '850', Issue: 'SWFROUT only — no Inflight/WF record',      Inflight: '✗', Webforms: '✗', SWFROUT: '✓' })),
        ];
    }

    if (!rows.length) { alert('No records to display.'); return; }

    const cols = Object.keys(rows[0]);
    const thHTML = ['#', ...cols].map(c => `<th>${c}</th>`).join('');
    const dataHTML = rows.map((row, i) => {
        const cells = cols.map(c => {
            const v = row[c] != null ? String(row[c]) : '—';
            const cls = v === '✓' ? ' class="chk-yes"' : v === '✗' ? ' class="chk-no"' : '';
            return `<td${cls}>${v}</td>`;
        }).join('');
        return `<tr><td>${i + 1}</td>${cells}</tr>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'totalsModal';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-head">
                <div>
                    <div class="modal-head-title">${title}</div>
                    <div class="modal-head-sub">${rows.length} PO(s)</div>
                </div>
                <button class="modal-close" onclick="document.getElementById('totalsModal').remove()">✕ Close</button>
            </div>
            <input class="modal-search" placeholder="Search PO or flow…"
                   oninput="filterTotalsRows(this.value)">
            <div class="modal-body">
                <table class="modal-table" id="totalsTable">
                    <thead><tr>${thHTML}</tr></thead>
                    <tbody>${dataHTML}</tbody>
                </table>
            </div>
        </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function filterTotalsRows(query) {
    const q = query.toUpperCase();
    document.querySelectorAll('#totalsTable tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toUpperCase().includes(q) ? '' : 'none';
    });
}

// ─── Per-flow modal (Complete / Issues for SOR_ORDER or 850) ─────────────────
// Shows real Excel row data from detailed_data, filtered by scenario PO sets.

function showFlowTotalsModal(flow, type) {
    if (!D) return;
    const sheet = D.inflight_by_sheet[flow];
    if (!sheet) return;
    const sm  = sheet.matches;
    const dd  = sheet.detailed_data || {};

    // Helper: filter detailed_data rows whose 'po' is in the given Set,
    // and stamp each row with Source + (optionally) Issue label.
    function taggedRows(stageKey, poSet, extra) {
        return (dd[stageKey] || [])
            .filter(r => poSet.has(String(r.po)))
            .map(r => {
                const { _duplicate, ...rest } = r;
                return { Source: stageKey, ...extra, ...rest };
            });
    }

    let title, rows;

    if (flow === 'SOR_ORDER') {
        if (type === 'complete') {
            title = '✅ SOR_ORDER — Complete Flow';
            const pos = new Set(sm.complete_flow || []);
            rows = [
                ...taggedRows('inflight', pos, {}),
                ...taggedRows('swfrout',  pos, {}),
            ];
        } else {
            title = '🔴 SOR_ORDER — Orders Needing Action';
            const inflightOnly = new Set(sm.inflight_only || []);
            const swfroutOnly  = new Set(sm.swfrout_only  || []);
            rows = [
                ...taggedRows('inflight', inflightOnly, { Issue: 'Not delivered to SWFROUT' }),
                ...taggedRows('swfrout',  swfroutOnly,  { Issue: 'No Inflight record'       }),
            ];
        }
    } else {  // 850
        if (type === 'complete') {
            title = '✅ 850 — Complete Flow';
            const pos = new Set(sm.complete_flow || []);
            rows = [
                ...taggedRows('inflight', pos, {}),
                ...taggedRows('webforms', pos, {}),
                ...taggedRows('swfrout',  pos, {}),
            ];
        } else {
            title = '🔴 850 — Orders Needing Action';
            const scenarios = [
                { key: 'inflight_only',         label: 'Inflight only — never reached WF/SWFROUT',  stage: 'inflight'  },
                { key: 'stuck_after_webforms',  label: 'Stuck after Webforms — not in SWFROUT',     stage: 'inflight'  },
                { key: 'inflight_skipped_wf',   label: 'Skipped Webforms — in Inflight + SWFROUT',  stage: 'inflight'  },
                { key: 'webforms_swfrout_only', label: 'No Inflight record — WF + SWFROUT only',    stage: 'webforms'  },
                { key: 'webforms_only',         label: 'Webforms only — not in Inflight/SWFROUT',   stage: 'webforms'  },
                { key: 'swfrout_only',          label: 'SWFROUT only — no Inflight/WF record',      stage: 'swfrout'   },
            ];
            rows = scenarios.flatMap(s =>
                taggedRows(s.stage, new Set(sm[s.key] || []), { Issue: s.label })
            );
        }
    }

    if (!rows.length) { alert('No records to display.'); return; }

    // Collect all column keys (Source + Issue first, then rest)
    const colSet = new Set();
    rows.forEach(r => Object.keys(r).forEach(k => colSet.add(k)));
    const cols = Array.from(colSet);

    const thHTML  = ['#', ...cols].map(c => `<th>${c}</th>`).join('');
    const dataHTML = rows.map((row, i) => {
        const cells = cols.map(c => {
            const v = row[c] != null ? String(row[c]) : '—';
            const display = v.length > 80 ? v.slice(0, 80) + '…' : v;
            return `<td title="${v.replace(/"/g, "'")}">${display}</td>`;
        }).join('');
        return `<tr><td>${i + 1}</td>${cells}</tr>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'flowTotalsModal';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-head">
                <div>
                    <div class="modal-head-title">${title}</div>
                    <div class="modal-head-sub">${rows.length} record(s)</div>
                </div>
                <button class="modal-close" onclick="document.getElementById('flowTotalsModal').remove()">✕ Close</button>
            </div>
            <input class="modal-search" placeholder="Search any field…"
                   oninput="filterFlowTotalsRows(this.value)">
            <div class="modal-body">
                <table class="modal-table" id="flowTotalsTable">
                    <thead><tr>${thHTML}</tr></thead>
                    <tbody>${dataHTML}</tbody>
                </table>
            </div>
        </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function filterFlowTotalsRows(query) {
    const q = query.toUpperCase();
    document.querySelectorAll('#flowTotalsTable tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toUpperCase().includes(q) ? '' : 'none';
    });
}

// ─── Ignored rows modal (rows dropped before reconciliation) ─────────────────
// source: 'outlook'  → emails with no PO in subject (out-of-office, auto-replies, etc.)
// source: 'inflight' → rows excluded by Business filter

function showIgnoredModal(source) {
    if (!D) return;
    const ir = D.ignored_rows || {};
    let rows, title, icon;

    if (source === 'outlook') {
        rows  = ir.outlook || [];
        title = 'Non-PO Emails — out-of-office, auto-replies, bounces & other skipped emails';
        icon  = '📧';
    } else {
        rows  = [...(ir.inflight_sor || []), ...(ir.inflight_850 || [])];
        title = 'Inflight rows ignored — Business filter excluded these records';
        icon  = '🛫';
    }

    if (!rows.length) { alert('No ignored records to display.'); return; }

    // Columns: _ignored_reason first, then the rest (skip internal keys)
    const colSet = new Set(['_ignored_reason']);
    rows.forEach(r => Object.keys(r).forEach(k => { if (!k.startsWith('_ignored')) colSet.add(k); }));
    const cols = Array.from(colSet);

    const thHTML = ['#', ...cols.map(c => `<th>${c === '_ignored_reason' ? 'Reason (ignored)' : c}</th>`)].join('');
    const dataHTML = rows.map((row, i) => {
        const cells = cols.map(c => {
            const v = row[c] != null ? String(row[c]) : '—';
            const display = v.length > 100 ? v.slice(0, 100) + '…' : v;
            const cls = c === '_ignored_reason' ? ' class="ignored-reason-cell"' : '';
            return `<td${cls} title="${v.replace(/"/g, "'")}">${display}</td>`;
        }).join('');
        return `<tr><td>${i + 1}</td>${cells}</tr>`;
    }).join('');

    const MODAL_ID = 'ignoredModal';
    document.getElementById(MODAL_ID)?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = MODAL_ID;
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-head">
                <div>
                    <div class="modal-head-title">${icon} ${title}</div>
                    <div class="modal-head-sub">${rows.length} record(s) excluded from reconciliation</div>
                </div>
                <button class="modal-close" onclick="document.getElementById('${MODAL_ID}').remove()">✕ Close</button>
            </div>
            <input class="modal-search" placeholder="Search subject, reason…"
                   oninput="filterIgnoredRows(this.value)">
            <div class="modal-body">
                <table class="modal-table" id="ignoredTable">
                    <thead><tr>${thHTML}</tr></thead>
                    <tbody>${dataHTML}</tbody>
                </table>
            </div>
        </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function filterIgnoredRows(query) {
    const q = query.toUpperCase();
    document.querySelectorAll('#ignoredTable tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toUpperCase().includes(q) ? '' : 'none';
    });
}

// ─── Render helpers ───────────────────────────────────────────────────────────

/**
 * Shows or hides a problem block and fills its table.
 * @param {string} id     — base id, e.g. 'sor-s2' → block id='sor-s2-block', tbody id='sor-s2-list'
 * @param {string[]} pos  — PO list
 * @param {number} count  — pre-computed count (= pos.length)
 * @param {string[]} stageCells — pre-built <td> HTML for stage columns
 * @param {string} actionText — short action label for last column
 */
function renderProblemBlock(id, pos, count, stageCells, actionText) {
    const block = document.getElementById(`${id}-block`);
    set(`${id}-count`, count);

    if (!count) {
        // Hide — replace inner content with a clean all-clear line
        block.querySelector('.problem-body').innerHTML =
            `<p class="none-msg">✅ No orders in this state</p>`;
        block.classList.add('block-ok');
        return;
    }

    block.classList.remove('block-ok');
    const tbody = document.getElementById(`${id}-list`);
    tbody.innerHTML = pos.map((po, i) => `
        <tr>
            <td>${i + 1}</td>
            <td class="po-num">${po}</td>
            ${stageCells.join('')}
            <td><span class="action-badge">${actionText}</span></td>
        </tr>`).join('');
}

/** Fills the collapsed "complete" list (inside <details>). */
function renderOkList(id, pos, stageCells, statusText) {
    const tbody = document.getElementById(`${id}-list`);
    if (!pos || !pos.length) {
        tbody.innerHTML = `<tr><td colspan="${stageCells.length + 3}" class="none-msg">No data</td></tr>`;
        return;
    }
    tbody.innerHTML = pos.map((po, i) => `
        <tr>
            <td>${i + 1}</td>
            <td class="po-num">${po}</td>
            ${stageCells.join('')}
            <td><span class="ok-badge">${statusText}</span></td>
        </tr>`).join('');
}

/** Returns a <td> with ✓ or ✗ styled by boolean. */
function chk(yes) {
    return yes
        ? `<td class="chk-yes">✓</td>`
        : `<td class="chk-no">✗</td>`;
}

/** Filter PO list table by search string. */
function filterPOList(tbodyId, query) {
    const q = query.toUpperCase();
    document.getElementById(tbodyId).querySelectorAll('tr').forEach(tr => {
        tr.style.display = tr.textContent.toUpperCase().includes(q) ? '' : 'none';
    });
}

// ─── Stage Modal (click Inflight / Webforms / SWFROUT to view raw records) ───

const STAGE_LABELS = {
    inflight: { icon: '🛫', name: 'Sterling Inflight' },
    webforms: { icon: '📝', name: 'Webforms'          },
    swfrout:  { icon: '📧', name: 'SWFROUT Email'      },
};

function showStageModal(sheetKey, stageKey) {
    if (!D) return;
    const sheet = D.inflight_by_sheet[sheetKey];
    if (!sheet) return;

    const rows = (sheet.detailed_data || {})[stageKey] || [];
    const dups  = (sheet.duplicates   || {})[stageKey] || [];
    const info  = STAGE_LABELS[stageKey] || { icon: '📄', name: stageKey };

    // Collect all column keys (skip internal _duplicate flag)
    const colSet = new Set();
    [...rows, ...dups].forEach(r =>
        Object.keys(r).forEach(k => { if (k !== '_duplicate') colSet.add(k); })
    );
    const cols = Array.from(colSet);

    if (!cols.length) {
        alert(`No records available for ${info.name} in ${sheetKey}`);
        return;
    }

    // Build header row
    const thHTML = ['#', ...cols]
        .map(c => `<th>${c}</th>`)
        .join('');

    // Build data rows
    const dataHTML = rows.map((row, i) => {
        const cells = cols.map(c => {
            const v = row[c] != null ? String(row[c]) : '—';
            const display = v.length > 80 ? v.slice(0, 80) + '…' : v;
            return `<td title="${v.replace(/"/g,"'")}">${display}</td>`;
        }).join('');
        return `<tr><td>${i + 1}</td>${cells}</tr>`;
    }).join('');

    // Build duplicate rows
    let dupHTML = '';
    if (dups.length) {
        dupHTML = `<tr class="modal-dup-sep"><td colspan="${cols.length + 1}">⚠️ DUPLICATE RECORDS (${dups.length})</td></tr>`;
        dupHTML += dups.map((row, i) => {
            const cells = cols.map(c => {
                const v = row[c] != null ? String(row[c]) : '—';
                const display = v.length > 80 ? v.slice(0, 80) + '…' : v;
                return `<td title="${v.replace(/"/g,"'")}">${display}</td>`;
            }).join('');
            return `<tr class="modal-dup-row"><td>DUP-${i + 1}</td>${cells}</tr>`;
        }).join('');
    }

    // Render overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'stageModal';
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-head">
                <div>
                    <div class="modal-head-title">${info.icon} ${info.name} — ${sheetKey}</div>
                    <div class="modal-head-sub">${rows.length} unique record(s)${dups.length ? ' · ' + dups.length + ' duplicate(s)' : ''}</div>
                </div>
                <button class="modal-close" onclick="document.getElementById('stageModal').remove()">✕ Close</button>
            </div>
            <input class="modal-search" placeholder="Search any field…"
                   oninput="filterModalRows(this.value)">
            <div class="modal-body">
                <table class="modal-table" id="modalTable">
                    <thead><tr>${thHTML}</tr></thead>
                    <tbody>${dataHTML}${dupHTML}</tbody>
                </table>
            </div>
        </div>`;
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
}

function filterModalRows(query) {
    const q = query.toUpperCase();
    document.querySelectorAll('#modalTable tbody tr').forEach(tr => {
        if (tr.classList.contains('modal-dup-sep')) { tr.style.display = ''; return; }
        tr.style.display = tr.textContent.toUpperCase().includes(q) ? '' : 'none';
    });
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function banner(type, icon, text) {
    const el = document.getElementById('alertBanner');
    el.className = `alert-banner alert-${type}`;
    document.getElementById('alertIcon').textContent = icon;
    document.getElementById('alertText').textContent = text;
}

// ─── Tiny util ────────────────────────────────────────────────────────────────

function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = (val !== undefined && val !== null) ? String(val) : '—';
}

// ─── Source Analyzer "View Data" modal ───────────────────────────────────────
// Called by all "↗ View Data" buttons in the Source Analyzer section.
// key values:
//   'inflight-sor-raw'  → raw inflight SOR_ORDER records
//   'inflight-850-raw'  → raw inflight 850 records
//   'inflight-all-raw'  → all inflight records (SOR_ORDER + 850)
//   'inflight-filtered' → filtered inflight (unique, IBM_SELLSIDE_B2B only)
//   'webforms-raw'      → raw webforms records
//   'webforms-filtered' → filtered webforms (unique POs)
//   'outlook-raw'       → all swfrout emails (unique + duplicates + ignored)
//   'outlook-filtered'  → unique swfrout PO emails after dedup

function showAnalyzerModal(key) {
    if (!D) return;
    const ibs = D.inflight_by_sheet || {};
    const sor = ibs['SOR_ORDER'] || {};
    const e850 = ibs['850'] || {};
    const ir = D.ignored_rows || {};

    let rows = [], title = '', icon = '📄';

    switch (key) {
        case 'inflight-sor-raw': {
            title = '🛫 Inflight — SOR_ORDER (all raw records including duplicates)';
            icon = '🛫';
            rows = [
                ...(sor.detailed_data?.inflight || []),
                ...(sor.duplicates?.inflight    || []).map(r => ({ ...r, _note: 'DUPLICATE' })),
                ...(ir.inflight_sor             || []).map(r => ({ ...r, _note: 'IGNORED' })),
            ];
            break;
        }
        case 'inflight-850-raw': {
            title = '🛫 Inflight — 850 (all raw records including duplicates)';
            icon = '🛫';
            rows = [
                ...(e850.detailed_data?.inflight || []),
                ...(e850.duplicates?.inflight     || []).map(r => ({ ...r, _note: 'DUPLICATE' })),
                ...(ir.inflight_850              || []).map(r => ({ ...r, _note: 'IGNORED' })),
            ];
            break;
        }
        case 'inflight-all-raw': {
            title = '🛫 Inflight — All sheets (SOR_ORDER + 850, all raw records)';
            icon = '🛫';
            rows = [
                ...(sor.detailed_data?.inflight  || []).map(r => ({ Sheet: 'SOR_ORDER', ...r })),
                ...(sor.duplicates?.inflight      || []).map(r => ({ Sheet: 'SOR_ORDER', ...r, _note: 'DUPLICATE' })),
                ...(ir.inflight_sor              || []).map(r => ({ Sheet: 'SOR_ORDER', ...r, _note: 'IGNORED' })),
                ...(e850.detailed_data?.inflight || []).map(r => ({ Sheet: '850', ...r })),
                ...(e850.duplicates?.inflight     || []).map(r => ({ Sheet: '850', ...r, _note: 'DUPLICATE' })),
                ...(ir.inflight_850              || []).map(r => ({ Sheet: '850', ...r, _note: 'IGNORED' })),
            ];
            break;
        }
        case 'inflight-filtered': {
            title = '🛫 Inflight — After Filter (unique IBM_SELLSIDE_B2B POs only)';
            icon = '🛫';
            rows = [
                ...(sor.detailed_data?.inflight  || []).map(r => ({ Sheet: 'SOR_ORDER', ...r })),
                ...(e850.detailed_data?.inflight || []).map(r => ({ Sheet: '850', ...r })),
            ];
            break;
        }
        case 'webforms-raw': {
            title = '📝 Webforms — All raw records';
            icon = '📝';
            rows = [
                ...(e850.detailed_data?.webforms || []),
                ...(e850.duplicates?.webforms     || []).map(r => ({ ...r, _note: 'DUPLICATE' })),
                ...(ir.webforms                  || []).map(r => ({ ...r, _note: 'IGNORED' })),
            ];
            break;
        }
        case 'webforms-filtered': {
            title = '📝 Webforms — After Filter (unique POs only)';
            icon = '📝';
            rows = e850.detailed_data?.webforms || [];
            break;
        }
        case 'outlook-raw': {
            title = '📧 Outlook (SWFROUT) — All raw emails';
            icon = '📧';
            const sorSwf  = (sor.detailed_data?.swfrout   || []).map(r => ({ Flow: 'SOR', ...r }));
            const sorDups = (sor.duplicates?.swfrout       || []).map(r => ({ Flow: 'SOR', ...r, _note: 'DUPLICATE' }));
            const wfSwf   = (e850.detailed_data?.swfrout  || []).map(r => ({ Flow: '850', ...r }));
            const wfDups  = (e850.duplicates?.swfrout      || []).map(r => ({ Flow: '850', ...r, _note: 'DUPLICATE' }));
            const ignored = (ir.outlook || []).map(r => ({ ...r, _note: 'NON-PO (ignored)' }));
            rows = [...sorSwf, ...sorDups, ...wfSwf, ...wfDups, ...ignored];
            break;
        }
        case 'outlook-filtered': {
            title = '📧 Outlook (SWFROUT) — After Filter (unique PO emails only)';
            icon = '📧';
            const sorFiltered = (sor.detailed_data?.swfrout  || []).map(r => ({ Flow: 'SOR', ...r }));
            const wfFiltered  = (e850.detailed_data?.swfrout || []).map(r => ({ Flow: '850', ...r }));
            rows = [...sorFiltered, ...wfFiltered];
            break;
        }
        default:
            alert(`Unknown data key: ${key}`);
            return;
    }

    if (!rows.length) { alert('No records to display.'); return; }

    // Collect all column keys (skip internal flags except _note)
    const colSet = new Set();
    rows.forEach(r => Object.keys(r).forEach(k => {
        if (k !== '_duplicate' && k !== '_ignored_reason') colSet.add(k);
    }));
    const cols = Array.from(colSet);

    const thHTML = ['#', ...cols].map(c => `<th>${c === '_note' ? 'Note' : c}</th>`).join('');
    const dataHTML = rows.map((row, i) => {
        const note = row._note || '';
        const rowCls = note === 'DUPLICATE' ? ' class="modal-dup-row"'
                     : note.startsWith('NON-PO') ? ' class="modal-dup-row"'
                     : '';
        const cells = cols.map(c => {
            const v = row[c] != null ? String(row[c]) : '—';
            const display = v.length > 90 ? v.slice(0, 90) + '…' : v;
            return `<td title="${v.replace(/"/g, "'")}">${display}</td>`;
        }).join('');
        return `<tr${rowCls}><td>${i + 1}</td>${cells}</tr>`;
    }).join('');

    const MODAL_ID = 'analyzerModal';
    document.getElementById(MODAL_ID)?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = MODAL_ID;
    overlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-head">
                <div>
                    <div class="modal-head-title">${icon} ${title}</div>
                    <div class="modal-head-sub">${rows.length} record(s)</div>
                </div>
                <button class="modal-close" onclick="document.getElementById('${MODAL_ID}').remove()">✕ Close</button>
            </div>
            <input class="modal-search" placeholder="Search any field…"
                   oninput="filterAnalyzerRows(this.value)">
            <div class="modal-body">
                <table class="modal-table" id="analyzerTable">
                    <thead><tr>${thHTML}</tr></thead>
                    <tbody>${dataHTML}</tbody>
                </table>
            </div>
        </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function filterAnalyzerRows(query) {
    const q = query.toUpperCase();
    document.querySelectorAll('#analyzerTable tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toUpperCase().includes(q) ? '' : 'none';
    });
}
