<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useRouter } from "vue-router"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { onMounted, ref } from "vue";
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

let linkImage
let namaUser
let emailUser
const router = useRouter()
const userCart = ref([])

const loadCart = async () => {
  if (emailUser) {
    const userRef = doc(db, 'user', emailUser);

    try {
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.cart) {
          userCart.value = data.cart;
        }

      } else {
        console.log('No such document!');
      }
    } catch (e) {
      console.error('Error getting document:', e);
    }
  }
};

const goToHome = () => {
  router.push("/")
}
const goToSetting = () => {
  router.push("/setting")
}

const openMenu = () => {
  document.getElementById("nav").style.display = "flex";
  document.getElementById("menu").style.display = "none";
  document.getElementById("menu-close").style.display = "block";
}
const closeMenu = () => {
  document.getElementById("nav").style.display = "none";
  document.getElementById("menu-close").style.display = "none";
  document.getElementById("menu").style.display = "block";
}

const isLoggedIn = ref(false);
const isLoggedOut = ref(false);
let user = ref(null);
onMounted(() => {
  auth = getAuth();
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      user.value = firebaseUser;
    } else {
      user.value = null;
    }
  });
});

let auth;
onMounted(() => {
  auth = getAuth();
  
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isLoggedIn.value = true;
      const displayName = user.displayName;
      const uid = user.uid;
      const photoURL = user.photoURL;
      const email = user.email
      linkImage = photoURL;
      namaUser = displayName;
      emailUser = email;
      loadCart();
    } else {
      isLoggedIn.value = false;
      isLoggedOut.value = true;
    }
  });
});

const handleSignOut = () => {
  signOut(auth).then(() => {
    router.push("/");
  });
};
</script>

<template>
  <header>
    <div class="wrapper">
      <img @click="goToHome()" src="./assets/logo2.png" height="50px" alt="">
  
      <nav id="nav">
        
        <RouterLink to="/login" v-if="isLoggedOut">Login</RouterLink>

        <div style="display: flex;gap: 10px;align-items: center;">
          <RouterLink style="background-color: rgb(245, 136, 20);padding: 5px;color: white;border-radius: 5px;"
            v-if="isLoggedIn" to="/cart">
            <font-awesome-icon icon="fa-solid fa-cart-shopping" />
            <span>{{ userCart.length }}</span>
          </RouterLink>

          <button
            style="background-color: rgb(245, 136, 20);padding: 5px;color: white;border-radius: 5px;"
            v-if="isLoggedIn" @click="goToSetting">
            <font-awesome-icon icon="fa-solid fa-gear" />
          </button>

          

          <button
            style="background-color: rgb(245, 136, 20);padding: 5px;color: white;border-radius: 5px"
            v-if="isLoggedIn" @click="handleSignOut">
            <font-awesome-icon icon="fa-solid fa-right-from-bracket" />
          </button>

          <img v-if="isLoggedIn" :src="linkImage"  width="30" height="30" style="border-radius: 50%;" alt="" :title="namaUser">
        </div>

      </nav>
    </div>
  </header>

  <RouterView class="view" />
  <footer>
    <div class="footer-content">
        <p>&copy; 2024 Fradel & Spies Shopping. All rights reserved.</p>
      </div>
  </footer>
</template>

<style scoped>
header {
  width: 100%;
  height: 9vh;
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: white;
}

header .wrapper {
  display: flex;
  padding: 5px 30px;
  justify-content: space-between;
  align-items: center;
}

header .wrapper img {
  cursor: pointer;
}

header .wrapper nav {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

header .wrapper nav a,
header .wrapper nav button {
  text-decoration: none;
  font-weight: 500;
  color: rgb(245, 136, 20);
  transition: 0.3s;
  border: none;
  cursor: pointer;
  font-size: 15px;
}

footer {
  background-color: rgb(245, 136, 20);
  min-height: 50px;
  color: white;
  text-align: center;
}

.footer-content {
  padding: 10px;
}

nav a.router-link-exact-active {
  background-color: rgb(245, 136, 20) !important;
  color: white !important;
  padding: 2px 10px;
  border-radius: 5px;
  font-weight: 700;
}

/* nav a.router-link-exact-active:hover {

} */

.menu {
  display: none;
}

.menu-close {
  display: none;
}

@media (max-width:700px) {
  .menu {
    display: block;
    font-weight: 700;
    color: rgb(245, 136, 20);
    transition: 0.5s;
  }




}
</style>
