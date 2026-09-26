let propertiesData = [];
let challengesData = [];
let scores = { blue: { money: 0, props: 0 }, yellow: { money: 0, props: 0 } };
let currentSelectedProperty = null;

// Initialize app
async function init() {
    try {
        // Fetch JSON data
        const propRes = await fetch('properties.json');
        propertiesData = await propRes.json();
        
        const challRes = await fetch('challenges.json');
        challengesData = await challRes.json();

        renderDropdowns();
    } catch (error) {
        console.error("Error loading JSON data. If running locally, ensure you use a local web server (e.g., Live Server).", error);
    }
}

// Group properties by colour and render the UI
function renderDropdowns() {
    const container = document.getElementById('property-container');
    container.innerHTML = '';

    // Grouping
    const grouped = propertiesData.reduce((acc, prop) => {
        if (!acc[prop.colour]) {
            acc[prop.colour] = { colorCode: prop.colourCode, items: [] };
        }
        acc[prop.colour].items.push(prop);
        return acc;
    }, {});

    // Rendering
    Object.keys(grouped).forEach(colourName => {
        const group = grouped[colourName];
        
        const section = document.createElement('div');
        section.className = 'mb-3 bg-white rounded-lg shadow-sm overflow-hidden';
        
        // Dropdown Header
        const header = document.createElement('button');
        header.className = 'w-full flex justify-between items-center p-4 text-left font-bold text-gray-800 transition-colors active:bg-gray-100';
        header.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="w-6 h-6 rounded-full shadow-inner" style="background-color: ${group.colorCode};"></span>
                <span class="uppercase tracking-wide">${colourName}</span>
            </div>
            <span class="text-xl transform transition-transform duration-300 pointer-events-none" id="icon-${colourName}">+</span>
        `;
        
        // Dropdown Content
        const content = document.createElement('div');
        content.id = `content-${colourName}`;
        content.className = 'accordion-content bg-gray-50';
        
        let buttonsHtml = '';
        group.items.forEach(prop => {
            buttonsHtml += `
                <button id="btn-${prop.id}" onclick="openModal('${prop.id}')" 
                class="w-full text-left p-3 border-t border-gray-200 hover:bg-gray-100 transition-colors font-medium pl-12 relative flex items-center justify-between">
                    <span>${prop.name}</span>
                    <span class="text-xs font-bold text-gray-500">£${prop.value}</span>
                </button>
            `;
        });
        content.innerHTML = buttonsHtml;

        header.onclick = () => toggleAccordion(colourName, content);
        
        section.appendChild(header);
        section.appendChild(content);
        container.appendChild(section);
    });
}

function toggleAccordion(colourName, contentElement) {
    const icon = document.getElementById(`icon-${colourName}`);
    if (contentElement.style.maxHeight) {
        contentElement.style.maxHeight = null;
        icon.style.transform = 'rotate(0deg)';
    } else {
        contentElement.style.maxHeight = contentElement.scrollHeight + "px";
        icon.style.transform = 'rotate(45deg)';
    }
}

function openModal(propId) {
    currentSelectedProperty = propertiesData.find(p => p.id === propId);
    const challenge = challengesData.find(c => c.id === propId);
    
    // Populate Modal Data
    document.getElementById('modal-prop-name').innerText = currentSelectedProperty.name;
    document.getElementById('modal-color-header').style.backgroundColor = currentSelectedProperty.colourCode;
    // Contrast text based on background color if needed (simplified to white for dark colors in Monopoly usually)
    document.getElementById('modal-color-header').style.color = ["Yellow", "Light Blue", "Pink", "Orange"].includes(currentSelectedProperty.colour) ? "#000" : "#FFF";
    
    document.getElementById('modal-challenge-name').innerText = challenge ? challenge.challengeName : "No Challenge Set";
    document.getElementById('modal-challenge-desc').innerText = challenge ? challenge.challengeDescription : "Explore the area.";
    document.getElementById('modal-prop-value').innerText = currentSelectedProperty.value;

    // Show modal container
    const modal = document.getElementById('card-modal');
    modal.classList.remove('hidden');
    // Tiny timeout to allow display:block to apply before animating opacity
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    
    // Trigger Flip Animation
    setTimeout(() => {
        document.getElementById('flip-card').classList.add('is-flipped');
    }, 150);
}

function closeModal() {
    const modal = document.getElementById('card-modal');
    document.getElementById('flip-card').classList.remove('is-flipped');
    
    setTimeout(() => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }, 400); // Wait for un-flip
}

function claimProperty(team) {
    if (!currentSelectedProperty) return;
    if (currentSelectedProperty.teamWonBy !== null) {
        alert("This property is already claimed!");
        return;
    }

    const value = currentSelectedProperty.value;
    
    // Update State
    currentSelectedProperty.teamWonBy = team;
    scores[team].money += value;
    scores[team].props += 1;

    // Update UI Scores
    document.getElementById(`score-money-${team}`).innerText = `£${scores[team].money}`;
    document.getElementById(`score-props-${team}`).innerText = scores[team].props;

    // Update Button Appearance
    const btn = document.getElementById(`btn-${currentSelectedProperty.id}`);
    if (team === 'blue') {
        btn.classList.add('bg-blue-200', 'text-blue-900', 'opacity-70');
        btn.classList.remove('hover:bg-gray-100');
    } else {
        btn.classList.add('bg-yellow-100', 'text-yellow-900', 'opacity-70');
        btn.classList.remove('hover:bg-gray-100');
    }

    // Close Modal
    closeModal();

    // Trigger Celebration
    setTimeout(() => {
        fireConfetti(team);
        showToast(`${team === 'blue' ? 'Blue' : 'Yellow'} Team claims ${currentSelectedProperty.name} : +£${value}`, team);
    }, 400); // Wait for modal to mostly close
}

function fireConfetti(team) {
    const colors = team === 'blue' ? ['#2563eb', '#60a5fa', '#ffffff'] : ['#eab308', '#fde047', '#ffffff'];
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
    });
}

function showToast(message, team) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    
    // Theme toast based on team
    if(team === 'blue') {
        toast.className = "fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold z-50 transition-all duration-500 pointer-events-none";
    } else {
        toast.className = "fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-gray-900 px-6 py-3 rounded-full shadow-2xl font-bold z-50 transition-all duration-500 pointer-events-none";
    }

    // Slide up and fade in
    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);

    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// Start the app
window.onload = init;