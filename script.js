// 1. Update File Upload UI when a PDF is selected
document.getElementById('resume').addEventListener('change', function(e) {
    const fileNameElement = document.getElementById('file-name');
    const dropZone = document.getElementById('drop-zone');
    
    if (e.target.files[0]) {
        fileNameElement.innerText = e.target.files[0].name;
        dropZone.classList.add('has-file');
        dropZone.querySelector('i').className = 'fa-solid fa-check-circle';
    } else {
        fileNameElement.innerText = "Click to browse or drag PDF here";
        dropZone.classList.remove('has-file');
        dropZone.querySelector('i').className = 'fa-solid fa-cloud-arrow-up';
    }
});

// 2. Modal Control Functions
function openModal() {
    document.getElementById('result-modal').classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal() {
    document.getElementById('result-modal').classList.remove('show');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Close modal if user clicks outside the white box
document.getElementById('result-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

// 3. Main Analyze Function
async function analyze() {
    const fileInput = document.getElementById("resume");
    const jobInput = document.getElementById("job");
    const modalBody = document.getElementById("modal-body");
    
    // UI Elements
    const btn = document.getElementById("analyze-btn");
    const btnText = document.getElementById("btn-text");
    const btnIcon = document.getElementById("btn-icon");
    const loader = document.getElementById("btn-loader");
    const scoreContainer = document.getElementById('score-container');
    const scoreValue = document.getElementById('score-value');
    const scoreCircle = document.getElementById('score-circle');

    if (!fileInput.files[0]) {
        alert("Please select a PDF file first.");
        return;
    }

    // Set Loading UI State
    btn.disabled = true;
    btnText.innerText = "Analyzing...";
    btnIcon.style.display = "none";
    loader.style.display = "block";
    
    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);
    formData.append("jobDescription", jobInput.value);

    // Your backend URL
    const BACKEND_URL = "https://resume-analyzer-production-64c0.up.railway.app"; 

    try {
        const response = await fetch(`${BACKEND_URL}/analyze`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) {
            // Show server error in modal
            modalBody.innerHTML = `<h3 style="color: red;">Error</h3><p>${data.result}</p>`;
            scoreContainer.style.display = 'none';
            openModal();
        } else {
            const rawText = data.result;
            
            // Regex to find "ATS Score: 92", "**ATS Score:** 92/100", etc.
            const scoreRegex = /ATS Score\s*[:*]*\s*(\d+)/i;
            const match = rawText.match(scoreRegex);
            
            let score = 0;
            
            if (match && match[1]) {
                score = parseInt(match[1]);
                scoreContainer.style.display = 'flex';
                
                // Reset animation state instantly
                scoreCircle.style.transition = 'none';
                scoreCircle.style.strokeDashoffset = 251.2;
                scoreValue.innerText = "0%";
                
                // Delay animation slightly so the modal has time to open first
                setTimeout(() => {
                    scoreCircle.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease';
                    const circumference = 251.2; 
                    const offset = circumference - (score / 100) * circumference;
                    scoreCircle.style.strokeDashoffset = offset;
                    
                    // Color coding based on score
                    if (score >= 80) scoreCircle.style.stroke = '#10b981'; // Green for Great
                    else if (score >= 50) scoreCircle.style.stroke = '#f59e0b'; // Orange for Okay
                    else scoreCircle.style.stroke = '#ef4444'; // Red for Needs Work

                    // Animate the number counting up
                    let currentScore = 0;
                    const duration = 1500; // 1.5 seconds
                    const intervalTime = Math.max(10, duration / (score || 1));
                    
                    const interval = setInterval(() => {
                        currentScore++;
                        scoreValue.innerText = `${currentScore}%`;
                        if (currentScore >= score) {
                            scoreValue.innerText = `${score}%`;
                            clearInterval(interval);
                        }
                    }, intervalTime);
                }, 300);
            } else {
                // If no score is found, hide the circle
                scoreContainer.style.display = 'none';
            }

            // Inject the rest of the formatted Markdown
            modalBody.innerHTML = marked.parse(rawText);
            openModal();
        }
    } catch (error) {
        // Handle network/fetch errors
        scoreContainer.style.display = 'none';
        modalBody.innerHTML = `<h3 style="color: red;">Connection Error</h3><p>Ensure the server is running. Check console for details.</p>`;
        openModal();
        console.error("Fetch error:", error);
    } finally {
        // Reset Button UI State
        btn.disabled = false;
        btnText.innerText = "Analyze Resume";
        btnIcon.style.display = "inline-block";
        loader.style.display = "none";
    }
}
