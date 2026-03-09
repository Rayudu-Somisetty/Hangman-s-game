// Word lists
const easyWords = [
    "apple", "beach", "bread", "bridge", "butter", "camera", "castle", "chair", "cheese", "church",
    "circle", "clock", "cloud", "coffee", "cookie", "cotton", "cousin", "credit", "dancer", "dinner",
    "doctor", "dollar", "donkey", "dragon", "dream", "driver", "eagle", "earth", "engine", "family",
    "father", "field", "finger", "flower", "forest", "friend", "garden", "glass", "glove", "guitar",
    "hammer", "handle", "harbor", "health", "heart", "heaven", "hockey", "horse", "hotel", "house",
    "humor", "island", "jacket", "jungle", "kettle", "keyboard", "kidney", "kitchen", "knife", "ladder",
    "laptop", "laugh", "lemon", "letter", "light", "lizard", "lunch", "magnet", "market", "memory",
    "mirror", "monkey", "nature", "needle", "nickel", "night", "number", "ocean", "office", "orange",
    "orchid", "palace", "paper", "pencil", "person", "phone", "piano", "picnic", "pillow", "planet",
    "queen", "rabbit", "radio", "rocket", "roller", "saddle", "safety", "school", "screen", "secret",
    "shadow", "shirt", "silver", "sister", "snake", "spider", "spring", "square", "table", "target",
    "teacher", "temple", "ticket", "tiger", "toilet", "tomato", "tongue", "tower", "train", "travel",
    "tunnel", "turtle", "uncle", "valley", "vessel", "violin", "walker", "wallet", "walnut", "water",
    "weapon", "weather", "window", "winter", "wizard", "worker", "writer", "yellow", "zebra", "zigzag",
    "zipper", "zodiac", "zombie"
];

const mediumWords = [
    "absolute", "academic", "accident", "activity", "addition", "alphabet", "altitude", "analysis",
    "ancestor", "apartment", "appetite", "argument", "atlantic", "attitude", "audience", "bachelor",
    "bacteria", "balloon", "barbecue", "baseball", "birthday", "boundary", "business", "calendar",
    "capacity", "category", "champion", "charcoal", "chemical", "chimney", "chocolate", "civilian",
    "database", "daughter", "delivery", "designer", "desktop", "dialogue", "diamond", "dinosaur",
    "disaster", "distance", "district", "division", "document", "domestic", "dynamite", "economic",
    "educated", "election", "electric", "elephant", "emerald", "employee", "engineer", "enormous",
    "envelope", "equation", "evidence", "exercise", "external", "facility", "familiar", "festival",
    "forecast", "fountain", "friction", "friendly", "gallery", "garbage", "gateway", "general",
    "genetic", "geometry", "glacial", "glisten", "goodbye", "graduate", "graphics", "gravity",
    "greatest", "grocery", "guardian", "handshake", "hardware", "harmonic", "harvest", "heritage",
    "history", "holiday", "hospital", "identity", "ignition", "illusion", "incident", "industry",
    "infinite", "innocent", "instance", "internal", "internet", "invasion", "invisible", "isolated"
];

// Game state
let currentWord = '';
let guessedLetters = [];
let wrongAttempts = 0;
let maxAttempts = 6;
let difficulty = '';
let hintsUsed = 0;

// Multi-word game state
let selectedWordCount = 1;
let wordsList = [];
let currentWordIndex = 0;
let score = 0;

// Canvas for hangman drawing
let canvas, ctx;

// Particle system for win/lose effect
let particles = [];
let particleCanvas, particleCtx;

// Initialize
window.onload = function() {
    canvas = document.getElementById('hangmanCanvas');
    ctx = canvas.getContext('2d');
    
    particleCanvas = document.getElementById('particleCanvas');
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    particleCtx = particleCanvas.getContext('2d');
    
    // Set initial canvas size based on screen
    adjustCanvasSize();
    
    showScreen('menuScreen');
};

// Adjust canvas size for responsive design
function adjustCanvasSize() {
    const screenWidth = window.innerWidth;
    
    if (screenWidth <= 480) {
        // Mobile portrait
        canvas.width = 320;
        canvas.height = 400;
    } else if (screenWidth <= 768) {
        // Mobile landscape / tablets
        canvas.width = 400;
        canvas.height = 480;
    } else {
        // Desktop
        canvas.width = 450;
        canvas.height = 500;
    }
    
    // Redraw hangman if in game
    if (document.getElementById('gameScreen').classList.contains('active')) {
        drawHangman();
    }
}

