
const config = require('./config.json');
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

const fs = require('fs');
const Enmap = require('enmap');

client.guildSettings = new Enmap({
	name: "guildSettings",
	fetchAll: false,
	autoFetch: true,
	cloneLevel: 'deep'
});
client.templateMessages = new Enmap({
	name: "templateMessages",
	fetchAll: false,
	autoFetch: true,
	cloneLevel: 'deep'
})

Promise.all([client.guildSettings.defer, client.templateMessages.defer])
	.then( () => {
		console.log("DB loaded");

		client.commands = new Discord.Collection();

		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);
			client.commands.set(command.name, command);
		}
		
		client.on("ready", () => {
			client.user.setActivity(`© Ryuka`);
		})
		
		client.on("guildDelete", guild => {
			client.guildSettings.delete(guild.id);
		});
		
		
		client.on('message', message => {
			if(!message.guild || message.author.bot) return;
		
			const guildConf = client.guildSettings.ensure(message.guild.id, {
				prefix: config.prefix,
				infochannel: null,
				infomessages: {
					event: null,
					bonus: null,
					mission: null,
					battle: null,
					bounty: null,
					vanquish: null,
					nicholas: null,
					blade: null,
					sandford: null,
				}
			});
		
			if(message.content.indexOf(guildConf.prefix) !== 0) return;
		
			const args = message.content.slice(guildConf.prefix.length).split(/ +/);
			const cmd = args.shift().toLowerCase();
		
			if (!client.commands.has(cmd)) return;
		
			try {
				let command = client.commands.get(cmd);
		
				if (command.admin) {
					const adminRole = message.guild.roles.find("name", guildConf.adminRole);
		
					if(!adminRole) {
						throw("Adminrole needed, but not found");
					}
		
					if(!message.member.roles.has(adminRole.id)) {
						message.reply('Benötigt Adminrechte')
						.then(msg => {
							msg.delete({ timeout: 10000 });
						});
						return;
					}
				}
		
				command.execute(client, message, args);
			} catch (error) {
				console.error(error);
				message.reply('Da ist etwas schief gelaufen :(')
					.then(msg => {
						msg.delete({ timeout: 10000 });
					});
			}
		});

		client.on('messageReactionAdd', async (reaction, user) => {
			if (reaction.partial) {
				try {
					await reaction.fetch();
				} catch (error) {
					console.log('Something went wrong when fetching the message: ', error);
					return;
				}
			}

			let isTemplateMessage = client.templateMessages.has(reaction.message.id);
			if (!user.bot && isTemplateMessage) {
				try {
					await reaction.users.remove(user);
				} catch (error) {
					console.log('Something went wrong when removing the reaction: ', error);
					return;
				}
				if (client.templateMessages.get(reaction.message.id) == user.id) {
					if (reaction.emoji.name === '✏️') {
						user.send("edit");
					} else if (reaction.emoji.name === '🗑️') {
						user.send("delete");
					}
				}
			}
		});
		
		try {
			client.login(config.token);
		} catch (error) {
			console.error(error);
		}
	})