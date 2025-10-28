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

// Helper function to export data to CSV format
function exportToCSV(data, filename = 'dashboard-stats.csv') {
  // Convert data to CSV format
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Add header row
  const headers = Object.keys(data[0]).join(',');
  csvContent += headers + '\r\n';
  
  // Add data rows
  data.forEach(item => {
    const values = Object.values(item).join(',');
    csvContent += values + '\r\n';
  });
  
  // Create a hidden link and trigger download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
  // Check for date filters
  const savedStartDate = localStorage.getItem('dashboardStartDate');
  const savedEndDate = localStorage.getItem('dashboardEndDate');
  
  let reportQuery;
  if (savedStartDate && savedEndDate) {
    const startDate = new Date(savedStartDate);
    // End date needs to be set to end of day
    const endDate = new Date(savedEndDate);
    endDate.setHours(23, 59, 59, 999);
    
    reportQuery = query(
      collection(db, "reportList"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    );
  } else {
    reportQuery = query(collection(db, "reportList"));
  }
  
  const querySnapshot = await safeFirebaseQuery(reportQuery);
    const equipmentCounts = {};
  let totalReports = 0;
  let pendingReports = 0;
  let processingReports = 0;
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.equipment) {
      equipmentCounts[data.equipment] = (equipmentCounts[data.equipment] || 0) + 1;
      totalReports++;
      
      // Count reports by status
      const status = data.statusReport ? data.statusReport.toLowerCase() : 'pending';
      if (status === 'pending') pendingReports++;
      else if (status === 'processing') processingReports++;
    }
  });
  // Convert to array and sort by count  
  const sortedEquipment = Object.entries(equipmentCounts)
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / totalReports) * 100) }))
    .sort((a, b) => b.count - a.count);
    
  // If there's no data, provide sample data for visualization
  if (sortedEquipment.length === 0) {
    const placeholderItems = [
      { name: "Keyboard", count: 15, percentage: 30 },
      { name: "Monitor", count: 12, percentage: 24 },
      { name: "Mouse", count: 10, percentage: 20 },
      { name: "CPU", count: 8, percentage: 16 },
      { name: "Headset", count: 5, percentage: 10 }
    ];    totalReports = placeholderItems.reduce((sum, item) => sum + item.count, 0);
    pendingReports = Math.round(totalReports * 0.3); // Sample data
    processingReports = Math.round(totalReports * 0.2); // Sample data
    return {
      totalReports,
      pendingReports,
      processingReports,
      mostReported: placeholderItems,
      leastReported: [...placeholderItems].reverse()
    };
  }
  return {
    totalReports,
    pendingReports,
    processingReports,
    mostReported: sortedEquipment.slice(0, 5),
    leastReported: sortedEquipment.slice(-5).reverse()
  };
}

// Fetch statistics about borrowed components
async function fetchBorrowStatistics() {
  // Check for date filters
  const savedStartDate = localStorage.getItem('dashboardStartDate');
  const savedEndDate = localStorage.getItem('dashboardEndDate');
  
  let borrowQuery;
  if (savedStartDate && savedEndDate) {
    const startDate = new Date(savedStartDate);
    // End date needs to be set to end of day
    const endDate = new Date(savedEndDate);
    endDate.setHours(23, 59, 59, 999);
    
    borrowQuery = query(
      collection(db, "borrowList"),
      where("timestamp", ">=", startDate),
      where("timestamp", "<=", endDate)
    );
  } else {
    borrowQuery = query(collection(db, "borrowList"));
  }
  
  const querySnapshot = await safeFirebaseQuery(borrowQuery);
  
  const equipmentCounts = {};
  let totalBorrows = 0;
  let pendingBorrows = 0;
  let approvedBorrows = 0;
  let returnedBorrows = 0;
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    totalBorrows++;
    
    if (data.equipment) {
      equipmentCounts[data.equipment] = (equipmentCounts[data.equipment] || 0) + 1;
    }
      const status = data.statusReport ? data.statusReport.toLowerCase() : 'pending';
    if (status === 'pending') pendingBorrows++;
    else if (status === 'approved') approvedBorrows++;
    else if (status === 'returned') returnedBorrows++;
  });

  // Convert to array and sort by count  
  let sortedEquipment = Object.entries(equipmentCounts)
    .map(([name, count]) => ({ name, count, percentage: Math.round((count / totalBorrows) * 100) }))
    .sort((a, b) => b.count - a.count);

  // If there's no data, provide sample data
  if (sortedEquipment.length === 0) {
    sortedEquipment = [
      { name: "Projector", count: 12, percentage: 30 },
      { name: "Laptop", count: 10, percentage: 25 },
      { name: "Tablet", count: 8, percentage: 20 },
      { name: "Speaker", count: 6, percentage: 15 },
      { name: "Microphone", count: 4, percentage: 10 }
    ];
    totalBorrows = sortedEquipment.reduce((sum, item) => sum + item.count, 0);
    pendingBorrows = Math.round(totalBorrows * 0.3);
    approvedBorrows = Math.round(totalBorrows * 0.5);
    returnedBorrows = Math.round(totalBorrows * 0.2);
  }

  return {
    totalBorrows,
    pendingBorrows,
    approvedBorrows,
    returnedBorrows,
    mostBorrowed: sortedEquipment.slice(0, 5),
    leastBorrowed: [...sortedEquipment].reverse().slice(0, 5)
  };
}

