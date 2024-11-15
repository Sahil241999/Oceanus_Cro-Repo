document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  const productGrid = document.querySelector('#os-cp-product-grid');
  let nextUrl = productGrid && productGrid.getAttribute('data-next-url');
  const loadMoreBtn = document.querySelector('.load__more--btn');
  const loadMoreSpinner = document.querySelector('.load__more--spinner');
  const observerConfig = {
    root: null,
    threshold: 0,
    rootMargin: "0px"
  };

  let loadBtnObserver = null;
  let isLoading = false;  // Add a loading state flag

  if (loadMoreBtn) {
    console.log('Load More button found');
    loadBtnObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          console.log('Load More button intersecting');
          loadMoreProducts();
        }
      }
    }, observerConfig);
    loadBtnObserver.observe(loadMoreBtn);
  } else {
    console.error('loadMoreBtn not found');
  }

  function stopObserving() {
    if (loadBtnObserver) {
      loadBtnObserver.disconnect();
      console.log('Stopped observing Load More button');
    }
  }

  loadMoreBtn.addEventListener('click', loadMoreProducts);

  async function loadMoreProducts(e) {
    if (e) {
      e.preventDefault();
    }
    if (isLoading || !nextUrl) return;  // Prevent multiple concurrent requests and check for nextUrl

    isLoading = true;  // Set loading state
    console.log('Loading more products');
    loadMoreSpinner.style.display = "block";
    loadMoreBtn.style.display = "none";

    try {
      const response = await fetch(nextUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }

      const nextPageHtml = await response.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = nextPageHtml;
      const newUrl = tempDiv.querySelector('#os-cp-product-grid').getAttribute('data-next-url');
      console.log('newurl', newUrl);
      loadMoreSpinner.style.display = "none";
      console.log('Hiding spinner');

      if (newUrl) {
        loadMoreBtn.style.display = "block";
        nextUrl = newUrl;
      } else {
        stopObserving();
        console.log('No more products to load');
      }

      const newProducts = tempDiv.querySelector('#os-cp-product-grid');
      productGrid.insertAdjacentHTML('beforeend', newProducts.innerHTML);
      console.log('New products added');

    } catch (error) {
      console.error('There has been a problem with the fetch operation:', error);
      loadMoreSpinner.style.display = "none";
      loadMoreBtn.style.display = "block";
    } finally {
      isLoading = false;  // Reset loading state
    }
  }
});
