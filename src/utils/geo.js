// @build: 2026-06-29.14-00-00 | id: UTIL-GEO-01 | desc: Utilidad compartida para cálculo de distancia Haversine
const geo = {
  /**
   * Calcula la distancia en kilómetros entre dos coordenadas usando la fórmula Haversine.
   * @param {number} lat1 - Latitud del punto 1
   * @param {number} lon1 - Longitud del punto 1
   * @param {number} lat2 - Latitud del punto 2
   * @param {number} lon2 - Longitud del punto 2
   * @returns {number} Distancia en kilómetros
   */
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
};

module.exports = geo;