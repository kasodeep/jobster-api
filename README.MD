# Jobster API

#### Starter

The starter is a copy of jobs-api final project, just with additional data.

#### Setup

- navigate to 06.5-jobster-api/starter
- install dependencies

```sh
npm install
```

- create .env and provide correct values
- you can copy from previous project (just change the DB name)

.env

```js
MONGO_URI=
JWT_SECRET=
JWT_LIFETIME=
```

- start the project

```sh
npm start
```

- you should see "Server is listening ...." text

##### Client Folder

- let's explore client folder
- open client folder
- it's a react app built with CRA
- it's the same as in my React Course (JOBSTER APP),
  just base url points to our current server (instead of heroku app)

utils/axios.js

```js
const customFetch = axios.create({
  baseURL: '/api/v1',
});
```

- notice the build folder (production ready application)
- in CRA we can create build folder by running "npm run build"
- that's the one we will use for our front-end

##### Setup Front-End

- require "path" module
- setup express static (as first middleware)
  to serve static assets from client/build
- so now instead of public folder we are using client/build

app.js

```js
const path = require('path');

app.use(express.static(path.resolve(__dirname, './client/build')));

// place as first middleware
app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(xss());
```

- serve index.html for all routes (apart from API)
- front-end routes pick's it up from there

```js
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', authenticateUser, jobsRouter);

// serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './client/build', 'index.html'));
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);
```

- navigate to localhost:5000
- clear local storage (if necessary)