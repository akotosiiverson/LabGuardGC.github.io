// ===================================
// SIDEBAR MENU ITEM ACTIVE STATE
// ===================================
const allSideMenuItems = document.querySelectorAll('.sidebar__menu--main .sidebar__item .sidebar__link');

allSideMenuItems.forEach(item => {
	const listItem = item.parentElement;

	item.addEventListener('click', function () {
		allSideMenuItems.forEach(i => {
			i.parentElement.classList.remove('sidebar__item--active');
		})
		listItem.classList.add('sidebar__item--active');
	})
});


// ===================================
// TOGGLE SIDEBAR (SHOW/HIDE)
// ===================================
const menuToggle = document.querySelector('.navbar__toggle');
const sidebar = document.getElementById('sidebar');

menuToggle.addEventListener('click', function () {
	// For mobile devices, toggle between show and hide instead of hide and narrow
	if(window.innerWidth <= 768) {
		sidebar.classList.toggle('show');
	} else {
		sidebar.classList.toggle('hide');
	}
})


// ===================================
// RESPONSIVE SIDEBAR BEHAVIOR
// ===================================
// Set initial sidebar state based on screen size
function setSidebarState() {
	if(window.innerWidth < 768) {
		sidebar.classList.remove('hide');
		sidebar.classList.remove('show');
		// On mobile, sidebar is hidden by default via CSS
	} else if(window.innerWidth < 992) {
		sidebar.classList.remove('show');
		// For tablets, show narrow sidebar by default
		sidebar.classList.add('hide');
	} else {
		// For larger screens, show full sidebar
		sidebar.classList.remove('hide');
		sidebar.classList.remove('show');
	}
}

// Set sidebar state on page load
setSidebarState();

// Adjust sidebar on window resize
window.addEventListener('resize', function () {
	setSidebarState();
})

// Close sidebar when clicking outside on mobile
document.addEventListener('click', function(e) {
	// If sidebar is shown on mobile and click is outside sidebar and not on the menu button
	if (window.innerWidth <= 768 && 
		sidebar.classList.contains('show') && 
		!sidebar.contains(e.target) && 
		e.target !== menuToggle) {
		sidebar.classList.remove('show');
	}
});


// ===================================
// DARK/LIGHT MODE TOGGLE
// ===================================
const themeSwitch = document.getElementById('theme-switch');

themeSwitch.addEventListener('change', function () {
	if(this.checked) {
		document.body.classList.add('dark');
	} else {
		document.body.classList.remove('dark');
	}
})

// ===================================
// SAVE USER PREFERENCES
// ===================================
// Save theme preference to localStorage
themeSwitch.addEventListener('change', function() {
	localStorage.setItem('dark-mode', this.checked);
});

// Load theme preference from localStorage
document.addEventListener('DOMContentLoaded', function() {
	if(localStorage.getItem('dark-mode') === 'true') {
		themeSwitch.checked = true;
		document.body.classList.add('dark');
	}
});

// ===================================
// ADD VIEWPORT META TAG IF MISSING
// ===================================
// This ensures proper scaling on mobile devices
(function() {
	let viewportMeta = document.querySelector('meta[name="viewport"]');
	if (!viewportMeta) {
		viewportMeta = document.createElement('meta');
		viewportMeta.name = 'viewport';
		viewportMeta.content = 'width=device-width, initial-scale=1.0';
		document.head.appendChild(viewportMeta);
	}
})();