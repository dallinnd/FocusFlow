// --- CONFIGURATION ---
// Define your available sounds here.
// Filenames assume format: sounds/type_variation.mp3 (e.g., river_1.mp3)
const SOUND_TYPES = {
    river: { icon: '🌊', label: 'River', count: 3 },
    rain: { icon: '🌧️', label: 'Rain', count: 3 },
    insect: { icon: '🦗', label: 'Insects', count: 3 },
    wind: { icon: '🌬️', label: 'Wind', count: 3 },
    fire: { icon: '🔥', label: 'Fire', count: 3 },
    birds: { icon: '🐦', label: 'Birds', count: 3 }
};

// --- STATE MANAGEMENT ---
let appState = {
    currentMixName: "My Flow",
    isPlaying: false,
    slots: [null, null, null, null, null, null], // 6 Slots
    audioObjects: [null, null, null, null, null, null], // Stores HTMLAudioElements
    activeSlotIndex: null // Which slot we are currently trying to fill
};

// --- DOM ELEMENTS ---
const screens = {
    home: document.getElementById('home-screen'),
    mixer: document.getElementById('mixer-screen')
};
const els = {
    slotsGrid: document.getElementById('slots-grid'),
    playBtn: document.getElementById('btn-play-pause'),
    soundModal: document.getElementById('sound-modal'),
    soundOptions: document.getElementById('sound-options'),
    savedList: document.getElementById('saved-flows-list')
};

// --- INITIALIZATION ---
function init() {
    renderSavedFlows();
    renderSlots();
    setupEventListeners();
}

// --- AUDIO LOGIC ---
function loadAudioForSlot(slotIndex) {
    // Stop existing if any
    if (appState.audioObjects[slotIndex]) {
        appState.audioObjects[slotIndex].pause();
        appState.audioObjects[slotIndex] = null;
    }

    const slotData = appState.slots[slotIndex];
    if (!slotData) return;

    // Construct filename: e.g., "sounds/river_1.mp3"
    // Variation is 1-based for file naming (1, 2, 3)
    const fileName = `sounds/${slotData.type}_${slotData.variation}.mp3`;
    
    const audio = new Audio(fileName);
    audio.loop = true;
    audio.volume = slotData.volume;
    
    appState.audioObjects[slotIndex] = audio;

    if (appState.isPlaying) {
        audio.play().catch(e => console.log("Autoplay prevented:", e));
    }
}

function toggleMasterPlay() {
    appState.isPlaying = !appState.isPlaying;
    els.playBtn.innerText = appState.isPlaying ? "⏸ Pause" : "▶ Play";

    appState.audioObjects.forEach(audio => {
        if (audio) {
            if (appState.isPlaying) audio.play();
            else audio.pause();
        }
    });
}

// --- UI RENDERING ---
function renderSlots() {
    els.slotsGrid.innerHTML = '';

    appState.slots.forEach((slot, index) => {
        const div = document.createElement('div');
        div.className = `slot-box ${slot ? 'active' : ''}`;

        if (!slot) {
            // EMPTY STATE
            div.innerHTML = `<div class="add-btn">+</div>`;
            div.onclick = () => openSoundModal(index);
        } else {
            // FILLED STATE
            const typeInfo = SOUND_TYPES[slot.type];
            div.innerHTML = `
                <div class="slot-content">
                    <div class="icon-area" onclick="cycleVariation(${index}, event)">
                        ${typeInfo.icon}
                        <div style="font-size:0.6rem; opacity:0.7">Var ${slot.variation}</div>
                    </div>
                    <div class="slot-name">${typeInfo.label}</div>
                    <input type="range" min="0" max="1" step="0.05" value="${slot.volume}" 
                           oninput="updateVolume(${index}, this.value)">
                </div>
            `;
            
            // Add Remove button (small X top right)
            const removeBtn = document.createElement('div');
            removeBtn.innerHTML = '×';
            removeBtn.style.cssText = "position:absolute; top:5px; right:10px; cursor:pointer; font-size:1.2rem; color:#666;";
            removeBtn.onclick = (e) => {
                e.stopPropagation(); // prevent triggering other clicks
                clearSlot(index);
            };
            div.appendChild(removeBtn);
        }
        els.slotsGrid.appendChild(div);
    });
}

