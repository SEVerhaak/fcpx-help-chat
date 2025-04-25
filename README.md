# FCPX Helper AI

## How to run locally:

1. Clone the repository
```bash
git clone https://github.com/SEVerhaak/fcpx-help-chat.git
```

2. Install dependencies
```bash
npm install
```

3. Remove the .example from the `.env.example` file and add your own config data

4. Run local server
```bash
npm run server
```

5. If the server is running you can reach it at http://localhost:8000/ with a simple GET request 
6. The GET request on the root URL should return the string `It's alive`
7. You can run the `index.html` in the `Front-End` folder locally, and it will work with the localhost server

## How to use in an online environment

1. Upload the following files and directories to a node enabled server:
   
  - `routes` [folder]
  - `vectorfiles` [folder]
  - `.env`
  - `package.json`
  - `package-lock.json`
  - `server.js`

2. Install dependencies on the server
```bash
npm install
```

3. Run server
```bash
npm run server
```