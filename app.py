import os
import threading
import discord
import dotenv
import streamlit as st
import logging
from queue import Queue
from streamlit.runtime.scriptrunner import add_script_run_ctx
import time

# Load environment variables
dotenv.load_dotenv()
token = os.getenv("DISCORD_BOT_TOKEN")

# Discord intents
intents = discord.Intents.default()
intents.message_content = True

# Declare the bot client
client = discord.Client(intents=intents)

# Set up logging
log_queue = Queue()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Function to log messages to the Streamlit UI
class QueueHandler(logging.Handler):
    def __init__(self, queue):
        super().__init__()
        self.queue = queue

    def emit(self, record):
        log_entry = self.format(record)
        self.queue.put(log_entry)

queue_handler = QueueHandler(log_queue)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
queue_handler.setFormatter(formatter)
logging.getLogger().addHandler(queue_handler)

# Discord bot event handlers
@client.event
async def on_ready():
    logging.info(f"We have logged in as {client.user}")

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    logging.info(f"Received message: {message.content} from {message.author}")

    if message.content.startswith("$GM"):
        await message.channel.send("GM Serr")
        logging.info("Responded with: GM Serr")

    if message.content.startswith("$add"):
        response = message.content.split(" ")
        if len(response) > 1 and response[1].startswith("https://"):
            await message.channel.send("Adding the link to the database")
            logging.info(f"Added link: {response[1]}")
        else:
            await message.channel.send("Please provide a valid link")
            logging.warning("Invalid link provided")

# Function to run the Discord bot
def run_discord_bot():
    if token:
        client.run(token)
    else:
        logging.error("Token not found")

# Start the bot in a separate thread
discord_thread = threading.Thread(target=run_discord_bot, daemon=True)
add_script_run_ctx(discord_thread)
discord_thread.start()

# Streamlit UI
st.title("Discord Bot Monitor")
st.write("The bot is currently **running**.")
st.write("This application is paired with **UptimeRobot** to ensure 24/7 availability.")

# Display logs in Streamlit
st.subheader("Logs")
if "log_list" not in st.session_state:
    st.session_state.log_list = []  # Initialize the log list in session state

log_container = st.empty()

# Function to update logs whenever there's new log data
def update_logs():
    while not log_queue.empty():
        log_entry = log_queue.get()
        st.session_state.log_list.append(log_entry)

    # Update the log output in Streamlit with a unique key
    log_container.text_area(
        "Log Output",
        "\n".join(st.session_state.log_list[-100:]),  # Show the last 100 logs
        height=400,
        key=f"log_output_{int(time.time())}"  # Unique key based on current time
    )

# Streamlit event loop to check for new logs
while True:
    update_logs()
    time.sleep(1)  # Poll every second for new logs
