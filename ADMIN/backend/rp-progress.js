import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "../../backend/firebase-config.js";
//import { initializeViewDetailsFeature } from "./view-details.js";

const pcGrid = document.querySelector('.pc-grid');
const roomgrid = document.querySelector('.room-grid');
const roomLabel = document.querySelector('.room-label');
const totalRoomsElement = document.querySelector('.room-total');
const totalPCsElement = document.querySelector('.pc-totals');
const totalAvailablePCsElement = document.querySelector('.pc-totals-available');

let totalRooms = 0;
let totalPCs = 0;
let totalAvailablePCs = 0;
let roomDataList = [];
let unsubscribeListeners = [];

let allPCs = {}; // Track all PCs across rooms: { roomId: { pcId: status } }

const roomsQuery = collection(db, "comlabrooms");

onSnapshot(roomsQuery, async (querySnapshot) => {
  // Clean up old PC listeners
  unsubscribeListeners.forEach(unsub => unsub());
  unsubscribeListeners = [];

  totalRooms = querySnapshot.size;
  roomDataList = [];
  allPCs = {}; // Reset allPCs on every room update

  // For each room...
  const roomPromises = querySnapshot.docs.map(async (docSnap) => {
    const roomId = docSnap.id;
    const roomData = docSnap.data();
    const roomNumber = roomData.roomNumber || roomId; // Use roomId as fallback

    allPCs[roomId] = {}; // Initialize room in allPCs
    let pcs = [];

    for (let i = 1; i <= 30; i++) {
      const pcId = `pc${i}`;
      const pcDocRef = doc(db, "comlabrooms", roomId, pcId, "document1");

      const unsubscribe = onSnapshot(pcDocRef, (pcSnap) => {
        if (pcSnap.exists()) {
          const status = pcSnap.data().status;

          // Update this room's PCs list (for rendering)
          const index = pcs.findIndex(pc => pc.id === pcId);
          if (index >= 0) {
            pcs[index].status = status;
          } else {
            pcs.push({ id: pcId, status });
          }

          // Update global allPCs object
          allPCs[roomId][pcId] = status;

          // Recalculate totals across all rooms
          let totalPCCount = 0;
          let totalAvailableCount = 0;
          for (const rId in allPCs) {
            totalPCCount += Object.keys(allPCs[rId]).length;
            totalAvailableCount += Object.values(allPCs[rId]).filter(s => s === "available").length;
          }
          totalPCs = totalPCCount;
          totalAvailablePCs = totalAvailableCount;

          // Update roomDataList with current room PCs
          const roomIndex = roomDataList.findIndex(r => r.id === roomId);
          if (roomIndex >= 0) {
            roomDataList[roomIndex].pcs = pcs;
          } else {
            roomDataList.push({ id: roomId, number: roomNumber, pcs });
          }

          // Update UI stats & re-render if this room is active
          renderStatsAndRooms();
          const activeBtn = document.querySelector('.room-btn.active');
          if (activeBtn && activeBtn.dataset.id === roomId) {
            renderPCs(roomId);
          }
        }
      });

      unsubscribeListeners.push(unsubscribe);
    }
  });

  await Promise.all(roomPromises);

  renderStatsAndRooms();
  pcGrid.innerHTML = ""; // Do not display PCs until a room is clicked
  roomLabel.textContent = "Select a room";
});

const renderStatsAndRooms = () => {
  totalRoomsElement.textContent = totalRooms;
  totalPCsElement.textContent = totalPCs;
  totalAvailablePCsElement.textContent = totalAvailablePCs;

  const roomsHTML = roomDataList
    .sort((a, b) => {
      // Sort by room number, handling both numeric and string values
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    })
    .map(room => `<div class="room-btn" data-id="${room.id}">${room.number}</div>`)
    .join('');

  roomgrid.innerHTML = roomsHTML;

  document.querySelectorAll('.room-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      document.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const roomId = btn.dataset.id;
      await renderPCs(roomId);
    });
  });
};

