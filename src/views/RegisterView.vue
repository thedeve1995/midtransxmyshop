<template>
    <div class="container-wrap">
        <div class="container">
            <div class="login-container">
                <img src="../assets/logologin.png" alt="">
            </div>
            <div class="login-form">
                <h3>Register</h3>
                <p>Please enter your information</p>
                <div class="input-grp">
                    <div class="label-con">
                        <label for="email">EMAIL ID</label>
                        <input id="email" type="text" v-model="email">
                    </div>
                    <div class="label-con">
                        <label for="password">PASSWORD</label>
                        <input id="password" type="password" v-model="password">
                    </div>
                </div>

                <p style="margin-bottom: -10px;font-size: 14px;">Have account ? <span @click="goToLogin" style="cursor: pointer;">Login</span>
                </p>

                <button style="margin-top: 20px;cursor: pointer;" @click="register">Register</button>

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import {
    getAuth,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup, updateProfile
} from "firebase/auth";
import { useRouter } from "vue-router";
import { RouterLink, RouterView } from "vue-router";
import { storage, db } from "@/firebase";
import { ref as storageRef,uploadBytes,getDownloadURL,} from "firebase/storage";

const email = ref("");
const password = ref("");
const router = useRouter();

const register = () => {
    createUserWithEmailAndPassword(getAuth(), email.value, password.value)
        .then((data) => {
            router.push("/");
        })
        .catch((error) => {
            console.log(error.code);
            alert(error.message);
        });
};

const goToLogin = () => {
    router.push("/login")
}

</script>

<style scoped>
.container-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 90vh;
}

.container {
    display: flex;
    justify-content: center;
    gap: 50px;
    align-items: center;
    height: 70vh;
    width: 60vw;
    box-shadow: 0 0 10px rgb(212, 212, 212);
    position: relative;
    padding: 0 70px;
    box-sizing: border-box;
    border-radius: 20px;
    padding: 100px;
}

.login-container {
    background-color: #F58814;
    height: 56vh;
    display: flex;
    justify-content: center;
    flex-direction: column;
    box-sizing: border-box;
    padding: 50px;
    width: 45%;
    border-radius: 20px;
}

.login-form {
    /* border: 2px solid rgb(223, 223, 223); */
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
    border-radius: 10px;
    padding: 30px 60px;
}

.login-form h3 {
    font-size: 30px;
}

.login-form p {
    margin-bottom: 20px;
}

.login-form p span:hover {
    color: #F58814;
}

.login-form button {
    padding: 10px;
    width: 260px;
    background-color: #F58814;
    border: none;
    border-radius: 5px;
    color: white;
    font-weight: 700;
    letter-spacing: 1px;
}

.reme-grp {
    display: flex;
    width: 260px;
    font-size: 13px;
    justify-content: space-between;
}

.reme-grp p {
    height: 20px;
}

.reme-grp a {
    color: rgb(96, 96, 96);
}

.re-me {
    display: flex;
    height: 20px;
    gap: 4px;
    justify-content: center;
    align-items: center;
    color: rgb(96, 96, 96);
}

.input-grp {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.label-con {
    display: flex;
    gap: 10px;
    justify-content: space-between;
    border-bottom: 1px solid rgb(182, 181, 181);
    padding: 5px;
    width: 250px;

}

.label-con input {
    border: none;
    outline: none;

}

.label-con label {
    color: rgb(96, 95, 95);
    font-size: 11px;
}

@media (max-width:500px) {
    .container {
        flex-direction: column;
        padding: 0 30px;
        justify-content: center;
        width: 95%;
    }

    .login-container {
        height: 100px;
        padding: 5px;
        align-items: center;
    }

    .login-container img {
        width: 80px;
    }
}
</style>