// Fetch statistics about rooms with most reports
async function fetchRoomStatistics() {
  // First, get the accurate total room count from comlabrooms collection
  const roomsQuery = query(collection(db, "comlabrooms"));
  const roomsSnapshot = await safeFirebaseQuery(roomsQuery);
  const totalRoomsInSystem = roomsSnapshot.size;
  
  // Check for date filters
  const savedStartDate = localStorage.getItem('dashboardStartDate');
  const savedEndDate = localStorage.getItem('dashboardEndDate');
  
  let reportQuery;
  if (savedStartDate && savedEndDate) {
    const startDate = new Date(savedStartDate);
    // End date needs to be set to end of day
    const endDate = new Date(savedEndDate);
    endDate.setHours(23, 59, 59, 999);
    
    reportQuery = query(
      collection(db, "reportList"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "desc")
    );
  } else {
    reportQuery = query(collection(db, "reportList"));
  }
  
  const querySnapshot = await safeFirebaseQuery(reportQuery);
  
  const roomCounts = {};
  let totalReports = 0;
  
  // Count reports per room
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.room) {
      const roomId = data.room.toString();
      roomCounts[roomId] = (roomCounts[roomId] || 0) + 1;
      totalReports++;
    }
  });
  
  // Convert to array and sort by count
  let sortedRooms = Object.entries(roomCounts)
    .map(([room, count]) => ({ room, count, percentage: Math.round((count / totalReports) * 100) }))
    .sort((a, b) => b.count - a.count);
    
  // If no data available, provide sample data
  if (sortedRooms.length === 0) {
    sortedRooms = [
      { room: "517", count: 15, percentage: 35 },
      { room: "520", count: 12, percentage: 28 },
      { room: "523", count: 8, percentage: 19 },
      { room: "518", count: 5, percentage: 12 },
      { room: "525", count: 2, percentage: 6 }
    ];
    totalReports = sortedRooms.reduce((sum, item) => sum + item.count, 0);
  }

  return {
    totalRooms: totalRoomsInSystem, // Use the accurate count from comlabrooms collection
    mostReportedRooms: sortedRooms.slice(0, 5)
  };
}

