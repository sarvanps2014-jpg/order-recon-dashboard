// Order Reconciliation Dashboard - Main Application
// Made with Bob

let dashboardData = null;
let distributionChart = null;
let matchStatusChart = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

// Load dashboard data from JSON file
async function loadDashboardData() {
    try {
        // Add cache-busting parameter to force fresh data
        const timestamp = new Date().getTime();
        const response = await fetch(`data/po_data.json?v=${timestamp}`);
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        dashboardData = await response.json();
        console.log('Dashboard data loaded from JSON:', dashboardData);
        updateDashboard();
    } catch (error) {
        console.error('Error loading JSON data:', error);
        if (typeof EMBEDDED_DATA !== 'undefined') {
            console.log('Using embedded data as fallback');
            dashboardData = EMBEDDED_DATA;
            updateDashboard();
        } else {
            showError('Failed to load dashboard data. Please ensure you are running the dashboard through a web server (use OPEN_DASHBOARD.bat or python -m http.server).');
        }
    }
}

// Update all dashboard components
function updateDashboard() {
    if (!dashboardData) return;

    updateSummaryCards();
    updateCharts();
    updateTables();
}

// Update summary cards
function updateSummaryCards() {
    const summary = dashboardData.summary;
    
    document.getElementById('totalPOs').textContent = summary.total_unique_pos.toLocaleString();
    document.getElementById('commonAll').textContent = summary.common_all_three.toLocaleString();
    document.getElementById('missingInflight').textContent = summary.missing_in_inflight.toLocaleString();
    document.getElementById('missingSWF').textContent = summary.missing_in_swfroutmail.toLocaleString();
    document.getElementById('lastUpdated').textContent = summary.last_updated;
}

// Update charts
function updateCharts() {
    createDistributionChart();
    createMatchStatusChart();
}

// Create distribution chart
function createDistributionChart() {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    const summary = dashboardData.summary;

    if (distributionChart) {
        distributionChart.destroy();
    }

    distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Webforms', 'Inflight', 'SWFRoutMail'],
            datasets: [{
                label: 'PO Count',
                data: [
                    summary.webforms_count,
                    summary.inflight_count,
                    summary.swfroutmail_count
                ],
                backgroundColor: [
                    'rgba(37, 99, 235, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)'
                ],
                borderColor: [
                    'rgba(37, 99, 235, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'PO Count: ' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Create match status chart
function createMatchStatusChart() {
    const ctx = document.getElementById('matchStatusChart').getContext('2d');
    const summary = dashboardData.summary;
    const matches = dashboardData.matches;
    const unique = dashboardData.unique;

    if (matchStatusChart) {
        matchStatusChart.destroy();
    }

    const partialMatches = matches.webforms_inflight_only.length + 
                          matches.webforms_swf_only.length + 
                          matches.inflight_swf_only.length;
    
    const uniqueOnly = unique.webforms_only.length + 
                      unique.inflight_only.length + 
                      unique.swfroutmail_only.length;

    matchStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['All Three Files', 'Partial Match (2 files)', 'Single File Only'],
            datasets: [{
                data: [
                    summary.common_all_three,
                    partialMatches,
                    uniqueOnly
                ],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ' + value.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Update tables
function updateTables() {
    updateMissingInflightTable();
    updateMissingSWFTable();
    updateAllThreeTable();
    updatePartialMatchTable();
}

// Update missing in inflight table
function updateMissingInflightTable() {
    const tbody = document.getElementById('missingInflightBody');
    const poNumbers = dashboardData.missing.missing_in_inflight;
    
    if (poNumbers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #10b981;">✅ No missing PO numbers</td></tr>';
        return;
    }

    tbody.innerHTML = poNumbers.map((po, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${po}</td>
        </tr>
    `).join('');
}

// Update missing in SWF table
function updateMissingSWFTable() {
    const tbody = document.getElementById('missingSWFBody');
    const poNumbers = dashboardData.missing.missing_in_swfroutmail;
    
    if (poNumbers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #10b981;">✅ No missing PO numbers</td></tr>';
        return;
    }

    tbody.innerHTML = poNumbers.map((po, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${po}</td>
        </tr>
    `).join('');
}

// Update all three files table
function updateAllThreeTable() {
    const tbody = document.getElementById('allThreeBody');
    const poNumbers = dashboardData.matches.all_three;
    
    if (poNumbers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #f59e0b;">⚠️ No PO numbers found in all three files</td></tr>';
        return;
    }

    tbody.innerHTML = poNumbers.map((po, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${po}</td>
        </tr>
    `).join('');
}

// Update partial match table
function updatePartialMatchTable() {
    const tbody = document.getElementById('partialMatchBody');
    const matches = dashboardData.matches;
    
    let rows = [];
    
    // Webforms + Inflight only
    matches.webforms_inflight_only.forEach(po => {
        rows.push({ po: po, sources: 'Webforms + Inflight' });
    });
    
    // Webforms + SWF only
    matches.webforms_swf_only.forEach(po => {
        rows.push({ po: po, sources: 'Webforms + SWFRoutMail' });
    });
    
    // Inflight + SWF only
    matches.inflight_swf_only.forEach(po => {
        rows.push({ po: po, sources: 'Inflight + SWFRoutMail' });
    });
    
    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #64748b;">No partial matches found</td></tr>';
        return;
    }

    // Sort by PO number
    rows.sort((a, b) => a.po.localeCompare(b.po));

    tbody.innerHTML = rows.map((row, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${row.po}</td>
            <td>${row.sources}</td>
        </tr>
    `).join('');
}

// Tab switching function
function showTab(tabId) {
    // Hide all tab contents in the parent container
    const parentContainer = event.target.closest('.table-container');
    const tabContents = parentContainer.querySelectorAll('.tab-content');
    const tabButtons = parentContainer.querySelectorAll('.tab-button');
    
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// Filter table function
function filterTable(tableId, searchInputId) {
    const input = document.getElementById(searchInputId);
    const filter = input.value.toUpperCase();
    const table = document.getElementById(tableId);
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            if (cell) {
                const textValue = cell.textContent || cell.innerText;
                if (textValue.toUpperCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
        }
        
        rows[i].style.display = found ? '' : 'none';
    }
}

// Show error message
function showError(message) {
    const container = document.querySelector('.container');
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        background: #fee2e2;
        border: 2px solid #ef4444;
        color: #991b1b;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
        text-align: center;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    container.insertBefore(errorDiv, container.firstChild);
}

// Export functions for global access
window.showTab = showTab;
window.filterTable = filterTable;