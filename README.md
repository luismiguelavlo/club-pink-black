# Pink & Black Road Rider Club

Sitio Nuxt 4 del club con autenticación por sesión, invitaciones, feed, multimedia y eventos.

## Stack

- Nuxt 4 + Vue 3 + Tailwind
- PostgreSQL 16 (Docker)
- Drizzle ORM
- [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils) (sesiones seguras, gratis)

## Setup rápido

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

### Credenciales semilla

| Rol    | Correo           | Contraseña |
|--------|------------------|------------|
| Admin  | admin@club.com   | Admin123!  |
| Usuario| rider@club.com   | Rider123!  |

## Auth e invitaciones

- **Inicio de sesión** en `/login` — sin registro público
- **Feed social** en `/feed` — admins y usuarios (posts + comentarios)
- **Rodadas y eventos** en `/rides` — todos ven; solo admin crea en `/admin/events`
- **Pilotos e invitaciones** en `/admin/pilots` — solo `admin`
- **Multimedia** en `/admin/multimedia` — fotos (Cloudinary) + videos (YouTube)
- Los admins generan invitaciones (código + link, 24h)
- El invitado crea su cuenta en `/invite/:code`

### Cloudinary

En `.env`:

```bash
NUXT_CLOUDINARY_CLOUD_NAME=...
NUXT_CLOUDINARY_API_KEY=...
NUXT_CLOUDINARY_API_SECRET=...
```

### Scripts DB

```bash
npm run db:up
npm run db:push
npm run db:seed
npm run db:setup
```
