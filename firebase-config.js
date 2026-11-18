// Cole aqui a configuração do seu app web (Firebase Console > Configurações do projeto > Seus apps)
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {initializeFirestore,persistentLocalCache} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const cfg={apiKey:"COLE_AQUI",authDomain:"SEU-PROJETO.firebaseapp.com",projectId:"SEU-PROJETO",storageBucket:"SEU-PROJETO.appspot.com",messagingSenderId:"",appId:""};
const app=initializeApp(cfg);
export const auth=getAuth(app); // o login persiste no aparelho por padrão
export const db=initializeFirestore(app,{localCache:persistentLocalCache()});
