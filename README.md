# 🗺️ Self-Host Map

Hola querido desarrollador,

¿Te has dado cuenta de que el mapa no tiene los nuevos edificios, caminos, etc.? ¡No te preocupes! La comunidad de OpenStreetMap ya los actualizó. Pero nosotros también tenemos que actualizar nuestro mapa de producción 😰 (¡se viene una pequeña tortura!). Por suerte, yo ya pasé por ella y te dejo los pasos para que no sufras tanto.

---

### 🚀 Pasos para tener tu propio mapa actualizado

#### 1. Descarga TODO Chile 🇨🇱

Ve a la siguiente página y descarga el archivo más reciente:
👉 [https://download.geofabrik.de/south-america/chile.html](https://download.geofabrik.de/south-america/chile.html)

### 1.5 
Solo obtener santiago y vallarica
osmium extract --config osmium-config.json -o output-directory/chile-extract.osm.pbf chile-latest.osm.pbf

#### 2. Tilemaker 🧩

Usaremos [Tilemaker](https://github.com/systemed/tilemaker) para convertir el archivo OSM en un MBTiles listo para servir.

> 💡 **Recomendación:** Lee la documentación oficial para entender cómo funciona.

#### 3. Ejecuta el contenedor Docker

Esto generará un archivo `.mbtiles` desde el `.osm.pbf`:

Ahora entra a la carpeta de "extracs" y ejecuta 
```bash
docker run -it --rm   -v $(pwd):/data   ghcr.io/systemed/tilemaker:master   /data/santiago.osm.pbf   --output /data/chile-merged.mbtiles   --bbox -70.85,-33.70,-70.45,-33.30
```

```bash
docker run -it --rm \
  -v $(pwd):/data \
  ghcr.io/systemed/tilemaker:master \
  /data/villarrica.osm.pbf \
  --output /data/chile-merged.mbtiles \
  --bbox -72.29,-39.35,-72.14,-39.24 \
  --merge
```

Se generara un "chile-merged.mbtiles"

#### 4. Convertir chile-merged.mbtiles a estructura `/z/x/y.pbf`

Sí, esto fue la parte más dolorosa, pero ya está resuelta 😎. (Tarda su timepo 1h en mi caso, es todo Chile)

```bash
bash mbtile2zyx.bash
```

Esto generará los tiles en formato `.pbf`, comprimidos con gzip. 

> ⚠️ **¡IMPORTANTE!** Los archivos están en **gzip**. Si no configuras bien los headers al servirlos, el mapa NO funcionará.

Ver si es gzip: file <file>.pbf
Ver si esta corrupto: gzip -t <file>.pbf && echo "gzip OK" || echo "gzip corrupto"

#### 5. Sube los tiles a un bucket 🪣

> 📌 La forma de subir cambia seguido, revisa la documentación o CLI de Cloudflare para subir carpetas estáticas.

Cree pero R2 y S3 no manda el header de gzip, asi que hay que agregar una regla en el dominio para que agrege ese header, en el manejador del DDNS (me costo 3h)

#### 6. Actualiza el `mapStyle.ts`

Una vez subidos los tiles, modifica la URL en tu estilo:

```ts
"sources": {
  "localtiles": {
    "type": "vector",
    "tiles": [
      "<URL_DE_TUS_TILES>/{z}/{x}/{y}.pbf"
    ],
    "minzoom": 0,
    "maxzoom": 14
  }
}
```

---

### ✅ ¡Listo! :D