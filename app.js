const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "3bt37yqx1awk",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "m01bkj7cdPjQJpvTj4cBB0WtLXltD4B5ZG3K6bUFoXg"
});

const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartContent = document.querySelector('.cart-content');
const cartTotal = document.querySelector('.cart-total');
const productsDOM = document.querySelector('.products-center');

let cart = [];
let buttonsDOM = [];

// Get Product class
class Products{
  async getProducts(){
    try{

      let contentful = await client.getEntries({
        content_type: "worldOfPlants"
      });
      // .then((response) => console.log(response.items))
      // .catch(console.error)

      // let result = await fetch('../product.json');
      // let data = await result.json();
      //return data;
      // let products = data.items;

      let products = contentful.items;
      console.log(products);

      products = products.map(item => {
        const {title,price} = item.fields;
        const {id} = item.sys;
        const image = item.fields.image.fields.file.url;
        return {title,price,id,image};
      });
      return products;
      // console.log(products);
    } catch(error){
      console.log(error);
    }
  }
}

// Display products
class UI{
  displayProducts(products){
     // console.log(products);
    let result = '';
    products.forEach(product => {
      result += `
      <article class="product">
        <div class="img-container">
          <img src=${product.image} alt="plant" class="product-img">
          <button class="bag-btn" data-id=${product.id}>
            <i class="fas fa-shopping-cart"></i>Add to Cart
          </button>
        </div>
        <h3>${product.title}</h3>
        <h4>₹ ${product.price}</h4>
      </article>
      `;
    });
    productsDOM.innerHTML  = result;
  }

  getBagButtons(){
    const buttons = [...document.querySelectorAll(".bag-btn")]; //... will array the values
    // console.log(buttons);
    buttonsDOM = buttons;
    buttons.forEach(button => {
      let id = button.dataset.id;
      let inCart = cart.find(item => item.id === id );
      if(inCart){
        button.innerText = "In Cart";
        button.disabled = true;
      }

      button.addEventListener('click',(event)=>{
      // console.log(event);
      event.target.innerText = "In Cart";
      event.target.disabled = true;
      //get product from products
      let cartItem = {...Storage.getProduct(id),amount:1};
        //console.log(cartItem);

      // add product to the cart
      cart = [...cart,cartItem];
        // console.log(cart);

      // save cart in local storage
      Storage.saveCart(cart);

      //set cart values
      this.setCartValues(cart);

      //display cart items
      this.addCartItem(cartItem);

      //show cart
      this.showCart();
    });

  });
  }
  setCartValues(cart){
    let tempTotal = 0;
    let itemsTotal = 0;

    cart.map(item => {
      tempTotal +=  item.price  * item.amount;
      itemsTotal += item.amount;
    })

    cartTotal.innerText = parseFloat(tempTotal.toFixed(2)); //2 decimals
    cartItems.innerText = itemsTotal;
    // console.log(cartTotal,cartItems);
  }

  addCartItem(item){
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
      <img src=${item.image} alt="plant">
      <div>
        <h4>${item.title}</h4>
        <h5>₹ ${item.price}</h5>
        <span class="remove-item" data-id=${item.id}>Remove</span>
      </div>
      <div>
        <i class="fas fa-chevron-up" data-id=${item.id}></i>
        <p class="item-amount">${item.amount}</p>
        <i class="fas fa-chevron-down" data-id=${item.id}></i>
      </div>`;
      cartContent.appendChild(div);
      // console.log(cartContent);
    }

    showCart(){
      cartOverlay.classList.add('transparentBcg');
      cartDOM.classList.add('showCart');
    }

    hideCart(){
      cartOverlay.classList.remove('transparentBcg');
      cartDOM.classList.remove('showCart');
    }

    setUpApp(){
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populate(cart);
    }

    populate(cart){
      cart.forEach(item => this.addCartItem(item));
      cartBtn.addEventListener('click',this.showCart);
      closeCartBtn.addEventListener('click',this.hideCart);
    }

    cartLogic(){
      //clear cart button
      clearCartBtn.addEventListener('click', () => {
        this.clearCart();
      });
      cartContent.addEventListener("click",() => {
        if(event.target.classList.contains('remove-item')){
          let removeItem = event.target;
          let id = removeItem.dataset.id;
          cartContent.removeChild(removeItem.parentElement.parentElement);
          this.removeItem(id);
        }
        else if(event.target.classList.contains('fa-chevron-up')){
          let addAmount = event.target;
          let id = addAmount.dataset.id;
          let tempItem = cart.find(item => item.id === id); //find item with id we have
          tempItem.amount = tempItem.amount + 1;
          Storage.saveCart(cart); //update cart
          this.setCartValues(cart);
          addAmount.nextElementSibling.innerText = tempItem.amount;
        }
        else if(event.target.classList.contains('fa-chevron-down')){
          let lowerAmount = event.target;
          let id = lowerAmount.dataset.id;
          let tempItem = cart.find(item => item.id === id); //find item with id we have
          tempItem.amount = tempItem.amount - 1;
          if(tempItem.amount > 0){
            Storage.saveCart(cart); //update cart
            this.setCartValues(cart);
            lowerAmount.previousElementSibling.innerText = tempItem.amount; // setting total no of item
          }
          else{
            cartContent.removeChild(lowerAmount.parentElement.parentElement);
            this.removeItem(id);
          }
        }

      })
    }

    clearCart(){
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        while(cartContent.children.length>0){
          cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }

    removeItem(id){
      cart = cart.filter(item => item.id  !== id);
      this.setCartValues(cart);
      Storage.saveCart(cart);
      let button = this.getSingleButton(id);
      button.disabled = false;
      button.innerHTML = `<i class="fas fa-shopping-cart"></i>Add to Cart`;
    }

    getSingleButton(id){
      return buttonsDOM.find(button => button.dataset.id === id);
    }
}

// Storage class
class Storage{
  static saveProducts(products){
    localStorage.setItem("products",JSON.stringify(products));
  }

  static getProduct(id){
    let products  = JSON.parse(localStorage.getItem('products'));
    return products.find(product => product.id === id);
  }

  static saveCart(cart){
    localStorage.setItem("cart",JSON.stringify(cart));
  }

  static getCart(){
    return localStorage.getItem('cart')?JSON.parse(localStorage.getItem('cart')):[] ;
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded",()=>{
  const ui = new UI();
  const products = new Products();
  // setup app
  ui.setUpApp();

  // get all products
  products.getProducts().then(products => {
    ui.displayProducts(products);
    Storage.saveProducts(products);
  }).then(()=>{
    ui.getBagButtons();
    ui.cartLogic();
  });

});

// Image carousel

var index = 0;
show_image(index);
 function show_image(i){
   index += i;

   var images = document.getElementsByClassName("image");
   var dots = document.getElementsByClassName("dot");

   for(i=0 ; i<images.length ; i++){
     images[i].style.display = "none";
   }

   for(i=0 ; i<dots.length ; i++){
     dots[i].className = dots[i].className.replace(" active", "");
   }

   if(index > images.length - 1){
     index = 0;
   }

   if(index < 0){
     index = images.length - 1;
   }

   images[index].style.display = "block";
   dots[index].className += " active";

 }
