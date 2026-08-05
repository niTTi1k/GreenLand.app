const categoryList = document.querySelector(".category-list");
const productsContainer = document.querySelector(".allProduct");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const CART_KEY = "greenland_cart";
const badge = document.getElementById("badge");
let allProducts = [];
let cart = loadCart();

async function init() {
  updateCartBadge();
  await Promise.all([fetchCategories(), fetchProducts()]);

  if (searchButton) {
    searchButton.addEventListener("click", searchProducts);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchProducts();
      }
    });
  }
}

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
  updateCartBadge();
}

function updateCartBadge() {
  if (!badge) return;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  badge.textContent = totalQuantity;
}

function searchProducts() {
  const query = searchInput?.value.trim().toLowerCase() || "";
  const activeCategory =
    document.querySelector(".category.active")?.dataset.category || "all";

  let sourceProducts = allProducts;
  if (activeCategory && activeCategory !== "all") {
    sourceProducts = sourceProducts.filter(
      (product) => product.category === activeCategory,
    );
  }

  if (!query) {
    filterProducts(activeCategory);
    return;
  }

  const filtered = sourceProducts.filter((product) => {
    const title = product.title.toLowerCase();
    const description = (product.description || "").toLowerCase();
    const category = (product.category || "").toLowerCase();
    return (
      title.includes(query) ||
      description.includes(query) ||
      category.includes(query)
    );
  });

  renderProducts(filtered);
}

function addToCart(product, imageElement) {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail || product.images?.[0] || "img/gucci.png",
      category: product.category,
      quantity: 1,
    });
  }
  saveCart();
  animateAddToCart(imageElement);
}

