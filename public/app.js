const form = document.getElementById("checkout-form");
const message = document.getElementById("checkout-message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "Preparing secure checkout...";

  const addonMap = {
    addonAccom:    "accomPackage",
    addonTransfer: "airportTransfer",
    addonGalle:    "galleTransfer",
    addonParty:    "afterParty"
  };

  const optionalKeys = Object.entries(addonMap)
    .filter(([fieldName]) => form[fieldName] && form[fieldName].checked)
    .map(([, catalogKey]) => catalogKey);

  const payload = {
    riderName:   form.riderName.value.trim(),
    riderEmail:  form.riderEmail.value.trim(),
    productKey:  form.productKey.value,
    optionalKeys
  };

  try {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok || !data.url) {
      throw new Error(data.error || "Unable to create checkout session.");
    }

    window.location.href = data.url;
  } catch (error) {
    message.textContent = error.message;
  }
});
