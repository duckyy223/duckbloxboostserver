require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('testboost')
        .setDescription('Simula un boost del servidor (solo OWNER y ADMIN)')
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setDescription('Cantidad de boosts para calcular la duración')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addStringOption(option =>
            option.setName('nombre')
                .setDescription('Nombre de la persona que boostea (opcional)')
                .setRequired(false)
        ),
    new SlashCommandBuilder()
        .setName('stopboost')
        .setDescription('Detiene el caos del boost inmediatamente y restaura el servidor (solo OWNER y ADMIN)')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registrando comandos slash...');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log('Comandos registrados correctamente!');
    } catch (error) {
        console.error('Error registrando comandos:', error);
    }
})();
