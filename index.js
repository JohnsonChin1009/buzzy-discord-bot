import { config } from "dotenv";
import express from "express";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { fetchData, submitData } from "./api.js";
import { fileURLToPath } from "url";
import * as fs from "node:fs";
import path from "path";


config();
const token = process.env.DISCORD_BOT_TOKEN;
const app = express();

app.get("/", (req, res) => {
  res.send("Discord bot is running!");
});
3;

const PORT = 8000;
app.listen(PORT, () =>
  console.log(`Health check server running on port ${PORT}`),
);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged into Discord as ${readyClient.user.tag}`);
});

client.commands = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandPaths = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandPaths).filter((file) => file.endsWith(".js"));

	for (const file of commandFiles) {
		const filePath = path.join(commandPaths, file);
		const command = (await import(filePath)).default;
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Listen for messages
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("$add")) {
    const parts = message.content.split(" ");

    if (parts.length > 1) {
      const url = parts[1];

      if (!url.startsWith("https://")) {
        return message.reply(
          "❌ Invalid URL format. Please provide a valid URL.",
        );
      }

      if (url.includes("meetup.com") || url.includes("lu.ma")) {
        const statusMessage = await message.reply(
          "⏳ Hold on, let me do some magic...",
        );

        try {
          const eventDetails = await fetchData(url);

          if (!eventDetails) {
            return message.reply(
              "❌ Error scraping data. Please try again later.",
            );
          } else {
            const result = await submitData(eventDetails);
            if (result.error) {
              return message.reply(`❌ Error submitting data: ${result.error}`);
            }
          }

          statusMessage.edit("🔥 Dope dope dope, see you at the event ser!");
        } catch (error) {
          console.error("Error fetching data:", error);
          message.reply("❌ Error fetching data. Please try again later.");
        }
      } else {
        message.reply(
          "❌ Unsupported URL. Only Meetup and Lu.ma links are allowed.",
        );
      }
    } else {
      message.reply("❌ Please provide a URL. Usage: `$add <URL>`");
    }
  }
});

// Listen for Event Interactions/Commands

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return; // Ignore messages from users

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
		return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
		}
  }
  console.log(interaction);
});

client.login(token);
