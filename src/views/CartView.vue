<template>
  <div class="cart">
    <h1>You have {{ userCart.length }} Item in your cart</h1>
    <div class="total">
      <p>Your Total Price : {{ formatCurrency(totalCart) }}</p>

      <button id="kirimBtn" @click="fillAddress">Kirim Barang</button>
    </div>
    <div class="cartItems">
      <div class="item" v-for="cart in userCart" :key="cart.id">
        <div class="img">
          <img width="60" :src="cart.linkImage[0]" alt="gambar">
        </div>
        <div class="ket">
          <h4>{{ cart.namaBarang }}</h4>
          <p>Harga {{ formatCurrency(cart.harga) }}</p>
          Jumlah : <input style="padding: 0 10px;min-width: 30px;max-width: 50px; text-align: center;border-radius: 4px;"
            v-model="cart.quantity" @input="updateQuantity(cart.id, $event.target.value)" type="number">
        </div>
        <font-awesome-icon @click="deleteCartItem(cart.id)" icon="fa-solid fa-xmark" />
      </div>

    </div>
    <div class="formModal" v-if="buttonClicked">

      <form @submit.prevent="kirimBarang">
        <h1>Silahkan Isi Data Diri Anda <br> Untuk Pemesanan</h1>
        <input type="text" v-model="namaPembeli" placeholder="Nama Pembeli">
        <input type="text" v-model="alamatRumahPembeli" placeholder="Alamat Rumah">
        <input type="email" v-model="emailPembeli" placeholder="Email">
        <input type="number" v-model="nomorWaPembeli" placeholder="Nomor WA">
        <textarea v-model="pesan" placeholder="Pesan Anda"></textarea>
        <input type="submit" value="Kirim Pesan Ke Admin ">
        <font-awesome-icon @click="cancelAddress" icon="fa-solid fa-xmark" />
      </form>


    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc, updateDoc, getDoc
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useRouter } from "vue-router"
import axios from 'axios';

onMounted(async () => {

  onAuthStateChanged(auth, (user) => {
    if (user) {
      isLoggedIn.value = true;
      const email = user.email
      emailUser = email;
      loadCart();
    } else {
      isLoggedIn.value = false;
    }
  });
});

const userCart = ref([])
const auth = getAuth();
const isLoggedIn = ref(false);
let totalCart

const namaPembeli = ref("");
const alamatRumahPembeli = ref("")
const emailPembeli = ref("")
const nomorWaPembeli = ref("")
const pesan = ref("")

const kirimBarang = async () => {
  const formattedCart = userCart.value.map(cartItem => ({
    id: cartItem.id,
    namaBarang: cartItem.namaBarang.slice(0,20),
    Harga: cartItem.harga,
    quantity: cartItem.quantity
  }));
  const orderCode = generateOrderCode();

  // Konversi formattedCart ke dalam bentuk yang diharapkan oleh "item_details"
  const itemDetails = formattedCart.map(cartItem => ({
    id: cartItem.id,
    price: cartItem.Harga,  // Sesuaikan dengan nama properti yang diharapkan
    quantity: cartItem.quantity,
    name: cartItem.namaBarang
  }));

  let parameter = {
    "transaction_details": {
      "order_id": orderCode,
      "gross_amount": totalCart,
    },
    "credit_card": {
      "secure": true
    },
    "item_details": itemDetails,  // Gunakan itemDetails yang sudah diatur
    "customer_details": {
      "first_name": namaPembeli.value,
      "email": emailPembeli.value,
      "phone": "+62" + nomorWaPembeli.value,
      "billing_address": {
        "first_name": namaPembeli.value,
        "email": emailPembeli.value,
        "phone": nomorWaPembeli.value,
        "address": alamatRumahPembeli.value,
        "country_code": "IDN"
      },
    }
  };

  // Tambahkan item details ke dalam parameter dengan key yang sudah disediakan
  parameter["item_details"] = itemDetails;

  try {
    // Menggunakan await untuk menunggu respons dari server
    const response = await axios.post('http://localhost:3000/getTransactionToken', parameter);

    const transactionToken = response.data.transactionToken;
    console.log('transactionToken:', transactionToken);
    window.snap.pay(transactionToken);

    // Melakukan operasi berikutnya, misalnya menampilkan pesan atau melakukan operasi lainnya.
  } catch (error) {
    console.error('Error getting transaction token:', error);
  }
};

