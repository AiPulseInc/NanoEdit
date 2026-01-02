# Deployment Guide: Custom Domain on Google Cloud

You cannot directly assign a custom domain to an `https://ai.studio/apps/...` URL. Those links are intended for prototyping and previewing within the Google AI Studio environment, not for hosting production applications.

To use a custom domain (e.g., `www.your-app.com`), you need to **deploy** your application to a hosting service. Since you are asking about Google Cloud, the best solution for this React application is **Firebase Hosting**.

Here is the high-level process to get your custom domain working:

1.  **Build your App**: Run `npm run build` locally to create the production-ready static files.
2.  **Set up Firebase**:
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Create a project (you can link it to your existing Google Cloud project).
    *   Install the Firebase CLI: `npm install -g firebase-tools`.
    *   Login: `firebase login`.
    *   Initialize: `firebase init hosting` (select your `dist` or `build` folder as the public directory).
3.  **Deploy**: Run `firebase deploy`. This gives you a `web.app` URL.
4.  **Add Custom Domain**:
    *   In the Firebase Console, go to **Hosting**.
    *   Click **Add Custom Domain**.
    *   Enter your domain name.
    *   Firebase will give you DNS records (A records or TXT records) to add to your domain registrar (e.g., GoDaddy, Namecheap, Google Domains).

Once verified, Google will automatically provision an SSL certificate (HTTPS) for your custom domain.
