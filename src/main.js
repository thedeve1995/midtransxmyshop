import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyBBGzFwfpd5vg50NDqydKmYWj57NNLXDcs",
    authDomain: "gurinvert.firebaseapp.com",
    projectId: "gurinvert",
    storageBucket: "gurinvert.appspot.com",
    messagingSenderId: "839051326604",
    appId: "1:839051326604:web:92ec4fda1fea98a7d937a9",
    measurementId: "G-7KCW3FP7C6"
  };

initializeApp(firebaseConfig);

const app = createApp(App)

app.use(router)



/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faDoorClosed, faUserSecret, faArrowRight, faHeart, faCartShopping, faRightFromBracket, faGear, faXmark } from '@fortawesome/free-solid-svg-icons'

/* add icons to the library */
library.add(faUserSecret,faDoorClosed, faArrowRight, faHeart,faCartShopping,faRightFromBracket,faGear,faXmark)

app.component('font-awesome-icon', FontAwesomeIcon).mount('#app')
