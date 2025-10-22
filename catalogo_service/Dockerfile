# Imagen base oficial
FROM node:18

WORKDIR /usr/src/app

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Crear carpeta para imágenes (por si no existe)
RUN mkdir -p uploads

# Exponer el puerto
EXPOSE 8080

# Comando para ejecutar el servicio
CMD ["npm", "start"]
