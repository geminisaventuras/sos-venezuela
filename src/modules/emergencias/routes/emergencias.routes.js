// @build: 2026-07-01.20-30-00 | id: EMERGENCIA-ROUTES | desc: Endpoint POST /api/emergencias para botón de emergencia del conductor
const express = require('express');
const router = express.Router();
const supabaseAdmin = require('../../../config/supabase');
const { authMiddleware, roleMiddleware } = require('../../../middleware/auth.middleware');

router.post('/', authMiddleware, roleMiddleware('voluntario'), async (req, res, next) => {
  try {
    const { lat, lon } = req.body;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Se requieren lat y lon' } });
    }
    
    // Insertar incidencia de emergencia
    const { data: incidencia, error: errorIncidencia } = await supabaseAdmin
      .from('incidencias')
      .insert({
        tipo: 'emergencia',
        descripcion: 'Botón de emergencia presionado por el conductor',
        reportado_por: req.user.sub,
        lat: lat,
        lon: lon
      })
      .select('id')
      .single();
    
    if (errorIncidencia) throw new Error('Error al registrar emergencia: ' + errorIncidencia.message);
    
    // Notificar a super admins (insertar en notificaciones)
    const { data: admins } = await supabaseAdmin
      .from('perfiles')
      .select('user_id')
      .eq('rol', 'super_admin');
    
       if (admins && admins.length > 0) {
      const notificaciones = admins.map(admin => ({
        user_id: admin.user_id,
        tipo: 'emergencia',
        titulo: '🚨 Botón de emergencia activado',
        mensaje: `El conductor ${req.user.sub} ha presionado el botón de emergencia en lat: ${lat}, lon: ${lon}`,
        leida: false
      }));
      await supabaseAdmin.from('notificaciones').insert(notificaciones);
    }
    
    res.json({ success: true, data: { id: incidencia.id }, traceId: req.traceId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
