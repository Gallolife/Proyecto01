const searchInput = document.getElementById('search');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('results');
const goBackBtn = document.getElementById('goBack'); // este es el botón correcto
const mainMenu = document.getElementById('mainMenu');
const sectionRow = document.querySelector('.section-row');
const secciones = ['viendo', 'pendiente', 'visto'];
const savedBg = localStorage.getItem('userBackground');
if (savedBg) {
  document.body.style.backgroundImage = `url(${savedBg})`;
  document.body.style.backgroundSize = 'cover';
}


console.log("✅ app.js cargado");

document.addEventListener('DOMContentLoaded', () => {
  secciones.forEach(section => mostrarSeccion(section, true));
  secciones.forEach(estado => {
    const btn = document.getElementById('vaciar-' + estado);
    if (btn) {
      btn.addEventListener('click', () => vaciarSeccion(estado));
    }
  });

  document.querySelectorAll('.section-card').forEach(card => {
    card.addEventListener('click', () => {
      const estado = card.dataset.section;
      console.log("📂 Sección seleccionada:", estado);
      mostrarSeccion(estado);
    });
  });

  goBackBtn.addEventListener('click', () => {
    document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
    resultsContainer.classList.add('hidden');
    goBackBtn.classList.add('hidden');
    mainMenu.classList.remove('hidden');
  });
});

searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (query) buscarAnime(query);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') searchBtn.click();
});

