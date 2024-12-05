require("dotenv").config();

const express = require("express");
const axios = require("axios");
const app = express();


app.use((req, res, next) => {
  console.log(`Recebendo requisição: ${req.method} ${req.url}`);
  next();
});

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

//async function getAccessToken(code) {
  //const response = await axios.post(
    //`${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    //new URLSearchParams({
      //grant_type: "authorization_code",
      //code: code,
      //client_id: process.env.KEYCLOAK_CLIENT_ID,
      //client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
      //redirect_uri: process.env.KEYCLOAK_REDIRECT_URI,
    //}).toString(),
    //{
      //headers: {
        //"Content-Type": "application/x-www-form-urlencoded",
      //},
   // }
  //);
  //if (response.data && response.data.access_token) {
    //return response.data.access_token;
  //} else {
    //console.error("Failed to get access token:", response.data);
 // }
//}

//const cookieParser = require("cookie-parser");
//app.use(cookieParser());


app.get("/", (req, res) => {
  //if (req.isAuthenticated()) {
  //res.send(`
  //     <h1>Bem Vindo ${req.user.displayName || "User"}</h1>
  //     <div>
  //      <h2>Perfil do Usuário</h2>
  //       <p>Email: ${
  //       req.user.emails ? req.user.emails[0].value : "Não disponível"
  //     }</p>
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
 // }
});

app.get("/test", (req, res) => {
  console.log("Rota teste");
  res.send("Teste");
});


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


app.listen(3000, () => {
  console.log("Service Provider running on port 3000");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Service Provider running on port 3000");
});