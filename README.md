PlatoMatch – Guía de instalación y ejecución
Curso: Ingeniería de Software II
Proyecto: PlatoMatch – Proyecto final
Universidad de Lima
1. Descripción del proyecto
PlatoMatch es una aplicación web que permite consultar platos, estimar costos de preparación, comparar precios de ingredientes en mercados y organizar las compras de acuerdo con las preferencias del usuario.

Esta guía explica cómo abrir y ejecutar el proyecto de manera local en Windows para su revisión y evaluación.
2. Requisitos previos
- Node.js (versión 22 LTS recomendada) y npm.
- SDK de .NET 8.
- Microsoft SQL Server (preferentemente SQL Server 2022 o compatible con la copia de seguridad).
- SQL Server Management Studio (SSMS).
- Visual Studio Code o Visual Studio.
- Navegador web (Google Chrome o Microsoft Edge).
3. Descomprimir el proyecto
1. Descargar el archivo ZIP de PlatoMatch.
2. Hacer clic derecho sobre el archivo y seleccionar Extraer todo.
3. Abrir la carpeta extraída. Identificar las siguientes partes del proyecto:
PlatoMatch/
├── Frontend/                 # Aplicación web React
├── BackEnd/
│   └── PlatoMatchBackend/    # API desarrollada en .NET 8
├── Base de datos/            # Copia de seguridad PlatoMatchDB.bak
└── README.md
Los nombres de las carpetas pueden variar ligeramente según la organización del ZIP. La carpeta del frontend se identifica por el archivo package.json y la del backend por el archivo .csproj.
4. Restaurar la base de datos
1. Abrir SQL Server Management Studio (SSMS).
2. Conectarse a la instancia local de SQL Server mediante la autenticación correspondiente.
3. Copiar el archivo PlatoMatchDB.bak a una carpeta accesible para el servicio de SQL Server (por ejemplo, su carpeta Backup).
4. En el Explorador de objetos, hacer clic derecho en Bases de datos y seleccionar Restaurar base de datos....
5. En Origen, seleccionar Dispositivo y hacer clic en el botón de tres puntos (...).
6. Seleccionar Agregar, buscar PlatoMatchDB.bak y aceptar.
7. Verificar que la base de datos de destino tenga el nombre PlatoMatchDB.
8. Si las rutas de los archivos de datos no existen en el equipo, entrar a la sección Archivos y ajustar las rutas de destino a las carpetas de la instancia local.
9. Presionar Aceptar para restaurar la base de datos.
10. Actualizar la lista de bases de datos y comprobar que aparezca PlatoMatchDB con sus tablas.
Si ya existe una base de datos con ese nombre, no sobrescribirla sin revisar previamente su contenido.
5. Configurar y ejecutar el backend
5.1. Configurar la conexión a SQL Server
Abrir la carpeta BackEnd/PlatoMatchBackend y localizar el archivo appsettings.json (revisar también appsettings.Development.json, si existe).

En la sección ConnectionStrings, mantener el nombre de la clave existente y modificar el valor de Server para que coincida con el nombre del servidor utilizado en SSMS. Mantener PlatoMatchDB como nombre de la base de datos.

Por ejemplo, para una instancia local llamada SQLEXPRESS01, con autenticación de Windows, el valor de conexión puede ser:
Server=localhost\\SQLEXPRESS01;Database=PlatoMatchDB;Trusted_Connection=True;TrustServerCertificate=True;
En un archivo JSON, la barra invertida del nombre de la instancia se escribe dos veces (\\). Si la instancia del equipo es SQLEXPRESS u otra, sustituir SQLEXPRESS01 por el nombre correspondiente. Si se utiliza autenticación de SQL Server en lugar de Windows, configurar las credenciales locales correspondientes.
5.2. Iniciar el backend
Abrir una terminal en la carpeta que contiene el archivo .csproj y ejecutar, en orden:
dotnet restore
dotnet build
dotnet run --launch-profile http
La API está configurada para ejecutarse en:
- API: http://localhost:5116
- Swagger: http://localhost:5116/swagger
Si el puerto mostrado en la terminal es diferente, utilizar el puerto indicado y actualizar la URL del frontend.

Mantener esta terminal abierta durante el uso de la aplicación.
6. Ejecutar el frontend
Abrir una segunda terminal en la carpeta Frontend, donde se encuentra package.json.

Instalar las dependencias:
npm install
Comprobar que el archivo de configuración de entorno del frontend (por ejemplo, .env.local, si está presente) apunte al backend local. La variable de URL de la API debe tener el siguiente valor si se utiliza el puerto 5116:
VITE_API_URL=http://localhost:5116/api
Conservar las demás variables de configuración que ya se encuentren en el proyecto.

Iniciar la aplicación:
npm run dev
Abrir en el navegador:

http://localhost:5173

Si Vite muestra una dirección diferente, abrir la dirección indicada en la terminal. Mantener ambas terminales abiertas.
7. Acceso y revisión del sistema
Desde la pantalla de inicio, utilizar la opción de registro para crear una cuenta de usuario, o iniciar sesión con una cuenta de prueba proporcionada por el equipo.

Se podrán revisar las funcionalidades disponibles en el menú de la aplicación, como la búsqueda de platos, consulta de ingredientes, comparación de precios y gestión de compras.

Para revisar los endpoints del backend, acceder a Swagger. El acceso a funciones administrativas puede requerir una cuenta con el rol correspondiente.
8. Solución de problemas frecuentes
Problema	Solución
npm no se reconoce	Instalar Node.js y abrir nuevamente la terminal.
ENOENT o no se encuentra package.json	Abrir la terminal dentro de la carpeta del frontend.
dotnet no se reconoce	Instalar el SDK de .NET 8 y reiniciar la terminal.
Error de conexión con la base de datos	Revisar que SQL Server esté iniciado, que PlatoMatchDB esté restaurada y que la cadena de conexión indique la instancia correcta.
No se puede acceder a la aplicación	Comprobar que el frontend y el backend estén ejecutándose y que sus puertos sean correctos.
No se puede restaurar el archivo .bak	Verificar los permisos de acceso al archivo y la compatibilidad de la versión de SQL Server.


9. Orden de ejecución
1. Restaurar PlatoMatchDB.bak en SQL Server (solo la primera vez).
2. Configurar la cadena de conexión del backend (solo la primera vez o si cambia la instancia).
3. Ejecutar el backend con dotnet run --launch-profile http.
4. Ejecutar el frontend con npm run dev (tras instalar sus dependencias).
5. Abrir http://localhost:5173 en el navegador.
Para finalizar, presionar Ctrl + C en cada una de las terminales.
Proyecto académico desarrollado para el curso de Ingeniería de Software II.