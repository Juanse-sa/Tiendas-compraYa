# cart-service/Dockerfile
FROM node:18

WORKDIR /usr/src/app

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Crear carpeta para uploads si la usa el servicio
RUN mkdir -p uploads

# Exponer el puerto que Cloud Run espera
EXPOSE 8080

# Ejecutar la app (asegúrate que package.json tenga "start": "node server.js")
CMD ["npm", "start"]
