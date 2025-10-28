import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

  const auth = getAuth();

  async function checkAdmin() {
    const user = auth.currentUser;

    if (!user) {
      // Not logged in, redirect to login page
      window.location.href = "../index.htm";
      return;
    }

    try {
      const idTokenResult = await user.getIdTokenResult();

      if (idTokenResult.claims.admin) {
        // User is admin — stay on this page or do admin stuff
        console.log("Welcome, admin!");
      } else {
        // Not admin — redirect to not authorized page
        window.location.href = "../index.htm";
      }
    } catch (error) {
      console.error("Error checking admin claim:", error);
      // Redirect to error or login page if needed
      window.location.href = "../index.htm";
    }
  }

  // Wait for Firebase Auth to initialize and user to be ready
  auth.onAuthStateChanged((user) => {
    if (user) {
      checkAdmin();
    } else {
      // No user logged in, redirect to login
      window.location.href = "../index.htm";
    }
  });