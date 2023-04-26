# Stroller Stats

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)


Ideas for webhooks:
https://firebase.google.com/docs/functions/get-started
https://github.com/vyper/biketastic
https://medium.com/@eric.l.m.thomas/setting-up-strava-webhooks-e8b825329dc7
https://www.curtiscode.dev/post/project/displaying-strava-stats-using-webhooks/
https://github.com/curtiscde/stravaytd/tree/main/app/functions/webhook
https://github.com/plinck/TeamATC/blob/050a0147e38f4bab4eea481db403d55a7330afb0/client/functions/src/modules/webhook.ts
https://github.com/caiismyname/atalanta/blob/3a7e6fe1d267c6c16ac12eb88546ac91c5058c02/functions/index.js

https://github.com/curtiscde/stravaytd/blob/b9ba5e7aab721bb8b87136d3f949b2ed4e3428d2/bin/updatesub.sh

subscription id: {"id":239616}

curl -X POST https://us-central1-stroller-stats.cloudfunctions.net/stravaWebhook -H ‘Content-Type: application/json’

 -d {
      “aspect_type”: “create”,
      “event_time”: 1682356786,
      “object_id”: 8955721197,
      “object_type”: “activity”,
      “owner_id”: 3438509,
      “subscription_id”: 239616
    }

    curl -X POST https://www.strava.com/api/v3/push_subscriptions -F client_id=1875 -F client_secret=2d442b8ba100c73169fa095cea89f34e730aafeb -F callback_url='https://us-central1-stroller-stats.cloudfunctions.net/stravaWebhook' -F verify_token=STROLLER-STATS



    curl -X POST https://localhost:5001/stravaWebhook -H 'Content-Type: application/json' \
 -d '{
      "aspect_type": "create",
      "event_time": 1682356786,
      "object_id": 8948950859,
      "object_type": "activity",
      "owner_id": 3438509,
      "subscription_id": 239616
    }'


us-central1-stroller-stats.cloudfunctions.net

