const SUPABASE_URL = "https://jennmnnidwsfkujphsfc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Implbm5tbm5pZHdzZmt1anBoc2ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMTU4MzAsImV4cCI6MjA5Njg5MTgzMH0.tRWDnQz0jaUjcRYUQLCM1rEg1sFmv0smxXHqQ298UbY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const localImages = [
  {
    name: "Beispielbild",
    path: "images/IMG_4645.jpg",
    url: "images/IMG_4645.jpg",
    storage: false,
  }
];

let currentImageList = [...localImages];
let history = [];
let historyIndex = -1;
let currentImage = null;
let currentUser = null;

const imageEl = document.getElementById("image");
const imageCaption = document.getElementById("imageCaption");
const avgRatingEl = document.getElementById("avgRating");
const ratingInfo = document.getElementById("ratingInfo");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const settingsBtn = document.getElementById("settingsBtn");
const closeSettings = document.getElementById("closeSettings");
const settingsOverlay = document.getElementById("settingsOverlay");
const themeToggle = document.getElementById("themeToggle");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminBtn = document.getElementById("adminBtn");
const userStatus = document.getElementById("userStatus");
const authOverlay = document.getElementById("authOverlay");
const closeAuth = document.getElementById("closeAuth");
const authTabLogin = document.getElementById("authTabLogin");
const authTabRegister = document.getElementById("authTabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");
const uploadSection = document.getElementById("uploadSection");
const uploadForm = document.getElementById("uploadForm");
const uploadFile = document.getElementById("uploadFile");
const uploadMessage = document.getElementById("uploadMessage");
const uploadsList = document.getElementById("uploadsList");
const adminOverlay = document.getElementById("adminOverlay");
const closeAdmin = document.getElementById("closeAdmin");
const adminUploads = document.getElementById("adminUploads");
const adminUsers = document.getElementById("adminUsers");

let uploadMetaDisabled = false;
let ratingTableMissing = false;
let profilesTableMissing = false;
let fallbackUploads = [];

function isAdmin(user = currentUser) {
  const username = user?.user_metadata?.username;
  return username === "Hillti" || username?.toLowerCase() === "hillti";
}

function setMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? "#ffb3b3" : "#c9c18c";
}

function setUploadMessage(message, isError = false) {
  uploadMessage.textContent = message;
  uploadMessage.style.color = isError ? "#ffb3b3" : "#c9c18c";
  uploadMessage.classList.toggle("hidden", !message);
}

function openSettings() {
  settingsOverlay.classList.remove("hidden");
}

function closeSettingsPanel() {
  settingsOverlay.classList.add("hidden");
}

function showAuthPanel() {
  updateTabButtons(true);
  setMessage("");
  authOverlay.classList.remove("hidden");
}

function hideAuthPanel() {
  authOverlay.classList.add("hidden");
}

function openAdminPanel() {
  adminOverlay.classList.remove("hidden");
  loadAdminDashboard();
}

function closeAdminPanel() {
  adminOverlay.classList.add("hidden");
}

function updateTabButtons(loginActive) {
  authTabLogin.classList.toggle("active", loginActive);
  authTabRegister.classList.toggle("active", !loginActive);
  loginForm.classList.toggle("hidden", !loginActive);
  registerForm.classList.toggle("hidden", loginActive);
}

async function initApp() {
  attachEventHandlers();
  const preferredTheme = localStorage.getItem("preferredTheme") || "dark";
  themeToggle.checked = preferredTheme === "light";
  applyTheme(preferredTheme);

  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user ?? null;
  await handleAuthState(currentUser);
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    handleAuthState(session?.user ?? null);
  });
}

