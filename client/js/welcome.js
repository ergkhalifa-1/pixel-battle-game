const onboardingForm = document.getElementById("onboardingForm");
const usernameInput = document.getElementById("usernameInput");
const onboardingError = document.getElementById("onboardingError");

const PROFILE_STORAGE_KEY = "pixelBattlePlayerProfile";
let welcomeTeam = "Blue";

const savedProfile = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "null");
if (savedProfile?.username && savedProfile?.team) {
  usernameInput.value = savedProfile.username;
  welcomeTeam = ["Red", "Blue", "Green"].includes(savedProfile.team) ? savedProfile.team : "Blue";
  document.querySelectorAll(".onboarding-team").forEach(card => {
    card.classList.toggle("selected", card.dataset.team === welcomeTeam);
  });
}

document.querySelectorAll(".onboarding-team").forEach(card => {
  card.addEventListener("click", () => {
    document.querySelectorAll(".onboarding-team").forEach(item => item.classList.remove("selected"));
    card.classList.add("selected");
    welcomeTeam = card.dataset.team;
    onboardingError.textContent = "";
  });
});

onboardingForm.addEventListener("submit", event => {
  event.preventDefault();
  const username = usernameInput.value.trim();

  if (!username) {
    onboardingError.textContent = "Please enter a username to continue.";
    usernameInput.focus();
    return;
  }

  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
    username: username.slice(0, 18),
    team: welcomeTeam
  }));

  window.location.href = "index.html";
});
