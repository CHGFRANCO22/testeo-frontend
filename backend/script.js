
async function obtenerTurnos() {
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:3000/api/turnos/mis-turnos', {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    });

    const data = await response.json();
    console.log(data); // mostrar turnos
}
