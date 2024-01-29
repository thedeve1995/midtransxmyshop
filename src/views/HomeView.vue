<script setup>
import { ref, onMounted, toRefs, nextTick } from 'vue';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query, orderBy, onSnapshot, doc, updateDoc, getDoc, addDoc, setDoc
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useRouter } from "vue-router"
import axios from 'axios';

const isLoggedIn = ref(false);
const isLoggedOut = ref(false);
const modalBeliBarang = ref(false);
let user = ref(null);

const jumlahBarang = ref(0)

const dataBarangYangMauDiBeli = ref({
  id: '',
  namaBarang: '',
  harga: 0,
  stok: 0,
  gender: '',
  kategori: '',
  linkImage: []
});


const beliBarang = (itemId) => {
  const selectedBarang = itemData.value.find(item => item.id === itemId);

  dataBarangYangMauDiBeli.value = { ...selectedBarang }
  jumlahBarang.value = 1;
  modalBeliBarang.value = true;
};

const dataPembeli = ref({
  nama: '',
  alamat: '',
  noWA: '',
  email: '',
  kota: '',
  kodePos: '',
});

const generateOrderCode = () => {
  // Implement your own logic to generate a unique order code
  // For example, you can use a combination of date and random numbers
  const currentDate = new Date();
  const orderCode = `ORDER${currentDate.getTime()}${Math.floor(Math.random() * 1000)}`;
  return orderCode;
};

const prosesPembelian = async () => {


  const { nama, alamat, noWA, email, kota, kodePos } = dataPembeli.value
  const { id, namaBarang, harga, stok, linkImage } = dataBarangYangMauDiBeli.value

  if (jumlahBarang.value <= 0) {
    console.error("Invalid quantity. Please enter a valid quantity.");
    return;
  }

  if (jumlahBarang.value > stok) {
    alert("Insufficient stock. Please choose a lower quantity.");
    return;
  }
  /*const message = `
  Pesanan Satuan
  
  _Nama_ : *${nama}*
  _Alamat Pengiriman_: *${alamat}*
  _Barang_ : *${namaBarang}*
  _Harga Barang_ : *${harga}*
  _Jumlah_ : *${jumlahBarang.value}*
  _Total Anda Bayar_ : *${harga * jumlahBarang.value}*
  `
  const encodedMessage = encodeURIComponent(message);
  window.open(`http://wa.me/6287787045257?text=${encodedMessage}`) */

  const orderCode = generateOrderCode();
  let parameter = {
    "transaction_details": {
      "order_id": orderCode,
      "gross_amount": harga * jumlahBarang.value,
    },
    "credit_card": {
      "secure": true
    },
    "item_details":
    {
      "id": id,
      "price": harga,
      "quantity": jumlahBarang.value,
      "name": namaBarang.slice(0, 20)
    },
    "customer_details": {
      "first_name": nama,
      // "last_name": "Susanto",
      "email": email,
      "phone": "+62" + noWA,
      "billing_address": {
        "first_name": nama,
        // "last_name": "Susanto",
        "email": email,
        "phone": "+62" + noWA,
        "address": alamat,
        "city": kota,
        "postal_code": kodePos,
        "country_code": "IDN"
      },
      "shipping_address": {
        "first_name": nama,
        // "last_name": "Susanto",
        "email": email,
        "phone": "+62" + noWA,
        "address": alamat,
        "city": kota,
        "postal_code": kodePos,
        "country_code": "IDN"
      }
    }
  };

  try {

    const itemDocRef = doc(db, "dataBarang", id);
    const itemDoc = await getDoc(itemDocRef);

    if (itemDoc.exists()) {
      // Decrease the stock by the quantity purchased
      const updatedStok = itemDoc.data().stok - jumlahBarang.value;

      // Update the Firestore document with the new stock value
      await updateDoc(itemDocRef, { stok: updatedStok });

      // Add data to the "user" collection with document ID equal to emailUser
      const userDocRef = doc(db, "user", emailUser);

      try {
        // Check if the user document already exists
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // If the user document exists, update its data
          const dataBeliArray = userDoc.data().dataBeli || [];

          // Map data from the parameter and add it to the array
          const newDataBeli = {
            orderId: orderCode,
            name: nama,
            alamat: alamat,
            nomorWA: noWA,
            email:email,
            barang: [
              {
                id: id,
                name: namaBarang,
                price: harga,
                quantity: jumlahBarang.value,
                total: harga * jumlahBarang.value,
                linkImage : linkImage
              }
            ],
            // Calculate the total sum of 'total' property within the 'barang' array
            statusBayar: false,
            statusPengiriman: false,
            // ... (add other properties as needed)
          };

          newDataBeli.total = newDataBeli.barang.reduce((sum, item) => sum + item.total, 0);

          // Combine the existing dataBeli with the new data
          const updatedDataBeli = [...dataBeliArray, newDataBeli];

          // Update the "dataBeli" field in the user document
          await updateDoc(userDocRef, { dataBeli: updatedDataBeli });

          console.log("User document updated successfully!");

          const response = await axios.post('http://localhost:3000/getTransactionToken', parameter);

          const transactionToken = response.data.transactionToken;

          window.snap.pay(transactionToken);
        } else {
          // If the user document doesn't exist, create a new one
          const userData = {
            email: emailUser,
            dataBeli: {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              payedStatus: false,
              
            },
            // ... (add other fields as needed)
          };

          // Set the new user document
          await setDoc(userDocRef, userData);

          console.log("User document created successfully!");
        }
      } catch (error) {
        console.error("Error updating/creating user document:", error);
      }
    } else {
      console.error(`Item with ID ${id} not found in Firestore`);
    }
  } catch (error) {
    console.error('Error getting transaction token:', error);
  }
}


