<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query, orderBy, onSnapshot,doc, updateDoc, getDoc
} from 'firebase/firestore'
import { db } from '@/firebase'
import { useRouter } from "vue-router"

const isLoggedIn = ref(false);
const isLoggedOut = ref(false);
let user = ref(null);

const dataCollectionQuery = query(
  collection(db, "dataBarang"),
  orderBy("stok", "asc")
  // limit(10)
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

  const userRef = doc(db, "user",emailUser)

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
        const itemToAdd =itemData.value.find(item => item.id === itemId);
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
              <button class="cart" @click="addToCart(item.id)"><font-awesome-icon icon="fa-solid fa-cart-shopping" /></button>
              <button class="button">Beli</button>
            </div>

          </div>
        </div>

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
