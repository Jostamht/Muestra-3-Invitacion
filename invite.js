/*
  Datos de esta invitación.
  Para crear otra invitación basta con cambiar este archivo
  (y las fotos / textos propios que haya en index.html).
*/
window.INVITE = {
  bride: 'Novia',
  groom: 'Novio',
  initials: 'N + N',

  // Fecha y hora de la ceremonia (con zona horaria) y duración total de la fiesta.
  eventStart: '2026-12-31T17:00:00-04:00',
  durationHours: 7,
  timeZone: 'America/La_Paz',

  city: 'La Paz · Bolivia',
  calendarLocation: 'La Paz, Bolivia',

  ceremonyTime: '17:00',
  receptionTime: '19:00',
  zoomTime: '17:00 · hora de Bolivia',

  // Número con código de país y sin "+", por ejemplo '59171234567'.
  // Si se deja vacío, la confirmación solo se muestra en pantalla.
  whatsapp: '',

  // Lista de invitados de la muestra (nombre, pases disponibles, últimos 4 dígitos del celular).
  guests: [
    { name: 'Juan Pérez', passes: 2, phone: '1234' },
    { name: 'Ruth Gómez', passes: 3, phone: '5678' }
  ]
};