// Fetch PC repair history statistics
async function fetchPCRepairStatistics() {
  // Stats object to return
  const pcStats = {
    total: 0,
    available: 0,
    inRepair: 0,
    repairHistory: []
  };
  
  try {
    // First, get the accurate counts from comlabrooms collection like in rp-progress.js
    const roomsQuery = query(collection(db, "comlabrooms"));
    const roomsSnapshot = await safeFirebaseQuery(roomsQuery);
    
    // Initialize counts
    let totalCount = 0;
    let availableCount = 0;
    
    // Process each room to get PC counts
    const roomPromises = roomsSnapshot.docs.map(async (roomDoc) => {
      const roomId = roomDoc.id;
      
      // Get all PCs in this room (up to 30 PCs per room)
      for (let i = 1; i <= 30; i++) {
        const pcId = `pc${i}`;
        const pcDocRef = doc(db, "comlabrooms", roomId, pcId, "document1");
        
        try {
          const pcSnap = await getDoc(pcDocRef);
          if (pcSnap.exists()) {
            totalCount++;
            
            // Count available PCs
            const status = pcSnap.data().status;
            if (status === "available") {
              availableCount++;
            }
          }
        } catch (err) {
          console.warn(`Could not fetch PC ${pcId} in room ${roomId}:`, err);
        }
      }
    });
    
    // Wait for all room processing to complete
    await Promise.all(roomPromises);
    
    // Update stats with accurate counts
    pcStats.total = totalCount;
    pcStats.available = availableCount;
    pcStats.inRepair = totalCount - availableCount;
    
    // Now get repair history
    const savedStartDate = localStorage.getItem('dashboardStartDate');
    const savedEndDate = localStorage.getItem('dashboardEndDate');
    
    let reportQuery;
    if (savedStartDate && savedEndDate) {
      const startDate = new Date(savedStartDate);
      const endDate = new Date(savedEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      reportQuery = query(
        collection(db, "reportList"),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
      );
    } else {
      reportQuery = query(collection(db, "reportList"));
    }
    
    const reportSnapshot = await safeFirebaseQuery(reportQuery);
    
    // Process reports for repair history
    const roomPcMap = new Map();
    const issueCount = {};
    
    reportSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.room && data.pc) {
        // Create a unique key for this room-pc combination
        const key = `${data.room}-${data.pc}`;
        
        // Track repair history
        pcStats.repairHistory.push({
          room: data.room,
          pc: data.pc,
          equipment: data.equipment,
          issue: data.issue,
          date: data.date,
          status: data.statusReport
        });
        
        // Count issues
        if (data.issue) {
          issueCount[data.issue] = (issueCount[data.issue] || 0) + 1;
        }
        
        // For PC total count, only count each PC once
        if (!roomPcMap.has(key)) {
          roomPcMap.set(key, data.statusReport);
          pcStats.total++;
          
          // Count status
          if (data.statusReport === "Approved") {
            pcStats.available++;
          } else {
            pcStats.inRepair++;
          }
        }
      }
    });
      // Only use fallback if we failed to get counts directly
    if (pcStats.total === 0) {
      console.warn("No PC count data available, using fallback values");
      pcStats.total = 30;  // Default assumption
      pcStats.available = 25;
      pcStats.inRepair = 5;
    }
    
    // Get top issues
    pcStats.topIssues = Object.entries(issueCount)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
  } catch (error) {
    console.error("Error fetching PC repair statistics:", error);
    // Set default values in case of error
    pcStats.total = 30;
    pcStats.available = 25;
    pcStats.inRepair = 5;
  }
  
  return pcStats;
}

// Fetch overall statistics
async function fetchOverallStatistics() {
  try {
    // Check for date filters
    const savedStartDate = localStorage.getItem('dashboardStartDate');
    const savedEndDate = localStorage.getItem('dashboardEndDate');
    
    let reportQuery, borrowQuery;
    
    if (savedStartDate && savedEndDate) {
      const startDate = new Date(savedStartDate);
      // End date needs to be set to end of day
      const endDate = new Date(savedEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      reportQuery = query(
        collection(db, "reportList"),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
      );
      
      borrowQuery = query(
        collection(db, "borrowList"),
        where("timestamp", ">=", startDate),
        where("timestamp", "<=", endDate)
      );
    } else {
      reportQuery = query(collection(db, "reportList"));
      borrowQuery = query(collection(db, "borrowList"));
    }
    
    const [reportSnapshot, borrowSnapshot] = await Promise.all([
      safeFirebaseQuery(reportQuery),
      safeFirebaseQuery(borrowQuery)
    ]);
    
    const reportsByMonth = {};
    const borrowsByMonth = {};
    
    // Process reports
    reportSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.date) {
        const date = data.date.toDate();
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        reportsByMonth[monthYear] = (reportsByMonth[monthYear] || 0) + 1;
      }
    });
    
    // Process borrows
    borrowSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.timestamp) {
        const date = data.timestamp.toDate();
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        borrowsByMonth[monthYear] = (borrowsByMonth[monthYear] || 0) + 1;
      }
    });
    
    return {      reportsByMonth,
      borrowsByMonth
    };
  } catch (error) {
    console.error("Error fetching overall statistics:", error);
    // Create some default mock data for visualization
    const mockMonths = ['1/2025', '2/2025', '3/2025', '4/2025', '5/2025'];
    const mockReports = {};
    const mockBorrows = {};
    
    mockMonths.forEach((month, idx) => {
      mockReports[month] = Math.floor(Math.random() * 10) + 5;
      mockBorrows[month] = Math.floor(Math.random() * 8) + 3;
    });
    
    return {
      reportsByMonth: mockReports,
      borrowsByMonth: mockBorrows
    };
  }
}

