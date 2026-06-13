const images = [
    "images/bild1.jpg",
    "images/bild2.jpg",
    "images/bild3.jpg"
];

let currentImage = "";

function randomImage() {
    currentImage =
        images[Math.floor(Math.random() * images.length)];

    document.getElementById("image").src = currentImage;

    loadRating();
}

function saveRating(rating) {
    localStorage.setItem(currentImage, rating);
    updateStars(rating);
}

function loadRating() {
    const rating =
        localStorage.getItem(currentImage) || 0;

    updateStars(Number(rating));
}

function updateStars(rating) {
    document.querySelectorAll("#stars span")
        .forEach(star => {
            star.classList.remove("active");

            if (
                Number(star.dataset.rating) <= rating
            ) {
                star.classList.add("active");
            }
        });
}

document.querySelectorAll("#stars span")
    .forEach(star => {
        star.addEventListener("click", () => {
            saveRating(star.dataset.rating);
        });
    });

document.getElementById("nextBtn")
    .addEventListener("click", randomImage);

randomImage();