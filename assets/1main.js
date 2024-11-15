// header
document.querySelectorAll('.osh-lvl2-details').forEach((summary) => {
  summary.addEventListener('mouseover', () => {
    summary.setAttribute('open', true);
    summary.addEventListener('mouseleave', () => {
      summary.removeAttribute('open');
    });
  });
});

// Nav
const navDrawer = document.getElementById('oshm-drawer-wrapper');

function openNav() {
  navDrawer.setAttribute('open', true);
}

function closeNav() {
  navDrawer.setAttribute('open', false);
}

document.getElementById('oshm-open').addEventListener('click', openNav);
document.getElementById('oshm-close').addEventListener('click', closeNav);
document.getElementById('oshm-drawer-overlay').addEventListener('click', closeNav);

// nav pages
document.querySelectorAll('.oshm-button').forEach((button) => {
  button.addEventListener('click', () => {
    button.parentElement.parentElement.removeAttribute('open');
  });
});

// Shopify money formats
function formatMoney(cents, format) {
  if (typeof cents == 'string') {
    cents = cents.replace('.', '');
  }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return typeof opt == 'undefined' ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split('.'),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
      cents = parts[1] ? decimal + parts[1] : '';

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
}

// Debounce function
function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

const format = $('#osc-main').attr('data-money-format');

// Change qty function
function changeItemQty(variant_id, qty, button) {
  $.post('/cart/change.js', {
    id: variant_id,
    quantity: qty,
  }).then((response) => {
    const data = JSON.parse(response);
    // console.log(data);
    // function at the top which puts money into proper format
    // store the new cart subtotal
    const totalPrice = formatMoney(data.total_price, format);  
    // find item price html & new corresponding value
    const itemPrice = formatMoney(data.items.find((item) => item.variant_id == variant_id).final_line_price, format);
  
    const htmlPrice = button.parentElement.parentElement.querySelector('.osc-line-price');
    // find item qty html & new corresponding value
    const topQtyText = button.parentElement.querySelector('.osc-quantity-middle');
    // console.log("this is selector", topQtyText);
    const newQty = data.items.find((item) => item.variant_id == variant_id).quantity;
    // console.log("new quantity", newQty);

    // Update html
    document.getElementById('osc-total').innerHTML = totalPrice;
    htmlPrice.innerHTML = itemPrice;
    topQtyText.innerHTML = newQty;
    updateCounter(data);
    calculateProgressBar(data.total_price);
  });
}

function calculateProgressBar(cartAmount) {
  if (!cartAmount || cartAmount <= 0) return;
  const percentsComplete = (cartAmount * 100) / window.freeShippingAmount;
  const barWidth = percentsComplete > 100 ? 100 : percentsComplete;
  const amountLeft = window.freeShippingAmount - cartAmount;
  const progressBarLabel = document.querySelector('#osc-progress-bar .progress-bar__label');

  if (amountLeft <= 0) {
    progressBarLabel.innerHTML = 'You unlocked free shipping!';
  } else {
    progressBarLabel.innerHTML = `You are ${formatMoney(amountLeft, format)} away from free shipping!`;
  }

  const barElement = document.querySelector('#osc-progress-bar .progress-bar__inner');
  barElement.style = `width: ${barWidth}%`;
}

calculateProgressBar(window.cartAmount);

// Update cart counter
function updateCounter(newData) {
  const cartCounter = parseInt(newData.item_count);
  if (cartCounter === 0) {
    $('#osh-cart-bubble').css('display', 'none');
    $('#osh-cart-bubble').text(0);
  } else {
    $('#osh-cart-bubble').text(cartCounter);
  }
}

const osc_section = $('#osc-section');

function osOpenCart() {
  osc_section.removeClass('osc-hide-main');
  osc_section.attr('data-cart-open', 'true');
  $('body').addClass('no-scroll');
}

function osCloseCart() {
  osc_section.attr('data-cart-open', 'false');
  $('body').removeClass('no-scroll');
  setTimeout(() => {
    osc_section.addClass('osc-hide-main');
  }, 330);
}

// Open cart if url has opencart=true
if (document.URL.split('?')[1] === 'opencart=true') {
  osOpenCart();
}

$('#osc-icon-span').click(osCloseCart);
$('#osc-overlay').click(osCloseCart);
$('#osh-cart-icon').click(osOpenCart);

