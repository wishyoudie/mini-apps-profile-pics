# Profile Pictures for Poor

# English 🇬🇧

## Motivation

As of August 2024, despite growing popularity of Mini Apps, the Telegram team still provides easy access to user's profile pictures only to apps launched via Attachment Menu. It takes loads of money to appear in this elite group, so this guide is dedicated to provide this basic functionality to everyone.

This is a small guide on how to get user's profile pictures from Telegram Bot API. All of commits are small steps towards this goal. Browse through them for detailed explanations, or just stick to this guide and follow along.

## Setup

First things first, let's decide what we want to build. For simplicity, we will not be building any complete real-world applications, rather we'd focus on our actual goal which is obtaining user's photo and show it to them in the actual Mini App.

This guide will be using some of the most common modern technologies in web development, however the same result can be achieved with any tool of your choice. Our stack for now will be:

- `React` + `@telegram-apps/sdk` for Frontend;
- `Express` + `grammy` for Backend.

## Chapter one. Frontend

We will begin our journey on the client side. Let's bootstrap our app. To do that, simply paste the following command into your terminal:

```bash
pnpm dlx @telegram-apps/create-mini-app@latest
```

You will be prompted with some basic questions about your project. I am going to stick to React + Typescript + `@telegram-apps/sdk`.

After you're done with project setup, let's take a look at what we've got. Since this is just a tutorial, I removed all the unnecessary code and left only the bare minimum. Here's our `src/components/Guide.tsx` component that will be used to display the profile picture:

```tsx
export default function Guide() {
  const initData = useInitData();
  const initialValue = initData?.user?.photoUrl; // Naive, isn't it?
  const [src, setSrc] = useState<string | undefined>(initialValue);

  useEffect(() => {
    const user = initData?.user;
    const fetchProflePicture = async () => {
      const response = await fetch(`http://localhost:3000/${user?.id}`);
      const data = await response.json();
      setSrc(data.src);
    };

    fetchProflePicture();
  }, [initData]);

  return (
    <article>
      <Avatar src={src} />
      <Subheadline>{initData?.user?.firstName}</Subheadline>
    </article>
  );
}
```

Now let's add some very basic fetching logic. We will not dive into any of production-ready solutions, but we will simply add a state and a fetch inside a `useEffect` hook: [commit](https://github.com/wishyoudie/mini-apps-profile-pics/commit/4e2d45a7e6aa9331ff3f15de2e14c47b2905ddfa).

Here we simply send a request to our future backend with user's id as a parameter, await our request and update the state accordingly. In fact, this is all that we need to do in our tiny frontend chapter.

## Chapte two. Backend

We will be using `Express` and `grammY` for our backend. Let's initialize our project and install them:

```bash
pnpm init && pnpm install express grammy
```

Now let's create a file called `index.js` in the root of our project. This approach is not scalable, but it's good enough for our purposes. Lets add some boilerplate code to start out Express server:

```js
const express = require("express");
const app = express();

app.use(express.json());

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
```

Also, we will need a bot to operate with Telegram API. Create one with `grammY` and add it to your project:

```js
const { Bot } = require("grammy");

const bot = new Bot("TOPSECRET:TOKEN");
```

This finalizes this step. [Click here to view the code](https://github.com/wishyoudie/mini-apps-profile-pics/commit/2173bd9e6ab34b33678e625d5325f9c7fdf04795).

Now, let's add our first endpoint, which will be used to fetch user's profile picture. We will use `bot.api.getProfilePhotos` method to do that.

```js
app.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { total_count, photos } = await bot.api.getUserProfilePhotos(id);
  // Photos are all of user's photos. We want the first one.

  if (total_count !== 0) {
    const currentPhoto = photos[0];
    // currentPhoto is an array of the same photo in different resolutions. We want the last one.

    const bestLookingSelfie = currentPhoto[currentPhoto.length - 1];

    res.json(bestLookingSelfie);
  }

  res.json({ src: "" });
});
```

[This is the commit.](https://github.com/wishyoudie/mini-apps-profile-pics/commit/9adffc73a4cfd3cbcee446bde3e97f685d4f860c)

You'd think this is it? Well, it's not. Our `bestLookingSelfie` is a mere reference to the actual photo, which is located on Telegram servers. To download it (which is what we want to do), we need to first tell Telegram to prepare it for us. To do that, we will first extract the file id, which is unique for each combination of user and bot. After that, we will use `bot.api.getFile` method to prepare our file for downloading:

```js
const { file_id } = currentPhoto[currentPhoto.length - 1];

console.log(file_id); // You can save this to database to reduce traffic for exisiting users

const file = await bot.api.getFile(file_id);

res.json(file);
```

You'd think this is it? Well, it's not once again. However, we are one step closer to our inevitable success. Currently, `file` is once again an object, not a Blob as you might expect. This object contains a property called `file_path`, which is a string that will be used to download the file. By the way, here is the commit link you're looking for: [click](https://github.com/wishyoudie/mini-apps-profile-pics/commit/6bf8645dfe8669cda27f151dd9320e58d7428d5a).

Finally, let's get it over with. Unfortunately, we cannot use `file_path` that was mentioned earlier on the frontend, because the full link contains our bot's token. This is also the reason we are not using Bot API solely on frontend. With bot's token those malicious bastards that know how to use DevTools can easily steal our bot and use it to achieve their vicious goals. This is clearly not something we want to happen. To prevent this unfortunate situation, we will use `Proxy` pattern. In fact, what we will do is create a separate endpoint within our application that will be _pointing_ to the Telegram servers, hiding the actual token from third-party users.

To do that, we will use a package called `http-proxy-middleware`. Install it with `pnpm`:

```bash
pnpm install http-proxy-middleware
```

Now, let's add a new middleware to our Express server. It is as simple as calling one function:

```js
const { createProxyMiddleware } = require("http-proxy-middleware");

const TOKEN = "TOPSECRET:TOKEN";

app.use(
  "/bot-api",
  createProxyMiddleware({
    target: "https://api.telegram.org/file/bot" + TOKEN,
    changeOrigin: true, // Make sure to set this, otherwise your requests will be rejected by Telegram servers
  })
);
```

Now all requests to `/bot-api` will be proxied to Telegram servers. You might think this is also a security issue, but Telegram developers carefully designed their API to prevent this. Notice the `/file/` part of the URL. This is what keeps other API methods apart from the one used to download files, so noone can use it to perform other actions. If this is not enough for you, `http-proxy-middleware` has a ton of options to customize your proxy, including resticting the methods that can be used.

Finally, change your response in `/:id` endpoint to use our fresh proxy:

```js
res.json({ src: "http://localhost:3000/bot-api/" + file.file_path });
```

This is it! Now the response has a link to the file, which can be used to display it in our Mini App. [Final commit link.](https://github.com/wishyoudie/mini-apps-profile-pics/commit/fcb13b714476eb36384ef6f5b9d49c2cb809a249)

> Please note that currently nothing is going to work due to CORS policy. For simplicity, we've used `localhost` as a target, but you should use your actual domain instead. The link you get is completely valid, to check it out you can insert it in your browser's search bar and you will download an actual image.
> Read more about CORS here: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

## Conclusion

Thank you for reading this guide. Hopefully, you've learned how to get user's profile pictures from Telegram Bot API. Once again, the actual code we've written is nowhere near being production-ready. It is not scalable, and due to CORS it doesn't even work. However, it is some knowledge for you to adapt and integrate into your codebases.

If you find any mistakes, please feel free to open an issue or a pull request.