const dataCollectionQuery = query(
  collection(db, "dataBarang"),
  orderBy("stok", "asc")

);

const itemData = ref([]);

let auth;
let emailUser


onMounted(() => {
  loadData();
  auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isLoggedIn.value = true;
      isLoggedOut.value = false;
      const email = user.email
      emailUser = email;
    } else {
      isLoggedIn.value = false;
      isLoggedOut.value = true;
    }
  });
});


const loadData = () => {
  onSnapshot(dataCollectionQuery, (querySnapshot) => {
    const fbData = [];
    querySnapshot.forEach((doc) => {
      const data = {
        id: doc.id,
        namaBarang: doc.data().namaBarang,
        harga: doc.data().harga,
        stok: doc.data().stok,
        gender: doc.data().gender,
        kategori: doc.data().kategori,
        linkImage: doc.data().linkImage,
      };

      fbData.push(data);
    });
    itemData.value = fbData;
    originalItemData.value = [...fbData];
  });
};
let originalItemData = ref([]);

const filter = (type) => {
  if (originalItemData.value.length === 0) {
    // If originalItemData is empty, store the current itemData as the original
    originalItemData.value = [...itemData.value];
  }

  switch (type) {
    case 1:
      itemData.value = originalItemData.value.filter(item => item.gender === "male");
      break;
    case 2:
      itemData.value = originalItemData.value.filter(item => item.gender === "female");
      break;
    case 3:
      itemData.value = originalItemData.value.filter(item => item.kategori === "aksesoris");
      break;
    default:
      // Reset to the original data if no filter is applied
      itemData.value = [...originalItemData.value];
      break;
  }
};

const addToCart = async (itemId) => {
  if (emailUser == undefined) {
    // If email is undefined, do nothing
    return;
  }

  const userRef = doc(db, "user", emailUser)

  try {
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const cartItems = userDoc.data().cart || [];

      // Check if the item is already in the cart
      const existingItem = cartItems.find(item => item.id === itemId);

      if (existingItem) {
        // If the item is already in the cart, update its quantity or other properties
        // For example, you might want to increase the quantity
        existingItem.quantity += 1;
      } else {
        // If the item is not in the cart, add it
        const itemToAdd = itemData.value.find(item => item.id === itemId);
        if (itemToAdd) {
          cartItems.push({ id: itemId, quantity: 1, ...itemToAdd });
        }
      }

      // Update the user's cart field in Firestore
      await updateDoc(userRef, { cart: cartItems });

      console.log("Item added to cart successfully!");
    } else {
      console.error("User not found in Firestore");
    }
  } catch (error) {
    console.error("Error adding item to cart:", error);
  }
};



</script>

