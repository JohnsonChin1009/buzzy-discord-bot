import { SlashCommandBuilder } from "discord.js";
import { fetchData, submitData } from "../../api.js";

const domains = ["meetup.com", "lu.ma"];

async function resolveShortenedURL(url) {
    try {
        const response = await fetch(url, { method: "HEAD", redirect: "follow" });
        return response.url; // Returns the final expanded URL
    } catch (error) {
        console.error("Error resolving shortened URL:", error);
        return url; // If there's an error, return the original URL
    }
}

export default {
    data: new SlashCommandBuilder().setName('add-event').setDescription('Add an event to HIVE').addStringOption(option =>
        option
            .setName("url")
            .setDescription("The event URL (Meetup or Lu.ma)")
            .setRequired(true)
    ),

    async execute(interaction) {
        let url = interaction.options.getString("url");

        if (!url.startsWith("https://")) {
            return interaction.reply({
                content: "❌ Invalid URL format. Please provide a valid URL.",
                ephemeral: true, // Makes the response visible only to the user
            });
        }

        url = await resolveShortenedURL(url);

        if (!domains.some(domain => url.includes(domain))) {
            return interaction.reply({
                content: "❌ Unsupported URL. Only Meetup and Lu.ma links are allowed.",
                ephemeral: true,
            });
        }
        
        await interaction.reply("⏳ Hold on, let me do some magic...");

            try {
                const eventDetails = await fetchData(url);

                if (!eventDetails) {
                    return interaction.editReply("Error scraping data. Please try again later.");
                } else {
                    const result = await submitData(eventDetails);
                    if (result.error) {
                    return interaction.editReply(`Error submitting data: ${result.error}`);
                    }
                }

                interaction.editReply(`🔥 Dope dope dope, see you at the event ser!\n\n📅 **Event added:** ${url}`); // add the added event url to this message
            } catch (error) {
                console.error("Error fetching data:", error);
                interaction.editReply("Error fetching data. Please try again later.");
            }
    }
}
