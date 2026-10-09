/* Lu-Gar — comportamiento de la pagina */
(function () {
  "use strict";

  var WA = "5493415719566";

  /* ---------- Arrancar siempre arriba ----------
     Por defecto el navegador recuerda la posicion del scroll y al recargar
     vuelve ahi, con lo cual al entrar se ve el final de la pagina. Se espera al
     evento load, porque el navegador restaura despues de parsear el HTML. */
  window.addEventListener("load", function () {
    if (!location.hash) window.scrollTo(0, 0);
  });

  /* ---------- Encabezado al hacer scroll ---------- */
  var header = document.getElementById("header");
  var ultimoScroll = 0;

  function alScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle("is-stuck", y > 40);
    ultimoScroll = y;
  }
  window.addEventListener("scroll", alScroll, { passive: true });
  alScroll();

  /* ---------- Menú mobile ---------- */
  var hamb = document.getElementById("hamb");
  var nav = document.getElementById("nav");

  function cerrarMenu() {
    nav.classList.remove("is-open");
    hamb.setAttribute("aria-expanded", "false");
  }

  hamb.addEventListener("click", function () {
    var abierto = nav.classList.toggle("is-open");
    hamb.setAttribute("aria-expanded", abierto ? "true" : "false");
  });

  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") cerrarMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") cerrarMenu();
  });

  /* ---------- Animación de entrada al hacer scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Rotador de imágenes de aislación ---------- */
  var rot = document.querySelector(".rotator");

  if (rot && rot.querySelectorAll(".rotator__img").length > 1) {
    var imgs = rot.querySelectorAll(".rotator__img");
    var puntos = document.createElement("div");
    puntos.className = "rotator__puntos";

    for (var p = 0; p < imgs.length; p++) {
      var d = document.createElement("span");
      if (p === 0) d.className = "is-on";
      puntos.appendChild(d);
    }
    rot.appendChild(puntos);
    var marcas = puntos.querySelectorAll("span");

    var actual = 0;
    var timer = null;

    function mostrar(i) {
      imgs[actual].classList.remove("is-on");
      marcas[actual].classList.remove("is-on");
      actual = i;
      imgs[actual].classList.add("is-on");
      marcas[actual].classList.add("is-on");
    }

    function avanzar() {
      mostrar((actual + 1) % imgs.length);
    }

    function arrancar() {
      if (timer) clearInterval(timer);
      timer = setInterval(avanzar, 3800);
    }

    function detener() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    // pausa cuando no se ve la seccion, y al pasar el mouse
    rot.addEventListener("mouseenter", detener);
    rot.addEventListener("mouseleave", arrancar);

    if ("IntersectionObserver" in window) {
      var obsRot = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (e) {
            if (e.isIntersecting) arrancar();
            else detener();
          });
        },
        { threshold: 0.15 }
      );
      obsRot.observe(rot);
    } else {
      arrancar();
    }
  }

  /* ---------- Fotos de producto: si faltan, se ve el nombre de la marca ---------- */
  var cajas = document.querySelectorAll(".prod-foto__caja");

  function marcarFalta(img) {
    var caja = img.parentNode;
    caja.classList.add("is-falta");
    caja.setAttribute("data-marca", caja.getAttribute("data-marca") || "");
    img.remove();
  }

  cajas.forEach(function (caja) {
    var img = caja.querySelector("img");
    if (!img) return;
    // data-marca va en el <figure>, para el texto del placeholder
    var marca = caja.parentNode.querySelector(".prod-foto__marca");
    if (marca) caja.setAttribute("data-marca", marca.textContent.trim());
    if (img.complete && img.naturalWidth === 0) marcarFalta(img);
    img.addEventListener("error", function () { marcarFalta(img); });
  });

  /* ---------- Botón para volver arriba ---------- */
  var btnSubir = document.getElementById("subir");

  if (btnSubir) {
    btnSubir.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    var ticking = false;
    function mostrarSubir() {
      var y = window.scrollY || document.documentElement.scrollTop;
      btnSubir.classList.toggle("is-visible", y > 700);
      ticking = false;
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(mostrarSubir);
        }
      },
      { passive: true }
    );
    mostrarSubir();
  }

  /* ---------- Sección activa en la navegación ---------- */
  var enlaces = document.querySelectorAll('.nav a[href^="#"]');
  var secciones = {};

  enlaces.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    var s = document.getElementById(id);
    if (s) secciones[id] = { el: s, link: a };
  });

  if ("IntersectionObserver" in window) {
    var obsNav = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (e) {
          var item = secciones[e.target.id];
          if (!item) return;
          if (e.isIntersecting) {
            enlaces.forEach(function (a) { a.classList.remove("is-active"); });
            item.link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    Object.keys(secciones).forEach(function (id) {
      obsNav.observe(secciones[id].el);
    });
  }

  /* ---------- Formulario: se envía por WhatsApp ---------- */
  var form = document.getElementById("form");
  if (!form) return;

  var aviso = document.createElement("p");
  aviso.className = "form__error";
  form.appendChild(aviso);

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    aviso.style.display = "none";

    var datos = new FormData(form);
    var nombre = (datos.get("nombre") || "").trim();
    var empresa = (datos.get("empresa") || "").trim();
    var tel = (datos.get("telefono") || "").trim();
    var mail = (datos.get("email") || "").trim();
    var msg = (datos.get("mensaje") || "").trim();

    var faltan = [];
    if (!nombre) faltan.push("nombre");
    if (!tel) faltan.push("teléfono");
    if (!mail) faltan.push("correo");
    if (!msg) faltan.push("mensaje");

    if (faltan.length) {
      aviso.textContent = "Completá estos campos: " + faltan.join(", ") + ".";
      aviso.style.display = "block";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      aviso.textContent = "Revisá el correo electrónico, parece incompleto.";
      aviso.style.display = "block";
      return;
    }

    var texto =
      "Hola Lu-Gar, soy " + nombre + "." +
      (empresa ? " De " + empresa + "." : "") +
      "%0A%0ATeléfono: " + tel + "%0ACorreo: " + mail +
      "%0A%0AMensaje:%0A" + msg;

    window.open("https://wa.me/" + WA + "?text=" + texto, "_blank", "noopener");
  });
})();