function renderSoundOptions() {
    els.soundOptions.innerHTML = '';
    Object.keys(SOUND_TYPES).forEach(key => {
        const type = SOUND_TYPES[key];
        const div = document.createElement('div');
        div.className = 'sound-option';
        div.innerHTML = `${type.icon} ${type.label}`;
        div.onclick = () => selectSoundType(key);
        els.soundOptions.appendChild(div);
    });
}

// --- INTERACTIONS ---

// 1. Open Modal
function openSoundModal(index) {
    appState.activeSlotIndex = index;
    renderSoundOptions();
    els.soundModal.classList.remove('hidden');
}

// 2. Select Type
function selectSoundType(typeKey) {
    const index = appState.activeSlotIndex;
    // Default to variation 1, 50% volume
    appState.slots[index] = { type: typeKey, variation: 1, volume: 0.5 };
    loadAudioForSlot(index);
    renderSlots();
    els.soundModal.classList.add('hidden');
}

// 3. Cycle Variations (1 -> 2 -> 3 -> 1)
window.cycleVariation = function(index, event) {
    event.stopPropagation(); // Don't trigger other things
    const slot = appState.slots[index];
    const max = SOUND_TYPES[slot.type].count;
    
    slot.variation++;
    if (slot.variation > max) slot.variation = 1;

    // Reload audio with new file
    loadAudioForSlot(index);
    renderSlots(); // Re-render to show new variation number
}

// 4. Update Volume
window.updateVolume = function(index, val) {
    appState.slots[index].volume = val;
    if (appState.audioObjects[index]) {
        appState.audioObjects[index].volume = val;
    }
}

// 5. Clear Slot
function clearSlot(index) {
    if (appState.audioObjects[index]) {
        appState.audioObjects[index].pause();
        appState.audioObjects[index] = null;
    }
    appState.slots[index] = null;
    renderSlots();
}

// --- SAVING & NAVIGATION ---

function saveCurrentFlow() {
    const name = prompt("Name your flow:", "My Relax Mix");
    if (!name) return;

    const newFlow = {
        id: Date.now(),
        name: name,
        slots: appState.slots // We save the config, not the audio objects
    };

    const saved = JSON.parse(localStorage.getItem('focusFlows') || '[]');
    saved.push(newFlow);
    localStorage.setItem('focusFlows', JSON.stringify(saved));
    alert("Flow Saved!");
}

function loadFlow(flow) {
    // clear current audio
    appState.audioObjects.forEach(a => a && a.pause());
    appState.audioObjects = [null,null,null,null,null,null];
    
    // Deep copy the slots to break reference
    appState.slots = JSON.parse(JSON.stringify(flow.slots));
    
    // Reload audio engines
    appState.slots.forEach((slot, i) => {
        if(slot) loadAudioForSlot(i);
    });

    switchScreen('mixer');
    renderSlots();
    
    // Auto play on load? Optional.
    // toggleMasterPlay();
}

function renderSavedFlows() {
    const saved = JSON.parse(localStorage.getItem('focusFlows') || '[]');
    const container = els.savedList;
    container.innerHTML = '';
    
    if (saved.length === 0) {
        container.innerHTML = '<p class="empty-msg" style="text-align:center; color:#555">No flows saved yet.</p>';
        return;
    }

    saved.forEach(flow => {
        const div = document.createElement('div');
        div.className = 'flow-card';
        div.innerHTML = `<span>${flow.name}</span> <span>▶</span>`;
        div.onclick = () => loadFlow(flow);
        container.appendChild(div);
    });
}

function switchScreen(screenName) {
    screens.home.classList.add('hidden');
    screens.mixer.classList.add('hidden');
    screens[screenName].classList.remove('hidden');
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    document.getElementById('btn-create-flow').onclick = () => {
        // Reset mixer for new flow
        appState.slots = [null,null,null,null,null,null];
        appState.audioObjects.forEach(a => a && a.pause());
        appState.audioObjects = [null,null,null,null,null,null];
        appState.isPlaying = false;
        els.playBtn.innerText = "▶ Play";
        
        switchScreen('mixer');
        renderSlots();
    };

    document.getElementById('btn-back').onclick = () => {
        // Pause when going back? Or keep playing?
        // Usually better to keep playing background audio while browsing
        renderSavedFlows();
        switchScreen('home');
    };

    document.getElementById('btn-close-modal').onclick = () => {
        els.soundModal.classList.add('hidden');
    };

    document.getElementById('btn-save').onclick = saveCurrentFlow;
    els.playBtn.onclick = toggleMasterPlay;
}

// Run
init();
