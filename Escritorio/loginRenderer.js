// loginRenderer.js
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const contrasena = document.getElementById("contrasena").value.trim();

  if (!email || !contrasena) {
    alert("Por favor completá todos los campos.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, contrasena })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      alert("Inicio de sesión exitoso");
      window.location = "dashboard.html"; // redirigir a dashboard
    } else {
      alert(data.mensaje || "Usuario o contraseña incorrectos");
    }
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    alert("Ocurrió un error al iniciar sesión.");
  }
});
