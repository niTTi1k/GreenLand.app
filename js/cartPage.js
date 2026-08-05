const CART_KEY = "greenland_cart";
const cartItemsContainer = document.getElementById("cartItems");
const cartItemCount = document.getElementById("cartItemCount");
const subtotalValue = document.getElementById("subtotalValue");
const shippingValue = document.getElementById("shippingValue");
const totalValue = document.getElementById("totalValue");
const totalPriceFooter = document.getElementById("totalPriceFooter");
const checkoutButton = document.getElementById("checkoutButton");
const modalSuccess = document.getElementById("modal-success");
const cardNameInput = document.getElementById("cardNameInput");
const cardNumberInput = document.getElementById("cardNumberInput");
const expDateInput = document.getElementById("expDateInput");
const cvvInput = document.getElementById("cvvInput");
const cardNameError = document.getElementById("cardNameError");
const cardNumberError = document.getElementById("cardNumberError");
const expDateError = document.getElementById("expDateError");
const cvvError = document.getElementById("cvvError");
const cardNameLabel = document.getElementById("cardNameLabel");
const cardNumberLabel = document.getElementById("cardNumberLabel");
const expDateLabel = document.getElementById("expDateLabel");
const cvvLabel = document.getElementById("cvvLabel");

let cart = loadCart();

function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function sanitizeNumericInput(input, maxLength) {
  if (!input) return;
  const digits = input.value.replace(/\D/g, "");
  input.value = digits.slice(0, maxLength);
}

function formatCardNumberInput() {
  if (!cardNumberInput) return;
  const digits = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
  cardNumberInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpDateInput() {
  if (!expDateInput) return;
  let digits = expDateInput.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) {
    digits = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  expDateInput.value = digits;
}

function isValidExpiration(value) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return false;
  if (year < 26) return false;
  return true;
}

function updateCartSummary() {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 0 ? 4 : 0;
  const total = subtotal + shipping;

  cartItemCount.textContent = itemCount;
  subtotalValue.textContent = `$${subtotal.toFixed(2)}`;
  shippingValue.textContent = `$${shipping.toFixed(2)}`;
  totalValue.textContent = `$${total.toFixed(2)}`;
  totalPriceFooter.textContent = `$${total.toFixed(2)}`;
}

function renderCart() {
  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = "";

  if (!cart.length) {
    cartItemsContainer.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
    updateCartSummary();
    return;
  }

  cart.forEach((item) => {
    const productBox = document.createElement("div");
    productBox.className = "productBox";
    productBox.dataset.id = item.id;
    productBox.innerHTML = `
      <div class="rightSiteProductBox">
        <img src="${item.thumbnail}" alt="${item.title}" height="128" width="161">
        <div class="nameDescription">
          <h1>${item.title}</h1>
          <p>${item.category || ""}</p>
        </div>
      </div>
      <div class="leftSiteProductBox">
        <span class="quantity">${item.quantity}</span>
        <div class="arrow">
          <i class="upArrow fa-solid fa-caret-up" data-id="${item.id}"></i>
          <i class="downArrow fa-solid fa-caret-down" data-id="${item.id}"></i>
        </div>
        <span class="totalPrice">$${(item.price * item.quantity).toFixed(2)}</span>
        <i class="trash fa-regular fa-trash-can" data-id="${item.id}"></i>
      </div>
    `;

    cartItemsContainer.appendChild(productBox);
  });

  attachCartListeners();
  updateCartSummary();
}

function attachCartListeners() {
  const upButtons = document.querySelectorAll(".upArrow");
  const downButtons = document.querySelectorAll(".downArrow");
  const trashButtons = document.querySelectorAll(".trash");

  upButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      updateQuantity(id, 1);
    });
  });

  downButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      updateQuantity(id, -1);
    });
  });

  trashButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      removeFromCart(id);
    });
  });
}

function updateQuantity(id, change) {
  const item = cart.find((cartItem) => String(cartItem.id) === String(id));
  if (!item) return;

  item.quantity = Math.max(0, item.quantity + change);
  if (item.quantity === 0) {
    cart = cart.filter((cartItem) => String(cartItem.id) !== String(id));
  }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((cartItem) => String(cartItem.id) !== String(id));
  saveCart();
  renderCart();
}

function setFieldState(input, error, label, isValid) {
  if (isValid) {
    input?.classList.remove("active");
    error?.classList.remove("active");
    label?.classList.remove("active");
  } else {
    input?.classList.add("active");
    error?.classList.add("active");
    label?.classList.add("active");
  }
}

function validateCheckout() {
  let valid = true;

  const nameValue = cardNameInput?.value.trim() || "";
  const cardNumberDigits = cardNumberInput?.value.replace(/\D/g, "") || "";
  const expValue = expDateInput?.value.trim() || "";
  const cvvValue = cvvInput?.value.trim() || "";

  const validName = nameValue.length >= 2;
  const validCardNumber = /^\d{16}$/.test(cardNumberDigits);
  const validExp = isValidExpiration(expValue);
  const validCvv = /^\d{3}$/.test(cvvValue);

  setFieldState(cardNameInput, cardNameError, cardNameLabel, validName);
  setFieldState(
    cardNumberInput,
    cardNumberError,
    cardNumberLabel,
    validCardNumber,
  );
  setFieldState(expDateInput, expDateError, expDateLabel, validExp);
  setFieldState(cvvInput, cvvError, cvvLabel, validCvv);

  return validName && validCardNumber && validExp && validCvv;
}

function clearPaymentForm() {
  if (cardNameInput) cardNameInput.value = "";
  if (cardNumberInput) cardNumberInput.value = "";
  if (expDateInput) expDateInput.value = "";
  if (cvvInput) cvvInput.value = "";

  const fields = [
    { input: cardNameInput, error: cardNameError, label: cardNameLabel },
    { input: cardNumberInput, error: cardNumberError, label: cardNumberLabel },
    { input: expDateInput, error: expDateError, label: expDateLabel },
    { input: cvvInput, error: cvvError, label: cvvLabel },
  ];

  fields.forEach(({ input, error, label }) => {
    input?.classList.remove("active");
    error?.classList.remove("active");
    label?.classList.remove("active");
  });
}

function handleCheckout() {
  if (!cart.length) return;
  if (!validateCheckout()) return;

  modalSuccess.style.display = "flex";
  setTimeout(() => {
    modalSuccess.style.display = "none";
  }, 1800);

  cart = [];
  saveCart();
  renderCart();
  clearPaymentForm();
}

if (checkoutButton) {
  checkoutButton.addEventListener("click", handleCheckout);
}

if (cardNumberInput) {
  cardNumberInput.addEventListener("input", formatCardNumberInput);
}

if (expDateInput) {
  expDateInput.addEventListener("input", formatExpDateInput);
}

if (cvvInput) {
  cvvInput.addEventListener("input", () => sanitizeNumericInput(cvvInput, 3));
}

if (cardNameInput) {
  cardNameInput.addEventListener("input", () => {
    if (cardNameInput.value.trim().length >= 2) {
      setFieldState(cardNameInput, cardNameError, cardNameLabel, true);
    }
  });
}

renderCart();
