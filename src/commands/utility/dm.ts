import { type Args, Command } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { type Message } from 'discord.js';

import { Formatters } from 'discord.js';

@ApplyOptions<Command.Options>({
  aliases: ['dm'],
  requiredUserPermissions: ['ADMINISTRATOR'],
})
export default class extends Command<Args> {
  public async messageRun(msg: Message, args: Args) {
    const user = args.finished ? null : await args.pick('user');
    if (!user) return msg.reply('That doesnt seem to be a valid user.');

    try {
      const message = await args.rest('string');
      const dm = user.dmChannel ?? (await user.createDM());
      await dm.send({
        embeds: [
          {
            author: {
              name: `You received a message from a server admin in ${
                msg.guild!.name
              }`,
              iconURL: msg.guild!.iconURL({ dynamic: true, size: 1024 })!,
            },
            color: this.container.util.randomColour(),
            description: message,
            timestamp: Date.now(),
          },
        ],
      });

      await msg.react('📨');
    } catch (e) {
      return await msg.react('❌').then(() => ({
        content: `An error occured while sending dm:\n${(e as Error).message}`,
      }));
    }
  }
}
