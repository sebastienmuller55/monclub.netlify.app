// Service worker — CAPA Foot (Gestion Équipe)
// Permet à l'application de continuer à s'ouvrir même sans connexion.
//
// IMPORTANT : à chaque fois qu'une nouvelle version de index.html est
// déployée, augmente le numéro ci-dessous (v1 -> v2 -> v3...) pour que les
// téléphones des coachs récupèrent bien la dernière version au lieu de
// rester bloqués sur une copie mise en cache.
const CACHE_NAME = 'capafoot-cache-v61';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installation : met en cache les fichiers de base de l'application.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.log('Mise en cache initiale impossible :', err))
  );
  self.skipWaiting();
});

// Activation : supprime les anciennes versions du cache.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Récupération : essaie le réseau en priorité (pour avoir la dernière
// version), et se rabat sur le cache si hors-ligne. Les requêtes vers
// d'autres domaines (Firebase, polices, etc.) ne sont pas interceptées,
// pour ne jamais gêner l'authentification ou la synchronisation.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
