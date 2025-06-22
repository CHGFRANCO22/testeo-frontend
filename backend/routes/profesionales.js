// Nueva ruta para listar profesionales con su especialidad
router.get('/api/profesionales', async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT prof.id_profesional, p.nombre_completo
      FROM profesionales prof
      JOIN persona p ON prof.id_persona = p.id
    `);
    res.json(result);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al cargar profesionales' });
  }
});