const renderPCs = async (roomId) => {
  const room = roomDataList.find(r => r.id === roomId);
  if (!room) {
    pcGrid.innerHTML = "<div>Room Not Found</div>";
    return;
  }

  roomLabel.textContent = `Room ${room.number}`;

  const pcsHTML = room.pcs.length === 0
    ? "<div>No PCs found.</div>"
    : room.pcs.map(pc => `
        <div class="pc-item ${pc.status === "available" ? "available" : "not-available"}"
          data-pc="${pc.id}" data-room="${roomId}">
                <div class="pc-circle">
                    <span class="pc-label">${pc.id}</span>
                </div>
            </div>`).join('');

  pcGrid.innerHTML = pcsHTML;
  document.querySelector('.panel-content').innerHTML ="";
  

   // Add click event listener to each PC item
 document.querySelectorAll('.pc-item').forEach(pcItem => {
  pcItem.addEventListener('click', async () => {
    const pcId = pcItem.dataset.pc;
    const roomId = pcItem.dataset.room;

    // Define the function to fetch reports for the selected PC
    async function fetchReportsForPC(roomId, pcId) {
  try {
    const pcCollectionRef = collection(db, `comlabrooms/${roomId}/${pcId}`);
    const pcReportsSnapshot = await getDocs(pcCollectionRef);

    let reportsHTML = "";
    let mainStatus = "N/A";
    let approvedDate = "N/A";
    let issue = "N/A";
    let equipment = "N/A";
    

    // Step 1: Get status from document1 firs
    pcReportsSnapshot.forEach(doc => {
      if (doc.id === "document1") {
        const docData = doc.data();
        if (docData.status) {
          mainStatus = docData.status;
        }
      }
    });

    // Step 2: Now generate reports excluding document1
    pcReportsSnapshot.forEach(doc => {
      if (doc.id === "document1") return;

      const report = doc.data();
       issue = report.issue || "N/A";
       equipment = report.equipment;
      
       approvedDate = report.approvedDate?.toDate
        ? report.approvedDate.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : "N/A";
    

      reportsHTML += `
        <div class="history-item">
          <span class="status-tag status-Repaired">Repaired</span>
          <span class="date">${approvedDate}</span>
          <span class="view-details" data-approved-date="${approvedDate}" data-issue="${issue}" data-equipment="${equipment}"><i class='bx bx-info-circle'></i> View Details</span>
        </div>
      `;
    });
    
    // Step 3: If no reports are found, display "No repair history"
    if (!reportsHTML) {
      reportsHTML = `
        <div class="history-item">
          No repair history
        </div>
      `;
    }
    // Update the UI
    roomLabel.textContent = `Room ${roomId} - PC ${pcId}`;
    document.querySelector('.panel-content').innerHTML = `
  <h3 class="section-title">"SPECIFICATION"</h3>

  <!-- Repair Status Indicator -->
  <div class="status-container">
    <p class="status-label">Status:</p>
    <span class="status-value ${mainStatus === 'available' ? "status-Repaired" : "status-repair"}">
      ${mainStatus === 'available' ? "Available" : "In repair"}
    </span>
  </div>

  <!-- Components Grid - Scrollable Container -->
  <div class="components-grid">
    <div class="component">
      <div class="component-header"><i class="bx bx-cable-connector"></i><span>Ethernet Cable</span></div>
      <div class="component-details">
        <p class="component-description">Category 6 UTP 10ft Network Cable</p>
        <p class="component-status">Description: Standard network cable with RJ-45 connectors, providing reliable Ethernet connectivity.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-desktop"></i><span>Case</span></div>
      <div class="component-details">
        <p class="component-description">DEEPCOOL MATREXX 40 3FS</p>
        <p class="component-status">Description: Mid-tower case with excellent airflow and good cable management.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-power-off"></i><span>Power Supply (PSU)</span></div>
      <div class="component-details">
        <p class="component-description">CORSAIR CV550 550W 80 PLUS Bronze</p>
        <p class="component-status">Description: Reliable power supply with stable delivery and 80+ Bronze efficiency.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-chip"></i><span>Processor (CPU)</span></div>
      <div class="component-details">
        <p class="component-description">INTEL CORE i3-10100F</p>
        <p class="component-status">Description: 4-core/8-thread processor ideal for everyday tasks and moderate workloads.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-circuit-board"></i><span>Motherboard</span></div>
      <div class="component-details">
        <p class="component-description">MSI H510M-A PRO</p>
        <p class="component-status">Description: Supports 10th/11th Gen Intel CPUs with standard connectivity ports.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-memory-card"></i><span>RAM</span></div>
      <div class="component-details">
        <p class="component-description">KINGSTON FURY Beast 8GB DDR4 3200MHz</p>
        <p class="component-status">Description: High-speed RAM for multitasking and performance.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-card"></i><span>Graphics Card</span></div>
      <div class="component-details">
        <p class="component-description">NVIDIA GeForce GTX 1650</p>
        <p class="component-status">Description: Entry-level GPU for light gaming and graphics work.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-hdd"></i><span>Storage</span></div>
      <div class="component-details">
        <p class="component-description">Samsung 970 EVO Plus 500GB NVMe M.2 SSD</p>
        <p class="component-status">Description: High-performance SSD with fast load times.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-desktop"></i><span>Monitor</span></div>
      <div class="component-details">
        <p class="component-description">Dell P2419H 24-inch IPS</p>
        <p class="component-status">Description: Full HD display with color accuracy and ergonomic stand.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-keyboard"></i><span>Keyboard</span></div>
      <div class="component-details">
        <p class="component-description">Logitech K845 Mechanical Keyboard</p>
        <p class="component-status">Description: Durable mechanical keyboard with tactile feedback.</p>
      </div>
    </div>
    <div class="component">
      <div class="component-header"><i class="bx bx-mouse"></i><span>Mouse</span></div>
      <div class="component-details">
        <p class="component-description">Logitech G203 Prodigy</p>
        <p class="component-status">Description: Wired gaming mouse with adjustable DPI and ergonomic design.</p>
      </div>
    </div>
  </div>

  <!-- Repair History Section -->
  <div class="repair-history">
    <h3 class="section-title">REPAIR HISTORY</h3> 
    <div class="repair-history-content">
      <div class="history-items">
        ${reportsHTML}
      </div>
    </div>
  </div>
`;
initializeViewDetailsFeature();


  } catch (error) {
    console.error("Error fetching reports:", error);
    document.querySelector('.panel-content').innerHTML = `
      <p class="error">Failed to load reports. Please try again later.</p>
    `;
  }
}

    // Call the function
    fetchReportsForPC(roomId, pcId);
   });
});

};



function initializeViewDetailsFeature() {
  document.querySelectorAll('.view-details').forEach(cell => {
    cell.addEventListener('click', () => {
      const approvedDate = cell.dataset.approvedDate || "N/A";
      const issue = cell.dataset.issue || "N/A";
      const equipment = cell.dataset.equipment || "N/A";

      let modal = document.querySelector('.details-modal');

      if (!modal) {
        modal = document.createElement('div');
        modal.classList.add('details-modal');
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="details-modal-content">
          <div class="details-modal-header">
            <h3 class="details-modal-title">Repair Details</h3>
            <button class="details-modal-close">&times;</button>
          </div>
          <div class="details-modal-body">
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${approvedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Issue:</span>
              <span class="detail-value">${issue}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Equipment:</span>
              <span class="detail-value">${equipment}</span>
            </div>
          </div>
        </div>
      `;

      modal.classList.add('active');

      const closeButton = modal.querySelector('.details-modal-close');
      closeButton.addEventListener('click', () => {
        modal.classList.remove('active');
      });

      // Optional: close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  });
}