const generateOrderCode = () => {
  // Implement your own logic to generate a unique order code
  // For example, you can use a combination of date and random numbers
  const currentDate = new Date();
  const orderCode = `ORDER${currentDate.getTime()}${Math.floor(Math.random() * 1000)}`;
  return orderCode;
};

let emailUser

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
};

const loadCart = async () => {
  if (emailUser) {
    const userRef = doc(db, 'user', emailUser);

    try {
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.cart) {
          userCart.value = data.cart;
          countTotalCart();
        }
      } else {
        console.log('No such document!');
      }
    } catch (e) {
      console.error('Error getting document:', e);
    }
  }
};

const updateCartQuantity = async (cartItemId, newQuantity) => {
  const userRef = doc(db, 'user', emailUser);

  try {
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.cart) {
        const updatedCart = data.cart.map((cartItem) => {
          if (cartItem.id === cartItemId) {
            cartItem.quantity = newQuantity;
          }
          return cartItem;
        });

        await updateDoc(userRef, { cart: updatedCart });
        loadCart();
      }
    }
  } catch (e) {
    console.error('Error updating document:', e);
  }
};

const updateQuantity = (cartItemId, newQuantity) => {
  const parsedQuantity = parseInt(newQuantity, 10);
  if (!isNaN(parsedQuantity) && parsedQuantity >= 0) {
    updateCartQuantity(cartItemId, parsedQuantity);
  }
};

const countTotalCart = () => {
  totalCart = userCart.value.reduce((total, cartItem) => {
    return total + cartItem.quantity * cartItem.harga;
  }, 0);
};

const buttonClicked = ref(false)

const fillAddress = () => {
  buttonClicked.value = true
}

const cancelAddress = () => {
  buttonClicked.value = false
}

const deleteCartItem = (cartItemId) => {
  // Find the index of the item in the userCart array
  const index = userCart.value.findIndex((cartItem) => cartItem.id === cartItemId);

  // If the item is found, remove it from the userCart array
  if (index !== -1) {
    userCart.value.splice(index, 1);

    // Update the cart in the database if needed
    updateCartInDatabase();

    // Recalculate the total cart value
    countTotalCart();
  }
};

const updateCartInDatabase = async () => {
  const userRef = doc(db, 'user', emailUser);

  try {
    await updateDoc(userRef, { cart: userCart.value });
  } catch (e) {
    console.error('Error updating document:', e);
  }
};
</script>

<style scoped>
.cart {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
}

.cart h1 {
  text-align: center;
}

.cartItems {
  height: 70vh;
  border: 1px solid #f58814;
  width: 50vw;
  border-radius: 10px;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  overflow-y: scroll;
}



.item {
  display: flex;
  width: 100%;
  background-color: #f58814;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 5px;
  justify-content: flex-start;
  color: white;
  gap: 10px;
  align-items: center;
  position: relative;
}

.fa-xmark {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 20px;
  cursor: pointer;
  transition: 0.2s;
}

.item .fa-xmark:hover {
  font-size: 25px;
}

.total {
  display: flex;
  width: 30vw;
  justify-content: space-around;
  align-items: center;
}



.total button {
  padding: 5px 20px;
}

.formModal {
  width: 100vw;
  height: 90vh;
  background-color: rgba(220, 220, 220, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
}

.formModal form {
  width: 50vw;
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
  position: relative;
}

@media (max-width:500px) {

  .cartItems,
  .total {
    width: 95vw;
  }

  .total {
    justify-content: space-between;
  }

  .formModal form {
    width: 98vw;
  }

}

.formModal form input,
.formModal form textarea {
  width: 400px;
  padding: 5px 20px;
  box-sizing: border-box;
  border-radius: 10px;
  border: none;
  outline: none;
}

.formModal form input {
  height: 40px;

}

.formModal form h1 {
  color: rgb(0, 0, 0);
}

.formModal form input[type=submit],
#kirimBtn {
  background-color: #f58814;
  color: white;
  border-radius: 10px;
  border: none;
  box-shadow: 0 0 4px rgb(116, 116, 116);
  cursor: pointer;
}

.img img {
  border-radius: 50%;
}
</style>