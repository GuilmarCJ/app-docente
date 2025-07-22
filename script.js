// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA3zknvFkQ5Oids3t5DP5RkGPZVpac2TpI",
  authDomain: "lecturaprimaria-4490c.firebaseapp.com",
  projectId: "lecturaprimaria-4490c",
  storageBucket: "lecturaprimaria-4490c.appspot.com",
  messagingSenderId: "516056173373",
  appId: "1:516056173373:web:b33564eab44e4325f41354"
};

// Constantes
const MAX_ALUMNOS = 40; // Límite máximo de alumnos por clase

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

// Variables de estado
let currentClassId = null;
let authListener = null;

// Mostrar/ocultar secciones
function showSection(section) {
  document.querySelectorAll("main section").forEach(sec => {
    sec.classList.add("hidden");
  });
  section.classList.remove("hidden");
}

// Mostrar alerta de éxito
function showSuccessAlert(message) {
  Swal.fire({
    icon: 'success',
    title: 'Éxito',
    text: message,
    confirmButtonColor: '#3085d6',
  });
}

// Mostrar alerta de error
function showErrorAlert(message) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonColor: '#d33',
  });
}

// Mostrar confirmación
async function showConfirmation(message) {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: message,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, continuar',
    cancelButtonText: 'Cancelar'
  });
  return result.isConfirmed;
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
    showSuccessAlert("Cuenta creada con éxito. Por favor inicia sesión.");
    showSection(loginSection);
  } catch (error) {
    showErrorAlert(`Error al registrar: ${error.message}`);
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
    showErrorAlert(`Error al iniciar sesión: ${error.message}`);
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
  
  classList.innerHTML = "<div class='text-center py-10'><i class='fas fa-spinner fa-spin text-primary-500 text-2xl mb-2'></i><p class='text-gray-500'>Cargando clases...</p></div>";
  
  const classesSnapshot = await db.collection("salones")
    .where("docenteId", "==", user.uid)
    .get();
  
  if (classesSnapshot.empty) {
    classList.innerHTML = "<p class='text-gray-500 text-center py-10'>No tienes clases creadas aún.</p>";
    return;
  }
  
  classList.innerHTML = ""; // Limpiar el loader
  
  classesSnapshot.forEach(doc => {
    const data = doc.data();
    const classCard = document.createElement("div");
    classCard.className = "bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 card-hover";
    classCard.innerHTML = `
      <h3 class="font-medium text-gray-700">${data.grado}</h3>
      <p class="text-sm text-gray-500">${data.alumnos.length}/${data.cantidad} alumnos</p>
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
    showErrorAlert("Debes estar logueado");
    return;
  }
  
  // Validar límite de alumnos
  if (cantidad > MAX_ALUMNOS) {
    showErrorAlert(`El número máximo de alumnos permitido es ${MAX_ALUMNOS}`);
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
    
    // Actualizar barra de progreso
    document.getElementById("progressBar").style.width = "0%";
    
    showSection(alumnosFormSection);
  } catch (error) {
    showErrorAlert(`Error al crear clase: ${error.message}`);
  }
});

// 7. Agregar alumnos
document.getElementById("alumnoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const salonId = e.target.dataset.salonId;
  let contador = parseInt(e.target.dataset.contador);
  const total = parseInt(e.target.dataset.total);
  const usuario = document.getElementById("usuarioAlumno").value.trim();
  const clave = document.getElementById("claveAlumno").value.trim();
  
  // Validar campos
  if (!usuario || !clave) {
    showErrorAlert("Usuario y contraseña son requeridos");
    return;
  }
  
  try {
    await db.collection("salones").doc(salonId).update({
  alumnos: firebase.firestore.FieldValue.arrayUnion({ 
    usuario, 
    clave, 
    claveCambiada: false // ✅ nombre y valor correctos
  })
});


    
    // Actualizar barra de progreso
    const progress = (contador / total) * 100;
    document.getElementById("progressBar").style.width = `${progress}%`;
    
    if (contador >= total) {
      // Todos los alumnos agregados
      showSuccessAlert("¡Clase creada con éxito!");
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
    showErrorAlert(`Error al agregar alumno: ${error.message}`);
  }
});

// 8. Ver una clase específica
async function viewClass(classId, classData = null) {
  try {
    currentClassId = classId;
    let data;
    
    if (classData) {
      data = classData;
    } else {
      const classDoc = await db.collection("salones").doc(classId).get();
      data = classDoc.data();
    }
    
    document.getElementById("classGrade").textContent = data.grado;
    document.getElementById("classStudentsCount").textContent = `${data.alumnos.length} alumnos`;
    document.getElementById("studentsCountBadge").textContent = data.alumnos.length;
    
    const listaAlumnos = document.getElementById("listaAlumnos");
    listaAlumnos.innerHTML = "";
    
    data.alumnos.forEach((al, i) => {
      const li = document.createElement("li");
      li.className = "bg-white p-3 rounded-lg border border-gray-100";
      li.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-medium">${al.usuario}</span>
          <span class="text-sm bg-gray-100 px-2 py-1 rounded">${al.clave}</span>
        </div>
        <div class="text-xs text-gray-500 mt-1">Alumno ${i + 1}</div>
      `;
      listaAlumnos.appendChild(li);
    });
    
    showSection(classViewSection);
  } catch (error) {
    showErrorAlert(`Error al cargar la clase: ${error.message}`);
  }
}

// 9. Volver al dashboard
document.getElementById("backToDashboard").addEventListener("click", () => {
  loadUserClasses();
  showSection(dashboardSection);
});

// 10. Eliminar clase
document.getElementById("deleteClassBtn").addEventListener("click", async () => {
  if (!currentClassId) return;
  
  const confirm = await showConfirmation("¿Estás seguro de que quieres eliminar esta clase? Esta acción no se puede deshacer.");
  if (!confirm) return;
  
  try {
    await db.collection("salones").doc(currentClassId).delete();
    showSuccessAlert("Clase eliminada correctamente");
    loadUserClasses();
    showSection(dashboardSection);
  } catch (error) {
    showErrorAlert(`Error al eliminar la clase: ${error.message}`);
  }
});

// 11. Manejo de estado de autenticación
function setupAuthListener() {
  // Limpia el listener anterior si existe
  if (authListener) {
    authListener();
  }
  
  authListener = auth.onAuthStateChanged(user => {
    if (user) {
      // Usuario logueado
      checkUserClasses();
    } else {
      // Usuario no logueado
      showSection(loginSection);
    }
  });
}

// Inicializar el listener de autenticación
setupAuthListener();

// 12. Cerrar sesión desde el dashboard
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    const confirm = await showConfirmation("¿Estás seguro de que quieres cerrar sesión?");
    if (!confirm) return;
    
    await auth.signOut();
    // Limpiar formularios al cerrar sesión
    document.getElementById("loginForm").reset();
    document.getElementById("registerForm").reset();
    classList.innerHTML = "";
    showSection(loginSection);
  } catch (error) {
    showErrorAlert(`Error al cerrar sesión: ${error.message}`);
  }
});

// 13. Cerrar sesión desde la vista de clase
document.getElementById("logoutBtnFromClass").addEventListener("click", async () => {
  try {
    const confirm = await showConfirmation("¿Estás seguro de que quieres cerrar sesión?");
    if (!confirm) return;
    
    await auth.signOut();
    // Limpiar formularios al cerrar sesión
    document.getElementById("loginForm").reset();
    document.getElementById("registerForm").reset();
    classList.innerHTML = "";
    showSection(loginSection);
  } catch (error) {
    showErrorAlert(`Error al cerrar sesión: ${error.message}`);
  }
});