// Screen management
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showMenu() {
    showScreen('menuScreen');
    particles = [];
    // Reset background to default gradient
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

// Select word count
function selectWordCount(count) {
    selectedWordCount = count;
    
    // Update button states
    const buttons = document.querySelectorAll('.word-count-btn');
    buttons.forEach(btn => {
        if (parseInt(btn.getAttribute('data-count')) === count) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Start game
function startGame(level) {
    difficulty = level;
    
    // Generate list of words based on selected count
    wordsList = [];
    const sourceWords = level === 'easy' ? easyWords : mediumWords;
    const shuffled = [...sourceWords].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < selectedWordCount; i++) {
        wordsList.push(shuffled[i]);
    }
    
    // Reset game state for multi-word session
    currentWordIndex = 0;
    score = 0;
    
    // Update progress display
    document.getElementById('totalWords').textContent = selectedWordCount;
    document.getElementById('totalWordsScore').textContent = selectedWordCount;
    
    // Start first word
    loadNextWord();
    
    showScreen('gameScreen');
}

// Load next word in the list
function loadNextWord() {
    if (currentWordIndex >= wordsList.length) {
        // All words completed - show final results
        showFinalResults();
        return;
    }
    
    currentWord = wordsList[currentWordIndex];
    
    // Reset word-specific state
    guessedLetters = [];
    wrongAttempts = 0;
    hintsUsed = 0;
    
    // Update UI
    document.getElementById('currentDifficulty').textContent = difficulty.toUpperCase();
    document.getElementById('attemptsLeft').textContent = maxAttempts;
    document.getElementById('currentWordNum').textContent = currentWordIndex + 1;
    document.getElementById('currentScore').textContent = score;
    
    // Initialize hints
    updateHintDisplay();
    
    // Create letter buttons
    createLetterButtons();
    
    // Display word
    updateWordDisplay();
    
    // Draw initial hangman canvas
    drawHangman();
}

// Create letter buttons
function createLetterButtons() {
    const lettersGrid = document.getElementById('lettersGrid');
    lettersGrid.innerHTML = '';
    
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    
    for (let letter of alphabet) {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = letter.toUpperCase();
        btn.onclick = () => guessLetter(letter, btn);
        lettersGrid.appendChild(btn);
    }
}

// Guess letter
function guessLetter(letter, btn) {
    if (guessedLetters.includes(letter)) return;
    
    guessedLetters.push(letter);
    btn.classList.add('used');
    
    if (currentWord.includes(letter)) {
        // Correct guess
        updateWordDisplay();
        checkWin();
    } else {
        // Wrong guess
        wrongAttempts++;
        document.getElementById('attemptsLeft').textContent = maxAttempts - wrongAttempts;
        drawHangman();
        
        if (wrongAttempts >= maxAttempts) {
            // Add dramatic death animation
            animateHangmanDeath();
            // Wait longer to show the dead hangman with X eyes before game over
            setTimeout(() => endGame(false), 2000);
        }
    }
}

// Update word display
function updateWordDisplay() {
    const wordDisplay = document.getElementById('wordDisplay');
    wordDisplay.innerHTML = '';
    
    for (let letter of currentWord) {
        const letterBox = document.createElement('div');
        letterBox.className = 'letter-box';
        
        if (guessedLetters.includes(letter)) {
            letterBox.textContent = letter.toUpperCase();
        } else {
            letterBox.classList.add('empty');
        }
        
        wordDisplay.appendChild(letterBox);
    }
}

// Check win condition
function checkWin() {
    const allGuessed = currentWord.split('').every(letter => guessedLetters.includes(letter));
    
    if (allGuessed) {
        setTimeout(() => endGame(true), 500);
    }
}

// Hint system - Reveals one random unrevealed letter
function useHint() {
    if (hintsUsed >= 3) return; // All hints used
    
    // Get unrevealed letters
    const unrevealedLetters = [];
    for (let i = 0; i < currentWord.length; i++) {
        const letter = currentWord[i];
        if (!guessedLetters.includes(letter)) {
            unrevealedLetters.push(letter);
        }
    }
    
    // If no unrevealed letters, don't use hint
    if (unrevealedLetters.length === 0) return;
    
    // Pick a random unrevealed letter
    const randomLetter = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
    
    // Add to guessed letters
    guessedLetters.push(randomLetter);
    
    // Find and disable the letter button
    const letterButtons = document.querySelectorAll('.letter-btn');
    letterButtons.forEach(btn => {
        if (btn.textContent.toLowerCase() === randomLetter) {
            btn.classList.add('used');
        }
    });
    
    // Update hint display
    hintsUsed++;
    updateHintDisplay();
    
    // Update word display
    updateWordDisplay();
    
    // Check if won
    checkWin();
}

function updateHintDisplay() {
    const hintsLeftElement = document.getElementById('hintsLeft');
    const hintButton = document.getElementById('hintButton');
    const hintsRemaining = 3 - hintsUsed;
    
    hintsLeftElement.textContent = hintsRemaining;
    
    if (hintsRemaining === 0) {
        hintButton.disabled = true;
        hintButton.classList.add('disabled');
    } else {
        hintButton.disabled = false;
        hintButton.classList.remove('disabled');
    }
}

// Animate hangman death with dramatic effect
function animateHangmanDeath() {
    const canvasElement = document.getElementById('hangmanCanvas');
    let shakeCount = 0;
    const maxShakes = 8;
    
    const shakeInterval = setInterval(() => {
        if (shakeCount < maxShakes) {
            // Shake effect
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            canvasElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            
            // Flash red background
            if (shakeCount % 2 === 0) {
                canvasElement.style.filter = 'brightness(1.3) saturate(1.5) hue-rotate(-10deg)';
            } else {
                canvasElement.style.filter = 'brightness(1)';
            }
            
            shakeCount++;
        } else {
            // Reset effects
            canvasElement.style.transform = 'translate(0, 0)';
            canvasElement.style.filter = 'none';
            clearInterval(shakeInterval);
        }
    }, 100);
}

// End game
function endGame(won) {
    if (won) {
        score++;
        document.getElementById('currentScore').textContent = score;
    }
    
    // Move to next word after a delay
    currentWordIndex++;
    
    if (currentWordIndex < wordsList.length) {
        // More words to go - show transition
        setTimeout(() => {
            showWordTransition(won);
        }, 1000);
    } else {
        // All words completed - show final results
        setTimeout(() => {
            showFinalResults();
        }, 1500);
    }
}

// Show transition between words
function showWordTransition(won) {
    const message = won ? '✓ Correct! Next word...' : '✗ Failed! Next word...';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'word-transition-overlay';
    overlay.innerHTML = `<div class="transition-message ${won ? 'success' : 'failure'}">${message}</div>`;
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.remove();
        loadNextWord();
    }, 1500);
}

// Show final results
function showFinalResults() {
    const resultTitle = document.getElementById('resultTitle');
    const revealWord = document.getElementById('revealWord');
    const resultWord = document.getElementById('resultWord');
    
    const percentage = Math.round((score / wordsList.length) * 100);
    
    if (percentage === 100) {
        resultTitle.textContent = 'PERFECT SCORE!';
        resultTitle.className = 'result-title win';
        document.body.style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
    } else if (percentage >= 70) {
        resultTitle.textContent = 'GREAT JOB!';
        resultTitle.className = 'result-title win';
        document.body.style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
    } else if (percentage >= 50) {
        resultTitle.textContent = 'GOOD EFFORT!';
        resultTitle.className = 'result-title';
        resultTitle.style.color = '#fbbf24';
        document.body.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
    } else {
        resultTitle.textContent = 'GAME OVER!';
        resultTitle.className = 'result-title lose';
        document.body.style.background = 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)';
    }
    
    // Show final score
    resultWord.innerHTML = `
        <div class="final-score-container">
            <div class="final-score">Final Score: <span class="score-number">${score}/${wordsList.length}</span></div>
            <div class="score-percentage">${percentage}%</div>
        </div>
    `;
    revealWord.textContent = '';
    
    // Create particles
    createParticles(percentage >= 50);
    animateParticles();
    
    showScreen('resultScreen');
}

