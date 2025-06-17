// backend/controllers/authController.js

exports.register = (req, res) => {
  const { nombre, email, password } = req.body;

  // Simulación de registro exitoso
  res.status(201).json({ message: 'Usuario registrado correctamente', nombre, email });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  // Simulación de login exitoso
  if (email === 'admin@example.com' && password === '1234') {
    res.json({ message: 'Login exitoso', token: '123abc' });
  } else {
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
};
