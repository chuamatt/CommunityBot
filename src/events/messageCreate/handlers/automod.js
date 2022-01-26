const MessageHandler = require('../../../models/Handlers/MessageHandler');

function testCensor(string, censors) {
  const re = new RegExp(censors.join('|'), 'gi');
  const match = re.exec(string);

  if (!match) {
    return false;
  }
  return match[0];
}

const [yesTick, noTick] = [
  '<:yesTick:931242491007606795>',
  '<:noTick:931242523685449818>'
];

module.exports = new MessageHandler(
  async ({ ctx, msg }) => {
    if (msg.guild && msg.guild.id !== ctx.config.dmc.guildID) {
      return null;
    }
    if (
      ctx.config.dmc.allStaffRoles.some((r) => msg.member._roles.includes(r))
    ) {
      return null;
    }

    const { censors } = await ctx.db.automod.get(msg.guild.id);
    if (!censors.length) {
      return null;
    }

    const censorTest = testCensor(msg.content, censors);
    if (!censorTest) {
      return null;
    }

    await msg.delete();
    const reason = `Automatic action carried out for using blacklisted word(s): \`${censorTest}\``;
    const { dmSent, caseNumber } = await ctx.utils.timeoutMember(
      ctx,
      msg,
      reason
    );

    const automodLogs = ctx.bot.channels.resolve(ctx.config.dmc.automodLogs);
    const modlog = ctx.bot.channels.resolve(ctx.config.dmc.modlog);
    await automodLogs.send({
      content: msg.author.toString(),
      embeds: [
        {
          title: 'Censor Automod',
          fields: [
            {
              name: 'Information:',
              value: `**${msg.author.tag}** (\`${
                msg.author.id
              }\`) said:\n${ctx.utils.codeblock(msg.content)}\nChannel: <#${
                msg.channel.id
              }>\nUser has been timed out for **20 minutes**.\nDM Sent: ${
                dmSent === true ? yesTick : noTick
              }`,
              inline: false
            },
            {
              name: 'Caught by:',
              value: censorTest
            }
          ],
          timestamp: new Date(),
          color: 15705088
        }
      ]
    });
    await modlog.send({
      embeds: [
        {
          title: `timeout | case #${caseNumber} | 20m`,
          description:
            `**Offender:** ${msg.author.tag} <@${msg.author.id}>\n` +
            `**Reason:** ${reason}\n` +
            '**Responsible moderator:** Community Bot#6333',
          color: 15960130,
          timestamp: new Date(),
          footer: { text: `ID: ${msg.author.id}` }
        }
      ]
    });
    return null;
  },
  {
    name: 'automod',
    allowDM: false,
    allowBot: false
  }
);
