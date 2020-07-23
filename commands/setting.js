module.exports = {
	name: 'setting',
	description: 'Gildeneinstellung',
	admin: true,
	execute(message, args) {
		const [prop, ...value] = args;
		if(!client.settings.has(message.guild.id, prop)) {
		  return message.reply("Diese Einstellung gibt es nicht.");
		} 
		client.settings.set(message.guild.id, value.join(" "), prop);
		message.channel.send(`Die Einstellung für ${prop} wurde erfolgreich gesetzt auf:'${value.join(" ")}'`);
	},
};