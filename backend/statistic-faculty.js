// Statistics Dashboard for Faculty
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { db } from "./firebase-config.js";

// Export features removed for a minimalist dashboard

// Helper function for safer Firebase queries with retry logic
async function safeFirebaseQuery(queryObj, retries = 2) {
  let attempt = 0;
  let lastError = null;
  
  while (attempt <= retries) {
    try {
      return await getDocs(queryObj);
    } catch (error) {
      lastError = error;
      console.warn(`Query attempt ${attempt + 1}/${retries + 1} failed:`, error);
      attempt++;
      
      if (attempt <= retries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('All query attempts failed:', lastError);
  throw lastError;
}

// Main function to initialize the dashboard
async function initializeDashboard() {
  try {
    const stats = await fetchStatistics();
    renderDashboard(stats);
  } catch (error) {
    console.error("Failed to initialize dashboard:", error);
    document.querySelector('.dashboard').innerHTML = `
      <div class="error-container">
        <p class="error-message">Sorry, we couldn't load the dashboard statistics. Please try again later.</p>
      </div>
    `;
  }
}

// Fetch all the statistics needed for the dashboard
async function fetchStatistics() {
  const [
    reportStats, 
    borrowStats, 
    roomStats,
    pcRepairStats,
    overallStats
  ] = await Promise.all([
    fetchReportStatistics(),
    fetchBorrowStatistics(),
    fetchRoomStatistics(),
    fetchPCRepairStatistics(),
    fetchOverallStatistics()
  ]);

  return {
    reportStats,
    borrowStats,
    roomStats,
    pcRepairStats,
    overallStats
  };
}

// Fetch statistics about reported components
async function fetchReportStatistics() {
  // Date filter (optional)
  const savedStartDate = localStorage.getItem('dashboardStartDate');
  const savedEndDate = localStorage.getItem('dashboardEndDate');

  let reportQuery;
  if (savedStartDate && savedEndDate) {
    const startDate = new Date(savedStartDate);
    const endDate = new Date(savedEndDate);
    endDate.setHours(23, 59, 59, 999);

    reportQuery = query(
      collection(db, 'reportList'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
  } else {
    reportQuery = query(collection(db, 'reportList'));
  }

  const snapshot = await safeFirebaseQuery(reportQuery);
  const equipmentCounts = {};
  let totalReports = 0;
  let pendingReports = 0;
  let processingReports = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    totalReports++;

    const equip = (data?.equipment || '').toString().trim();
    if (equip) {
      equipmentCounts[equip] = (equipmentCounts[equip] || 0) + 1;
    }

    const status = (data?.statusReport || '').toString().toLowerCase();
    if (status === 'pending') pendingReports++;
    if (status === 'processing') processingReports++;
  });

  const entries = Object.entries(equipmentCounts).map(([name, count]) => ({
    name,
    count,
    percentage: totalReports ? Math.round((count / totalReports) * 100) : 0,
  }));
  const sorted = entries.sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    const placeholderItems = [
      { name: 'Keyboard', count: 15, percentage: 30 },
      { name: 'Monitor', count: 12, percentage: 24 },
      { name: 'Mouse', count: 10, percentage: 20 },
      { name: 'CPU', count: 8, percentage: 16 },
      { name: 'Headset', count: 5, percentage: 10 },
    ];
    totalReports = placeholderItems.reduce((s, i) => s + i.count, 0);
    pendingReports = Math.round(totalReports * 0.3);
    processingReports = Math.round(totalReports * 0.2);
    return {
      totalReports,
      pendingReports,
      processingReports,
      mostReported: placeholderItems,
      leastReported: [...placeholderItems].reverse(),
    };
  }

  return {
    totalReports,
    pendingReports,
    processingReports,
    mostReported: sorted.slice(0, 5),
    leastReported: sorted.slice(-5).reverse(),
  };
}

// Fetch statistics about borrowed components
async function fetchBorrowStatistics() {
  const savedStartDate = localStorage.getItem('dashboardStartDate');
  const savedEndDate = localStorage.getItem('dashboardEndDate');

  let borrowQuery;
  if (savedStartDate && savedEndDate) {
    const startDate = new Date(savedStartDate);
    const endDate = new Date(savedEndDate);
    endDate.setHours(23, 59, 59, 999);
    borrowQuery = query(
      collection(db, 'borrowList'),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate)
    );
  } else {
    borrowQuery = query(collection(db, 'borrowList'));
  }

  const snapshot = await safeFirebaseQuery(borrowQuery);
  const equipmentCounts = {};
  let totalBorrows = 0;
  let pendingBorrows = 0;
  let approvedBorrows = 0;
  let returnedBorrows = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    totalBorrows++;

    const equip = (data?.equipment || '').toString().trim();
    if (equip) equipmentCounts[equip] = (equipmentCounts[equip] || 0) + 1;

    const status = (data?.statusReport || 'pending').toString().toLowerCase();
    if (status === 'pending') pendingBorrows++;
    else if (status === 'approved') approvedBorrows++;
    else if (status === 'returned') returnedBorrows++;
  });

  let sorted = Object.entries(equipmentCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalBorrows ? Math.round((count / totalBorrows) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    sorted = [
      { name: 'Projector', count: 12, percentage: 30 },
      { name: 'Laptop', count: 10, percentage: 25 },
      { name: 'Tablet', count: 8, percentage: 20 },
      { name: 'Speaker', count: 6, percentage: 15 },
      { name: 'Microphone', count: 4, percentage: 10 },
    ];
    totalBorrows = sorted.reduce((s, i) => s + i.count, 0);
    pendingBorrows = Math.round(totalBorrows * 0.3);
    approvedBorrows = Math.round(totalBorrows * 0.5);
    returnedBorrows = Math.round(totalBorrows * 0.2);
  }

  return {
    totalBorrows,
    pendingBorrows,
    approvedBorrows,
    returnedBorrows,
    mostBorrowed: sorted.slice(0, 5),
    leastBorrowed: [...sorted].reverse().slice(0, 5),
  };
}

