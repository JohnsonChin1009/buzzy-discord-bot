import { config } from "dotenv";
import express from "express";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { fetchData, submitData } from "./api.js";

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

client.login(token);
