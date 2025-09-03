function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {
      pageLanguage: "pt",
      autoDisplay: false
    },
    "google_translate_element"
  );
}

// Função para setar o cookie do Google Translate
function setCookie(name, value, days, domain) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  let cookie = name + "=" + value + expires + "; path=/";
  if (domain) cookie += "; domain=" + domain;
  document.cookie = cookie;
}

// Força o idioma
function translateLanguage(lang) {
  // Define o cookie do Google Translate
  setCookie("googtrans", `/pt/${lang}`, 1);
  setCookie("googtrans", `/pt/${lang}`, 1, window.location.hostname);
  // Recarrega a página para aplicar
  window.location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("language");

  if (select) {
    select.addEventListener("change", function () {
      translateLanguage(this.value);
    });
  }

  // 🥷 Força esconder a régua sempre que o Google tentar injetar
  setInterval(() => {
    const banner = document.querySelector("iframe.goog-te-banner-frame");
    if (banner) {
      banner.style.display = "none";
      banner.style.visibility = "hidden";
      banner.style.height = "0";
    }
    document.body.style.top = "0px";
  }, 500);
});