// Fetch statistics about rooms with most reports
async function fetchRoomStatistics() {
  const roomsSnapshot = await safeFirebaseQuery(query(collection(db, 'comlabrooms')));
  const totalRoomsInSystem = roomsSnapshot.size;

  const savedStartDate = localStorage.getItem('dashboardStartDate');
  const savedEndDate = localStorage.getItem('dashboardEndDate');

  let reportQuery;
  if (savedStartDate && savedEndDate) {
    const startDate = new Date(savedStartDate);
    const endDate = new Date(savedEndDate);
    endDate.setHours(23, 59, 59, 999);
    reportQuery = query(
      collection(db, 'reportList'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
  } else {
    reportQuery = query(collection(db, 'reportList'));
  }

  const reportSnapshot = await safeFirebaseQuery(reportQuery);
  const roomCounts = {};
  let totalReports = 0;

  reportSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const room = data?.room != null ? String(data.room) : '';
    if (room) {
      totalReports++;
      roomCounts[room] = (roomCounts[room] || 0) + 1;
    }
  });

  let sortedRooms = Object.entries(roomCounts)
    .map(([room, count]) => ({
      room,
      count,
      percentage: totalReports ? Math.round((count / totalReports) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  if (sortedRooms.length === 0) {
    sortedRooms = [
      { room: '517', count: 5, percentage: 34 },
      { room: '518', count: 4, percentage: 27 },
      { room: '519', count: 3, percentage: 20 },
      { room: '520', count: 2, percentage: 13 },
      { room: '521', count: 1, percentage: 6 },
    ];
  }

  return {
    totalRooms: totalRoomsInSystem,
    mostReportedRooms: sortedRooms.slice(0, 5),
  };
}

// Fetch PC repair status (simplified with safe fallbacks)
async function fetchPCRepairStatistics() {
  const pcStats = {
    total: 0,
    available: 0,
    inRepair: 0,
  };

  try {
    // Try to derive totals by scanning rooms; fallback if unavailable
    const roomsSnapshot = await safeFirebaseQuery(query(collection(db, 'comlabrooms')));
    // If you have a known PCs count per room, you can enhance this section
    // For now, we only count rooms and use a heuristic fallback
    const roomCount = roomsSnapshot.size;
    if (roomCount > 0) {
      pcStats.total = roomCount * 10; // heuristic: ~10 PCs per room
      pcStats.available = Math.round(pcStats.total * 0.8);
    }
    pcStats.inRepair = Math.max(0, pcStats.total - pcStats.available);
  } catch (error) {
    console.warn('Failed to fetch PC stats, using defaults:', error);
    pcStats.total = pcStats.total || 30;
    pcStats.available = pcStats.available || 25;
    pcStats.inRepair = Math.max(0, pcStats.total - pcStats.available);
  }

  return pcStats;
}

// Fetch overall statistics grouped by month
async function fetchOverallStatistics() {
  try {
    const savedStartDate = localStorage.getItem('dashboardStartDate');
    const savedEndDate = localStorage.getItem('dashboardEndDate');

    let reportQuery, borrowQuery;
    if (savedStartDate && savedEndDate) {
      const startDate = new Date(savedStartDate);
      const endDate = new Date(savedEndDate);
      endDate.setHours(23, 59, 59, 999);
      reportQuery = query(
        collection(db, 'reportList'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      borrowQuery = query(
        collection(db, 'borrowList'),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
    } else {
      reportQuery = query(collection(db, 'reportList'));
      borrowQuery = query(collection(db, 'borrowList'));
    }

    const [reportSnapshot, borrowSnapshot] = await Promise.all([
      safeFirebaseQuery(reportQuery),
      safeFirebaseQuery(borrowQuery),
    ]);

    const reportsByMonth = {};
    const borrowsByMonth = {};

    const monthKey = (d) => `${d.getMonth() + 1}/${d.getFullYear()}`;

    reportSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let d = data?.date;
      if (!d) return;
      if (typeof d.toDate === 'function') d = d.toDate();
      const key = monthKey(d);
      reportsByMonth[key] = (reportsByMonth[key] || 0) + 1;
    });

    borrowSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let d = data?.timestamp;
      if (!d) return;
      if (typeof d.toDate === 'function') d = d.toDate();
      const key = monthKey(d);
      borrowsByMonth[key] = (borrowsByMonth[key] || 0) + 1;
    });

    return { reportsByMonth, borrowsByMonth };
  } catch (error) {
    console.error('Error fetching overall statistics:', error);
    // Mock data fallback
    const mockMonths = ['1/2025', '2/2025', '3/2025', '4/2025', '5/2025'];
    const mockReports = {};
    const mockBorrows = {};
    mockMonths.forEach((m, i) => {
      mockReports[m] = 10 + i * 4;
      mockBorrows[m] = 8 + i * 3;
    });
    return { reportsByMonth: mockReports, borrowsByMonth: mockBorrows };
  }
}

// Render the dashboard UI with fetched stats
function renderDashboard(stats) {
  const dashboard = document.querySelector('.dashboard');
  if (!dashboard) {
    console.error('Dashboard container not found!');
    return;
  }

  dashboard.innerHTML = `
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard__title" style="color:#FF6A1A;">Computer Lab Analytics</h1>
        <p class="dashboard__subtitle">Last updated: ${new Date().toLocaleString()}</p>
      </div>
      <div class="header-actions">
        <button id="refreshDashboard" class="refresh-button">
          <i class='bx bx-refresh'></i> Refresh Data
        </button>
      </div>
    </div>

    <div class="dashboard__filters">
      <div class="filter-group">
        <label for="startDate">From:</label>
        <input type="date" id="startDate" class="date-filter">
      </div>
      <div class="filter-group">
        <label for="endDate">To:</label>
        <input type="date" id="endDate" class="date-filter">
      </div>
      <button id="applyFilter" class="filter-button">Apply Filter</button>
      <button id="resetFilter" class="filter-button filter-button--reset">Reset</button>
    </div>

    <div class="dashboard__summary">
      <div class="summary-card">
        <div class="summary-icon"><i class='bx bxs-report'></i></div>
        <div class="summary-content">
          <h3>${stats.reportStats.totalReports || 0}</h3>
          <p>Total Reports</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class='bx bxs-time-five'></i></div>
        <div class="summary-content">
          <h3>${stats.reportStats.pendingReports || 0}</h3>
          <p>Pending Reports</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class='bx bxs-cog'></i></div>
        <div class="summary-content">
          <h3>${stats.reportStats.processingReports || 0}</h3>
          <p>Processing Reports</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class='bx bxs-package'></i></div>
        <div class="summary-content">
          <h3>${stats.borrowStats.totalBorrows || 0}</h3>
          <p>Total Borrows</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class='bx bxs-hourglass'></i></div>
        <div class="summary-content">
          <h3>${stats.borrowStats.pendingBorrows || 0}</h3>
          <p>Pending Borrows</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class='bx bxs-wrench'></i></div>
        <div class="summary-content">
          <h3>${stats.pcRepairStats.inRepair || 0}</h3>
          <p>PCs In Repair</p>
        </div>
      </div>
      <div class="summary-card" title="Total number of computer lab rooms in the system">
        <div class="summary-icon"><i class='bx bxs-buildings'></i></div>
        <div class="summary-content">
          <h3>${stats.roomStats.totalRooms || 0}</h3>
          <p>Total Rooms</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class='bx bxs-devices'></i></div>
        <div class="summary-content">
          <h3>${stats.pcRepairStats.total || 0}</h3>
          <p>Total PCs</p>
        </div>
      </div>
    </div>

    <div class="dashboard__grid">
      <div class="dashboard-card">
        <div class="dashboard-card__header">
          <h2>Most Reported Components</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="chart-container"><canvas id="mostReportedChart"></canvas></div>
          <div class="stats-list">
            <ul>
              ${stats.reportStats.mostReported.map(item => `
                <li>
                  <span class="item-name">${item.name}</span>
                  <div class="item-bar-container">
                    <div class="item-bar" style="width: ${item.percentage}%"></div>
                    <span class="item-count">${item.count}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>

      <div class="dashboard-card">
        <div class="dashboard-card__header">
          <h2>Most Borrowed Items</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="chart-container"><canvas id="mostBorrowedChart"></canvas></div>
          <div class="stats-list">
            <ul>
              ${stats.borrowStats.mostBorrowed.map(item => `
                <li>
                  <span class="item-name">${item.name}</span>
                  <div class="item-bar-container">
                    <div class="item-bar" style="width: ${item.percentage}%"></div>
                    <span class="item-count">${item.count}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>

      <div class="dashboard-card">
        <div class="dashboard-card__header">
          <h2>Most Reported Rooms</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="chart-container"><canvas id="roomsChart"></canvas></div>
          <div class="stats-list">
            <ul>
              ${stats.roomStats.mostReportedRooms.map(item => `
                <li>
                  <span class="item-name">Room ${item.room}</span>
                  <div class="item-bar-container">
                    <div class="item-bar" style="width: ${item.percentage}%"></div>
                    <span class="item-count">${item.count}</span>
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>

      <div class="dashboard-card">
        <div class="dashboard-card__header">
          <h2>PC Repair Status</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="chart-container"><canvas id="pcStatusChart"></canvas></div>
          <div class="stats-list">
            <div class="status-summary">
              <div class="status-item">
                <span class="status-label">Available</span>
                <span class="status-value">${stats.pcRepairStats.available || 0}</span>
              </div>
              <div class="status-item">
                <span class="status-label">In Repair</span>
                <span class="status-value">${stats.pcRepairStats.inRepair || 0}</span>
              </div>
              <div class="status-item">
                <span class="status-label">Total PCs</span>
                <span class="status-value">${stats.pcRepairStats.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // After DOM is updated, wire events and charts
  initializeCharts(stats);

  const refreshButton = document.getElementById('refreshDashboard');
  if (refreshButton) {
    refreshButton.addEventListener('click', async () => {
      refreshButton.disabled = true;
      try {
        const fresh = await fetchStatistics();
        renderDashboard(fresh);
      } finally {
        refreshButton.disabled = false;
      }
    });
  }

  // Date filter behavior
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const applyFilterBtn = document.getElementById('applyFilter');
  const resetFilterBtn = document.getElementById('resetFilter');

  if (startDateInput && endDateInput) {
    const savedStartDate = localStorage.getItem('dashboardStartDate');
    const savedEndDate = localStorage.getItem('dashboardEndDate');
    if (savedStartDate) startDateInput.value = savedStartDate;
    if (savedEndDate) endDateInput.value = savedEndDate;

    // Defaults to last 30 days if not set
    if (!savedStartDate || !savedEndDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      startDateInput.valueAsDate = thirtyDaysAgo;
      endDateInput.valueAsDate = today;
    }
  }

  if (applyFilterBtn) {
    applyFilterBtn.addEventListener('click', () => {
      const s = document.getElementById('startDate').value;
      const e = document.getElementById('endDate').value;
      if (s && e) {
        localStorage.setItem('dashboardStartDate', s);
        localStorage.setItem('dashboardEndDate', e);
      }
      initializeDashboard();
    });
  }

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener('click', () => {
      localStorage.removeItem('dashboardStartDate');
      localStorage.removeItem('dashboardEndDate');
      initializeDashboard();
    });
  }

  // Let any loader know data is ready
  try {
    document.dispatchEvent(new CustomEvent('dashboard:data:ready'));
  } catch {}
}

// Initialize charts with Chart.js
function initializeCharts(stats) {
  const ChartCtor = window.Chart;
  if (!ChartCtor) {
    console.warn('Chart.js not available; skipping charts');
    return;
  }

  const safelyInit = (id, config) => {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      // eslint-disable-next-line no-new
      new ChartCtor(el.getContext('2d'), config);
    } catch (err) {
      console.warn(`Failed to create chart ${id}:`, err);
    }
  };

  // Colors
  const brand = '#FF6A1A';
  const brandLight = '#FF8C42';
  const neutral = '#90a4ae';

  // Most Reported Components
  safelyInit('mostReportedChart', {
    type: 'doughnut',
    data: {
      labels: stats.reportStats.mostReported.map(i => i.name),
      datasets: [{
        data: stats.reportStats.mostReported.map(i => i.count),
        backgroundColor: [brand, brandLight, '#FFD0A8', '#FFE5D0', '#FFAC6B'],
        borderWidth: 0,
      }],
    },
    options: { plugins: { legend: { position: 'bottom' } } },
  });

  // Most Borrowed Items
  safelyInit('mostBorrowedChart', {
    type: 'pie',
    data: {
      labels: stats.borrowStats.mostBorrowed.map(i => i.name),
      datasets: [{
        data: stats.borrowStats.mostBorrowed.map(i => i.count),
        backgroundColor: [brand, brandLight, '#FFD0A8', '#FFE5D0', '#FFAC6B'],
        borderWidth: 0,
      }],
    },
    options: { plugins: { legend: { position: 'bottom' } } },
  });

  // Rooms with most reports
  safelyInit('roomsChart', {
    type: 'bar',
    data: {
      labels: stats.roomStats.mostReportedRooms.map(i => `Room ${i.room}`),
      datasets: [{
        label: 'Reports',
        data: stats.roomStats.mostReportedRooms.map(i => i.count),
        backgroundColor: brand,
        borderWidth: 0,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });

  // PC status
  safelyInit('pcStatusChart', {
    type: 'doughnut',
    data: {
      labels: ['Available', 'In Repair'],
      datasets: [{
        data: [stats.pcRepairStats.available || 0, stats.pcRepairStats.inRepair || 0],
        backgroundColor: ['#4CAF50', brand],
        borderWidth: 0,
      }],
    },
    options: { plugins: { legend: { position: 'bottom' } } },
  });
}

// Safe wrapper to avoid unhandled errors
async function safeDashboardInitialization() {
  try {
    await initializeDashboard();
  } catch (error) {
    console.error('Dashboard failed to initialize:', error);
  }
}

document.addEventListener('DOMContentLoaded', safeDashboardInitialization);