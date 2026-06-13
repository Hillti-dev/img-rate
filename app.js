const images = [
    "images/bild1.jpg",
    "images/bild2.jpg",
    "images/bild3.jpg"
];

const ratings = {};
const history = [];
let historyIndex = -1;
let currentImage = "";

const imageEl = document.getElementById("image");
const imageCaption = document.getElementById("imageCaption");
const ratingInfo = document.getElementById("ratingInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const settingsBtn = document.getElementById("settingsBtn");
const closeSettings = document.getElementById("closeSettings");
const settingsOverlay = document.getElementById("settingsOverlay");
const themeInputs = document.querySelectorAll("input[name=theme]");

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (theme === "light") {
        document.documentElement.classList.add("light");
    } else {
        document.documentElement.classList.remove("light");
    }
}

function loadTheme() {
    const saved = localStorage.getItem("preferredTheme") || "dark";
    applyTheme(saved);
    themeInputs.forEach(input => {
        input.checked = input.value === saved;
    });
}

function selectRandomImage() {
    if (images.length <= 1) {
        return images[0] || "";
    }

    let next;
    do {
        next = images[Math.floor(Math.random() * images.length)];
    } while (next === currentImage && images.length > 1);

    return next;
}

function pushHistory(image) {
    if (historyIndex < history.length - 1) {
        history.splice(historyIndex + 1);
    }
    history.push(image);
    historyIndex = history.length - 1;
}

function showImage(image) {
    currentImage = image;
    imageEl.src = image;
    imageCaption.textContent = `Bild ${historyIndex + 1} von ${history.length}`;
    loadRating();
    updateNavButtons();
}

function updateNavButtons() {
    prevBtn.disabled = historyIndex <= 0;
}

function randomImage() {
    if (historyIndex < history.length - 1) {
        historyIndex += 1;
        showImage(history[historyIndex]);
        return;
    }
    const image = selectRandomImage();
    pushHistory(image);
    showImage(image);
}

function previousImage() {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    showImage(history[historyIndex]);
}

function saveRating(rating) {
    ratings[currentImage] = Number(rating);
    updateStars(ratings[currentImage]);
    updateRatingDisplay();
}

function loadRating() {
    const rating = ratings[currentImage] || 0;
    updateStars(rating);
    updateRatingDisplay();
}

function updateStars(rating) {
    document.querySelectorAll("#stars span").forEach(star => {
        star.classList.toggle("active", Number(star.dataset.rating) <= rating);
    });
}

function updateRatingDisplay() {
    const rating = ratings[currentImage] || 0;
    ratingInfo.textContent = rating > 0 ? `Bewertung: ${rating} von 5` : "Keine Bewertung";
}

function openSettings() {
    settingsOverlay.classList.remove("hidden");
}

function closeSettingsPanel() {
    settingsOverlay.classList.add("hidden");
}

settingsBtn.addEventListener("click", openSettings);
closeSettings.addEventListener("click", closeSettingsPanel);
settingsOverlay.addEventListener("click", event => {
    if (event.target === settingsOverlay) {
        closeSettingsPanel();
    }
});

themeInputs.forEach(input => {
    input.addEventListener("change", () => {
        if (input.checked) {
            applyTheme(input.value);
            localStorage.setItem("preferredTheme", input.value);
        }
    });
});

document.querySelectorAll("#stars span").forEach(star => {
    star.addEventListener("click", () => saveRating(star.dataset.rating));
});

prevBtn.addEventListener("click", previousImage);
nextBtn.addEventListener("click", randomImage);

loadTheme();
randomImage();
