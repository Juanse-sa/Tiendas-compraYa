# Imagen base oficial de Node
FROM node:18

# Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar los archivos de configuración
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Exponer el puerto que Cloud Run usa
EXPOSE 8080

# Comando para iniciar la app
CMD ["npm", "start"]
