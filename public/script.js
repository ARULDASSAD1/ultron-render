const btnTalk = document.querySelector('.talk');
const btnStop = document.querySelector('.stop');
const content = document.querySelector('.content');
const responseTab = document.querySelector('.response-text');
const textInput = document.getElementById('text-input');
const submitText = document.getElementById('submit-text');
const languageSelect = document.getElementById('language-select');

let isSpeaking = false;
let isRecognizing = false;
let recognition = null;
let recognitionTimeout = null;

function getVoiceSettings(lang) {
  // Define custom settings for different languages
  switch (lang) {
    case 'en-US':
      return { rate: 1, volume: 1, pitch: 1 };  // English (US) - Normal speed and tone
    case 'ta-IN':
      return { rate: 1.3, volume: 1, pitch: 1.2 };  // Tamil (India) - Slightly slower and deeper pitch
    case 'hi-IN':
      return { rate: 1, volume: 1, pitch: 1.1 };  // Hindi (India) - Normal speed with slightly higher pitch
    case 'es-ES':
      return { rate: 1.2, volume: 1, pitch: 1 };  // Spanish (Spain) - Faster speed
    case 'fr-FR':
      return { rate: 1, volume: 0.9, pitch: 1 };  // French (France) - Normal speed with slightly lower volume
    default:
      return { rate: 1, volume: 1, pitch: 1 };  // Default settings for other languages
  }
}

function speak(text, lang = 'en-US') {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
  }

  const textSpeak = new SpeechSynthesisUtterance(text);
  const { rate, volume, pitch } = getVoiceSettings(lang);

  textSpeak.lang = lang; // Set the language for speech synthesis
  textSpeak.rate = rate;  // Set the rate for the specific language
  textSpeak.volume = volume;  // Set the volume for the specific language
  textSpeak.pitch = pitch;  // Set the pitch for the specific language

  textSpeak.onstart = () => { isSpeaking = true; };
  textSpeak.onend = () => { isSpeaking = false; };

  window.speechSynthesis.speak(textSpeak);
  responseTab.textContent = text;
}

function wishMe() {
  const day = new Date();
  const hour = day.getHours();
  const lang = languageSelect.value; // Get the selected language

  if (hour >= 0 && hour < 12) {
    speak("Good Morning, Sir.", lang);
  } else if (hour >= 12 && hour < 17) {
    speak("Good Afternoon, Sir.", lang);
  } else {
    speak("Good Evening, Sir.", lang);
  }
}

window.addEventListener('load', () => {
  speak("Initializing JARVIS...", languageSelect.value);
  wishMe();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function startRecognition() {
  if (recognition) {
    recognition.stop();
  }

  recognition = new SpeechRecognition();
  recognition.lang = languageSelect.value; // Set the recognition language
  recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
  };

  recognition.onstart = () => {
    isRecognizing = true;
    console.log("Speech recognition started.");
    if (recognitionTimeout) {
      clearTimeout(recognitionTimeout);
    }
    recognitionTimeout = setTimeout(() => {
      console.log("Stopping recognition due to timeout.");
      stopRecognition();
    }, 120000); // Adjust timeout as needed
  };

  recognition.onend = () => {
    isRecognizing = false;
    console.log("Speech recognition ended.");
  };

  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.stop();
  }
  if (recognitionTimeout) {
    clearTimeout(recognitionTimeout);
  }
}

btnTalk.addEventListener('click', () => {
  content.textContent = "Listening...";
  startRecognition();
});

btnStop.addEventListener('click', () => {
  content.textContent = "Stopped.";
  stopRecognition();
  window.speechSynthesis.cancel();
});

submitText.addEventListener('click', () => {
  const message = textInput.value.trim();
  if (message) {
    content.textContent = `You said: ${message}`;
    takeCommand(message.toLowerCase());
    textInput.value = '';
  }
});

async function takeCommand(message) {
  try {
    let responseText = '';
    const lang = languageSelect.value; // Get the selected language

    if (message.includes('hey') || message.includes('hello')) {
      responseText = "Hello Boss, How May I Help You?";
    } else if (message.includes("open google")) {
      window.open("https://google.com", "_blank");
      responseText = "Opening Google...";
    } else if (message.includes("open youtube")) {
      window.open("https://youtube.com", "_blank");
      responseText = "Opening Youtube...";
    } else if (message.includes("open facebook")) {
      window.open("https://facebook.com", "_blank");
      responseText = "Opening Facebook...";
    } else {
      // Send user query to server-side API
      const response = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message })
      });

      if (response.ok) {
        const data = await response.json();
        responseText = `Sir, ${data.reply.replace(/\*/g, '').trim()}`;
      } else {
        console.error('Error:', response.statusText);
        responseText = "I'm sorry, I couldn't process your request.";
      }
    }

    speak(responseText, lang);
    responseTab.textContent = responseText;

  } catch (error) {
    console.error("Error processing command:", error);
    const errorText = "I'm sorry, I couldn't understand that. Please try again.";
    speak(errorText, languageSelect.value);
    responseTab.textContent = errorText;
  }
}

// Populate voices when they are loaded
window.speechSynthesis.onvoiceschanged = () => {
  console.log(window.speechSynthesis.getVoices());
};
