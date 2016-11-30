const { Command } = require('discord.js-commando');

const { redis } = require('../../redis/redis');
const Tag = require('../../postgreSQL/models/Tag');

module.exports = class TagCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag',
			group: 'tags',
			memberName: 'tag',
			description: 'Displays a tag.',
			format: '<tagname>',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'What tag would you like to see?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const name = args.name.toLowerCase();

		return this.findTagCached(msg, name, msg.guild.id);
	}

	async findTagCached(msg, name, guildID) {
		return redis.getAsync(name + guildID).then(async reply => {
			if (reply) {
				let tag = await Tag.findOne({ where: { name: name, guildID: guildID } });
				if (tag) tag.increment('uses');

				return msg.say(reply);
			} else {
				let tag = await Tag.findOne({ where: { name: name, guildID: guildID } });
				if (!tag) return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);
				tag.increment('uses');

				let tagcontent = `${tag.header ? `${tag.header}\n` : ''}\n${tag.content}`;

				return redis.setAsync(name + guildID, tagcontent)
					.then(() => {
						msg.say(tagcontent);
					});
			}
		});
	}
};
