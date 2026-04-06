// Dr. Amara PWA — App Logic
const App = {
  state: {
    questionIndex: 0,
    answers: {},
    inMealPlanMode: false,
    inBookingMode: false,
    isTyping: false,
    isOnline: navigator.onLine
  },

  // Config
  config: {
    webhookUrl: 'https://n8n.srv1524386.hstgr.cloud/webhook/meal-plan',
    supabaseUrl: 'https://irlxxeoocqktiuulfuqb.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlybHh4ZW9vY3FrdGl1dWxmdXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDU2MTgsImV4cCI6MjA3NDQ4MTYxOH0.1rjQgX34Kj8R_ibQ6LsmXl6J3WI8d5kEXrk3SbB6iyg',
    bookingWebhook: 'https://n8n.srv1524386.hstgr.cloud/webhook/booking-request'
  },

  // Meal plan questions
  questions: [
    { key: 'goals', question: "What are your main fitness or health goals?", placeholder: "e.g., muscle gain, weight loss, more energy...", type: 'text' },
    { key: 'dietary_restrictions', question: "Any dietary restrictions I should know about?", placeholder: "e.g., gluten-free, nut allergy, none...", type: 'text' },
    { key: 'budget', question: "What's your weekly food budget?", placeholder: "budget / moderate / premium", type: 'select', options: ['budget ($50-75)', 'moderate ($75-125)', 'premium ($125+)'] },
    { key: 'skill_level', question: "How comfortable are you in the kitchen?", placeholder: "beginner / intermediate / advanced", type: 'select', options: ['beginner', 'intermediate', 'advanced'] }
  ],

  // Initialize
  init() {
    this.registerSW();
    this.setupOfflineListener();
    this.setupChatInput();
  },

  // Register service worker
  async registerSW() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');
      } catch (err) {
        console.log('SW registration failed:', err);
      }
    }
  },

  // Offline detection
  setupOfflineListener() {
    window.addEventListener('online', () => {
      this.state.isOnline = true;
      document.getElementById('offline-toast').style.display = 'none';
      this.syncPendingMessages();
    });
    window.addEventListener('offline', () => {
      this.state.isOnline = false;
      document.getElementById('offline-toast').style.display = 'flex';
    });
  },

  // Setup chat input
  setupChatInput() {
    const input = document.getElementById('chat-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendChat();
        }
      });
    }
  },

  // Start meal plan flow
  startMealPlan() {
    this.state.inMealPlanMode = true;
    this.state.questionIndex = 0;
    this.state.answers = {};
    
    // Open chat accordion
    this.toggleAccordion('chat');
    
    // Clear and start fresh
    const messages = document.getElementById('chat-messages');
    messages.innerHTML = '';
    
    // Show first question
    setTimeout(() => {
      this.addBotMessage("Great choice! Let me ask you a few quick questions to personalize your meal plan. Ready?");
      setTimeout(() => this.askNextQuestion(), 800);
    }, 300);
  },

  // Ask next question
  askNextQuestion() {
    const q = this.questions[this.state.questionIndex];
    if (!q) {
      this.generateMealPlan();
      return;
    }
    this.addBotMessage(q.question);
    this.focusInput();
  },

  // Send chat message
  sendChat() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message || this.state.isTyping) return;

    this.addUserMessage(message);
    input.value = '';

    // If in meal plan mode, collect answers
    if (this.state.inMealPlanMode) {
      const q = this.questions[this.state.questionIndex];
      if (q) {
        this.state.answers[q.key] = message;
        this.state.questionIndex++;
        setTimeout(() => this.askNextQuestion(), 500);
      }
      return;
    }

    // Regular chat — send to n8n
    this.sendToWebhook({ message, source: 'chat' });
  },

  // Add user message
  addUserMessage(text) {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-bubble user';
    div.textContent = text;
    messages.appendChild(div);
    this.scrollToBottom();
  },

  // Add bot message
  addBotMessage(text) {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-bubble bot';
    div.innerHTML = `<span class="bot-avatar">🌿</span><span class="bot-text">${text}</span>`;
    messages.appendChild(div);
    this.scrollToBottom();
  },

  // Add typing indicator
  showTyping() {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-bubble bot typing';
    div.id = 'typing-indicator';
    div.innerHTML = '<span class="bot-avatar">🌿</span><span class="typing-dots"><span></span><span></span><span></span></span>';
    messages.appendChild(div);
    this.scrollToBottom();
    this.state.isTyping = true;
  },

  hideTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
    this.state.isTyping = false;
  },

  // Scroll to bottom
  scrollToBottom() {
    const messages = document.getElementById('chat-messages');
    messages.scrollTop = messages.scrollHeight;
  },

  // Focus input
  focusInput() {
    const input = document.getElementById('chat-input');
    if (input) input.focus();
  },

  // Generate meal plan
  async generateMealPlan() {
    this.showTyping();
    
    const payload = {
      ...this.state.answers,
      name: 'Meal Plan Request',
      source: 'pwa-meal-plan'
    };

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      this.hideTyping();
      
      // Show meal plan
      this.displayMealPlan(data.plan || this.getFallbackPlan());
      
      // Show email capture
      setTimeout(() => {
        this.addBotMessage("Want the full plan with recipes and macros? Drop your email below and I'll send it over!");
        this.showEmailInput();
      }, 1000);

    } catch (err) {
      this.hideTyping();
      this.addBotMessage(this.getFallbackPlan());
      setTimeout(() => {
        this.addBotMessage("Want the full plan? Drop your email below!");
        this.showEmailInput();
      }, 500);
    }

    this.state.inMealPlanMode = false;
  },

  // Fallback meal plan
  getFallbackPlan() {
    return `🍽 YOUR 7-DAY PLANT-BASED MEAL PLAN

Based on: ${this.state.answers.goals || 'General wellness'}

DAY 1 — Monday
Breakfast: Overnight oats with berries + plant protein smoothie
Lunch: Quinoa Buddha bowl with roasted chickpeas
Dinner: Tempeh stir-fry with brown rice
Snacks: Apple + almond butter, hummus + veggies

DAY 2 — Tuesday  
Breakfast: Avocado toast with hemp seeds
Lunch: Mediterranean lentil salad
Dinner: Black bean tacos with cashew cream
Snacks: Trail mix, energy balls

DAY 3 — Wednesday
Breakfast: Smoothie bowl with granola
Lunch: Leftover tacos + side salad
Dinner: Lentil shepherd's pie
Snacks: Fruit, roasted chickpeas

DAY 4 — Thursday
Breakfast: Chia pudding with fruit
Lunch: Sweet potato + black bean soup
Dinner: Veggie burger + oven fries
Snacks: Veggies + hummus, dates

DAY 5 — Friday
Breakfast: Tofu scramble with veggies
Lunch: Quinoa salad wrap
Dinner: Pasta with marinara + nutritional yeast
Snacks: Popcorn, fresh fruit

DAY 6 — Saturday
Breakfast: Pancakes with maple syrup + berries
Lunch: Buddha bowl (use up veggies)
Dinner: Homemade pizza with veggie toppings
Snacks: Dark chocolate, nuts

DAY 7 — Sunday
Breakfast: Brunch — tofu scramble + hash browns
Lunch: Light — big salad with seeds
Dinner: Meal prep for the week!
Snacks: Prepped snacks for the week

💚 Drink 8+ glasses of water daily
💪 Aim for 60-80g protein from plant sources`;
  },

  // Display meal plan
  displayMealPlan(plan) {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-bubble bot meal-plan';
    div.innerHTML = `<span class="bot-avatar">🍽</span><pre class="plan-content">${plan}</pre>`;
    messages.appendChild(div);
    this.scrollToBottom();
  },

  // Show email input in chat
  showEmailInput() {
    const messages = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'email-capture';
    div.innerHTML = `
      <input type="email" id="inline-email" placeholder="your@email.com" class="inline-email-input">
      <button class="btn-send" onclick="App.captureEmail()">→</button>
    `;
    messages.appendChild(div);
    this.scrollToBottom();
    document.getElementById('inline-email').focus();
  },

  // Capture email
  async captureEmail() {
    const emailInput = document.getElementById('inline-email');
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
      this.addBotMessage("Hmm, that doesn't look like a valid email. Try again?");
      return;
    }

    this.state.answers.email = email;
    this.addUserMessage(email);

    // Save to Supabase
    try {
      await fetch(`${this.config.supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: 'Meal Plan Request',
          email: email,
          service_type: 'meal-plan',
          notes: JSON.stringify(this.state.answers),
          status: 'new'
        })
      });
      this.addBotMessage("Perfect! I'll send your personalized plan within 24 hours. Check your inbox! 🌿");
    } catch (err) {
      this.addBotMessage("Got it! I'll send your plan shortly. Thanks for trusting me with your nutrition journey! 🌿");
    }

    // Remove email capture
    const emailCapture = document.querySelector('.email-capture');
    if (emailCapture) emailCapture.remove();
  },

  // Toggle accordion
  toggleAccordion(tab) {
    const content = document.getElementById(`${tab}-content`);
    const allContent = document.querySelectorAll('.accordion-content');
    const allArrows = document.querySelectorAll('.accordion-arrow');

    // Close all
    allContent.forEach(c => c.classList.remove('open'));
    allArrows.forEach(a => a.classList.remove('rotated'));

    // Open target
    content.parentElement.classList.add('open');
    content.previousElementSibling.querySelector('.accordion-arrow').classList.add('rotated');
  },

  // Submit booking
  async submitBooking(e) {
    e.preventDefault();
    const form = document.getElementById('consultation-form');
    const data = {
      name: document.getElementById('booking-name').value,
      email: document.getElementById('booking-email').value,
      type: document.getElementById('booking-type').value,
      time: document.getElementById('booking-time').value,
      message: document.getElementById('booking-message').value
    };

    try {
      // Save to Supabase
      await fetch(`${this.config.supabaseUrl}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'apikey': this.config.supabaseAnonKey,
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          service_type: 'consultation',
          notes: JSON.stringify(data),
          status: 'booking-request'
        })
      });

      // Show success
      form.style.display = 'none';
      document.getElementById('booking-success').style.display = 'block';
      document.getElementById('booking-summary').textContent = 
        `${data.name} • ${data.type} • ${data.time.replace('-', ' at ')}`;

    } catch (err) {
      alert('Something went wrong. Please try again or email directly.');
    }
  },

  // Send to webhook (for regular chat)
  async sendToWebhook(payload) {
    this.showTyping();
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      this.hideTyping();
      this.addBotMessage(data.reply || data.message || "Thanks for your message! Let me think about that...");
    } catch (err) {
      this.hideTyping();
      if (!this.state.isOnline) {
        this.queueOfflineMessage(payload);
        this.addBotMessage("You're offline — I'll send your message when you're back online.");
      } else {
        this.addBotMessage("Hmm, something went wrong. Try again?");
      }
    }
  },

  // Queue offline message
  queueOfflineMessage(msg) {
    const pending = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
    pending.push({ ...msg, timestamp: Date.now() });
    localStorage.setItem('pendingMessages', JSON.stringify(pending));
  },

  // Sync pending messages
  syncPendingMessages() {
    const pending = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
    if (pending.length === 0) return;
    
    pending.forEach(async (msg, i) => {
      try {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg)
        });
        pending.splice(i, 1);
      } catch (e) {}
    });
    
    localStorage.setItem('pendingMessages', JSON.stringify(pending));
  },

  // Modal controls
  closeModal() {
    document.getElementById('meal-plan-modal').style.display = 'none';
  },

  sendEmail() {
    const email = document.getElementById('email-input').value;
    if (email) {
      this.captureEmail();
      this.closeModal();
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => App.init());