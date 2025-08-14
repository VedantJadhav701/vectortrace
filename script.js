document.addEventListener('DOMContentLoaded', function() {
    // --- Three.js Hero Background Animation ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('hero-canvas'), alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const particlesCount = 5000;
    const positions = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 10;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.005,
        color: 0x3b82f6
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    camera.position.z = 5;

    const animate = function () {
        requestAnimationFrame(animate);
        particles.rotation.x += 0.0001;
        particles.rotation.y += 0.0002;
        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Shared Elements & Functions ---
    const codeInput = document.getElementById('code-input');
    const scannerOutput = document.getElementById('scanner-output');
    const exampleBtn = document.getElementById('example-btn');
    const scanBtn = document.getElementById('scan-btn');
    const fixBtn = document.getElementById('fix-btn');
    const featureDescriptionInput = document.getElementById('feature-description');
    const threatModelerOutput = document.getElementById('threat-modeler-output');
    const threatModelBtn = document.getElementById('threat-model-btn');

    const exampleCode = `
// Vulnerable Python Flask code
import sqlite3
from flask import Flask, request

app = Flask(__name__)

@app.route("/user")
def get_user():
    user_id = request.args.get('id')
    db = sqlite3.connect('database.db')
    cursor = db.cursor()
    
    # This line is vulnerable to SQL Injection
    query = "SELECT * FROM users WHERE id = " + user_id
    cursor.execute(query)
    
    user = cursor.fetchone()
    db.close()
    return str(user)
            `;

    const toggleButtonLoadingState = (button, isLoading) => {
        if (!button) return;
        button.disabled = isLoading;
        const text = button.querySelector('.btn-text');
        const spinner = button.querySelector('.loading-spinner-wrapper');
        const icon = button.querySelector('.scan-icon-wrapper');

        if (isLoading) {
            text.textContent = text.textContent.startsWith('✨') ? '✨ Analyzing...' : 'Analyzing...';
            spinner.classList.remove('hidden');
            icon.classList.add('hidden');
        } else {
            if (button.id === 'scan-btn') text.textContent = 'Scan Code';
            if (button.id === 'fix-btn') text.textContent = '✨ Fix & Explain Code';
            if (button.id === 'threat-model-btn') text.textContent = '✨ Analyze for Threats';
            spinner.classList.add('hidden');
            icon.classList.remove('hidden');
        }
    };

    // --- Mock Responses for Offline Demo ---
    const mockScanResponse = `
VectorTrace Security Analysis Report
------------------------------------

**Vulnerability Type:** SQL Injection (CWE-89)
**Severity:** Critical

**Explanation:**
The application code constructs a raw SQL query by directly concatenating user-supplied input ('id' parameter) into the query string. An attacker can provide malicious SQL code as the 'id' parameter (e.g., '1 OR 1=1') to manipulate the database query, bypass authentication, or exfiltrate data.

**Vulnerable Code:**
\`\`\`python
query = "SELECT * FROM users WHERE id = " + user_id
\`\`\`
            `;

    const mockFixResponse = `
The Fix (Corrected Code)
------------------------
Here is the secure, corrected version of the code:

\`\`\`python
import sqlite3
from flask import Flask, request

app = Flask(__name__)

@app.route("/user")
def get_user():
    user_id = request.args.get('id')
    db = sqlite3.connect('database.db')
    cursor = db.cursor()
    
    # Use a parameterized query to prevent SQL injection
    query = "SELECT * FROM users WHERE id = ?"
    cursor.execute(query, (user_id,))
    
    user = cursor.fetchone()
    db.close()
    return str(user)
\`\`\`

Explanation
-----------
1.  **Why it was Vulnerable:** The original code directly inserted the \`user_id\` variable into the SQL query string. This is dangerous because an attacker could enter SQL commands instead of a simple ID, and the database would execute them.

2.  **How it's Fixed:** The corrected code uses a **parameterized query** (also known as a prepared statement).
    * The SQL query is written with a placeholder (\`?\`).
    * The user-provided \`user_id\` is passed as a separate argument to \`cursor.execute()\`.
    * The database driver then safely combines the query and the parameter, ensuring that the user input is treated only as data, not as executable code. This makes SQL injection impossible.
            `;

    const mockThreatModelResponse = `
VectorTrace AI Threat Model
---------------------------
Feature: "A user profile page where users can upload a profile picture and update their bio."

Here are potential security risks and recommended mitigations:

**1. Threat/Vulnerability:** Unrestricted File Upload (CWE-434)
   - **Potential Impact:** Remote Code Execution. An attacker could upload a malicious script (e.g., a PHP shell) instead of an image, then execute it on the server.
   - **Recommended Mitigation:**
     - Implement a strict allow-list for file extensions (e.g., '.jpg', '.png', '.gif').
     - Do not trust the file's MIME type; verify the file content itself.
     - Store uploaded files in a non-executable directory outside the web root.
     - Rename uploaded files to a random string to prevent direct access.

**2. Threat/Vulnerability:** Cross-Site Scripting (XSS) in Bio (CWE-79)
   - **Potential Impact:** Session Hijacking, Defacement. An attacker could inject malicious JavaScript into their bio. When other users view the profile, the script executes in their browser.
   - **Recommended Mitigation:**
     - Sanitize all user input. Use a trusted library to strip any HTML/script tags before storing the bio in the database.
     - When displaying the bio, ensure it is properly HTML-encoded so the browser treats it as text, not code.

**3. Threat/Vulnerability:** Cross-Site Request Forgery (CSRF) on Profile Update (CWE-352)
   - **Potential Impact:** Unauthorized Profile Changes. An attacker could trick a logged-in user into clicking a malicious link that secretly changes their bio or profile picture without their consent.
   - **Recommended Mitigation:**
     - Implement anti-CSRF tokens. Generate a unique, unpredictable token for each user session and require it to be submitted with any form that changes data.
            `;

    // --- Vulnerability Scanner Logic ---
    if(exampleBtn) {
        exampleBtn.addEventListener('click', () => {
            codeInput.value = exampleCode;
        });
    }

    if(scanBtn) {
        scanBtn.addEventListener('click', () => {
            const code = codeInput.value.trim();
            if (!code) {
                scannerOutput.innerHTML = '<p class="text-red-400">Please paste some code to analyze.</p>';
                return;
            }
            toggleButtonLoadingState(scanBtn, true);
            scannerOutput.innerHTML = '<p class="text-blue-400">AI is analyzing the code. This may take a moment...</p>';

            setTimeout(() => {
                scannerOutput.innerHTML = `<pre class="output-pre">${mockScanResponse}</pre>`;
                toggleButtonLoadingState(scanBtn, false);
            }, 1500); // Simulate network delay
        });
    }

    if(fixBtn) {
        fixBtn.addEventListener('click', () => {
            const code = codeInput.value.trim();
            if (!code) {
                scannerOutput.innerHTML = '<p class="text-red-400">Please paste some code to fix.</p>';
                return;
            }
            toggleButtonLoadingState(fixBtn, true);
            scannerOutput.innerHTML = '<p class="text-purple-400">✨ AI is generating a fix and explanation...</p>';
            
            setTimeout(() => {
                scannerOutput.innerHTML = `<pre class="output-pre">${mockFixResponse}</pre>`;
                toggleButtonLoadingState(fixBtn, false);
            }, 2000); // Simulate network delay
        });
    }

    // --- Threat Modeler Logic ---
    if(threatModelBtn) {
        threatModelBtn.addEventListener('click', () => {
            const description = featureDescriptionInput.value.trim();
            if (!description) {
                threatModelerOutput.innerHTML = '<p class="text-red-400">Please describe the feature you want to analyze.</p>';
                return;
            }
            toggleButtonLoadingState(threatModelBtn, true);
            threatModelerOutput.innerHTML = '<p class="text-purple-400">✨ AI is brainstorming potential threats...</p>';

            setTimeout(() => {
                threatModelerOutput.innerHTML = `<pre class="output-pre">${mockThreatModelResponse}</pre>`;
                toggleButtonLoadingState(threatModelBtn, false);
            }, 2500); // Simulate network delay
        });
    }
});
