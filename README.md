# Shadow - E2EE Chat App

A secure, end-to-end encrypted chat application built with Bun, Vite, Express, Socket.IO, and shadcn/ui.

## Features

- E2EE with TweetNaCl
- Room-based chat with password protection
- Self-destructing messages
- Message status (sent/delivered/failed)
- File sharing
- Typing indicators
- Key fingerprint verification
- Auto-scrolling chat

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```
2. Run development servers:
   ```bash
   bun run dev
   ```

## Deployment

- Build the client: `bun run build`
- Start the server: `bun run server`

Built with [Bun](https://bun.sh) v1.2.4.