// Draw hangman with 3D effect
function drawHangman() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale factor based on canvas size (450x500 is base)
    const scaleX = canvas.width / 450;
    const scaleY = canvas.height / 500;
    
    // Helper function to scale coordinates
    const sx = (x) => x * scaleX;
    const sy = (y) => y * scaleY;
    
    // Colors for 3D effect
    const brown = '#8B4513';
    const darkBrown = '#654321';
    const lightBrown = '#B8860B';
    
    // Base platform (3D ellipse)
    ctx.fillStyle = darkBrown;
    ctx.beginPath();
    ctx.ellipse(sx(225), sy(460), sx(100), sy(15), 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = brown;
    ctx.beginPath();
    ctx.ellipse(sx(225), sy(455), sx(100), sy(15), 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = lightBrown;
    ctx.beginPath();
    ctx.ellipse(sx(225), sy(453), sx(85), sy(12), 0, 0, Math.PI * 2);
    ctx.fill();
    
    if (wrongAttempts > 0) {
        // Vertical pole with 3D effect
        draw3DRect(ctx, sx(215), sy(150), sx(20), sy(305), brown, darkBrown, lightBrown, scaleX, scaleY);
    }
    
    if (wrongAttempts > 1) {
        // Horizontal pole with 3D effect
        draw3DRect(ctx, sx(235), sy(150), sx(140), sy(20), brown, darkBrown, lightBrown, scaleX, scaleY);
    }
    
    if (wrongAttempts > 2) {
        // Rope with 3D effect
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 4 * scaleX;
        ctx.beginPath();
        ctx.moveTo(sx(375), sy(170));
        ctx.lineTo(sx(375), sy(220));
        ctx.stroke();
        
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2 * scaleX;
        ctx.beginPath();
        ctx.moveTo(sx(373), sy(170));
        ctx.lineTo(sx(373), sy(220));
        ctx.stroke();
    }
    
    if (wrongAttempts > 3) {
        // Head with 3D sphere effect
        drawSphere(ctx, sx(375), sy(250), sx(30), '#FFDCB0', '#FFE4C4', scaleX);
        
        // Draw expressive face based on wrongAttempts
        ctx.strokeStyle = '#000';
        ctx.fillStyle = '#000';
        ctx.lineCap = 'round';
        
        // wrongAttempts = 4: Happy face (just got head)
        if (wrongAttempts === 4) {
            // Happy eyes - open circles
            ctx.lineWidth = 2 * scaleX;
            ctx.beginPath();
            ctx.arc(sx(365), sy(245), sx(4), 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(sx(385), sy(245), sx(4), 0, Math.PI * 2);
            ctx.fill();
            
            // Happy eyebrows - raised
            ctx.lineWidth = 2 * scaleX;
            ctx.beginPath();
            ctx.moveTo(sx(360), sy(238));
            ctx.quadraticCurveTo(sx(365), sy(236), sx(370), sy(238));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(sx(380), sy(238));
            ctx.quadraticCurveTo(sx(385), sy(236), sx(390), sy(238));
            ctx.stroke();
            
            // Happy smile
            ctx.lineWidth = 2.5 * scaleX;
            ctx.beginPath();
            ctx.arc(sx(375), sy(258), sx(10), 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
        // wrongAttempts = 5: Worried face (body + arms added)
        else if (wrongAttempts === 5) {
            // Worried eyes - slightly larger, more alert
            ctx.lineWidth = 2 * scaleX;
            ctx.beginPath();
            ctx.arc(sx(365), sy(245), sx(3.5), 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(sx(385), sy(245), sx(3.5), 0, Math.PI * 2);
            ctx.fill();
            
            // Worried eyebrows - angled up in middle
            ctx.lineWidth = 2 * scaleX;
            ctx.beginPath();
            ctx.moveTo(sx(360), sy(238));
            ctx.quadraticCurveTo(sx(365), sy(234), sx(370), sy(236));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(sx(380), sy(236));
            ctx.quadraticCurveTo(sx(385), sy(234), sx(390), sy(238));
            ctx.stroke();
            
            // Worried mouth - straight line
            ctx.lineWidth = 2 * scaleX;
            ctx.beginPath();
            ctx.moveTo(sx(365), sy(265));
            ctx.lineTo(sx(385), sy(265));
            ctx.stroke();
        }
        // wrongAttempts >= 6: Dead face (legs added - game over with X eyes)
        else if (wrongAttempts >= 6) {
            // Dead eyes - X shaped
            ctx.lineWidth = 3 * scaleX;
            
            // Left eye X
            ctx.beginPath();
            ctx.moveTo(sx(362), sy(242));
            ctx.lineTo(sx(368), sy(248));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(sx(368), sy(242));
            ctx.lineTo(sx(362), sy(248));
            ctx.stroke();
            
            // Right eye X
            ctx.beginPath();
            ctx.moveTo(sx(382), sy(242));
            ctx.lineTo(sx(388), sy(248));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(sx(388), sy(242));
            ctx.lineTo(sx(382), sy(248));
            ctx.stroke();
            
            // Tongue sticking out (dead expression)
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.ellipse(sx(380), sy(268), sx(8), sx(6), 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5 * scaleX;
            ctx.beginPath();
            ctx.ellipse(sx(380), sy(268), sx(8), sx(6), 0, 0, Math.PI * 2);
            ctx.stroke();
            
            // Open mouth
            ctx.fillStyle = '#000';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2.5 * scaleX;
            ctx.beginPath();
            ctx.arc(sx(375), sy(265), sx(8), 0.1, Math.PI - 0.1);
            ctx.stroke();
        }
        
        // Restore lineCap
        ctx.lineCap = 'butt';
    }
    
    if (wrongAttempts > 4) {
        // Body with 3D cylinder effect
        draw3DCylinder(ctx, sx(375), sy(280), sx(8), sy(70), '#CCC', '#DDD', scaleX, scaleY);
        
        // Arms with 3D effect
        draw3DLine(ctx, sx(375), sy(300), sx(345), sy(330), sx(6), '#BBB', '#DDD', scaleX);
        draw3DLine(ctx, sx(375), sy(300), sx(405), sy(330), sx(6), '#BBB', '#DDD', scaleX);
    }
    
    if (wrongAttempts > 5) {
        // Legs with 3D effect
        draw3DLine(ctx, sx(375), sy(350), sx(350), sy(400), sx(6), '#BBB', '#DDD', scaleX);
        draw3DLine(ctx, sx(375), sy(350), sx(400), sy(400), sx(6), '#BBB', '#DDD', scaleX);
    }
}

// 3D drawing helpers
function draw3DRect(ctx, x, y, width, height, color, darkColor, lightColor, scaleX = 1, scaleY = 1) {
    // Shadow
    ctx.fillStyle = darkColor;
    ctx.fillRect(x + 3 * scaleX, y + 3 * scaleY, width, height);
    
    // Main rectangle
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    
    // Highlight
    ctx.fillStyle = lightColor;
    ctx.fillRect(x, y, width * 0.3, height * 0.4);
}

function drawSphere(ctx, cx, cy, radius, color, highlightColor, scale = 1) {
    // Shadow
    ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(cx + 2 * scale, cy + 2 * scale, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Main circle
    const gradient = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
    gradient.addColorStop(0, highlightColor);
    gradient.addColorStop(1, color);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
}

function draw3DCylinder(ctx, x, y, width, height, color, lightColor, scaleX = 1, scaleY = 1) {
    // Shadow
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = width * 2 + 2 * scaleX;
    ctx.beginPath();
    ctx.moveTo(x + 2 * scaleX, y);
    ctx.lineTo(x + 2 * scaleX, y + height);
    ctx.stroke();
    
    // Main cylinder
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
    
    // Highlight
    ctx.strokeStyle = lightColor;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x - width * 0.5, y);
    ctx.lineTo(x - width * 0.5, y + height);
    ctx.stroke();
}

function draw3DLine(ctx, x1, y1, x2, y2, width, color, lightColor, scale = 1) {
    // Shadow
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = width + 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x1 + 2 * scale, y1 + 2 * scale);
    ctx.lineTo(x2 + 2 * scale, y2 + 2 * scale);
    ctx.stroke();
    
    // Main line
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Highlight
    ctx.strokeStyle = lightColor;
    ctx.lineWidth = width * 0.5;
    ctx.beginPath();
    ctx.moveTo(x1 - scale, y1 - scale);
    ctx.lineTo(x2 - scale, y2 - scale);
    ctx.stroke();
}

// Particle system
function createParticles(won) {
    particles = [];
    const color = won ? '#FFD700' : '#EF4444';
    
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: particleCanvas.width / 2,
            y: particleCanvas.height / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: Math.random() * -8 - 2,
            color: color,
            life: Math.random() * 60 + 60,
            maxLife: Math.random() * 60 + 60,
            size: Math.random() * 5 + 3
        });
    }
}

function animateParticles() {
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    particles = particles.filter(particle => particle.life > 0);
    
    particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.3; // Gravity
        particle.life--;
        
        const alpha = particle.life / particle.maxLife;
        particleCtx.fillStyle = particle.color;
        particleCtx.globalAlpha = alpha;
        
        particleCtx.beginPath();
        particleCtx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        particleCtx.fill();
    });
    
    particleCtx.globalAlpha = 1;
    
    if (particles.length > 0) {
        requestAnimationFrame(animateParticles);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (particleCanvas) {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }
    
    // Adjust hangman canvas size
    adjustCanvasSize();
});
