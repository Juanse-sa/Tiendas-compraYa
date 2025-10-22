# Imagen base oficial
FROM node:18

# Directorio de trabajo
WORKDIR /usr/src/app

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto que Cloud Run usará
EXPOSE 8080

# Comando para iniciar el servicio
CMD ["npm", "start"]