// Add event listners to the quantity buttons
function updateQty() {
  document.querySelectorAll('.osc-quantity-button').forEach(function (button) {
    button.addEventListener(
      'click',
      debounce(function () {
        const input = button.parentElement.querySelector('.osc-quantity-middle');
        const value = parseInt(input.innerHTML);
        const isPlus = button.classList.contains('osc-quantity-plus');
        const variant_id = button.closest('.osc-cart-item').getAttribute('data-key');

        // check variant qty
        const maxVariantQty = button.parentElement.getAttribute('data-variant-qty');

        // Change the input text value (depending up or down) then run function to update the cart qty
        if (isPlus) {
          // check if its hit the max variant stock left
          if (value == parseInt(maxVariantQty)) {
            button.parentElement.parentElement.parentElement.querySelector('.osc-update-error').innerHTML =
              'You have the max inventory in cart already';
          } else {
            const newValue = value + 1;
            changeItemQty(variant_id, newValue, button);
          }
        } else {
          const newValue = value - 1;
          if (!newValue) {
            const item = button.closest('.osc-cart-item');
            updateCartQuantity(variant_id, 0, item);
          } else {
            changeItemQty(variant_id, newValue, button);
          }
        }
      }, 500)
    );
  });
}

updateQty();

function updateCartQuantity(variant_id, quantity, item) {
  $.post('/cart/change.js', {
    id: variant_id,
    quantity,
  }).then((response) => {
    const data = JSON.parse(response);
    const format = $('#osc-main').attr('data-money-format');
    const totalPrice = formatMoney(data.total_price, format);
    // If cart items are empty then append the empty cart message. If not then update the totals.
    if (data.item_count === 0) {
      $('#osc-active-cart').remove();
      const html = `
          <div class="osc-empty__wrapper">
            <h3 class="osc-empty-heading">Your Cart is Empty</h3>
            <a class="osc-empty-link os-pp-atc" href="/collections/all">Shop All</a>
          </div>
        `;
      $('#osc-empty-cart').append(html);
      $('#osc-empty-cart').addClass('osc-empty-cart__visible');
      updateCounter(data);
    } else {
      item.remove();
      document.getElementById('osc-total').innerHTML = totalPrice;
      updateCounter(data);
      calculateProgressBar(data.total_price);
    }
  });
}

// add event listners to the remove button on cart items
function removeQty() {
  document.querySelectorAll('.osc-ci-close').forEach((remove) => {
    remove.addEventListener('click', (e) => {
      e.preventDefault();

      const item = remove.closest('.osc-cart-item');
      const variant_id = item.getAttribute('data-key');

      updateCartQuantity(variant_id, 0, item);

      // post request then remove cart item from display
    });
  });
}

removeQty();

document.querySelectorAll('#os-pp-atc, #os-pp-atc-sticky').forEach((addToCartButton) => {
  addToCartButton.addEventListener('click', (e) => {
    e.preventDefault();

    const variantId = document.getElementById('os-pp-master-input').value;
    // const variantQty = parseInt(document.getElementById("os-pp-qty-input").value);

    addToCart(variantId, 1);
  });
});

document.querySelectorAll('.os-pc-variant-title').forEach((addToCartButton) => {
  addToCartButton.addEventListener('click', (e) => {
    // e.preventDefault();

    const variantId = addToCartButton.getAttribute('data-variant-id');

    addToCart(variantId, 1);
  });
}); /**/

// Add item to cart
function addToCart(variantId, variantQty, addToCartButton) {
  $.post('/cart/add.js', {
    id: variantId,
    quantity: variantQty,
  })
    .then(() => {
      $.get('/?view=cart', (res) => {
        const mainWrapper = document.getElementById('osc-main-wrapper');
        mainWrapper.innerHTML = res;
        updateQty();
        removeQty();
        $('#osc-icon-span').click(osCloseCart);

        if (addToCartButton) {
          const quantity = addToCartButton.getAttribute('data-variant-quantity');

          if (quantity && quantity === '1') {
            addToCartButton.parentElement.parentElement.style = 'display:none;';
          }
        }
        const totalCart = mainWrapper.querySelector('#osc-total');
        calculateProgressBar(totalCart.dataset.totalPrice);
        osOpenCart();
      });

      document.getElementById('os-pp-error').innerHTML = '';
      const currentQty = parseInt(document.getElementById('osh-cart-bubble').innerHTML);
      const afterAddedQty = currentQty + parseInt(variantQty);
      $('#osh-cart-bubble').css('display', 'flex');
      $('#osh-cart-bubble').text(afterAddedQty);
    })
    .fail(function (xhr, status, error) {
      errorResponse = JSON.parse(xhr.responseText);
      document.getElementById('os-pp-error').innerHTML = errorResponse.message + ': ' + errorResponse.description;
    });
}

//Accodion js
$(document).ready(function () {
  $('.accordion_btn').on('click', function () {
    if ($(this).hasClass('active')) {
      $(this).removeClass('active');
      $(this).siblings('.accordion_content').slideUp(200);
      $('.accordion_btn i').removeClass('icon-minus').addClass('icon-plus');
    } else {
      $('.accordion_btn i').removeClass('icon-minus').addClass('icon-plus');
      $(this).find('i').removeClass('icon-plus').addClass('icon-minus');
      $('.accordion_btn').removeClass('active');
      $(this).addClass('active');
      $('.accordion_content').slideUp(200);
      $(this).siblings('.accordion_content').slideDown(200);
    }
  });
});
//Accodion js end
