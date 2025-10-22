# Usa una imagen base oficial
FROM node:18

# Crea el directorio de trabajo
WORKDIR /app

# Copia los archivos del proyecto
COPY package*.json ./
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto que Cloud Run usará
EXPOSE 8080

# Comando para ejecutar la app
CMD ["npm", "start"]
