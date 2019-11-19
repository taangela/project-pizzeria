import { settings, select, classNames, templates } from '../settings.js';
import {utils} from '../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;

    thisCart.products = [];
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.getElements(element);
    thisCart.initActions();
  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.address = thisCart.dom.wrapper.querySelector(select.cart.address);

    thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee']; //każdy ze stringów jest kluczem w obiekcie select.cart

    for (let key of thisCart.renderTotalsKeys) {
      thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
    }
  }

  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function() {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);

    });

    thisCart.dom.productList.addEventListener('updated', function() {
      thisCart.update();
      console.log('klick'); //nasłuchujemy na liści produktów (lista produktów ma produkty, w których są widgety liczby sztuk)
    }); //to właśnie widget liczby sztuk generuje event
    //dzięki bubbles słyszymy go na tej liście i możemy wykonać metodę update
    thisCart.dom.productList.addEventListener('remove', function() {
      thisCart.remove(event.detail.cartProduct);
    });
    thisCart.dom.form.addEventListener('submit', function() {
      event.preventDefault();
      thisCart.sendOrder();
    });


  }

  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.order;

    const payload = {
      address: thisCart.address.value,
      phone: thisCart.phone.value,
      totalPrice: thisCart.totalPrice,
      totalNumber: thisCart.deliveryFee,
      subtotalPrice: thisCart.subtotalPrice,
      deliveryFee: thisCart.deliveryFee,
      products: [],
    };

    for (let product of thisCart.products) {
      payload.products.push(product.getData());
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function(response) {
        return response.json();
      }).then(function(parsedResponse) {
        console.log('parsedResponse', parsedResponse);
      });

  }



  add(menuProduct) {

    const thisCart = this;


    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    thisCart.dom.productList.appendChild(generatedDOM);


    thisCart.products.push(new CartProduct(menuProduct, generatedDOM)); //jednocześnie tworzy instancję klasy oraz dodaje ją do tablicy thisCart.products
    thisCart.update();
    //console.log('thisCart.products', thisCart.products);
    //console.log('adding product', menuProduct);
  }

  update() {
    const thisCart = this;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (let product of thisCart.products) {
      thisCart.subtotalPrice += product.price;
      thisCart.totalNumber += product.amount;
    }
    if (thisCart.subtotalPrice == 0) {
      thisCart.deliveryFee = 0;
      // jeżeli dodamy dwa produkty do koszyka to deliveryfee = 0;
    }
    if (thisCart.totalNumber > 0) {
      thisCart.deliveryFee = 20;
    }
    console.log(thisCart.products);
    thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    console.log('total number', thisCart.totalNumber);
    console.log('subtotal price', thisCart.subtotalPrice);
    console.log('total price', thisCart.totalPrice);
    console.log('deliveryFee', thisCart.deliveryFee);

    for (let key of thisCart.renderTotalsKeys) { //iterujemy po kolekcji
      for (let elem of thisCart.dom[key]) { // iterujemy po każdym elmencie z kolekcji
        elem.innerHTML = thisCart[key]; // ustawiamy wartość koszyka, któru ma taki sam klucz
      }
    }
  }

  remove(cartProduct) {
    const thisCart = this;
    const index = thisCart.products.indexOf(cartProduct);
    thisCart.products.splice(index, 1);
    console.log(index);
    thisCart.update();
    cartProduct.dom.wrapper.remove();
  }
}

export default Cart;
