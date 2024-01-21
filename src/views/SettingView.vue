<!-- App.vue -->
<template>
    <div class="setting">
        <div class="sideAdminNav">
            <button>Profil</button>
            <button>Cart</button>
            <button>On Progress</button>
            <button>Done</button>
            <button>Data</button>
        </div>
        <div class="sideView">
            <h1>Your Profile</h1>
            <p>Type on input to edit</p>
            <form @submit.prevent="uploadData">
                <div>
                    <label for="name">Nama</label>
                    <input type="text" id="name" v-model="namaUser" />
                </div>
                <div>
                    <label for="email">Email</label>
                    <input type="text" id="email" v-model="emailUser" />
                </div>


                <!-- <div>
                    <label for="email">Email:</label>
                    <input type="email" id="email" v-model="formData.email" />
                </div> -->

                <div>
                    <label for="photo">Foto Profil</label>
                    <input type="file" id="photo" @change="handleImageUpload" />

                </div>

                <button>Save</button>
            </form>
        </div>
    </div>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import { getAuth, updateProfile, onAuthStateChanged } from "firebase/auth";
import { storage, db } from "@/firebase";
import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
} from "firebase/storage";
import { addDoc, collection, updateDoc, setDoc, doc } from 'firebase/firestore';

let selectedImageFile = null;
let imageRef;
const linkImage = ref("");
const auth = getAuth();
const namaUser = ref("")
const emailUser = ref("")

const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        // Initialize imageRef within handleImageUpload
        imageRef = storageRef(storage, file.name);
        selectedImageFile = file;
    }
};

const uploadData = async () => {
    if (selectedImageFile) {
        // Upload the image to Firebase Storage
        await uploadBytes(imageRef, selectedImageFile);
        // Get the download URL of the uploaded image
        const imageUrl = await getDownloadURL(imageRef);
        // Update the linkImage field with the image URL
        linkImage.value = imageUrl;
    }

    // Update user profile
    updateProfile(auth.currentUser, {
        displayName: namaUser.value,
        email: emailUser.value,
        photoURL: linkImage.value,
    }).then(() => {
        console.log("Profile updated!");

        // Add the updated data to the Firestore collection "user"
        setDoc(doc(db, 'user', emailUser.value), {
            displayName: namaUser.value,
            photoURL: linkImage.value,
            email: emailUser.value
        }, { merge: true }).then(() => {
            console.log("Data added to Firestore collection 'user' with email as document ID");
        }).catch((error) => {
            console.error("Error adding data to Firestore:", error);
        });
    }).catch((error) => {
        console.error("Error updating profile:", error);
    });
};


onMounted(() => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const displayName = user.displayName;
            const uid = user.uid;
            const photoURL = user.photoURL;
            const email = user.email;
            linkImage.value = photoURL;
            namaUser.value = displayName;
            emailUser.value = email;
        } else {
        }
    });
});

</script>

  
<style scoped>
.setting {
    min-height: 90vh;
    display: flex;
    justify-content: space-between;
    margin-top: -20px;
}

.sideAdminNav {
    width: 15vw;
    min-height: 90vh;
    background-color: rgb(245, 136, 20);
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px;
}

.sideAdminNav button {
    height: 35px;
}

.sideView {
    width: 85vw;
    min-height: calc(90vh + 5px);
    padding: 0 10px;
}

form {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 10px;
    margin-top: 20px;
}

form div {
    display: flex;
    justify-content: space-between;
    width: 300px;
}

form div input {
    width: 180px;
    padding: 0 10px;
}

form button {
    width: 300px;
    background-color: rgb(245, 136, 20);
    color: white;
    padding: 10px 0;
    border: none;
    outline: none;
    border-radius: 5px;
}

form button:hover {
    background-color: rgb(246, 151, 50);
    cursor: pointer;
}

form button:active {
    background-color: rgb(245, 136, 20);
}
</style>
  