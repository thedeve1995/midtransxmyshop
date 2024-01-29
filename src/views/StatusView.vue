<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useRouter } from "vue-router"
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { onMounted, ref } from "vue";
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import axios from 'axios';

let linkImage
let namaUser
let emailUser
let dataBeliUser = ref([]);

const router = useRouter()
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
      const email = user.email
      namaUser = displayName;
      emailUser = email;
      loadData();

    } else {
      isLoggedIn.value = false;
      isLoggedOut.value = true;
    }
  });
});

async function loadData() {
  if (user.value) {
    const userDocRef = doc(db, "user", emailUser);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const dataBeliField = userDocSnap.data().dataBeli;
      if (dataBeliField && Array.isArray(dataBeliField)) {
        dataBeliUser.value = dataBeliField;
        // Panggil fungsi checkOrderStatus untuk setiap orderId dalam dataBeliUser
        for (const data of dataBeliUser.value) {
          checkOrderStatus(data.orderId);
        }
        console.log(dataBeliUser)
      }
    } else {
      console.error("Dokumen tidak ditemukan!");
    }
  }
}



const checkOrderStatus = async (orderId) => {
  try {
    const response = await axios.get(`http://localhost:3000/getOrderStatus/${orderId}`);
    const { transactionStatus } = response.data;


    if (transactionStatus.store && transactionStatus.payment_type === 'cstore') {
      const { transaction_status: status, payment_code: payNumber, payment_type: payment_type, store: store } = transactionStatus;
      console.log(transactionStatus);
      const storeName = store; // Get storeName from transactionStatus

      updateFirestoreDocument(orderId, status, payNumber, payment_type, storeName);

      console.log('Transaction Status:', status, 'Store Name:', storeName, orderId);
    } else {
      // Extract relevant fields with destructuring assignment
      const { transaction_status: status, va_numbers, payment_type: payment_type } = transactionStatus;
      console.log(transactionStatus)
      // Use optional chaining to handle potential undefined properties
      const vaNumber = va_numbers?.[0]?.va_number;
      const bank = va_numbers?.[0]?.bank;

      // Update Firestore document with a default value if both code and code2 are undefined
      updateFirestoreDocument2(orderId, status, vaNumber, payment_type, bank);

      console.log('Transaction Status:', status);
    }

  } catch (error) {
    console.error('Error checking transaction status:', error);
  }
};

async function updateFirestoreDocument(orderId, statusPayment, payNumber, payment_type, storeName) {
  try {
    const userDocRef = doc(db, "user", emailUser);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const newDataBeli = userData.dataBeli.map(data => {
        if (data.orderId === orderId) {
          return { ...data, statusPayment, payNumber, payment_type, storeName };
        } else {
          return data;
        }
      });

      await updateDoc(userDocRef, { dataBeli: newDataBeli });
    } else {
      console.error("Dokumen tidak ditemukan!");
    }
  } catch (error) {
    console.error('Error updating Firestore document:', error);
  }
}
async function updateFirestoreDocument2(orderId, statusPayment, vaNumber, payment_type, bank) {
  try {
    const userDocRef = doc(db, "user", emailUser);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const newDataBeli = userData.dataBeli.map(data => {
        if (data.orderId === orderId) {
          return { ...data, statusPayment, vaNumber, payment_type, bank };
        } else {
          return data;
        }
      });

      await updateDoc(userDocRef, { dataBeli: newDataBeli });
    } else {
      console.error("Dokumen tidak ditemukan!");
    }
  } catch (error) {
    console.error('Error updating Firestore document:', error);
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
};
</script>

<template>
  <div class="container">

    <div class="cardCon">
      <h1 v-if="dataBeliUser.length == 0">Anda belum membeli apapun</h1>
      <div class="card" v-for="data in dataBeliUser">
        <div class="area1">
          <div class="name">
            {{ data.name }}
          </div>
          <div class="status">
            <p style="background-color: rgb(245, 136, 20);padding: 0 20px;color: white;">
              Status : {{ data.statusPayment }} 
            </p>
          </div>
        </div>
        <div class="area2">
          <div class="cardArea2" v-for="barang in data.barang">
            <div class="imgCon">
              <img width="75" :src="barang.linkImage[0]" alt="">
              <div class="barangKeterangan">
                <span>{{ barang.name.slice(0,20) }}</span>
                <span>{{ barang.quantity }} x {{ formatCurrency(barang.price) }}</span>
              </div>
            </div>
            <span>{{ formatCurrency(barang.total) }}</span>
          </div>
        </div>
        
        <div class="area3">
          <span>Total Pesanan : {{ formatCurrency(data.total) }}</span>
        </div>
        <div class="areaPetunjukBayar">
          <p v-if="data.bank">Silahkan transfer sejumlah total pesanan {{formatCurrency(data.total)}} ke bank <b>{{ data.bank }}</b> dengan nomor virtual account <b>{{ data.vaNumber }}</b>, status pembayaran akan berubah menjadi <b>"settlement"</b> jika pembayaran sudah dilakukan. Silahkan refresh halaman secara berkala untuk melihat perubahan status </p>
          <p v-if="data.storeName">Silahkan bayar sejumlah total pesanan {{formatCurrency(data.total)}} di <b>{{data.storeName}}</b> dengan memberi kode <b>{{ data.payNumber }}</b> ke kasir, status pembayaran akan berubah menjadi <b>"settlement"</b> jika pembayaran sudah dilakukan </p>
        </div>
        <!-- <div class="area4">
         
            <button>Bayar</button>
            <button>Hubungi Toko</button>
          
        </div> -->
      </div>
    </div>
  </div>
</template>

<style scoped>
div {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h1 {
  font-size: 15px;
}

.cardCon {
  background-color: antiquewhite;
  width: 100%;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cardCon .card {
  background-color: aliceblue;
  padding: 20px;
  width: 80%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cardCon .card .area1 {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
}

.cardCon .card .area2 {
  display: flex;
  flex-direction: column;
  padding: 10px;
  gap: 5px;
  width: 100%;
}

.cardCon .card .area2 .cardArea2 {
  display: flex;
  flex-direction: row;
  background-color: rgb(225, 225, 225);
  padding: 5px;
  width: 100%;
  justify-content: space-between;
  box-sizing: border-box;
}

.cardCon .card .area2 .cardArea2 .imgCon{
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.cardCon .card .area2 .cardArea2 .imgCon .barangKeterangan{
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.cardCon .card .area3 {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  background-color: rgb(245, 136, 20);
  padding: 5px;
  width: 100%;
  box-sizing: border-box;
  color: aliceblue;
}

.cardCon .card .area4{
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 10px;
}
</style>