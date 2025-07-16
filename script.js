// script.js

// 1. Registro de docentes
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    alert("Cuenta creada con éxito");
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  } catch (error) {
    alert(error.message);
  }
});

// 2. Login de docentes
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
  } catch (error) {
    alert(error.message);
  }
});

// 3. Crear salón
document.getElementById("classForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const grado = document.getElementById("grado").value;
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const user = auth.currentUser;
  if (!user) return alert("Debes estar logueado");

  const salonRef = await db.collection("salones").add({
    docenteId: user.uid,
    grado,
    cantidad,
    alumnos: []
  });

  document.getElementById("classForm").style.display = "none";
  document.getElementById("alumnosForm").style.display = "block";
  document.getElementById("alumnoCantidad").innerText = cantidad;
  document.getElementById("alumnoForm").dataset.salonId = salonRef.id;
  document.getElementById("alumnoForm").dataset.total = cantidad;
  document.getElementById("alumnoForm").dataset.contador = 1;
});

// 4. Agregar alumnos uno por uno
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
    alert("Salón creado con éxito");
    mostrarSalon(salonId);
  } else {
    e.target.dataset.contador = contador + 1;
    document.getElementById("usuarioAlumno").value = "";
    document.getElementById("claveAlumno").value = "";
    document.getElementById("alumnoActual").innerText = contador + 1;
  }
});

// 5. Mostrar salón y lista de alumnos
async function mostrarSalon(salonId) {
  document.getElementById("alumnosForm").style.display = "none";
  const salon = await db.collection("salones").doc(salonId).get();
  const data = salon.data();
  document.getElementById("salonFinal").style.display = "block";
  document.getElementById("gradoFinal").innerText = data.grado;

  const lista = document.getElementById("listaAlumnos");
  lista.innerHTML = "";
  data.alumnos.forEach((al, i) => {
    const li = document.createElement("li");
    li.innerText = `${i + 1}. Usuario: ${al.usuario} | Clave: ${al.clave}`;
    lista.appendChild(li);
  });
}