<template>
  <main>
    <img id="logo" src="../assets/banner.png" alt="">

    <div class="menu-home" style="display: flex;justify-content: center;">
      <img @click="filter(1)" src="../assets/1.png" style="border-radius: 10px;" alt="">
      <img @click="filter(2)" src="../assets/2.png" style="border-radius: 10px;" alt="">
      <img @click="filter(3)" src="../assets/3.png" style="border-radius: 10px;" alt="">
    </div>

    <div style="width: 100%;">
      <h1 style="text-align: center;">Featured Products</h1>

      <div class="card-container">
        <div v-for="item in itemData" class="card">
          <img :src="item.linkImage" width="250" height="250" alt="">
          <div class="judul-heart">
            <span class="judul" style="font-size: 12px;font-weight: 700;">{{ item.namaBarang }}</span>
            <font-awesome-icon icon="fa-solid fa-heart" />
          </div>

          <div class="harga-btnCon">
            <span class="harga" style="font-size: 15px;"><sup>Rp</sup>{{ item.harga }}</span>
            <div class="btn-group">
              <button class="cart" @click="addToCart(item.id)"><font-awesome-icon
                  icon="fa-solid fa-cart-shopping" /></button>
              <button @click="beliBarang(item.id)" class="button">Beli</button>
            </div>

          </div>
          <div class="stok">
            stok : {{ item.stok }}
          </div>
        </div>

      </div>
    </div>
    <div v-if="modalBeliBarang" class="beliBarangModal">
      <div class="modal-content">
        <span class="close" @click="modalBeliBarang = false">&times;</span>
        <h2>Detail Barang</h2>
        <div class="ketCon">
          <img :src="dataBarangYangMauDiBeli.linkImage[0]" width="100" height="100" alt="">

          <div class="ketCon1">
            <h3>ini {{ dataBarangYangMauDiBeli.namaBarang }}</h3>
            <p>Harga: Rp {{ dataBarangYangMauDiBeli.harga * jumlahBarang }}</p>
            <p> Jumlah : <input v-model="jumlahBarang" style="width: 50px;" type="number"></p>
          </div>
        </div>


        <!-- Form untuk data pembeli dan alamat -->
        <form @submit.prevent="prosesPembelian">
          <div class="inputCon">
            <label for="namaPembeli">Nama Pembeli:</label>
            <input type="text" id="namaPembeli" v-model="dataPembeli.nama" required>

            <label for="alamatPengiriman">Alamat Pengiriman:</label>
            <textarea id="alamatPengiriman" v-model="dataPembeli.alamat" required></textarea>
          </div>
          <div class="inputCon">
            <label for="nomorWhatsapp">Nomor Whatsapp:</label>
            <input type="text" id="nomorWhatsapp" v-model="dataPembeli.noWA" required>

            <label for="email">Email:</label>
            <input id="email" v-model="dataPembeli.email" required>

            <label for="kota">Kota:</label>
            <input type="text" id="kota" v-model="dataPembeli.kota" required>

            <label for="kodePos">Kode Pos:</label>
            <input id="kodePos" v-model="dataPembeli.kodePos" required>
          </div>


          <button type="submit">Beli Barang</button>
        </form>
      </div>
    </div>
  </main>
</template>

<style scoped>
#logo {
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  width: calc(80% + 40px);
  border-radius: 10px;
}

.menu-home {
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  width: calc(80% + 40px);
  gap: 40px;
  margin: 30px 0;
}

.menu-home img {
  width: 30%;
  box-shadow: 0 0 4px rgb(166, 166, 166);
}

.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  justify-content: center;
  margin: 30px 0;
  transition: 0.5s;
}

.card {
  width: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 0 10px rgb(230, 230, 230);
}

.card .judul {
  color: #f58814;
}



.card .btn-group {
  display: flex;
  gap: 7px;
}

.card .button {
  background-color: rgb(245, 136, 20);
  padding: 5px 25px;
  outline: 0;
  border: none;
  box-shadow: 0 0 4px rgb(166, 166, 166);
  border-radius: 5px;
  color: white;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
}

.card .cart {
  background-color: rgb(245, 136, 20);
  padding: 5px 10px;
  outline: 0;
  border: none;
  box-shadow: 0 0 4px rgb(166, 166, 166);
  border-radius: 5px;
  color: white;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
}

.harga-btnCon,
.judul-heart {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px;
}

.stok {
  margin: 0 10px;
}

.beliBarangModal {
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: 5% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 40%;
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 80vh;
  overflow-y: scroll;
}

.modal-content h2 {
  margin-bottom: 20px;
}

.close {
  color: #aaa;
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

/* Style tambahan untuk form */
form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

label {
  font-weight: bold;
}

input,
textarea {
  width: 100%;
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.ketCon {
  display: flex;

  justify-content: center;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
}



button:hover {
  background-color: #45a049;
}


@media (max-width:700px) {
  .menu-home {
    flex-direction: column;
    gap: 20px;
    align-items: center;
    margin-top: 10px;
  }

  .menu-home img {
    width: 100% !important;
  }

  .card {
    width: 47%;

  }

  .card-container {
    gap: 5px;
  }

  .menu-home img {
    width: 400px;
  }
}
</style>
