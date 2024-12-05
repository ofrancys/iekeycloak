// service-provider/app.js

require("dotenv").config();

// Verificação de variáveis de ambiente
// const requiredEnvVars = [
//   'KEYCLOAK_URL',
//   'KEYCLOAK_REALM',
//   'KEYCLOAK_CLIENT_ID',
//   'KEYCLOAK_CLIENT_SECRET'
// ];

// service-provider/app.js
const express = require("express");
// const session = require('express-session');
// const passport = require('passport');
// const { Strategy } = require('passport-openidconnect');
// const crypto = require('crypto');

const axios = require("axios");
const app = express();

async function getKeycloakConfig() {
  const response = await axios.get(
    `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`
  );
  console.info("Keycloak config loaded:", response.data);
  return {
    authorization_endpoint: response.data.authorization_endpoint,
    end_session_endpoint: response.data.end_session_endpoint,
    token_endpoint: response.data.token_endpoint,
  };
}

async function getAccessToken(code) {
  const response = await axios.post(
    `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      client_id: process.env.KEYCLOAK_CLIENT_ID,
      client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      redirect_uri: process.env.KEYCLOAK_REDIRECT_URI,
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (response.data && response.data.access_token) {
    return response.data.access_token;
  } else {
    console.error("Failed to get access token:", response.data);
  }
}

// Base URLs
// const EXTERNAL_KEYCLOAK_URL = process.env.KEYCLOAK_URL;
// const INTERNAL_KEYCLOAK_URL = process.env.KEYCLOAK_URL;
// const APP_URL = "http://localhost:3001";

// app.use(session({
//   secret: process.env.SESSION_SECRET || 'chave_sessionSecret',
//   resave: false,
//   saveUninitialized: false,
//   cookie: { secure: false }
// }));

// app.use(passport.initialize());
// app.use(passport.session());
const cookieParser = require("cookie-parser");

app.use(cookieParser);

// Função para gerar PKCE code verifier e challenge
// function generatePKCE() {
//   const verifier = crypto.randomBytes(32).toString('base64url');
//   const challenge = crypto
//     .createHash('sha256')
//     .update(verifier)
//     .digest('base64url');
//   return { verifier, challenge };
// }

// Armazenar PKCE em memória (para demonstração)
// let pkceStore = {};

// const strategyConfig = {
//   issuer: `${INTERNAL_KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
//   authorizationURL: `${EXTERNAL_KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
//   tokenURL: `${INTERNAL_KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
//   userInfoURL: `${INTERNAL_KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
//   clientID: process.env.KEYCLOAK_CLIENT_ID,
//   clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
//   callbackURL: `${APP_URL}/callback`,
//   scope: ['openid', 'profile', 'email'],
//   passReqToCallback: true
// };

// passport.use('oidc', new Strategy(strategyConfig,
//   (req, issuer, profile, context, idToken, accessToken, refreshToken, params, done) => {
//     return done(null, profile);
// }));

// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser((user, done) => {
//   done(null, user);
// });

app.get("/", (req, res) => {
  // if (req.isAuthenticated()) {
  // res.send(`
  //     <h1>Welcome ${req.user.displayName || "User"}</h1>
  //     <div>
  //       <h2>User Profile</h2>
  //       <p>Email: ${
  //         req.user.emails ? req.user.emails[0].value : "Not available"
  //       }</p>
  //       <p>ID: ${req.user.id}</p>
  //       <hr/>
  //       <a href="/logout">Logout</a>
  //     </div>
  //   `);
  // } else {
  res.send(`
      <h1>Service Provider - Francys</h1>
      <div>
        <a href="/login">Login</a>
      </div>
     `);
});

// app.get('/register', (req, res) => {
//   const { verifier, challenge } = generatePKCE();

//   // Armazenar o verifier para uso posterior
//   const state = crypto.randomBytes(16).toString('hex');
//   pkceStore[state] = { verifier, challenge };

//   const registrationUrl = new URL(`${EXTERNAL_KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/registrations`);
//   registrationUrl.searchParams.set('client_id', process.env.KEYCLOAK_CLIENT_ID);
//   registrationUrl.searchParams.set('response_type', 'code');
//   registrationUrl.searchParams.set('scope', 'openid email profile');
//   registrationUrl.searchParams.set('redirect_uri', `${APP_URL}/callback`);
//   registrationUrl.searchParams.set('state', state);
//   registrationUrl.searchParams.set('code_challenge', challenge);
//   registrationUrl.searchParams.set('code_challenge_method', 'S256');

//   res.redirect(registrationUrl.toString());
// });

app.get("/login", async (req, res, next) => {
  const authUrl = await getKeycloakConfig().authorization_endpoint;
  const params = new URLSearchParams({
    client_id: process.env.KEYCLOAK_CLIENT_ID,
    redirect_uri: process.env.KEYCLOAK_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
  });
  const redirectUrl = `${authUrl}?${params.toString()}`;
  res.redirect(redirectUrl);
});

app.get("/callback", async (req, res, next) => {
  const code = req.query.code;
  if (!code) return req.status(400).send("Code not found");
  const accessToken = await getAccessToken(code);
  res.cookie("access_token", accessToken).redirect("/");
  // const state = req.query.state;
  // const pkceData = pkceStore[state];
  // if (!pkceData) {
  //   return res.status(400).send('Invalid state parameter');
  // }
  // const { verifier } = pkceData;
  // passport.authenticate('oidc', {
  //   code_verifier: verifier,
  //   successRedirect: '/',
  //   failureRedirect: '/login'
  // })(req, res, next);
  // // Limpar o store após o uso
  // delete pkceStore[state];
});

app.get("/logout", async (req, res) => {
  const logoutUrl = await getKeycloakConfig().end_session_endpoint;
  logoutUrl.searchParams.set("redirect_uri", process.env.APP_HOST);
  console.info("Redirecting to logout URL:", logout);
  res.clearCookie("access_token").redirect(logoutUrl.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Service Provider running on port ${PORT}`);
  console.log("Environment variables loaded:");
  console.log("KEYCLOAK_URL:", process.env.KEYCLOAK_BASE_URL);
  console.log("KEYCLOAK_REALM:", process.env.KEYCLOAK_REALM);
  console.log("KEYCLOAK_CLIENT_ID:", process.env.KEYCLOAK_CLIENT_ID);
});
