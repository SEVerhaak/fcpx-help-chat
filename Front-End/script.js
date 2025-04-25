const form = document.getElementById('chat-form');
const input = document.getElementById('chat-input');
const chatWrapper = document.getElementById('chat-wrapper');
const submitBtn = document.getElementById('submit-btn');

// Initialize messages from localStorage or an empty array if not available
let messages = JSON.parse(localStorage.getItem('messages')) || [];


async function init(){
    console.log('init')
    messages.push({role:"human", content: 'How can you assist me?'})

    // Create and append an empty bot bubble with typing dots
    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble bot-bubble';
    botBubble.textContent = '...';
    chatWrapper.appendChild(botBubble);
    chatWrapper.scrollTop = chatWrapper.scrollHeight;

    await sendQuestion(messages, botBubble);
}

init()

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userText = input.value.trim();
    if (!userText) return;

    submitBtn.disabled = true;

    // Add the user's message to the history
    messages.push({ role: 'human', content: userText });

    // Create and append user bubble
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user-bubble';
    userBubble.textContent = userText;
    chatWrapper.appendChild(userBubble);
    chatWrapper.scrollTop = chatWrapper.scrollHeight;

    // Clear input
    input.value = '';

    // Create and append an empty bot bubble with typing dots
    const botBubble = document.createElement('div');
    botBubble.className = 'chat-bubble bot-bubble';
    botBubble.textContent = '...';
    chatWrapper.appendChild(botBubble);
    chatWrapper.scrollTop = chatWrapper.scrollHeight;

    await sendQuestion(messages, botBubble);

});

async function sendQuestion(messages, botBubble) {

    let firstChunk = true;

    try {
        // Send the entire messages array with each request
        const response = await fetch('http://localhost:8000/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        // Handle the streaming response
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Update the bot bubble with the chunk of response
            if (firstChunk) {
                botBubble.classList.add('finished');
                botBubble.textContent = chunk;  // Replace the typing dots with the first chunk
                firstChunk = false;
            } else {
                botBubble.textContent += chunk;  // Append further chunks
            }

            chatWrapper.scrollTop = chatWrapper.scrollHeight;
        }

        botBubble.innerHTML = formatInstructionsToHTML(botBubble.innerHTML);

        chatWrapper.scrollTop = chatWrapper.scrollHeight;

        // Add the AI response to the history
        messages.push({ role: 'ai', content: botBubble.textContent });

        // Save updated messages to localStorage
        localStorage.setItem('messages', JSON.stringify(messages));

    } catch (err) {
        botBubble.textContent = `Error: ${err.message}`;
    }

    submitBtn.disabled = false;
}

function formatInstructionsToHTML(text) {
    return text
        .replace(/^(\d+)\.\s\*\*(.+?)\*\*:/gm, '<h3>$1. $2</h3>') // Convert numbered steps to headings
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')          // Bold text
        .replace(/`(.+?)`/g, '<code>$1</code>')                    // Code formatting
        .replace(/- (.+)/g, '<li>$1</li>')                         // List items
        .replace(/<li>(.*?)<\/li>/g, '<ul>$&</ul>')                // Wrap in <ul> if needed
        .replace(/\n{2,}/g, '<br><br>');                           // Double newlines to <br>
}

async function clearLocalStorage() {
    await localStorage.removeItem('messages');
}