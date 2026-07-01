// @build: 2026-07-01.15-00-00 | id: VOL-UTILS-V1 | desc: Utilidades compartidas del voluntario: distancia, escapeHTML, ETA
window.VoluntarioUtils = {
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  calcularETA(origenLat, origenLon, destinoLat, destinoLon, vehiculo) {
    const dist = this.calcularDistancia(origenLat, origenLon, destinoLat, destinoLon);
    let velocidad = 30;
    if (vehiculo === 'carro' || vehiculo === 'camioneta') velocidad = 25;
    else if (vehiculo === 'bicicleta') velocidad = 12;
    else if (vehiculo === 'a_pie') velocidad = 4;
    const minutos = Math.round((dist / velocidad) * 60);
    if (minutos < 1) return 'Menos de 1 min';
    return minutos + ' min';
  }
};
