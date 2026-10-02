// ================================
// EDIT THESE VALUES BEFORE PUBLISHING
// ================================
const CONFIG = {
  discordUrl: "https://discord.gg/gYDWykzuzN",

  // Optional custom text used by the "Copy share message" button.
  shareMessage:
`You were passed an invitation to a long-running online D&D campaign.

Recurring campaign • Discord • UK-time schedule • YouTube livestreaming planned • currently seeking players and a volunteer DM.

Read the full invitation here:
{url}

If it isn't for you but you know someone who genuinely fits, you're welcome to pass it onward.`
};

document.querySelectorAll("[data-discord-link]").forEach((link) => {
  link.href = CONFIG.discordUrl;
});

const toast = document.querySelector(".toast");
let toastTimer;

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch (error) {
    // Fallback for browsers/pages where Clipboard API is unavailable.
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    if (copied) {
      showToast(successMessage);
    } else {
      showToast("Could not copy automatically. Please copy the address bar.");
    }
  }
}

document.querySelectorAll('[data-action="copy-link"]').forEach((button) => {
  button.addEventListener("click", () => {
    copyText(window.location.href, "Invite page link copied.");
  });
});

document.querySelectorAll('[data-action="copy-share"]').forEach((button) => {
  button.addEventListener("click", () => {
    const message = CONFIG.shareMessage.replace("{url}", window.location.href);
    copyText(message, "Share message copied.");
  });
});

// Close other FAQ items when one is opened on small screens.
// This keeps the page easier to scan on phones without changing desktop behavior.
const faqItems = [...document.querySelectorAll(".faq-list details")];

faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open || window.innerWidth > 650) return;

    faqItems.forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});
