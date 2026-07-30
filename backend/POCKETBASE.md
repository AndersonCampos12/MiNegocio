# PocketBase Storage para logos

1. Inicia una instancia de PocketBase y crea un superusuario.
2. En el panel de PocketBase crea una colección base llamada `negocio_logos`.
3. Añade un campo `negocioId` de tipo texto, obligatorio.
4. Añade un campo `logo` de tipo archivo: máximo 1 archivo, 2 MB, formatos JPG, PNG y WEBP.
5. Deja el archivo público para que la URL guardada pueda mostrarse directamente en el frontend.
6. Configura en `backend/.env` las variables descritas en `.env.example`.
7. Aplica la migración Prisma para añadir `logo_url` y `logo_storage_id` a `negocios`.

Las credenciales o el token de PocketBase permanecen únicamente en el backend. Al cambiar un logo se actualiza el mismo registro de PocketBase, evitando crear archivos huérfanos por cada modificación.
