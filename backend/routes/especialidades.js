router.get('/api/especialidades', async (req, res) => {
  try {
    const [result] = await db.query(`SELECT id_espe, nombre FROM especialidades`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al cargar especialidades' });
  }
});
