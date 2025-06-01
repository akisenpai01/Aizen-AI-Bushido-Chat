# **App Name**: Aizen AI: Bushido Chat

## Core Features:

- Contextual AI Chat: Contextual chat using the Gemini API with Aizen, an AI persona embodying Bushido principles, retaining context from the last 10 messages and leveraging a simulated internet search tool for enhanced responses.
- User Personalization: Personalized Aizen responses based on user preferences gathered from a one-time quiz, influencing tone, answer length, and engagement with Bushido philosophy; stored in browser localStorage.
- Haiku Generation: Generate haikus on a user-specified theme; leverages AI to compose and format a haiku, which Aizen presents within the chat interface.
- AI Error Messages: Aizen provides in-character error messages generated via AI, offering empathetic responses to technical issues encountered by the user; ensures a consistent persona even during error states.
- Voice Input (STT): Speech-to-Text (STT) enables voice input using a microphone, displaying an interim transcript in real-time as the user speaks; improves accessibility and ease of message input.
- Voice Output (TTS): Text-to-Speech (TTS) output speaks Aizen's messages and error messages aloud, customizable via settings, including enabling/disabling TTS and selecting from available system voices, all stored in localStorage.
- Developer Tools: Includes dev tools to aid in development and debugging.

## Style Guidelines:

- Monochrome color scheme (#262626) to create a focused, high-contrast chat layout.
- Background Image set and visible.
- Completely transparent chatbox allows full view of background image. (#FFFFFF00)
- Input section is translucent.
- Body and headline font: 'Inter' (sans-serif) for clean readability.
- Fixed header with app title and blurred background; sticky input bar at the bottom of the screen, with auto-resizing textarea.
- Subtle, non-intrusive animations for loading states and toast notifications.
- Simple and modern icons for settings and microphone.