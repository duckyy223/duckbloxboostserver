# Discord Boost Bot

Bot de Discord que se vuelve completamente loco cuando alguien boostea el servidor.

## ¿Qué hace este bot?

Cuando alguien boostea el servidor:
- Bloquea TODOS los canales (nadie puede escribir ni conectarse)
- Crea 10 canales nuevos con el nombre "[JUGADOR] HA BOOSTEADO EL SERVIDOR"
- Renombra TODOS los roles a "[JUGADOR] HA BOOSTEADO EL SERVIDOR"
- Spamea el mensaje en los nuevos canales cada 2 segundos
- Después del tiempo establecido (1:30 base + tiempo según boosts), restaura TODO a la normalidad

## Duración del caos

- 1 boost: 1 minuto 30 segundos
- 2 boosts: 1 minuto 40 segundos
- 3 boosts: 1 minuto 50 segundos
- Y así sucesivamente (+10 segundos por cada boost adicional)

## Comando /testboost

Solo accesible por roles OWNER y ADMIN:
- `/testboost cantidad:1` - Simula un boost con la duración correspondiente
- `/testboost cantidad:5 nombre:PepitoGamer` - Simula 5 boosts con nombre personalizado

## Credenciales configuradas

El archivo `.env` ya está creado con:
- **Server ID**: 1441144455561478439
- **Application ID**: 1441478376480182322
- **Token**: Configurado ✓

## Instrucciones para Deploy en Render

### Paso 1: Subir el código a GitHub

1. Crea un repositorio en GitHub (público o privado)
2. Desde la carpeta del proyecto, ejecuta:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

**IMPORTANTE:** El archivo `.env` ya está en `.gitignore` así que NO se subirá (es correcto, las credenciales van en Render)

### Paso 2: Crear el servicio en Render

1. Ve a https://render.com y crea una cuenta (o inicia sesión)
2. En el dashboard, click en "New +" y selecciona "Web Service"
3. Conecta tu cuenta de GitHub si no lo has hecho
4. Busca y selecciona tu repositorio
5. Configura el servicio:
   - **Name**: boost-bot (o el nombre que quieras)
   - **Region**: Elige la más cercana a ti
   - **Branch**: main
   - **Root Directory**: (déjalo vacío)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Paso 3: Configurar variables de entorno en Render

1. Antes de hacer deploy, ve a la pestaña "Environment" en la configuración
2. Click en "Add Environment Variable" y añade:
   - Key: `DISCORD_TOKEN` → Value: tu token del bot
   - Key: `CLIENT_ID` → Value: el ID de tu aplicación
   - Key: `GUILD_ID` → Value: el ID de tu servidor
3. Click en "Create Web Service" para iniciar el deployment

**NOTA IMPORTANTE:** Render puede tomar 1-2 minutos en hacer el primer deploy

### Paso 4: Registrar los comandos slash

Después de que el servicio se haya desplegado exitosamente:

1. Ve a tu servicio en Render
2. Click en la pestaña "Shell" (arriba a la derecha)
3. Ejecuta este comando:
```bash
node deploy-commands.js
```
4. Deberías ver el mensaje: "Comandos registrados correctamente!"

### Paso 5: Verificar que funciona

1. El bot debería aparecer online en tu servidor
2. Su estado debe mostrar: "boostea el server y ya veras lo que pasa"
3. Prueba el comando `/testboost cantidad:1`

## Permisos necesarios del bot en el servidor

Asegúrate de que el rol del bot esté:
1. Por ENCIMA de los roles que quieres renombrar
2. Con permisos de Administrador (o los permisos específicos mencionados)

## Troubleshooting

### El bot no responde
- Verifica que el token sea correcto
- Revisa los logs en Render
- Asegúrate de que los intents estén activados

### No puede renombrar roles
- El rol del bot debe estar por encima de los roles que quiere modificar
- Verifica que tenga permisos de "Manage Roles"

### El comando /testboost no aparece
- Ejecuta `node deploy-commands.js` nuevamente
- Espera unos minutos (Discord puede tardar en actualizar)
- Verifica que CLIENT_ID y GUILD_ID sean correctos

### El bot se desconecta en Render
- Render free tier tiene 750 horas gratis al mes
- Los servicios gratuitos se suspenden después de 15 minutos de inactividad
- Para mantenerlo 24/7, considera actualizar a un plan de pago ($7/mes)
- Alternativa: usa un servicio de ping cada 10-14 minutos para mantenerlo activo

## Características

- Estado personalizado del bot: "boostea el server y ya veras lo que pasa"
- Sistema de backup automático antes del caos
- Restauración completa después del tiempo establecido
- Comando de prueba con permisos restringidos
- Duración escalable según cantidad de boosts

## Alternativas de hosting (además de Render)

- **Railway.app**: $5/mes, 500 horas gratis de prueba
- **Fly.io**: Tier gratuito con 3 VMs pequeñas
- **Heroku**: Ya no tiene tier gratuito (desde 2022)
- **VPS económicos**: Contabo, Hetzner (~€3-5/mes)

## Notas importantes

- El bot necesita permisos de administrador o permisos muy altos
- NO uses este bot en servidores grandes sin permiso de los administradores
- El caos es reversible, todo se restaura automáticamente
- Los canales creados se borran al final
- Los roles vuelven a sus nombres originales
- Asegúrate de tener backup manual del servidor por si acaso