async function buscarAnime(query) {
  const cargando = document.createElement('div');
  cargando.className = 'mensaje-flotante cargando';
  cargando.textContent = '🔎 Buscando animes...';
  document.body.appendChild(cargando);

  resultsContainer.innerHTML = '';
  let page = 1;
  let todosLosAnimes = [];
  let sigue = true;

  try {
    while (sigue) {
      const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&page=${page}`);
      const data = await res.json();

      if (data.data && data.data.length > 0) {
        todosLosAnimes = todosLosAnimes.concat(data.data);
        sigue = data.pagination?.has_next_page;
        page++;
      } else {
        sigue = false;
      }
    }

    mostrarResultados(todosLosAnimes);
  } catch (err) {
    console.error("❌ Error al buscar:", err);
  } finally {
    cargando.remove();
  }
}

function mostrarResultados(animes) {
  resultsContainer.innerHTML = '';
  animes.forEach(anime => {
    const card = crearTarjetaAnime(anime, true);
    resultsContainer.appendChild(card);
  });

  document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
  mainMenu.classList.add('hidden');
  resultsContainer.classList.remove('hidden');
  goBackBtn.classList.remove('hidden');
}

function crearTarjetaAnime(anime, esResultado = false, estado = '') {
  const card = document.createElement('div');
  card.className = 'anime-card';

  const img = document.createElement('img');
  img.src = anime.images.jpg.image_url;
  card.appendChild(img);

  const title = document.createElement('h3');
  title.textContent = anime.title;
  card.appendChild(title);

  const select = document.createElement('select');

  if (esResultado) {
    select.innerHTML = `
      <option value="">Guardar en...</option>
      <option value="viendo">Viendo</option>
      <option value="pendiente">Pendiente</option>
      <option value="visto">Visto</option>
    `;
    select.addEventListener('change', () => {
      if (select.value) {
        guardarAnime(anime, select.value);
        select.value = '';
      }
    });
    card.appendChild(select);
  } else {
    select.innerHTML = `
      <option value="viendo" ${estado === 'viendo' ? 'selected' : ''}>Viendo</option>
      <option value="pendiente" ${estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
      <option value="visto" ${estado === 'visto' ? 'selected' : ''}>Visto</option>
    `;
    select.addEventListener('change', () => {
      cambiarEstado(anime, estado, select.value);
    });
    card.appendChild(select);

    const eliminarBtn = document.createElement('button');
    eliminarBtn.textContent = 'Eliminar';
    eliminarBtn.addEventListener('click', () => {
      eliminarAnime(anime.mal_id, estado);
    });
    card.appendChild(eliminarBtn);
  }

  return card;
}

function guardarAnime(anime, estado) {
  const guardados = JSON.parse(localStorage.getItem(estado)) || [];
  if (!guardados.some(a => a.mal_id === anime.mal_id)) {
    guardados.push(anime);
    localStorage.setItem(estado, JSON.stringify(guardados));
    mostrarSeccion(estado, true);
    mostrarMensaje(`✅ Guardado en "${estado}"`);
  } else {
    mostrarMensaje(`⚠️ Ya está en "${estado}"`);
  }
}

function mostrarSeccion(estado, soloCargar = false) {
  const contenedor = document.getElementById(estado + 'Container');
  contenedor.innerHTML = '';

  const animes = JSON.parse(localStorage.getItem(estado)) || [];
  animes.forEach(anime => {
    const card = crearTarjetaAnime(anime, false, estado);
    contenedor.appendChild(card);
  });

  if (!soloCargar) {
    resultsContainer.classList.add('hidden');
    mainMenu.classList.add('hidden');
    document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(estado + 'Section').classList.remove('hidden');
    goBackBtn.classList.remove('hidden');
  }
}

function cambiarEstado(anime, estadoActual, nuevoEstado) {
  if (estadoActual === nuevoEstado) return;

  let actuales = JSON.parse(localStorage.getItem(estadoActual)) || [];
  actuales = actuales.filter(a => a.mal_id !== anime.mal_id);
  localStorage.setItem(estadoActual, JSON.stringify(actuales));

  let nuevos = JSON.parse(localStorage.getItem(nuevoEstado)) || [];
  if (!nuevos.some(a => a.mal_id === anime.mal_id)) {
    nuevos.push(anime);
    localStorage.setItem(nuevoEstado, JSON.stringify(nuevos));
    mostrarMensaje(`🔁 Movido a "${nuevoEstado}"`);
  } else {
    mostrarMensaje(`⚠️ Ya está en "${nuevoEstado}"`);
  }

  mostrarSeccion(estadoActual, true);
  mostrarSeccion(nuevoEstado, true);
}

function eliminarAnime(id, estado) {
  let animes = JSON.parse(localStorage.getItem(estado)) || [];
  animes = animes.filter(a => a.mal_id !== id);
  localStorage.setItem(estado, JSON.stringify(animes));
  mostrarSeccion(estado, true);
}

function vaciarSeccion(estado) {
  localStorage.removeItem(estado);
  mostrarSeccion(estado, true);
}

function mostrarMensaje(texto) {
  const mensaje = document.createElement('div');
  mensaje.className = 'mensaje-flotante';
  mensaje.textContent = texto;
  document.body.appendChild(mensaje);
  setTimeout(() => mensaje.remove(), 2500);
}

// Efectos visuales
document.querySelectorAll('.section-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.remove('clicked');
    void card.offsetWidth;
    card.classList.add('clicked');
  });
});

document.querySelectorAll('.search-wrapper').forEach(wrapper => {
  const searchInput = document.getElementById('search');
  const searchWrapper = document.querySelector('.search-wrapper');

  searchInput.addEventListener('input', () => {
    searchWrapper.classList.add('typing');
    setTimeout(() => {
      searchWrapper.classList.remove('typing');
    }, 600);
  });

  wrapper.addEventListener('mousemove', (e) => {
    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    wrapper.style.setProperty('--x', `${x}px`);
    wrapper.style.setProperty('--y', `${y}px`);
  });

  wrapper.addEventListener('mouseleave', () => {
    wrapper.style.setProperty('--x', `50%`);
    wrapper.style.setProperty('--y', `50%`);
  });
});
const backgroundInput = document.getElementById('backgroundInput');

backgroundInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    document.body.style.setProperty('--user-background', `url(${event.target.result})`);
    document.body.style.backgroundImage = `url(${event.target.result})`;
    document.body.style.backgroundSize = 'cover';
  };
  reader.readAsDataURL(file);
});
localStorage.setItem('userBackground', event.target.result);

const changeBtn = document.getElementById('changeBackgroundBtn');
const fileInput = document.getElementById('uploadBackground');

changeBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      document.body.style.setProperty('--bg-url', `url('${event.target.result}')`);
      document.body.style.setProperty('background-image', `url('${event.target.result}')`);
      document.body.style.background = `url('${event.target.result}') center/cover no-repeat fixed`;
      document.body.style.setProperty('--user-background', event.target.result);
      document.querySelector('body::before'); // Esto asegura que el pseudo-elemento lo reciba
    };
    reader.readAsDataURL(file);
  }
});
