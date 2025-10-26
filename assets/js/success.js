// --- Configuration ---
// Make sure this URL matches your backend URL on Render.
const apiUrl = "https://couplescan-backend-app.onrender.com"; // Replace with your actual Render URL!

// --- Get DOM Elements ---
const reportStatusElement = document.getElementById("reportStatus");
const reportLoadingElement = document.getElementById("reportLoading");
const reportErrorElement = document.getElementById("reportError");
const reportErrorMessageElement = document.getElementById("reportErrorMessage");
const reportDisplayElement = document.getElementById("reportDisplay");

// --- Helper Functions ---
function showReportLoading() {
    reportStatusElement.classList.remove("hidden");
    reportLoadingElement.classList.remove("hidden");
    reportErrorElement.classList.add("hidden");
    reportDisplayElement.classList.add("hidden");
}

function showReportError(message) {
    reportStatusElement.classList.remove("hidden");
    reportLoadingElement.classList.add("hidden");
    reportErrorMessageElement.textContent = `Error loading report: ${message}. Please contact support if the problem persists.`;
    reportErrorElement.classList.remove("hidden");
    reportDisplayElement.classList.add("hidden");
}

function showReportContent(reportText) {
    reportStatusElement.classList.add("hidden"); // Hide loading/error messages
    reportErrorElement.classList.add("hidden");
    reportDisplayElement.textContent = reportText; // Put the report text in the div
    reportDisplayElement.classList.remove("hidden"); // Show the report div
}

// --- Main Function to Fetch Report ---
async function fetchAndDisplayReport() {
    showReportLoading();

    try {
        // 1. Get the report_id from the URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        // Lemon Squeezy sends it back nested like this: checkout[custom][report_id]
        const reportId = urlParams.get('checkout[custom][report_id]');

        if (!reportId) {
            throw new Error("Report ID not found in URL. Payment might not have completed correctly.");
        }

        // 2. Call the backend's /get_report endpoint
        const response = await fetch(`${apiUrl}/get_report?report_id=${encodeURIComponent(reportId)}`, {
            method: "GET",
            headers: {
                "Accept": "application/json", // We expect JSON back
            }
        });

        // 3. Check if the backend request was successful
        if (!response.ok) {
            let errorDetail = `HTTP error! Status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorDetail = errorData.detail || errorDetail;
            } catch (e) {
                 errorDetail = `${errorDetail} - ${response.statusText}`;
            }
             throw new Error(errorDetail);
        }

        // 4. Parse the JSON response
        const data = await response.json();

        // 5. Display the report
        if (data.full_report) {
            showReportContent(data.full_report);
        } else {
            throw new Error("Report data received from server was incomplete.");
        }

    } catch (error) {
        console.error("Error fetching report:", error);
        showReportError(error.message);
    }
}

// --- Run on Page Load ---
// Automatically call the function when the success page loads
fetchAndDisplayReport();