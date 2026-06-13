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
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
}

function loadTheme() {
    const saved = localStorage.getItem("preferredTheme") || "dark";
    themeToggle.checked = saved === "light";
    applyTheme(saved);
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
    imageCaption.textContent = "Lade Bild…";
    loadRating();
    updateNavButtons();
}

imageEl.addEventListener("load", () => {
    imageCaption.textContent = `Bild ${historyIndex + 1} von ${history.length}`;
});

imageEl.addEventListener("error", () => {
    imageCaption.textContent = "Bild kann nicht angezeigt werden. Konvertiere die Datei zu PNG oder JPG.";
});

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

themeToggle.addEventListener("change", () => {
    const selected = themeToggle.checked ? "light" : "dark";
    applyTheme(selected);
    localStorage.setItem("preferredTheme", selected);
});

document.querySelectorAll("#stars span").forEach(star => {
    star.addEventListener("click", () => saveRating(star.dataset.rating));
});

prevBtn.addEventListener("click", previousImage);
nextBtn.addEventListener("click", randomImage);

loadTheme();
randomImage();
