const API_URL = "http://localhost:8000";

let currentProfile = null;
let currentMealPlan = null;
let currentDay = 1;
let totalDays = 7;

// State to track which option (main/alternative) is selected for each meal of each day
// Structure: { "day_1": { "breakfast": "main", ... }, ... }
let mealSelections = {};

document.getElementById('body-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    submitBtn.disabled = true;

    const data = {
        gender: document.getElementById('gender').value,
        weight_kg: parseFloat(document.getElementById('weight').value),
        height_cm: parseFloat(document.getElementById('height').value),
        waist_cm: parseFloat(document.getElementById('waist').value),
        hip_cm: parseFloat(document.getElementById('hip').value),
        chest_cm: parseFloat(document.getElementById('chest').value),
        shoulder_breadth_cm: parseFloat(document.getElementById('shoulder').value),
        wrist_cm: parseFloat(document.getElementById('wrist').value)
    };

    try {
        const response = await fetch(`${API_URL}/body-type/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Prediction failed');

        const result = await response.json();
        displayResults(result, data);
    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

function displayResults(result, inputData) {
    document.getElementById('result-section').classList.remove('hidden');
    document.getElementById('res-somatotype').textContent = result.somatotype;
    document.getElementById('res-bmi').textContent = result.bmi;
    document.getElementById('res-category').textContent = result.bmi_category;

    currentProfile = {
        gender: inputData.gender,
        weight_kg: inputData.weight_kg,
        height_cm: inputData.height_cm,
        bmi: result.bmi,
        bmi_category: result.bmi_category,
        somatotype: result.somatotype
    };
    
    document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('generate-btn').addEventListener('click', async () => {
    if (!currentProfile) return;

    const goal = document.getElementById('goal').value;
    currentProfile.goal = goal;

    const planSection = document.getElementById('plan-section');
    const loading = document.getElementById('loading');
    const cardContainer = document.getElementById('meal-card-container');
    const advice = document.getElementById('advice-content');

    planSection.classList.remove('hidden');
    loading.classList.remove('hidden');
    cardContainer.classList.add('hidden');
    advice.innerHTML = '';
    
    planSection.scrollIntoView({ behavior: 'smooth' });

    try {
        const response = await fetch(`${API_URL}/meal-plan/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profile: currentProfile,
                plan_days: 7 // Requesting 7 days
            })
        });

        const data = await response.json();
        
        if (data.error) {
            cardContainer.innerHTML = `<p style="color: #ef4444; text-align: center;">${data.error}</p>`;
            cardContainer.classList.remove('hidden');
            return;
        }

        currentMealPlan = data.meal_plan;
        currentDay = 1;
        
        // Initialize selections
        mealSelections = {};
        for (let i = 1; i <= 7; i++) {
            mealSelections[`day_${i}`] = {
                breakfast: "main",
                lunch: "main",
                dinner: "main",
                snacks: "main"
            };
        }

        renderDay(currentDay);
        renderAdvice(data.advice);
        
        cardContainer.classList.remove('hidden');

    } catch (error) {
        cardContainer.innerHTML = `<p style="color: #ef4444; text-align: center;">Error generating plan: ${error.message}</p>`;
        cardContainer.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
});

function renderDay(day) {
    const dayKey = `day_${day}`;
    const meals = currentMealPlan[dayKey];
    const container = document.getElementById('meal-card-container');
    
    document.getElementById('current-day-label').textContent = `Day ${day}`;
    document.getElementById('prev-day').disabled = day === 1;
    document.getElementById('next-day').disabled = day === totalDays;

    let html = '';
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];

    mealTypes.forEach(type => {
        const selection = mealSelections[dayKey][type]; // 'main' or 'alternative'
        const mealData = meals[type];
        
        let mealText = "";
        let hasAlternative = false;

        if (typeof mealData === 'string') {
            mealText = mealData;
        } else {
            mealText = mealData[selection];
            hasAlternative = true;
        }

        const formattedMeal = formatMealText(mealText);

        html += `
            <div class="meal-row">
                <span class="meal-type">${type}</span>
                <div class="meal-content">
                    <span class="meal-desc" id="desc-${type}">${formattedMeal}</span>
                    ${hasAlternative ? `
                        <button class="swap-btn" onclick="swapMeal('${dayKey}', '${type}')">
                            <i class="fas fa-sync-alt"></i> Swap Option
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function formatMealText(text) {
    // Split "Meal description (Approx. ...)"
    const parts = text.split(' (Approx.');
    if (parts.length > 1) {
        const mainText = parts[0];
        const portionText = '(Approx.' + parts.slice(1).join(' (Approx.'); // Rejoin if multiple, though unlikely
        return `${mainText}<div class="meal-portion">${portionText}</div>`;
    }
    return text;
}

function renderAdvice(adviceList) {
    const adviceDiv = document.getElementById('advice-content');
    if (adviceList && adviceList.length > 0) {
        let adviceHtml = '<div class="advice-box"><h4><i class="fas fa-lightbulb"></i> Nutritionist Advice</h4><ul>';
        adviceList.forEach(tip => {
            adviceHtml += `<li>${tip}</li>`;
        });
        adviceHtml += '</ul></div>';
        adviceDiv.innerHTML = adviceHtml;
    }
}

// Global function for swap button
window.swapMeal = function(dayKey, type) {
    const currentSelection = mealSelections[dayKey][type];
    const newSelection = currentSelection === 'main' ? 'alternative' : 'main';
    
    mealSelections[dayKey][type] = newSelection;
    
    // Update text with animation
    const descEl = document.getElementById(`desc-${type}`);
    descEl.style.opacity = '0';
    
    setTimeout(() => {
        const newText = currentMealPlan[dayKey][type][newSelection];
        descEl.innerHTML = formatMealText(newText);
        descEl.style.opacity = '1';
    }, 200);
};

// Navigation
document.getElementById('prev-day').addEventListener('click', () => {
    if (currentDay > 1) {
        currentDay--;
        renderDay(currentDay);
    }
});

document.getElementById('next-day').addEventListener('click', () => {
    if (currentDay < totalDays) {
        currentDay++;
        renderDay(currentDay);
    }
});
