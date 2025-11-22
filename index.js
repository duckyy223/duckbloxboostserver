require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot activo');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor HTTP escuchando en puerto ${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const backupData = new Map();
const activeChaos = new Map();

client.once('clientReady', () => {
    console.log(`Bot conectado como ${client.user.tag}`);

    client.user.setPresence({
        activities: [{ name: 'boostea el server y ya veras lo que pasa', type: ActivityType.Playing }],
        status: 'online'
    });
});

function calcularDuracion(boostCount) {
    const baseDuration = 90000;
    const increment = 10000;
    return baseDuration + (boostCount - 1) * increment;
}

async function guardarEstadoServidor(guild) {
    const backup = {
        roles: [],
        channels: []
    };

    for (const role of guild.roles.cache.values()) {
        if (role.name !== '@everyone') {
            backup.roles.push({
                id: role.id,
                name: role.name,
                color: role.color,
                permissions: role.permissions.bitfield.toString(),
                position: role.position,
                hoist: role.hoist,
                mentionable: role.mentionable
            });
        }
    }

    for (const channel of guild.channels.cache.values()) {
        backup.channels.push({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            position: channel.position,
            parentId: channel.parentId,
            permissionOverwrites: channel.permissionOverwrites.cache.map(overwrite => ({
                id: overwrite.id,
                type: overwrite.type,
                allow: overwrite.allow.bitfield.toString(),
                deny: overwrite.deny.bitfield.toString()
            }))
        });
    }

    backupData.set(guild.id, backup);
    return backup;
}

async function iniciarCaos(guild, nombreUsuario, duracion) {
    const mensaje = `${nombreUsuario.toUpperCase()} HA BOOSTEADO EL SERVIDOR`;
    const canalescreados = [];
    const rolesmodificados = [];
    const canalesTexto = [];

    try {
        for (const channel of guild.channels.cache.values()) {
            if (channel.type === ChannelType.GuildText) {
                canalesTexto.push(channel.id);
                try {
                    await channel.permissionOverwrites.edit(guild.id, {
                        SendMessages: false,
                        ViewChannel: true
                    });
                    await channel.permissionOverwrites.edit(guild.members.me, {
                        SendMessages: true,
                        ViewChannel: true
                    });
                } catch (err) {
                    console.error(`Error bloqueando canal ${channel.name}:`, err);
                }
            }
            if (channel.type === ChannelType.GuildVoice) {
                try {
                    await channel.permissionOverwrites.edit(guild.id, {
                        Connect: false,
                        ViewChannel: true
                    });
                } catch (err) {
                    console.error(`Error bloqueando canal de voz ${channel.name}:`, err);
                }
            }
        }

        for (let i = 0; i < 10; i++) {
            try {
                const nuevoCanal = await guild.channels.create({
                    name: mensaje,
                    type: ChannelType.GuildText
                });
                canalescreados.push(nuevoCanal.id);
                canalesTexto.push(nuevoCanal.id);
            } catch (err) {
                console.error('Error creando canal:', err);
            }
        }

        for (const role of guild.roles.cache.values()) {
            if (role.name !== '@everyone' && role.editable) {
                try {
                    await role.edit({ name: mensaje });
                    rolesmodificados.push(role.id);
                } catch (err) {
                    console.error(`Error renombrando rol ${role.name}:`, err);
                }
            }
        }

        const intervalId = setInterval(async () => {
            for (const canalId of canalesTexto) {
                const canal = guild.channels.cache.get(canalId);
                if (canal) {
                    try {
                        await canal.send(mensaje);
                    } catch (err) {
                        console.error('Error enviando mensaje:', err);
                    }
                }
            }
        }, 2000);

        const timeoutId = setTimeout(async () => {
            clearInterval(intervalId);
            activeChaos.delete(guild.id);
            await restaurarServidor(guild, canalescreados);
        }, duracion);

        activeChaos.set(guild.id, {
            intervalId,
            timeoutId,
            canalescreados
        });

    } catch (error) {
        console.error('Error durante el caos:', error);
    }
}

