class Chatbot {
    constructor() {
        this.chatbotToggle = document.querySelector('.chatbot-toggle');
        this.chatbotWindow = document.querySelector('.chatbot-window');
        this.closeBtn = document.querySelector('.close-chatbot');
        this.input = document.querySelector('.chatbot-input input');
        this.sendBtn = document.querySelector('.chatbot-input button');
        this.messagesContainer = document.querySelector('.chatbot-messages');
        this.quickReplies = document.querySelectorAll('.quick-replies button');
        
        this.init();
    }
    
    init() {
        // Toggle chatbot window
        this.chatbotToggle.addEventListener('click', () => {
            this.toggleChatbot();
        });
        
        // Close chatbot
        this.closeBtn.addEventListener('click', () => {
            this.closeChatbot();
        });
        
        // Send message on button click
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Send message on Enter key
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Quick replies
        this.quickReplies.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const reply = e.target.dataset.reply;
                this.handleQuickReply(reply);
            });
        });
        
        // Predefined responses
        this.responses = {
            'weather': 'Current weather in Batu Pahat: 32°C, Sunny. No immediate threats detected.',
            'hazard': 'Active hazard zones: 1) Jalan Kluang (flood risk), 2) Parit Raja (storm warning). Check the Hazard Map for details.',
            'register': 'To register, click the "Register" button in the top right corner. Fill in your details and verify your email.',
            'pricing': 'We offer three plans: Free, Pro (RM9.99/month), and Enterprise (RM29.99/month). Each offers different features.',
            'map': 'The Hazard Map shows real-time weather threats and flood zones. Click on any marker for details.',
            'report': 'Weather reports are available to registered users. They include detailed forecasts and historical data.',
            'default': 'I can help you with: weather information, hazard zones, registration, pricing, and maps. What would you like to know?'
        };
    }
    
    toggleChatbot() {
        const isVisible = this.chatbotWindow.style.display === 'block';
        this.chatbotWindow.style.display = isVisible ? 'none' : 'block';
        
        // Add focus to input when opened
        if (!isVisible) {
            setTimeout(() => {
                this.input.focus();
            }, 100);
        }
    }
    
    closeChatbot() {
        this.chatbotWindow.style.display = 'none';
    }
    
    sendMessage() {
        const message = this.input.value.trim();
        if (message) {
            this.addMessage(message, 'user');
            this.input.value = '';
            this.generateResponse(message.toLowerCase());
        }
    }
    
    handleQuickReply(type) {
        this.addMessage(type.charAt(0).toUpperCase() + type.slice(1), 'user');
        this.generateResponse(type);
    }
    
    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    generateResponse(userMessage) {
        // Simulate typing delay
        setTimeout(() => {
            let response = this.responses.default;
            
            // Check for keywords in user message
            const keywords = {
                'weather': ['weather', 'temperature', 'forecast', 'rain'],
                'hazard': ['hazard', 'danger', 'flood', 'storm', 'warning'],
                'register': ['register', 'sign up', 'account', 'login'],
                'pricing': ['price', 'cost', 'plan', 'upgrade', 'premium'],
                'map': ['map', 'location', 'area', 'zone'],
                'report': ['report', 'data', 'history', 'export']
            };
            
            for (const [key, words] of Object.entries(keywords)) {
                if (words.some(word => userMessage.includes(word))) {
                    response = this.responses[key];
                    break;
                }
            }
            
            this.addMessage(response, 'bot');
        }, 1000);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
});