// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyA3zknvFkQ5Oids3t5DP5RkGPZVpac2TpI",
  authDomain: "lecturaprimaria-4490c.firebaseapp.com",
  projectId: "lecturaprimaria-4490c",
  storageBucket: "lecturaprimaria-4490c.firebasestorage.app",
  messagingSenderId: "516056173373",
  appId: "1:516056173373:web:b33564eab44e4325f41354"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Mostrar login / registro
document.getElementById("showRegister").onclick = () => {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("registerSection").classList.remove("hidden");
};
document.getElementById("showLogin").onclick = () => {
  document.getElementById("registerSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
};

// Registro
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert("Registro exitoso, ahora puedes iniciar sesión");
    document.getElementById("registerSection").classList.add("hidden");
    document.getElementById("loginSection").classList.remove("hidden");
  } catch (error) {
    alert(error.message);
  }
});

// Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    document.getElementById("loginSection").classList.add("hidden");
    cargarDashboard();
  } catch (error) {
    alert(error.message);
  }
});

// Cargar dashboard: verifica si el docente ya tiene clase
async function cargarDashboard() {
  document.getElementById("dashboard").classList.remove("hidden");
  const user = auth.currentUser;
  const query = await db.collection("salones").where("docenteId", "==", user.uid).get();

  if (!query.empty) {
    const salon = query.docs[0].data();
    const salonId = query.docs[0].id;
    document.getElementById("salonExistente").classList.remove("hidden");
    document.getElementById("gradoFinal").innerText = salon.grado;

    const lista = document.getElementById("listaAlumnos");
    lista.innerHTML = "";
    salon.alumnos.forEach((al, i) => {
      const li = document.createElement("li");
      li.innerText = `${i + 1}. Usuario: ${al.usuario} | Clave: ${al.clave}`;
      lista.appendChild(li);
    });
  }
}

// Crear salón
document.getElementById("classForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const grado = document.getElementById("grado").value;
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const user = auth.currentUser;

  const salonRef = await db.collection("salones").add({
    docenteId: user.uid,
    grado,
    cantidad,
    alumnos: []
  });

  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("alumnosForm").classList.remove("hidden");

  document.getElementById("alumnoCantidad").innerText = cantidad;
  document.getElementById("alumnoForm").dataset.salonId = salonRef.id;
  document.getElementById("alumnoForm").dataset.total = cantidad;
  document.getElementById("alumnoForm").dataset.contador = 1;
});

// Agregar alumnos
document.getElementById("alumnoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const salonId = e.target.dataset.salonId;
  let contador = parseInt(e.target.dataset.contador);
  const total = parseInt(e.target.dataset.total);
  const usuario = document.getElementById("usuarioAlumno").value;
  const clave = document.getElementById("claveAlumno").value;

  await db.collection("salones").doc(salonId).update({
    alumnos: firebase.firestore.FieldValue.arrayUnion({ usuario, clave })
  });

  if (contador >= total) {
    alert("Salón y alumnos creados con éxito");
    document.getElementById("alumnosForm").classList.add("hidden");
    cargarDashboard(); // vuelve al dashboard para mostrar el salón creado
  } else {
    e.target.dataset.contador = contador + 1;
    document.getElementById("usuarioAlumno").value = "";
    document.getElementById("claveAlumno").value = "";
    document.getElementById("alumnoActual").innerText = contador + 1;
  }
});
