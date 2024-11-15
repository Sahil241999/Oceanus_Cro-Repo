const productCardATCs = Array.from(
  document.querySelectorAll(".os-pc-quick-atc")
);

productCardATCs.forEach((card) => {
  card.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  const variants = Array.from(
    card.querySelectorAll(".os-pc-quick-atc-variant")
  );
  variants.forEach((variant) => {
    variant.addEventListener("click", function () {
      console.log(variant.dataset.variantId)
      addToCart(variant.dataset.variantId, 1);
    });
  });
});
