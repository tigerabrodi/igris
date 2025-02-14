https://github.com/user-attachments/assets/7cef38dc-bcf5-4d48-b295-25b97f957fda

<div align="center">
<h1 align="center">
  <a href="https://igris.vercel.app/">Igris</a>
</h1>
  <p>
    A streamlined way to manage collections of voices.
  </p>
</div>

## Why I made this

When I was building my game, I found it annoying to use the ElevenLabs GUI. I could only generate one voice at a time. What I wanted is to be able to have a set of voice messages.

Think of a level up voice in a game. I want to be able to quickly generate 10 of them. The idea behind the variety is so that the user is more engaged. That's why when building my game, I prefer to have a set of voices and randomly pick one message from the set. So when you level up, you won't hear the same voice message over and over again. Causing you to be more engaged and getting more dopamine.

Yes, I know their API exists. But to me, their API makes sense when you need mass generation of voices or on the fly generation.

What I want is to have similar messages quickly generated and be able to download them with a specific naming convention.

If the set's name is "Level Up", files should be named after the order of generation e.g. "level-up-1.mp3", "level-up-2.mp3", etc. This way, when building the game, it's easy to refer to the different voices.

## Free and OSS

## Tech stack 💻

- [React](https://react.dev/) for frontend.
- [Convex](https://www.convex.dev/) for backend.
- [Motion](https://motion.dev/) for animations.
- [Tailwind](https://tailwindcss.com/) for styling.
- [Shadcn](https://ui.shadcn.com/) for components.
- [React Hot Keys](https://github.com/jaywcjlove/react-hotkeys) for hotkeys.
- [Vercel](https://vercel.com/) for hosting and web analytics.

## Cloning & running 🏄

1. Clone the repo: `git clone https://github.com/tigerabrodi/jinwooo`
2. Setup a Convex account and create a new project.
3. Run `pnpm install`
4. Run `npx convex dev` (this will setup your `.env.local` file)
5. Run `pnpm dev`

## Bugs & Contributing 🐛

I assume you've it up and running by yourself.

If you find a bug, create an issue.

If you want to contribute, make sure an issue is already created and ASSIGNED to you. Don't waste your time making a PR that won't be merged.

If it's something that I think should be addressed, we can discuss the solution in the github issue, and then you can go ahead and make a PR.

## License

This project is licensed under the MIT License ❤️