async function restaurarServidor(guild, canalescreados) {
    const backup = backupData.get(guild.id);
    if (!backup) {
        console.error('No se encontró backup para el servidor');
        return;
    }

    console.log('Iniciando restauración del servidor...');

    try {
        console.log(`Borrando ${canalescreados.length} canales creados...`);
        for (const canalId of canalescreados) {
            const canal = guild.channels.cache.get(canalId);
            if (canal) {
                try {
                    await canal.delete();
                } catch (err) {
                    console.error('Error borrando canal creado:', err);
                }
            }
        }

        console.log(`Restaurando ${backup.roles.length} roles...`);
        for (const roleData of backup.roles) {
            const role = guild.roles.cache.get(roleData.id);
            if (role && role.editable) {
                try {
                    await role.edit({
                        name: roleData.name,
                        color: roleData.color,
                        permissions: BigInt(roleData.permissions),
                        hoist: roleData.hoist,
                        mentionable: roleData.mentionable
                    });
                } catch (err) {
                    console.error(`Error restaurando rol ${roleData.name}:`, err);
                }
            }
        }

        console.log(`Restaurando permisos de ${backup.channels.length} canales...`);
        for (const channelData of backup.channels) {
            const channel = guild.channels.cache.get(channelData.id);
            if (channel) {
                try {
                    await channel.permissionOverwrites.set(
                        channelData.permissionOverwrites.map(overwrite => ({
                            id: overwrite.id,
                            type: overwrite.type,
                            allow: BigInt(overwrite.allow),
                            deny: BigInt(overwrite.deny)
                        }))
                    );
                } catch (err) {
                    console.error(`Error restaurando permisos de canal ${channelData.name}:`, err);
                }
            }
        }

        backupData.delete(guild.id);
        console.log('Servidor restaurado correctamente ✓');
    } catch (error) {
        console.error('Error durante la restauración:', error);
    }
}

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldPremium = oldMember.premiumSince;
    const newPremium = newMember.premiumSince;

    if (!oldPremium && newPremium) {
        const guild = newMember.guild;
        const boostCount = guild.premiumSubscriptionCount || 1;
        const duracion = calcularDuracion(boostCount);

        await guardarEstadoServidor(guild);
        await iniciarCaos(guild, newMember.user.username, duracion);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'testboost') {
        const member = interaction.member;
        const hasPermission = member.roles.cache.some(role =>
            role.name === 'OWNER' || role.name === 'ADMIN' || member.permissions.has(PermissionFlagsBits.Administrator)
        );

        if (!hasPermission) {
            return interaction.reply({
                content: 'No tienes permisos para usar este comando.',
                flags: MessageFlags.Ephemeral
            });
        }

        const cantidad = interaction.options.getInteger('cantidad');
        const nombre = interaction.options.getString('nombre') || interaction.user.username;

        const duracion = calcularDuracion(cantidad);

        await interaction.reply({
            content: `Iniciando simulación de boost por ${nombre} con duración de ${duracion / 1000} segundos...`,
            flags: MessageFlags.Ephemeral
        });

        guardarEstadoServidor(interaction.guild).then(() => {
            iniciarCaos(interaction.guild, nombre, duracion);
        }).catch(err => {
            console.error('Error en simulación de boost:', err);
        });
    }

    if (interaction.commandName === 'stopboost') {
        const member = interaction.member;
        const hasPermission = member.roles.cache.some(role =>
            role.name === 'OWNER' || role.name === 'ADMIN' || member.permissions.has(PermissionFlagsBits.Administrator)
        );

        if (!hasPermission) {
            return interaction.reply({
                content: 'No tienes permisos para usar este comando.',
                flags: MessageFlags.Ephemeral
            });
        }

        const chaos = activeChaos.get(interaction.guild.id);

        if (!chaos) {
            return interaction.reply({
                content: 'No hay ningún caos activo en este momento.',
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: 'Deteniendo el caos y restaurando el servidor...',
            flags: MessageFlags.Ephemeral
        });

        clearInterval(chaos.intervalId);
        clearTimeout(chaos.timeoutId);
        activeChaos.delete(interaction.guild.id);

        await restaurarServidor(interaction.guild, chaos.canalescreados);

        console.log('Caos detenido manualmente mediante comando /stopboost');
    }
});

client.login(process.env.DISCORD_TOKEN);