// Render the dashboard with the fetched statistics
function renderDashboard(stats) {
  const dashboard = document.querySelector('.dashboard');
  
  if (!dashboard) {
    console.error("Dashboard container not found!");
    return;
  }
    dashboard.innerHTML = `    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="dashboard__title">Computer Lab Dashboard</h1>
        <p class="dashboard__subtitle">Last updated: ${new Date().toLocaleString()}</p>
      </div>
      <div class="header-actions">
        <button id="exportDashboard" class="export-button">
          <i class='bx bx-download'></i> Export Data
        </button>
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
          <h3>${stats.reportStats.totalReports}</h3>
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
          <h3>${stats.borrowStats.totalBorrows}</h3>
          <p>Total Borrows</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class='bx bxs-hourglass'></i></div>
        <div class="summary-content">
          <h3>${stats.borrowStats.pendingBorrows}</h3>
          <p>Pending Borrows</p>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon"><i class='bx bxs-wrench'></i></div>
        <div class="summary-content">
          <h3>${stats.pcRepairStats.inRepair || 0}</h3>
          <p>PCs In Repair</p>
        </div>
      </div>      <div class="summary-card" title="Total number of computer lab rooms in the system">
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
      <!-- Most/Least Reported Components -->
      <div class="dashboard-card">
        <div class="dashboard-card__header">
          <h2>Most Reported Components</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="chart-container">
            <canvas id="mostReportedChart"></canvas>
          </div>
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

      <!-- Most/Least Borrowed Components -->
      <div class="dashboard-card">
        <div class="dashboard-card__header">
          <h2>Most Borrowed Items</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="chart-container">
            <canvas id="mostBorrowedChart"></canvas>
          </div>
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
      
      <!-- Rooms with Most Reports -->
      <div class="dashboard-card">
        <div class="dashboard-card__header">
          <h2>Most Reported Rooms</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="chart-container">
            <canvas id="roomsChart"></canvas>
          </div>
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
      
      <!-- PC Repair Status -->
      <div class="dashboard-card">
        <div class="dashboard-card__header">
          <h2>PC Repair Status</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="chart-container">
            <canvas id="pcStatusChart"></canvas>
          </div>
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
        <!-- Monthly Trends -->
      <div class="dashboard-card dashboard-card--full">
        <div class="dashboard-card__header">
          <h2>Monthly Activity Trends</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="chart-container">
            <canvas id="monthlyTrendsChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- PC Repair History -->
      <div class="dashboard-card dashboard-card--full">
        <div class="dashboard-card__header">
          <h2>PC Repair History</h2>
        </div>
        <div class="dashboard-card__body">
          <div class="repair-history-container">
            <table class="repair-history-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>PC</th>
                  <th>Equipment</th>
                  <th>Issue</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${stats.pcRepairStats.repairHistory && stats.pcRepairStats.repairHistory.length > 0 ? 
                  stats.pcRepairStats.repairHistory.slice(0, 10).map(repair => `
                    <tr>
                      <td>${repair.room || 'N/A'}</td>
                      <td>${repair.pc || 'N/A'}</td>
                      <td>${repair.equipment || 'N/A'}</td>
                      <td>${repair.issue || 'N/A'}</td>
                      <td>${repair.date ? repair.date.toDate().toLocaleDateString() : 'N/A'}</td>
                      <td class="status-${(repair.status || '').toLowerCase()}">${repair.status || 'Pending'}</td>
                    </tr>
                  `).join('') : 
                  '<tr><td colspan="6">No repair history available</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
    // Initialize charts once the HTML is rendered
  initializeCharts(stats);    // Add refresh button functionality
  const refreshButton = document.getElementById('refreshDashboard');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      dashboard.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Refreshing dashboard data...</p>
        </div>
      `;
      setTimeout(initializeDashboard, 500);
    });
  }
    // Add export functionality
  const exportButton = document.getElementById('exportDashboard');
  if (exportButton) {
    exportButton.addEventListener('click', () => {
      // Prepare data for comprehensive export
      const summaryData = [
        {
          reportType: 'Summary',
          category: 'Reports',
          item: 'Total Reports',
          count: stats.reportStats.totalReports,
          date: new Date().toISOString().split('T')[0]
        },
        {
          reportType: 'Summary',
          category: 'Reports',
          item: 'Pending Reports',
          count: stats.reportStats.pendingReports,
          date: new Date().toISOString().split('T')[0]
        },
        {
          reportType: 'Summary',
          category: 'Reports',
          item: 'Processing Reports',
          count: stats.reportStats.processingReports,
          date: new Date().toISOString().split('T')[0]
        },
        {
          reportType: 'Summary',
          category: 'Borrows',
          item: 'Total Borrows',
          count: stats.borrowStats.totalBorrows,
          date: new Date().toISOString().split('T')[0]
        },
        {
          reportType: 'Summary',
          category: 'Borrows',
          item: 'Pending Borrows',
          count: stats.borrowStats.pendingBorrows,
          date: new Date().toISOString().split('T')[0]
        },
        {
          reportType: 'Summary',
          category: 'Borrows',
          item: 'Approved Borrows',
          count: stats.borrowStats.approvedBorrows,
          date: new Date().toISOString().split('T')[0]
        },        {
          reportType: 'Summary',
          category: 'Rooms',
          item: 'Total Rooms',
          count: stats.roomStats.totalRooms,
          note: 'Total number of computer lab rooms in the system',
          date: new Date().toISOString().split('T')[0]
        },
        {
          reportType: 'Summary',
          category: 'PCs',
          item: 'Total PCs',
          count: stats.pcRepairStats.total,
          date: new Date().toISOString().split('T')[0]
        },
        {
          reportType: 'Summary',
          category: 'PCs',
          item: 'Available PCs',
          count: stats.pcRepairStats.available,
          date: new Date().toISOString().split('T')[0]
        },
        {
          reportType: 'Summary',
          category: 'PCs',
          item: 'PCs In Repair',
          count: stats.pcRepairStats.inRepair,
          date: new Date().toISOString().split('T')[0]
        }
      ];
      
      const detailData = [];
      
      // Add report statistics
      stats.reportStats.mostReported.forEach(item => {
        detailData.push({
          reportType: 'Detail',
          category: 'Most Reported Components',
          item: item.name,
          count: item.count,
          percentage: item.percentage + '%',
          date: new Date().toISOString().split('T')[0]
        });
      });
      
      // Add borrow statistics
      stats.borrowStats.mostBorrowed.forEach(item => {
        detailData.push({
          reportType: 'Detail',
          category: 'Most Borrowed Items',
          item: item.name,
          count: item.count,
          percentage: item.percentage + '%',
          date: new Date().toISOString().split('T')[0]
        });
      });
        // Add room statistics
      stats.roomStats.mostReportedRooms.forEach(item => {
        detailData.push({
          reportType: 'Detail',
          category: 'Most Reported Rooms',
          item: 'Room ' + item.room,
          count: item.count,
          percentage: item.percentage + '%',
          note: 'Number of reports for this room',
          date: new Date().toISOString().split('T')[0]
        });
      });
      
      // Add special note about total rooms count
      detailData.push({
        reportType: 'Detail',
        category: 'Room Information',
        item: 'Total Rooms',
        count: stats.roomStats.totalRooms,
        note: 'Total number of lab rooms across all buildings',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Add PC repair history if available
      if (stats.pcRepairStats.repairHistory && stats.pcRepairStats.repairHistory.length > 0) {
        stats.pcRepairStats.repairHistory.forEach(repair => {
          detailData.push({
            reportType: 'Detail',
            category: 'PC Repair History',
            item: `Room ${repair.room}-PC ${repair.pc}`,
            equipment: repair.equipment || 'N/A',
            issue: repair.issue || 'N/A',
            status: repair.status || 'N/A',
            date: repair.date ? repair.date.toDate().toISOString().split('T')[0] : 'N/A'
          });
        });
      }
      
      // Add monthly trend data
      const months = Object.keys(stats.overallStats.reportsByMonth || {});
      months.forEach(month => {
        detailData.push({
          reportType: 'Monthly',
          category: 'Report Trends',
          month: month,
          count: stats.overallStats.reportsByMonth[month],
          date: new Date().toISOString().split('T')[0]
        });
      });
      
      const months2 = Object.keys(stats.overallStats.borrowsByMonth || {});
      months2.forEach(month => {
        detailData.push({
          reportType: 'Monthly',
          category: 'Borrow Trends',
          month: month,
          count: stats.overallStats.borrowsByMonth[month],
          date: new Date().toISOString().split('T')[0]
        });
      });
      
      // Combine all data for export
      const exportData = [...summaryData, ...detailData];
        // Export to CSV with a more descriptive filename
      exportToCSV(exportData, `computer-lab-statistics-${new Date().toISOString().split('T')[0]}.csv`);
      
      // Show confirmation message
      const confirmationMsg = document.createElement('div');
      confirmationMsg.className = 'export-confirmation';
      confirmationMsg.innerHTML = `
        <p><i class='bx bx-check-circle'></i> Dashboard data successfully exported with ${stats.roomStats.totalRooms} rooms information.</p>
      `;
      document.querySelector('.dashboard-header').appendChild(confirmationMsg);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        if (confirmationMsg.parentNode) {
          confirmationMsg.parentNode.removeChild(confirmationMsg);
        }
      }, 3000);
    });
  }
  
  // Set up date filters
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const applyFilterBtn = document.getElementById('applyFilter');
  const resetFilterBtn = document.getElementById('resetFilter');
  
  if (startDateInput && endDateInput && applyFilterBtn && resetFilterBtn) {
    // Set default dates (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    startDateInput.valueAsDate = thirtyDaysAgo;
    endDateInput.valueAsDate = today;
    
    // Apply filter functionality
    applyFilterBtn.addEventListener('click', () => {
      const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
      const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
      
      if (startDate && endDate && startDate > endDate) {
        alert('Start date cannot be after end date');
        return;
      }
      
      dashboard.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Filtering data...</p>
        </div>
      `;
      
      // Apply filter and reload dashboard with filtered data
      localStorage.setItem('dashboardStartDate', startDateInput.value);
      localStorage.setItem('dashboardEndDate', endDateInput.value);
      
      setTimeout(initializeDashboard, 500);
    });
    
    // Reset filter functionality
    resetFilterBtn.addEventListener('click', () => {
      localStorage.removeItem('dashboardStartDate');
      localStorage.removeItem('dashboardEndDate');
      
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      startDateInput.valueAsDate = thirtyDaysAgo;
      endDateInput.valueAsDate = today;
      
      dashboard.innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Resetting filters...</p>
        </div>
      `;
      
      setTimeout(initializeDashboard, 500);
    });
    
    // Export data functionality
    const exportButton = document.getElementById('exportData');
    if (exportButton) {
      exportButton.addEventListener('click', () => {
        // Prepare data for export
        const exportData = {
          reports: stats.reportStats.mostReported,
          borrows: stats.borrowStats.mostBorrowed,
          rooms: stats.roomStats.mostReportedRooms,
          pcRepair: stats.pcRepairStats.repairHistory
        };
        
        // Convert to CSV format
        let csvContent = 'data:text/csv;charset=utf-8,';
        
        // Add header row
        const headers = 'Type,Name,Count,Percentage';
        csvContent += headers + '\r\n';
        
        // Add data rows
        Object.keys(exportData).forEach(key => {
          exportData[key].forEach(item => {
            const values = [key, item.name, item.count, item.percentage].join(',');
            csvContent += values + '\r\n';
          });
        });
        
        // Create a hidden link and trigger download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'dashboard_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
    
    // Load saved filters if any
    const savedStartDate = localStorage.getItem('dashboardStartDate');
    const savedEndDate = localStorage.getItem('dashboardEndDate');
    
    if (savedStartDate) startDateInput.value = savedStartDate;
    if (savedEndDate) endDateInput.value = savedEndDate;
  }
}

// Initialize all charts with the statistics data
function initializeCharts(stats) {
  // Function to safely initialize a chart
  function safelyInitializeChart(chartId, chartConfig) {
    try {
      const chartElement = document.getElementById(chartId);
      if (!chartElement) {
        console.error(`Chart element with id '${chartId}' not found.`);
        return null;
      }
      
      return new Chart(chartElement, chartConfig);
    } catch (error) {
      console.error(`Error initializing chart '${chartId}':`, error);
      return null;
    }
  }
  
  try {    // Most Reported Components Chart
    safelyInitializeChart('mostReportedChart', {    type: 'pie',
    data: {
      labels: stats.reportStats.mostReported.map(item => item.name),
      datasets: [{
        data: stats.reportStats.mostReported.map(item => item.count),
        backgroundColor: [
          '#FF6A1A', '#FF8C42', '#FFAC6B', '#FFD0A8', '#FFE5D0'
        ],
        borderColor: '#FFFFFF',
        borderWidth: 1,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const item = stats.reportStats.mostReported[context.dataIndex];
              return ` ${item.name}: ${item.count} (${item.percentage}%)`;
            }
          }
        }
      }
    }  });
  // Most Borrowed Items Chart
  safelyInitializeChart('mostBorrowedChart', {
    type: 'pie',
    data: {
      labels: stats.borrowStats.mostBorrowed.map(item => item.name),
      datasets: [{
        data: stats.borrowStats.mostBorrowed.map(item => item.count),
        backgroundColor: [
          '#FF6A1A', '#FF8C42', '#FFAC6B', '#FFD0A8', '#FFE5D0'
        ],
        borderColor: '#FFFFFF',
        borderWidth: 1,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
        }
      }
    }  });
  // Rooms Chart
  safelyInitializeChart('roomsChart', {
    type: 'bar',
    data: {
      labels: stats.roomStats.mostReportedRooms.map(item => `Room ${item.room}`),
      datasets: [{
        label: '# of Reports',
        data: stats.roomStats.mostReportedRooms.map(item => item.count),
        backgroundColor: '#FF6A1A',
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {
          display: false,
        }
      }
    }  });
  // PC Status Chart
  safelyInitializeChart('pcStatusChart', {
    type: 'doughnut',
    data: {
      labels: ['Available', 'In Repair'],
      datasets: [{
        data: [stats.pcRepairStats.available || 0, stats.pcRepairStats.inRepair || 0],
        backgroundColor: ['#4CAF50', '#FF6A1A'],
        borderColor: '#FFFFFF',
        borderWidth: 1,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true
    }
  });
  
  // Monthly Trends Chart
  const months = Object.keys(stats.overallStats.reportsByMonth || {});
  const reportCounts = months.map(month => stats.overallStats.reportsByMonth[month] || 0);
  const borrowCounts = months.map(month => stats.overallStats.borrowsByMonth[month] || 0);  
  safelyInitializeChart('monthlyTrendsChart', {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Reports',
          data: reportCounts,
          borderColor: '#FF6A1A',
          backgroundColor: 'rgba(255, 106, 26, 0.1)',
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: 'Borrows',
          data: borrowCounts,
          borderColor: '#FFB067',
          backgroundColor: 'rgba(255, 176, 103, 0.1)',
          borderWidth: 2,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Monthly Reports and Borrows'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Month/Year'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Count'
          },
          beginAtZero: true
        }      }
    }
  });
  } catch (error) {
    console.error("Error initializing charts:", error);
    document.querySelector('.dashboard').innerHTML += `
      <div class="error-container">
        <p class="error-message">There was an error loading some charts. Please try refreshing the page.</p>
      </div>
    `;
  }
}

// Safe wrapper for dashboard initialization to prevent crashes
async function safeDashboardInitialization() {
  try {
    await initializeDashboard();
  } catch (error) {
    console.error("Dashboard initialization failed:", error);
    document.querySelector('.dashboard').innerHTML = `
      <div class="error-container">
        <p class="error-message">We encountered an error while loading the dashboard.</p>
        <button class="retry-button">Try Again</button>
      </div>
    `;
    
    // Add retry functionality
    document.querySelector('.retry-button')?.addEventListener('click', () => {
      document.querySelector('.dashboard').innerHTML = `
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading statistics...</p>
        </div>
      `;
      setTimeout(safeDashboardInitialization, 500);
    });
  }
}

// Initialize the dashboard when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', safeDashboardInitialization);