function animateAddToCart(imageElement) {
  if (!badge || !imageElement) return;

  const imageRect = imageElement.getBoundingClientRect();
  const badgeRect = badge.getBoundingClientRect();
  const clone = imageElement.cloneNode(true);

  clone.style.position = "fixed";
  clone.style.left = `${imageRect.left}px`;
  clone.style.top = `${imageRect.top}px`;
  clone.style.width = `${imageRect.width}px`;
  clone.style.height = `${imageRect.height}px`;
  clone.style.transition = "transform 0.8s ease, opacity 0.8s ease";
  clone.style.zIndex = "9999";
  clone.style.pointerEvents = "none";
  clone.style.borderRadius = "10px";
  clone.style.objectFit = "cover";
  clone.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";

  document.body.appendChild(clone);

  const targetX =
    badgeRect.left + badgeRect.width / 2 - imageRect.left - imageRect.width / 2;
  const targetY =
    badgeRect.top + badgeRect.height / 2 - imageRect.top - imageRect.height / 2;

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.2)`;
    clone.style.opacity = "0.3";
  });

  badge.classList.add("added");
  setTimeout(() => badge.classList.remove("added"), 220);
  setTimeout(() => clone.remove(), 850);
}

async function fetchCategories() {
  try {
    const response = await fetch("https://dummyjson.com/products/categories");
    if (!response.ok) throw new Error("response is not ok");

    const data = await response.json();
    const categoryData = Array.isArray(data)
      ? data
      : Array.isArray(data?.categories)
        ? data.categories
        : [];
    const categories = [
      { slug: "all", label: "All" },
      ...categoryData.map((category) => ({
        slug: category?.slug || getCategoryText(category),
        label: category?.name || getCategoryText(category),
      })),
    ];
    renderCategories(categories);
  } catch (error) {
    console.error(error);
    renderCategories([{ slug: "all", label: "All" }]);
  }
}

async function fetchProducts() {
  try {
    const response = await fetch("https://dummyjson.com/products?limit=100");
    if (!response.ok) throw new Error("response is not ok");

    const data = await response.json();
    allProducts = Array.isArray(data.products) ? data.products : [];
    renderProducts(allProducts);
  } catch (error) {
    console.error(error);
    renderProducts([]);
  }
}

function renderCategories(categories) {
  if (!categoryList) return;

  categoryList.innerHTML = "";

  categories.forEach((category) => {
    const slug = category.slug || getCategoryText(category);
    const label = category.label || getCategoryText(category);
    const p = document.createElement("p");
    p.classList.add("category");
    p.dataset.category = slug;
    p.textContent = label === "all" ? "All" : capitalizeLabel(label);

    p.addEventListener("click", () => {
      categoryList
        .querySelectorAll(".category")
        .forEach((item) => item.classList.remove("active"));
      p.classList.add("active");
      filterProducts(slug);
    });

    categoryList.appendChild(p);
  });

  const firstCategory = categoryList.querySelector(".category");
  if (firstCategory) {
    firstCategory.classList.add("active");
  }
}

function filterProducts(category) {
  const filtered =
    category === "all"
      ? allProducts
      : allProducts.filter((product) => product.category === category);

  renderProducts(filtered);
}

function renderProducts(products) {
  if (!productsContainer) return;

  productsContainer.innerHTML = "";

  if (!products.length) {
    productsContainer.innerHTML = `<p class="no-products">Nuk ka produkte për këtë kategori.</p>`;
    return;
  }

  products.forEach((product) => {
    const box = document.createElement("div");
    box.classList.add("productBox");
    box.innerHTML = `
            <img src="${product.thumbnail || product.images?.[0] || "img/gucci.png"}" alt="${product.title}" class="productImg">
            <h1 class="productTitle">${product.title}</h1>
            <p class="productDescription">${product.description || product.title}</p>
            <div class="priceCartFavorite">
                <p class="productPrice">${formatPrice(product.price)}</p>
                <button class="addToCart">Add to Cart</button>
                <span class="favorite">
                    <i class="fa-solid fa-heart"></i>
                </span>
            </div>
        `;
    const addBtn = box.querySelector(".addToCart");
    const favBtn = box.querySelector(".favorite");
    const productImg = box.querySelector(".productImg");
    if (addBtn) {
      addBtn.addEventListener("click", () => addToCart(product, productImg));
    }
    if (favBtn) {
      favBtn.addEventListener("click", () => {
        const selected = favBtn.classList.toggle("selected");
        if (selected) {
          playFavoriteSound();
          animateFavoriteToProfile(favBtn);
        }
      });
    }
    productsContainer.appendChild(box);
  });
}

function formatPrice(price) {
  return typeof price === "number" ? `${price}$` : price;
}

function playFavoriteSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.15);
  } catch (error) {
    console.warn("Favorite sound not supported", error);
  }
}

function animateFavoriteToProfile(sourceElement) {
  const profileIcon = document.querySelector("#navRightSite .fa-user");
  if (!profileIcon || !sourceElement) return;

  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = profileIcon.getBoundingClientRect();
  const clone = sourceElement.cloneNode(true);

  clone.style.position = "fixed";
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.transition = "transform 0.6s ease, opacity 0.6s ease";
  clone.style.zIndex = "9999";
  clone.style.pointerEvents = "none";
  clone.style.transformOrigin = "center center";

  document.body.appendChild(clone);

  const targetX =
    targetRect.left +
    targetRect.width / 2 -
    sourceRect.left -
    sourceRect.width / 2;
  const targetY =
    targetRect.top +
    targetRect.height / 2 -
    sourceRect.top -
    sourceRect.height / 2;

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.4)`;
    clone.style.opacity = "0.3";
  });

  profileIcon.classList.add("profile-highlight");
  setTimeout(() => profileIcon.classList.remove("profile-highlight"), 300);
  setTimeout(() => clone.remove(), 650);
}

function getCategoryText(category) {
  if (typeof category === "string") return category;
  if (typeof category === "object" && category !== null) {
    return String(
      category.name ||
        category.title ||
        category.category ||
        category.label ||
        "",
    );
  }
  return "";
}

function capitalizeLabel(text) {
  return String(text)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

init();
