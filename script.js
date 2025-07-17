// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA3zknvFkQ5Oids3t5DP5RkGPZVpac2TpI",
  authDomain: "lecturaprimaria-4490c.firebaseapp.com",
  projectId: "lecturaprimaria-4490c",
  storageBucket: "lecturaprimaria-4490c.appspot.com",
  messagingSenderId: "516056173373",
  appId: "1:516056173373:web:b33564eab44e4325f41354"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Referencias a los elementos del DOM
const loginSection = document.getElementById("loginSection");
const registerSection = document.getElementById("registerSection");
const dashboardSection = document.getElementById("dashboard");
const createClassSection = document.getElementById("createClassSection");
const alumnosFormSection = document.getElementById("alumnosForm");
const classViewSection = document.getElementById("classView");
const classList = document.getElementById("classList");

// Mostrar/ocultar secciones
function showSection(section) {
  document.querySelectorAll("main > section").forEach(sec => {
    sec.classList.add("hidden");
  });
  section.classList.remove("hidden");
}

// 1. Manejo del login/registro
document.getElementById("showRegisterBtn").addEventListener("click", () => {
  showSection(registerSection);
});

document.getElementById("showLoginBtn").addEventListener("click", () => {
  showSection(loginSection);
});

// 2. Registro de docentes
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert("Cuenta creada con éxito. Por favor inicia sesión.");
    showSection(loginSection);
  } catch (error) {
    alert(`Error al registrar: ${error.message}`);
  }
});

// 3. Login de docentes
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  
  try {
    await auth.signInWithEmailAndPassword(email, password);
    checkUserClasses();
  } catch (error) {
    alert(`Error al iniciar sesión: ${error.message}`);
  }
});

// 4. Verificar si el usuario tiene clases
async function checkUserClasses() {
  const user = auth.currentUser;
  if (!user) return;
  
  const classesSnapshot = await db.collection("salones")
    .where("docenteId", "==", user.uid)
    .get();
  
  if (classesSnapshot.empty) {
    // No tiene clases, mostrar formulario para crear una
    showSection(createClassSection);
  } else {
    // Tiene clases, mostrarlas en el dashboard
    loadUserClasses();
    showSection(dashboardSection);
  }
}

// 5. Cargar las clases del usuario
async function loadUserClasses() {
  const user = auth.currentUser;
  if (!user) return;
  
  classList.innerHTML = "";
  
  const classesSnapshot = await db.collection("salones")
    .where("docenteId", "==", user.uid)
    .get();
  
  if (classesSnapshot.empty) {
    classList.innerHTML = "<p class='text-gray-500'>No tienes clases creadas aún.</p>";
    return;
  }
  
  classesSnapshot.forEach(doc => {
    const data = doc.data();
    const classCard = document.createElement("div");
    classCard.className = "bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100";
    classCard.innerHTML = `
      <h3 class="font-medium text-gray-700">${data.grado}</h3>
      <p class="text-sm text-gray-500">${data.alumnos.length} alumnos</p>
    `;
    classCard.addEventListener("click", () => viewClass(doc.id, data));
    classList.appendChild(classCard);
  });
}

// 6. Manejo de creación de clases
document.getElementById("createClassBtn").addEventListener("click", () => {
  showSection(createClassSection);
});

document.getElementById("cancelCreateClass").addEventListener("click", () => {
  showSection(dashboardSection);
});

document.getElementById("classForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const grado = document.getElementById("grado").value;
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const user = auth.currentUser;
  
  if (!user) {
    alert("Debes estar logueado");
    return;
  }
  
  try {
    const salonRef = await db.collection("salones").add({
      docenteId: user.uid,
      grado,
      cantidad,
      alumnos: []
    });
    
    // Configurar formulario de alumnos
    document.getElementById("alumnoCantidad").innerText = cantidad;
    document.getElementById("alumnoActual").innerText = 1;
    document.getElementById("alumnoForm").dataset.salonId = salonRef.id;
    document.getElementById("alumnoForm").dataset.total = cantidad;
    document.getElementById("alumnoForm").dataset.contador = 1;
    
    showSection(alumnosFormSection);
  } catch (error) {
    alert(`Error al crear clase: ${error.message}`);
  }
});

// 7. Agregar alumnos
document.getElementById("alumnoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const salonId = e.target.dataset.salonId;
  let contador = parseInt(e.target.dataset.contador);
  const total = parseInt(e.target.dataset.total);
  const usuario = document.getElementById("usuarioAlumno").value;
  const clave = document.getElementById("claveAlumno").value;
  
  try {
    await db.collection("salones").doc(salonId).update({
      alumnos: firebase.firestore.FieldValue.arrayUnion({ usuario, clave })
    });
    
    if (contador >= total) {
      // Todos los alumnos agregados
      await viewClass(salonId);
    } else {
      // Siguiente alumno
      e.target.dataset.contador = contador + 1;
      document.getElementById("alumnoActual").innerText = contador + 1;
      document.getElementById("usuarioAlumno").value = "";
      document.getElementById("claveAlumno").value = "";
      document.getElementById("usuarioAlumno").focus();
    }
  } catch (error) {
    alert(`Error al agregar alumno: ${error.message}`);
  }
});

// 8. Ver una clase específica
async function viewClass(classId, classData = null) {
  try {
    let data;
    
    if (classData) {
      data = classData;
    } else {
      const classDoc = await db.collection("salones").doc(classId).get();
      data = classDoc.data();
    }
    
    document.getElementById("classGrade").textContent = data.grado;
    const listaAlumnos = document.getElementById("listaAlumnos");
    listaAlumnos.innerHTML = "";
    
    data.alumnos.forEach((al, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. Usuario: ${al.usuario} | Clave: ${al.clave}`;
      listaAlumnos.appendChild(li);
    });
    
    showSection(classViewSection);
  } catch (error) {
    alert(`Error al cargar la clase: ${error.message}`);
  }
}

// 9. Volver al dashboard
document.getElementById("backToDashboard").addEventListener("click", () => {
  loadUserClasses();
  showSection(dashboardSection);
});

// 10. Manejo de estado de autenticación
auth.onAuthStateChanged(user => {
  if (user) {
    // Usuario logueado
    checkUserClasses();
  } else {
    // Usuario no logueado
    showSection(loginSection);
  }
});
