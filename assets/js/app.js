// --- Configuration ---
const apiUrl = "https://couplescan-backend-app.onrender.com"; // Replace with your actual Render URL!
const lemonSqueezyCheckoutLink = "YOUR_LEMON_SQUEEZY_CHECKOUT_LINK"; // Replace with your actual Lemon Squeezy product link!

// --- Get DOM Elements ---
const userIdentifierElement = document.getElementById("userIdentifier");
const chatInputElement = document.getElementById("chatInput");
const zipFileInputElement = document.getElementById("zipFileInput"); // Added
const analyzeButtonElement = document.getElementById("analyzeButton");
const loadingSectionElement = document.getElementById("loadingSection");
const paywallSectionElement = document.getElementById("paywallSection");
const teaserTextElement = document.getElementById("teaserText");
const payButtonElement = document.getElementById("payButton");
const errorSectionElement = document.getElementById("errorSection");
const errorMessageElement = document.getElementById("errorMessage");
const inputSectionElement = document.getElementById("inputSection");
const heroSectionElement = document.getElementById("heroSection");

// --- Helper Functions (showLoading, hideLoading, showPaywall, showError - remain mostly the same) ---

function showLoading() {
  loadingSectionElement.classList.remove("hidden");
  errorSectionElement.classList.add("hidden"); 
  paywallSectionElement.classList.add("hidden"); 
  analyzeButtonElement.disabled = true; 
  analyzeButtonElement.textContent = "Analyzing..."; 
}

function hideLoading() {
  loadingSectionElement.classList.add("hidden");
  analyzeButtonElement.disabled = false;
  analyzeButtonElement.textContent = "Analyze My Chat"; 
}

function showPaywall(reportId, teaserText) {
  hideLoading(); 
  heroSectionElement.classList.add("hidden"); 
  inputSectionElement.classList.add("hidden"); 

  teaserTextElement.textContent = teaserText; 

  const checkoutUrlWithId = `${lemonSqueezyCheckoutLink}?checkout[custom][report_id]=${reportId}`;
  payButtonElement.href = checkoutUrlWithId; 

  paywallSectionElement.classList.remove("hidden"); 
}

function showError(message) {
  hideLoading(); 
  errorMessageElement.textContent = message;
  errorSectionElement.classList.remove("hidden");
}

// --- Main Analysis Function ---

async function analyzeChat() {
  // Clear previous errors
  errorSectionElement.classList.add("hidden");

  // 1. Get User Identifier
  const userIdentifier = userIdentifierElement ? userIdentifierElement.value.trim() : "";
  if (!userIdentifier) {
    showError("Please enter your name or identifier as it appears in the chat.");
    return; 
  }

  // 2. Determine Input Source (File or Text)
  const file = zipFileInputElement ? zipFileInputElement.files[0] : null;
  const chatLog = chatInputElement ? chatInputElement.value : "";

  const formData = new FormData();
  formData.append('user_identifier', userIdentifier);

  let inputProvided = false;

  if (file) {
      if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
          formData.append('file', file);
          inputProvided = true;
          console.log("Preparing to send zip file..."); // For debugging
      } else {
          showError("Invalid file type. Please upload a .zip file.");
          return;
      }
  } else if (chatLog && chatLog.length >= 50) {
      formData.append('chat_log', chatLog);
      inputProvided = true;
      console.log("Preparing to send chat log text..."); // For debugging
  }

  if (!inputProvided) {
      showError("Please paste at least 50 characters of chat text OR upload a WhatsApp .zip export.");
      return;
  }

  // 3. Show Loading and Make API Call
  showLoading();

  try {
    console.log("Sending request to:", `${apiUrl}/analyze`); // For debugging
    const response = await fetch(`${apiUrl}/analyze`, {
      method: "POST",
      // 'Content-Type' header is set automatically by the browser for FormData
      body: formData, 
    });

    console.log("Received response status:", response.status); // For debugging

    if (!response.ok) {
        let errorDetail = `HTTP error! Status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail; 
        } catch (e) {
            errorDetail = `${errorDetail} - ${response.statusText || 'Server error'}`;
        }
        throw new Error(errorDetail);
    }

    const data = await response.json();
    console.log("Received data:", data); // For debugging

    localStorage.setItem('report_id', data.report_id);
    showPaywall(data.report_id, data.teaser_text);

  } catch (error) {
    console.error("Error during analysis fetch:", error); 
    showError(`Analysis failed: ${error.message}. Please check console or try again later.`);
  }
}

// --- Event Listener ---
if (analyzeButtonElement) {
    analyzeButtonElement.addEventListener("click", analyzeChat);
} else {
    console.error("Analyze button not found!");
}