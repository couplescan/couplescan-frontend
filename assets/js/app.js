// --- Configuration ---
// Make sure this URL matches the one Render gave you for your backend.
// For local testing, use: const apiUrl = "http://127.0.0.1:8000";
const apiUrl = "https://couplescan-backend-app.onrender.com"; // Replace with your actual Render URL!
const lemonSqueezyCheckoutLink = "YOUR_LEMON_SQUEEZY_CHECKOUT_LINK"; // Replace with your actual Lemon Squeezy product link!

// --- Get DOM Elements ---
const chatInputElement = document.getElementById("chatInput");
const analyzeButtonElement = document.getElementById("analyzeButton");
const loadingSectionElement = document.getElementById("loadingSection");
const paywallSectionElement = document.getElementById("paywallSection");
const teaserTextElement = document.getElementById("teaserText");
const payButtonElement = document.getElementById("payButton");
const errorSectionElement = document.getElementById("errorSection");
const errorMessageElement = document.getElementById("errorMessage");
const inputSectionElement = document.getElementById("inputSection"); // Added for hiding later
const heroSectionElement = document.getElementById("heroSection");   // Added for hiding later

// --- Helper Functions ---

function showLoading() {
  loadingSectionElement.classList.remove("hidden");
  errorSectionElement.classList.add("hidden"); // Hide previous errors
  paywallSectionElement.classList.add("hidden"); // Hide paywall if shown before
  analyzeButtonElement.disabled = true; // Prevent multiple clicks
  analyzeButtonElement.textContent = "Analyzing..."; // Change button text
}

function hideLoading() {
  loadingSectionElement.classList.add("hidden");
  analyzeButtonElement.disabled = false;
  analyzeButtonElement.textContent = "Analyze My Chat"; // Reset button text
}

function showPaywall(reportId, teaserText) {
  hideLoading(); // Ensure loading is hidden
  heroSectionElement.classList.add("hidden"); // Hide original intro
  inputSectionElement.classList.add("hidden"); // Hide input section
  
  teaserTextElement.textContent = teaserText; // Update teaser text

  // Construct the checkout URL with the report_id embedded
  const checkoutUrlWithId = `${lemonSqueezyCheckoutLink}?checkout[custom][report_id]=${reportId}`;
  payButtonElement.href = checkoutUrlWithId; // Set the button link

  paywallSectionElement.classList.remove("hidden"); // Show the paywall
}

function showError(message) {
  hideLoading(); // Ensure loading is hidden
  errorMessageElement.textContent = message;
  errorSectionElement.classList.remove("hidden");
}

// --- Main Analysis Function ---

async function analyzeChat() {
  const chatLog = chatInputElement.value;

  // Basic validation
  if (!chatLog || chatLog.length < 50) {
    showError("Please paste at least 50 characters of your chat log.");
    return;
  }

  showLoading();

  try {
    const response = await fetch(`${apiUrl}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_log: chatLog }), // Send data as JSON
    });

    // Check if the request was successful (status code 2xx)
    if (!response.ok) {
        // Try to get error details from the response body
        let errorDetail = `HTTP error! Status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail; // Use detail from backend if available
        } catch (e) {
            // If response is not JSON, use the status text
            errorDetail = `${errorDetail} - ${response.statusText}`;
        }
        throw new Error(errorDetail);
    }

    // Parse the JSON response from the backend
    const data = await response.json();

    // Store the report ID locally (optional but can be useful)
    localStorage.setItem('report_id', data.report_id);

    // Show the paywall with the received data
    showPaywall(data.report_id, data.teaser_text);

  } catch (error) {
    console.error("Error during analysis:", error); // Log the full error to the console
    // Display a user-friendly error message
    showError(`Analysis failed: ${error.message}. Please try again later.`);
  }
}

// --- Event Listener ---

// Attach the analyzeChat function to the button's click event
if (analyzeButtonElement) {
    analyzeButtonElement.addEventListener("click", analyzeChat);
} else {
    console.error("Analyze button not found!");
}