function attachEventHandlers() {
  settingsBtn.addEventListener("click", openSettings);
  closeSettings.addEventListener("click", closeSettingsPanel);
  settingsOverlay.addEventListener("click", event => {
    if (event.target === settingsOverlay) {
      closeSettingsPanel();
    }
  });

  loginBtn.addEventListener("click", showAuthPanel);
  logoutBtn.addEventListener("click", handleLogout);
  adminBtn.addEventListener("click", openAdminPanel);

  closeAuth.addEventListener("click", hideAuthPanel);
  closeAdmin.addEventListener("click", closeAdminPanel);
  authOverlay.addEventListener("click", event => {
    if (event.target === authOverlay) {
      hideAuthPanel();
    }
  });
  adminOverlay.addEventListener("click", event => {
    if (event.target === adminOverlay) {
      closeAdminPanel();
    }
  });

  authTabLogin.addEventListener("click", () => {
    updateTabButtons(true);
    setMessage("");
  });
  authTabRegister.addEventListener("click", () => {
    updateTabButtons(false);
    setMessage("");
  });

  loginForm.addEventListener("submit", handleLogin);
  registerForm.addEventListener("submit", handleRegister);
  uploadForm.addEventListener("submit", handleUpload);

  themeToggle.addEventListener("change", () => {
    const selected = themeToggle.checked ? "light" : "dark";
    applyTheme(selected);
    localStorage.setItem("preferredTheme", selected);
  });

  imageEl.addEventListener("load", () => {
    imageCaption.textContent = currentImage?.name || "Bild geladen";
  });

  imageEl.addEventListener("error", () => {
    imageCaption.textContent = "Dieses Bild kann hier nicht angezeigt werden. Bitte konvertiere es zu JPG oder PNG.";
  });

  uploadsList.addEventListener("click", handleUploadsClick);
  adminUploads.addEventListener("click", handleAdminUploadsClick);
  adminUsers.addEventListener("click", handleAdminUsersClick);
  prevBtn.addEventListener("click", previousImage);
  nextBtn.addEventListener("click", randomImage);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

async function handleAuthState(user) {
  currentUser = user;
  updateAuthUI();
  if (user) {
    await ensureProfileRecord();
    await refreshUploadSection();
    await refreshImageSource();
  } else {
    currentImageList = [...localImages];
    history = [];
    historyIndex = -1;
    randomImage();
  }
}

function updateAuthUI() {
  const loggedIn = Boolean(currentUser);
  loginBtn.classList.toggle("hidden", loggedIn);
  logoutBtn.classList.toggle("hidden", !loggedIn);
  uploadSection.classList.toggle("hidden", !loggedIn);
  adminBtn.classList.toggle("hidden", !loggedIn || !isAdmin(currentUser));
  userStatus.textContent = loggedIn
    ? currentUser.user_metadata?.username || currentUser.email
    : "Gast";
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    setMessage("Bitte E-Mail und Passwort eingeben.", true);
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage(error.message || "Login fehlgeschlagen.", true);
    return;
  }

  if (data.session) {
    setMessage("Erfolgreich angemeldet.");
    hideAuthPanel();
    await handleAuthState(data.user);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;

  if (!username || !email || !password) {
    setMessage("Bitte alle Felder ausfüllen.", true);
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) {
    setMessage(error.message || "Registrierung fehlgeschlagen.", true);
    return;
  }

  setMessage("Registriert! Bitte E-Mail bestätigen.");
  if (data.session) {
    hideAuthPanel();
    await handleAuthState(data.user);
  } else {
    await handleAuthState(null);
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  updateAuthUI();
  currentImageList = [...localImages];
  history = [];
  historyIndex = -1;
  randomImage();
}

async function ensureProfileRecord() {
  if (!currentUser || profilesTableMissing) return;
  const username = currentUser.user_metadata?.username || currentUser.email?.split("@")[0] || "Benutzer";
  const { error } = await supabaseClient.from("profiles").upsert([
    {
      id: currentUser.id,
      username,
      email: currentUser.email,
      is_admin: isAdmin(currentUser),
    },
  ]).select();

  if (error) {
    if (error.message?.includes("Could not find the table") || error.message?.includes("public.profiles")) {
      profilesTableMissing = true;
      console.warn("Profile-Tabelle fehlt:", error.message);
      return;
    }
    console.warn("Profil-Datensatz konnte nicht gespeichert werden:", error.message);
  }
}

async function refreshUploadSection() {
  if (!currentUser) return;
  const uploads = await fetchUserUploads();
  renderUploadsList([...uploads, ...fallbackUploads]);
}

async function refreshImageSource() {
  const uploads = await fetchGalleryUploads();
  currentImageList = uploads.length ? [...uploads] : [...localImages];
  if (fallbackUploads.length) {
    currentImageList = [...uploads, ...fallbackUploads];
  }
  history = [];
  historyIndex = -1;
  randomImage();
}

async function fetchGalleryUploads() {
  const { data, error } = await supabaseClient
    .from("image_uploads")
    .select("image_path, image_url, file_name, created_at, username, email, user_id");

  if (error) {
    console.warn("Upload-Metadaten konnten nicht geladen werden:", error.message);
    setUploadMessage("Uploads können nicht geladen werden: " + (error.message || "Fehler"), true);
    return [];
  }

  const uploads = [];
  for (const row of data || []) {
    const filePath = row.image_path;
    const fileName = row.file_name || filePath.split("/").pop();
    let url = row.image_url || null;

    if (!url) {
      const { data: signedUrlData, error: signError } = await supabaseClient.storage
        .from("images")
        .createSignedUrl(filePath, 3600);

      if (!signError && signedUrlData?.signedUrl) {
        url = signedUrlData.signedUrl;
      } else {
        const { data: publicUrlData, error: publicError } = supabaseClient.storage
          .from("images")
          .getPublicUrl(filePath);
        if (!publicError && publicUrlData?.publicUrl) {
          url = publicUrlData.publicUrl;
        }
      }
    }

    if (!url) continue;

    uploads.push({
      name: fileName,
      path: filePath,
      url,
      storage: true,
      uploader: row.username || row.email || row.user_id || "Unbekannt",
    });
  }

  return uploads;
}

async function getImageUrl(path) {
  const { data: signedData, error: signedError } = await supabaseClient.storage
    .from("images")
    .createSignedUrl(path, 3600);
  if (!signedError && signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const { data, error } = await supabaseClient.storage.from("images").getPublicUrl(path);
  if (error || !data?.publicUrl) {
    console.warn("Konnte URL nicht erstellen:", error?.message);
    return null;
  }
  return data.publicUrl;
}

function renderUploadsList(uploads) {
  if (!uploads.length) {
    uploadsList.innerHTML = "<p class='form-message'>Noch keine eigenen Uploads.</p>";
    return;
  }

  uploadsList.innerHTML = uploads
    .map(upload => {
      return `
        <div class="upload-card">
          <img src="${upload.url}" alt="${upload.name}">
          <div class="card-row">
            <div>
              <strong>${upload.name}</strong>
              <p class="avg-rating">${upload.path}</p>
            </div>
            <button class="control-btn delete-upload" data-path="${upload.path}">Löschen</button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function handleUploadsClick(event) {
  const deleteButton = event.target.closest(".delete-upload");
  if (!deleteButton) return;
  const path = deleteButton.dataset.path;
  await deleteUpload(path);
}

async function deleteUpload(path) {
  if (!currentUser || !path) return;
  const { error } = await supabaseClient.storage.from("images").remove([path]);
  if (error) {
    console.warn("Upload konnte nicht gelöscht werden:", error.message);
    return;
  }

  await supabaseClient.from("image_uploads").delete().eq("image_path", path);
  await refreshUploadSection();
  await refreshImageSource();
}

async function handleUpload(event) {
  event.preventDefault();
  if (!currentUser) {
    setUploadMessage("Bitte zuerst anmelden.", true);
    return;
  }

  const file = uploadFile.files[0];
  if (!file) {
    setUploadMessage("Bitte eine Bilddatei auswählen.", true);
    return;
  }

  const filename = `${Date.now()}_${file.name}`;
  const path = `uploads/${currentUser.id}/${filename}`;
  const { error } = await supabaseClient.storage.from("images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    if (error.message?.includes("row-level security")) {
      const objectUrl = URL.createObjectURL(file);
      fallbackUploads.push({
        name: filename,
        path: `uploads/local/${filename}`,
        url: objectUrl,
        storage: false,
      });
      setUploadMessage("Upload fehlgeschlagen: Supabase Storage-Policy verhindert den Upload. Datei wird lokal angezeigt.");
      await refreshUploadSection();
      await refreshImageSource();
      return;
    }

    const message = `Upload fehlgeschlagen: ${error.message}`;
    setUploadMessage(message, true);
    return;
  }

  const publicUrl = await getImageUrl(path);
  const { error: insertError } = await supabaseClient.from("image_uploads").insert([
    {
      user_id: currentUser.id,
      username: currentUser.user_metadata?.username || null,
      email: currentUser.email,
      image_path: path,
      image_url: publicUrl,
      file_name: filename,
    },
  ]);

  if (insertError) {
    uploadMetaDisabled = true;
    console.warn("Upload-Metadaten konnten nicht gespeichert werden:", insertError.message);
    setUploadMessage("Bild hochgeladen, Metadaten konnten nicht gespeichert werden.");
  } else {
    setUploadMessage("Bild erfolgreich hochgeladen.");
  }

  uploadFile.value = "";
  await refreshUploadSection();
  await refreshImageSource();
}

async function handleAdminUsersClick(event) {
  const button = event.target.closest(".admin-user-delete");
  if (!button) return;
  const userId = button.dataset.userId;
  if (!userId) return;
  if (!window.confirm("Benutzer wirklich löschen?")) return;
  await deleteUser(userId);
  await loadAdminDashboard();
}

async function handleAdminUploadsClick(event) {
  const button = event.target.closest(".admin-delete");
  if (!button) return;
  const path = button.dataset.path;
  await deleteUpload(path);
  await loadAdminDashboard();
}

async function deleteUser(userId) {
  if (!userId) return;

  const { error: deleteMetadataError } = await supabaseClient.from("image_uploads").delete().eq("user_id", userId);
  if (deleteMetadataError) {
    console.warn("Upload-Metadaten des Benutzers konnten nicht gelöscht werden:", deleteMetadataError.message);
  }

  const { data: storedFiles, error: listError } = await supabaseClient.storage.from("images").list(`uploads/${userId}`, {
    limit: 100,
  });
  if (!listError && storedFiles?.length) {
    const paths = storedFiles
      .filter(item => item.name && !item.name.endsWith("/"))
      .map(item => `uploads/${userId}/${item.name}`);
    if (paths.length) {
      const { error: storageDeleteError } = await supabaseClient.storage.from("images").remove(paths);
      if (storageDeleteError) {
        console.warn("Storage-Dateien des Benutzers konnten nicht gelöscht werden:", storageDeleteError.message);
      }
    }
  }

  const { error } = await supabaseClient.from("profiles").delete().eq("id", userId);
  if (error) {
    console.warn("Benutzer konnte nicht gelöscht werden:", error.message);
  }
}

async function loadAdminDashboard() {
  await loadAdminUploads();
  await loadAdminUsers();
}

async function loadAdminUploads() {
  adminUploads.innerHTML = "<p class='form-message'>Lade Uploads...</p>";
  const { data, error } = await supabaseClient
    .from("image_uploads")
    .select("image_path, file_name, user_id, username, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    adminUploads.innerHTML = `<p class='form-message'>Uploads können nicht geladen werden: ${error.message}</p>`;
    return;
  }

  const cards = [];
  for (const record of data || []) {
    cards.push({
      uploader: record.username || record.email || record.user_id || "Unbekannt",
      userId: record.user_id,
      path: record.image_path,
      name: record.file_name || record.image_path.split("/").pop(),
    });
  }

  if (!cards.length) {
    adminUploads.innerHTML = "<p class='form-message'>Keine Uploads gefunden.</p>";
    return;
  }

  adminUploads.innerHTML = cards
    .map(record => {
      return `
        <div class="admin-card">
          <div class="card-row">
            <div>
              <strong>${record.name}</strong>
              <p class="avg-rating">Uploader: ${record.uploader}</p>
            </div>
            <button class="control-btn admin-delete" data-path="${record.path}">Löschen</button>
          </div>
        </div>
      `;
    })
    .join("");
}

async function loadAdminUsers() {
  adminUsers.innerHTML = "<p class='form-message'>Lade Benutzer...</p>";
  if (profilesTableMissing) {
    adminUsers.innerHTML = "<p class='form-message'>Profil-Tabelle fehlt. Führe supabase-setup.sql aus.</p>";
    return;
  }

  const { data, error } = await supabaseClient.from("profiles").select("id,username,email,created_at").order("created_at", { ascending: false });

  if (error) {
    if (error.message?.includes("Could not find the table") || error.message?.includes("public.profiles")) {
      profilesTableMissing = true;
      adminUsers.innerHTML = "<p class='form-message'>Profil-Tabelle fehlt. Führe supabase-setup.sql aus.</p>";
      return;
    }
    adminUsers.innerHTML = `<p class='form-message'>Benutzer können nicht geladen werden: ${error.message}</p>`;
    return;
  }

  if (!data?.length) {
    adminUsers.innerHTML = "<p class='form-message'>Keine Benutzer gefunden.</p>";
    return;
  }

  adminUsers.innerHTML = data
    .map(profile => {
      const isSelf = currentUser?.id === profile.id;
      return `
        <div class="admin-card">
          <div class="card-row">
            <div>
              <strong>${profile.username || profile.email}</strong>
              <p class="avg-rating">${profile.email}</p>
            </div>
            ${isSelf ? `<span class="user-tag">Du</span>` : `<button class="control-btn admin-user-delete" data-user-id="${profile.id}">Löschen</button>`}
          </div>
        </div>
      `;
    })
    .join("");
}

function selectRandomImage() {
  if (!currentImageList.length) {
    return null;
  }

  if (currentImageList.length === 1) {
    return currentImageList[0];
  }

  let next;
  do {
    next = currentImageList[Math.floor(Math.random() * currentImageList.length)];
  } while (next === currentImage && currentImageList.length > 1);

  return next;
}

function pushHistory(image) {
  if (historyIndex < history.length - 1) {
    history.splice(historyIndex + 1);
  }
  history.push(image);
  historyIndex = history.length - 1;
}

async function showImage(image) {
  currentImage = image;
  imageEl.src = image.url || image.path;
  imageCaption.textContent = "Bild wird geladen…";
  await loadRating();
  updateNavButtons();
}

function updateNavButtons() {
  prevBtn.disabled = historyIndex <= 0;
}

async function randomImage() {
  if (historyIndex < history.length - 1) {
    historyIndex += 1;
    showImage(history[historyIndex]);
    return;
  }

  const image = selectRandomImage();
  if (!image) return;
  pushHistory(image);
  showImage(image);
}

function previousImage() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  showImage(history[historyIndex]);
}

async function loadRating() {
  const rating = ratings[currentImage?.path] || 0;
  updateStars(rating);
  updateRatingDisplay(rating);
  await loadAverageRating();
}

function updateStars(rating) {
  document.querySelectorAll("#stars span").forEach(star => {
    star.classList.toggle("active", Number(star.dataset.rating) <= rating);
  });
}

function updateRatingDisplay(rating) {
  ratingInfo.textContent = rating > 0 ? `Deine Bewertung: ${rating}/5` : "Noch nicht bewertet";
}

async function loadAverageRating() {
  if (!currentImage?.path) {
    avgRatingEl.textContent = "Durchschnitt: -";
    return;
  }

  if (ratingTableMissing) {
    avgRatingEl.textContent = "Durchschnitt: nicht verfügbar";
    return;
  }

  const { data, error } = await supabaseClient.from("image_ratings").select("rating").eq("image_path", currentImage.path);
  if (error || !data) {
    if (error?.message?.includes("Could not find the table") || error?.message?.includes("table 'public.image_ratings'")) {
      ratingTableMissing = true;
    }
    avgRatingEl.textContent = "Durchschnitt: nicht verfügbar";
    return;
  }

  if (!data.length) {
    avgRatingEl.textContent = "Keine Bewertung";
    return;
  }

  const average = data.reduce((sum, item) => sum + item.rating, 0) / data.length;
  avgRatingEl.textContent = `Durchschnitt: ${average.toFixed(1)}/5 (${data.length})`;
}

async function saveRating(ratingValue) {
  const rating = Number(ratingValue);

  if (!currentImage?.path || !currentUser || ratingTableMissing) {
    ratings[currentImage?.path] = rating;
    updateStars(rating);
    updateRatingDisplay(rating);
    return;
  }

  const { error } = await supabaseClient.from("image_ratings").upsert({
    user_id: currentUser.id,
    image_path: currentImage.path,
    rating,
  }, { onConflict: ["user_id", "image_path"] });

  if (error) {
    if (error.message?.includes("Could not find the table") || error.message?.includes("table 'public.image_ratings'") || error.message?.includes("row-level security")) {
      ratingTableMissing = true;
      ratings[currentImage?.path] = rating;
      updateStars(rating);
      updateRatingDisplay(rating);
      return;
    }
    console.warn("Bewertung konnte nicht gespeichert werden:", error.message);
    return;
  }

  updateStars(rating);
  updateRatingDisplay(rating);
  await loadAverageRating();
}

const ratings = {};

document.querySelectorAll("#stars span").forEach(star => {
  star.addEventListener("click", () => saveRating(star.dataset.rating));
});

initApp();
