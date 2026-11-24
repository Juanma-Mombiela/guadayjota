const TARGET = new Date('2027-02-27T18:00:00-03:00').getTime();

export function initCountdown() {
  const el = document.querySelector<HTMLElement>('[data-cd]');
  if (!el) return;
  let id = 0;
  const tick = () => {
    let d = TARGET - Date.now();
    if (d <= 0) {
      el.innerHTML = '<div><b>¡Es hoy!</b></div>';
      clearInterval(id);
      return;
    }
    const D = Math.floor(d / 864e5); d -= D * 864e5;
    const H = Math.floor(d / 36e5); d -= H * 36e5;
    const Mi = Math.floor(d / 6e4);
    const S = Math.floor((d - Mi * 6e4) / 1e3);
    el.innerHTML = ([[D, 'días'], [H, 'horas'], [Mi, 'minutos'], [S, 'segundos']] as const)
      .map(([v, l]) => `<div><b>${String(v).padStart(2, '0')}</b><span>${l}</span></div>`).join('');
  };
  tick();
  id = window.setInterval(tick, 1000);
}
